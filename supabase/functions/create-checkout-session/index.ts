/**
 * Creates a Stripe Checkout Session (one-time payment) for a permanent vault license.
 * Secrets: STRIPE_SECRET_KEY, PUBLIC_APP_URL (e.g. https://yoursite.com/app — include /app in prod).
 * Optional: STRIPE_LICENSE_AMOUNT_CENTS (default 499 = $4.99).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";

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
  const appUrl = (Deno.env.get("PUBLIC_APP_URL") ?? "http://localhost:5173/app").replace(
    /\/$/,
    "",
  );

  if (!supabaseUrl || !anonKey || !stripeKey) {
    console.error("create-checkout-session: missing env", {
      hasUrl: Boolean(supabaseUrl),
      hasAnon: Boolean(anonKey),
      hasStripe: Boolean(stripeKey),
    });
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
  const user = userData.user;

  const stripe = new Stripe(stripeKey);

  const unitAmount = Number(Deno.env.get("STRIPE_LICENSE_AMOUNT_CENTS") ?? "499");
  if (!Number.isFinite(unitAmount) || unitAmount < 50) {
    return json({ error: "invalid_price_config" }, 500);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      success_url: `${appUrl}/#/pricing?checkout=success`,
      cancel_url: `${appUrl}/#/pricing?checkout=cancel`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: "My Password Vault — Permanent license",
              description:
                "Unlimited password entries for this account (one-time purchase).",
            },
          },
        },
      ],
    });
    if (!session.url) {
      return json({ error: "no_checkout_url" }, 500);
    }
    return json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout create failed", e);
    return json({ error: "stripe_error" }, 502);
  }
});
