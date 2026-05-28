import { useLayoutEffect } from "react";
import { translate } from "../lib/i18n/bundles";
import { detectBrowserLocale } from "../lib/i18n/locale";
import {
  CHECKOUT_CANCEL_MESSAGE,
  clearCheckoutPending,
  clearCheckoutPopupMode,
  clearCheckoutReturn,
} from "../lib/checkoutReturn";

/** Stripe cancel/back in checkout popup: close popup without affecting the opener tab. */
export function CheckoutCancelRelay() {
  useLayoutEffect(() => {
    const opener = window.opener;
    if (opener && !opener.closed) {
      opener.postMessage({ type: CHECKOUT_CANCEL_MESSAGE }, window.location.origin);
    }
    clearCheckoutReturn();
    clearCheckoutPending();
    clearCheckoutPopupMode();
    window.close();
  }, []);

  const t = (k: string) => translate(detectBrowserLocale(), k);
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-6 bg-ink-50 text-ink-700 text-sm text-center">
      {t("pricing.checkoutClosingTab")}
    </div>
  );
}
