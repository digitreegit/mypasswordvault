/**
 * Creates a Stripe Checkout Session (one-time payment) for a permanent vault license.
 * Secrets: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY (pk_… for embedded checkout),
 * PUBLIC_APP_URL (e.g. https://yoursite.com/app — include /app in prod).
 * Optional: STRIPE_LICENSE_AMOUNT_CENTS (default 499 = $4.99).
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.8";
import Stripe from "npm:stripe@17.4.0";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Stripe success redirect must land on the React app (`/app/`), not the marketing root. */
function resolveAppBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  try {
    const u = new URL(trimmed);
    const path = u.pathname.replace(/\/$/, "") || "";
    if (path === "" || path === "/") {
      u.pathname = "/app";
    } else if (path !== "/app" && !path.startsWith("/app/")) {
      u.pathname = `${path}/app`.replace("//", "/");
    }
    return `${u.origin}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return trimmed.endsWith("/app") ? trimmed : `${trimmed}/app`;
  }
}

/** Allow localhost dev returns; otherwise use configured PUBLIC_APP_URL. */
function resolveCheckoutReturnBase(
  requested: unknown,
  fallback: string,
): string {
  if (typeof requested !== "string" || !requested.trim()) return fallback;
  try {
    const u = new URL(requested.trim().replace(/\/$/, ""));
    const host = u.hostname;
    const allowed =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "mypasswordvault.app" ||
      host.endsWith(".mypasswordvault.app");
    if (!allowed) return fallback;
    const path = u.pathname.replace(/\/$/, "") || "";
    if (path === "" || path === "/") {
      return `${u.origin}/app`;
    }
    if (path === "/app" || path.startsWith("/app/")) {
      return `${u.origin}/app`;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

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
  const appUrl = resolveAppBaseUrl(
    Deno.env.get("PUBLIC_APP_URL") ?? "https://mypasswordvault.app/app",
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
  const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY")?.trim() ?? "";

  let uiMode: "embedded" | "hosted" = "embedded";
  let returnBaseUrl: string | undefined;
  try {
    const body = await req.json();
    if (body?.ui_mode === "hosted") uiMode = "hosted";
    if (typeof body?.return_base_url === "string") {
      returnBaseUrl = body.return_base_url;
    }
  } catch {
    /* default embedded */
  }

  const checkoutReturnBase = resolveCheckoutReturnBase(returnBaseUrl, appUrl);

  const unitAmount = Number(Deno.env.get("STRIPE_LICENSE_AMOUNT_CENTS") ?? "499");
  if (!Number.isFinite(unitAmount) || unitAmount < 50) {
    return json({ error: "invalid_price_config" }, 500);
  }

  const lineItems = [
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
  ];

  const sessionBase = {
    mode: "payment" as const,
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: { supabase_user_id: user.id },
    line_items: lineItems,
  };

  try {
    if (uiMode === "embedded") {
      const session = await stripe.checkout.sessions.create({
        ...sessionBase,
        ui_mode: "embedded",
        redirect_on_completion: "if_required",
        return_url: `${checkoutReturnBase}/#/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      });
      if (!session.client_secret) {
        return json({ error: "no_checkout_secret" }, 500);
      }
      return json({
        client_secret: session.client_secret,
        session_id: session.id,
        publishable_key: publishableKey || undefined,
      });
    }

    const session = await stripe.checkout.sessions.create({
      ...sessionBase,
      success_url: `${appUrl}/#/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#/?checkout=cancel`,
    });
    if (!session.url) {
      return json({ error: "no_checkout_url" }, 500);
    }
    return json({ url: session.url });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "stripe_error";
    console.error("Stripe checkout create failed", e);
    return json({ error: message.includes("Stripe") ? "stripe_error" : message }, 502);
  }
});
