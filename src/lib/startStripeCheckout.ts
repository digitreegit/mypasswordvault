import type { SupabaseClient } from "@supabase/supabase-js";
import { markCheckoutPending } from "./checkoutReturn";

type CheckoutResponse = { url?: string; error?: string };

export type StartStripeCheckoutResult =
  | { ok: true; openedInNewTab: boolean }
  | { ok: false; reason: string };

/** Starts Stripe Checkout. Prefers a new tab so the vault tab stays unlocked. */
export async function startStripeCheckout(
  sb: SupabaseClient,
): Promise<StartStripeCheckoutResult> {
  const { data, error } = await sb.functions.invoke<CheckoutResponse>(
    "create-checkout-session",
    { body: {} },
  );
  if (error) {
    return { ok: false, reason: error.message || "invoke_failed" };
  }
  if (data?.error) {
    return { ok: false, reason: data.error };
  }
  if (data?.url) {
    markCheckoutPending();
    // Named window without noopener so `window.opener` works for postMessage back to vault tab.
    const popup = window.open(data.url, "mpw_stripe_checkout");
    if (!popup) {
      window.location.href = data.url;
      return { ok: true, openedInNewTab: false };
    }
    return { ok: true, openedInNewTab: true };
  }
  return { ok: false, reason: "no_checkout_url" };
}
