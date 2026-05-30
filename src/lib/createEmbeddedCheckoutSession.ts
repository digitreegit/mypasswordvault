import type { SupabaseClient } from "@supabase/supabase-js";
import { checkoutAppBaseUrl } from "./checkoutAppBaseUrl";

export type EmbeddedCheckoutSession = {
  clientSecret: string;
  sessionId: string;
  publishableKey: string;
};

type CheckoutResponse = {
  client_secret?: string;
  session_id?: string;
  publishable_key?: string;
  url?: string;
  error?: string;
};

export function resolveStripePublishableKey(fromApi?: string | null): string | null {
  const fromServer = fromApi?.trim();
  if (fromServer?.startsWith("pk_")) return fromServer;
  const fromEnv = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
  return fromEnv?.startsWith("pk_") ? fromEnv : null;
}

async function readInvokeErrorBody(
  error: unknown,
): Promise<CheckoutResponse | null> {
  const ctx = error as { context?: { json?: () => Promise<CheckoutResponse> } };
  try {
    return (await ctx.context?.json?.()) ?? null;
  } catch {
    return null;
  }
}

export async function createEmbeddedCheckoutSession(
  sb: SupabaseClient,
): Promise<
  { ok: true; session: EmbeddedCheckoutSession } | { ok: false; reason: string }
> {
  const { data, error } = await sb.functions.invoke<CheckoutResponse>(
    "create-checkout-session",
    {
      body: {
        ui_mode: "embedded",
        return_base_url: checkoutAppBaseUrl(),
      },
    },
  );
  if (error) {
    const body = await readInvokeErrorBody(error);
    if (body?.error) return { ok: false, reason: body.error };
    return { ok: false, reason: error.message || "invoke_failed" };
  }
  if (data?.error) {
    return { ok: false, reason: data.error };
  }
  if (data?.url && !data.client_secret) {
    return { ok: false, reason: "no_checkout_secret" };
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

/** Fetch publishable key from env or a lightweight checkout-session probe. */
export async function resolveStripePublishableKeyForCheckout(
  sb: SupabaseClient,
): Promise<string | null> {
  const fromEnv = resolveStripePublishableKey(null);
  if (fromEnv) return fromEnv;
  const created = await createEmbeddedCheckoutSession(sb);
  if (created.ok) return created.session.publishableKey;
  return null;
}
