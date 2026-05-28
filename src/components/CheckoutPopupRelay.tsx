import { useLayoutEffect } from "react";
import { translate } from "../lib/i18n/bundles";
import { detectBrowserLocale } from "../lib/i18n/locale";
import {
  CHECKOUT_COMPLETE_MESSAGE,
  clearCheckoutPending,
  clearCheckoutReturn,
  getCheckoutSessionId,
} from "../lib/checkoutReturn";

/** Stripe success tab opened from vault: notify opener (stays unlocked) and close. */
export function CheckoutPopupRelay() {
  useLayoutEffect(() => {
    const opener = window.opener;
    if (!opener || opener.closed) return;
    const sessionId = getCheckoutSessionId();
    opener.postMessage(
      { type: CHECKOUT_COMPLETE_MESSAGE, sessionId },
      window.location.origin,
    );
    clearCheckoutReturn();
    clearCheckoutPending();
    window.close();
  }, []);

  const t = (k: string) => translate(detectBrowserLocale(), k);
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-6 bg-ink-50 text-ink-700 text-sm text-center">
      {t("pricing.checkoutClosingTab")}
    </div>
  );
}
