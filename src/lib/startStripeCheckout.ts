import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clearCheckoutPending,
  clearCheckoutPopupMode,
  markCheckoutPending,
  markCheckoutPopupMode,
} from "./checkoutReturn";
import {
  closeStripeCheckoutPopup,
  navigateStripePopup,
  openStripeCheckoutPopup,
  watchCheckoutPopup,
} from "./stripeCheckoutPopup";

type CheckoutResponse = { url?: string; error?: string };

export type StartStripeCheckoutResult =
  | { ok: true; stopWatching: () => void }
  | { ok: false; reason: string };

async function fetchCheckoutUrl(
  sb: SupabaseClient,
): Promise<{ url: string } | { error: string }> {
  const { data, error } = await sb.functions.invoke<CheckoutResponse>(
    "create-checkout-session",
    { body: {} },
  );
  if (error) {
    return { error: error.message || "invoke_failed" };
  }
  if (data?.error) {
    return { error: data.error };
  }
  if (data?.url) {
    return { url: data.url };
  }
  return { error: "no_checkout_url" };
}

/**
 * Opens Stripe Checkout in a centered popup immediately (on user click),
 * then loads the session URL when the server responds.
 */
export async function startStripeCheckout(
  sb: SupabaseClient,
  onPopupClosed?: () => void,
): Promise<StartStripeCheckoutResult> {
  closeStripeCheckoutPopup();
  const popup = openStripeCheckoutPopup();
  if (!popup) {
    return { ok: false, reason: "popup_blocked" };
  }

  markCheckoutPending();
  markCheckoutPopupMode();

  const stopWatching = watchCheckoutPopup(popup, () => {
    clearCheckoutPending();
    clearCheckoutPopupMode();
    onPopupClosed?.();
  });

  const stop = () => {
    stopWatching();
    onPopupClosed?.();
  };

  try {
    const result = await fetchCheckoutUrl(sb);
    if ("error" in result) {
      popup.close();
      clearCheckoutPending();
      clearCheckoutPopupMode();
      stopWatching();
      return { ok: false, reason: result.error };
    }
    if (popup.closed) {
      clearCheckoutPending();
      clearCheckoutPopupMode();
      stopWatching();
      return { ok: false, reason: "popup_closed" };
    }
    navigateStripePopup(popup, result.url);
    return { ok: true, stopWatching: stop };
  } catch (e) {
    popup.close();
    clearCheckoutPending();
    clearCheckoutPopupMode();
    stopWatching();
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "checkout_failed",
    };
  }
}
