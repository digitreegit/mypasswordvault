/**
 * Stripe webhook: on checkout.session.completed, sets user_entitlements.licensed = true.
 * Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   (or SUPABASE_SECRET_KEYS JSON with service_role).
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import Stripe from "npm:stripe@17.4.0";
import { purchaseCountryFromCheckoutSession } from "../_shared/purchaseMetadata.ts";

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

function defaultLicenseAmountCents(): number {
  const n = Number(Deno.env.get("STRIPE_LICENSE_AMOUNT_CENTS") ?? "499");
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 499;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  const whSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = getServiceRoleKey();

  if (!stripeKey || !whSecret || !supabaseUrl || !serviceKey) {
    console.error("stripe-webhook: missing env");
    return new Response("misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey);

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch (e) {
    console.error("stripe signature verify failed", e);
    return new Response("bad signature", { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const sess = event.data.object as Stripe.Checkout.Session;
    const userId =
      (sess.metadata?.supabase_user_id as string | undefined) ??
      (sess.client_reference_id as string | undefined);
    if (sess.payment_status !== "paid") {
      // Async/delayed payment not yet settled — wait for async_payment_succeeded.
      console.warn("checkout.session: not paid yet", sess.id, sess.payment_status);
    } else if (!userId) {
      console.error("checkout.session.completed: no user id", sess.id);
    } else {
      const admin = createClient(supabaseUrl, serviceKey);
      let accountEmail: string | null =
        sess.customer_details?.email?.trim() || null;
      if (!accountEmail) {
        const { data: authUser } = await admin.auth.admin.getUserById(userId);
        accountEmail = authUser?.user?.email?.trim() || null;
      }
      const { error } = await admin.from("user_entitlements").upsert(
        {
          user_id: userId,
          licensed: true,
          purchased_at: new Date().toISOString(),
          stripe_checkout_session_id: sess.id,
          purchase_platform: "web",
          purchase_country: purchaseCountryFromCheckoutSession(sess),
          amount_cents:
            typeof sess.amount_total === "number"
              ? sess.amount_total
              : defaultLicenseAmountCents(),
          currency: sess.currency ?? "usd",
          account_email: accountEmail,
          refunded_at: null,
        },
        { onConflict: "user_id" },
      );
      if (error) {
        console.error("user_entitlements upsert failed", error);
        return new Response("db error", { status: 500 });
      }
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const pi =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;
    if (pi) {
      const admin = createClient(supabaseUrl, serviceKey);
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: pi,
        limit: 1,
      });
      const sid = sessions.data[0]?.id;
      if (sid) {
        const { data: ent } = await admin
          .from("user_entitlements")
          .select("amount_cents")
          .eq("stripe_checkout_session_id", sid)
          .maybeSingle();
        const { error } = await admin
          .from("user_entitlements")
          .update({
            licensed: false,
            refunded_at: new Date().toISOString(),
            amount_cents: ent?.amount_cents ?? defaultLicenseAmountCents(),
            currency: "usd",
          })
          .eq("stripe_checkout_session_id", sid);
        if (error) {
          console.error("charge.refunded: entitlements update", error);
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
