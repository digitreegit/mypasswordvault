/**
 * After Stripe Checkout redirect: verify session is paid and grant license immediately
 * (does not rely on webhook timing). JWT must match checkout metadata user id.
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import Stripe from "npm:stripe@17.4.0";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function getServiceRoleKey(): string | undefined {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, string>;
      for (const name of ["default", "service_role"]) {
        const v = keys[name];
        if (typeof v === "string" && v.length > 10) return v;
      }
      const first = Object.values(keys).find(
        (v) => typeof v === "string" && v.length > 10,
      );
      if (first) return first;
    } catch {
      /* fall through */
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  const serviceKey = getServiceRoleKey();

  if (!supabaseUrl || !anonKey || !stripeKey || !serviceKey) {
    console.error("confirm-checkout-session: missing env");
    return json({ error: "server_misconfigured" }, 500);
  }

  const authz = req.headers.get("Authorization") ?? "";
  if (!authz.toLowerCase().startsWith("bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }

  const supa = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authz } },
  });
  const { data: userData, error: userErr } = await supa.auth.getUser();
  if (userErr || !userData.user) {
    return json({ error: "unauthorized" }, 401);
  }
  const authUserId = userData.user.id;

  let body: { session_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : "";
  if (!sessionId.startsWith("cs_")) {
    return json({ error: "invalid_session_id" }, 400);
  }

  const stripe = new Stripe(stripeKey);
  let sess: Stripe.Checkout.Session;
  try {
    sess = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (e) {
    console.error("confirm-checkout-session: stripe retrieve failed", e);
    return json({ error: "stripe_error" }, 502);
  }

  if (sess.payment_status !== "paid") {
    return json({ licensed: false, payment_status: sess.payment_status });
  }

  const checkoutUserId =
    (sess.metadata?.supabase_user_id as string | undefined) ??
    (sess.client_reference_id as string | undefined);
  if (!checkoutUserId || checkoutUserId !== authUserId) {
    console.error("confirm-checkout-session: user mismatch", {
      authUserId,
      checkoutUserId,
      sessionId,
    });
    return json({ error: "forbidden" }, 403);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { error } = await admin.from("user_entitlements").upsert(
    {
      user_id: checkoutUserId,
      licensed: true,
      purchased_at: new Date().toISOString(),
      stripe_checkout_session_id: sess.id,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("confirm-checkout-session: upsert failed", error);
    return json({ error: "db_error" }, 500);
  }

  return json({ licensed: true });
});
