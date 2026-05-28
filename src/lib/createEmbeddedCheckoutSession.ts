import type { SupabaseClient } from "@supabase/supabase-js";

export type EmbeddedCheckoutSession = {
  clientSecret: string;
  sessionId: string;
  publishableKey: string;
};

type CheckoutResponse = {
  client_secret?: string;
  session_id?: string;
  publishable_key?: string;
  error?: string;
};

export function resolveStripePublishableKey(fromApi?: string | null): string | null {
  const fromServer = fromApi?.trim();
  if (fromServer?.startsWith("pk_")) return fromServer;
  const fromEnv = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
  return fromEnv?.startsWith("pk_") ? fromEnv : null;
}

export async function createEmbeddedCheckoutSession(
  sb: SupabaseClient,
): Promise<
  { ok: true; session: EmbeddedCheckoutSession } | { ok: false; reason: string }
> {
  const { data, error } = await sb.functions.invoke<CheckoutResponse>(
    "create-checkout-session",
    { body: { ui_mode: "embedded" } },
  );
  if (error) {
    return { ok: false, reason: error.message || "invoke_failed" };
  }
  if (data?.error) {
    return { ok: false, reason: data.error };
  }
  const clientSecret = data?.client_secret?.trim();
  const sessionId = data?.session_id?.trim();
  const publishableKey = resolveStripePublishableKey(data?.publishable_key);
  if (!clientSecret || !sessionId?.startsWith("cs_")) {
    return { ok: false, reason: "no_checkout_secret" };
  }
  if (!publishableKey) {
    return { ok: false, reason: "no_publishable_key" };
  }
  return {
    ok: true,
    session: { clientSecret, sessionId, publishableKey },
  };
}
