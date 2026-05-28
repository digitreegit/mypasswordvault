import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CHECKOUT_CANCEL_MESSAGE,
  CHECKOUT_COMPLETE_MESSAGE,
} from "../lib/checkoutReturn";
import { STRIPE_CHECKOUT_POPUP_NAME } from "../lib/stripeCheckoutPopup";

type TFn = (key: string) => string;

export function StripeCheckoutOverlay({
  open,
  t,
  onDismiss,
}: {
  open: boolean;
  t: TFn;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  useEffect(() => {
    if (!open) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const type = (e.data as { type?: string })?.type;
      if (
        type === CHECKOUT_COMPLETE_MESSAGE ||
        type === CHECKOUT_CANCEL_MESSAGE
      ) {
        onDismiss();
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [open, onDismiss]);

  if (!open) return null;

  function focusPopup() {
    try {
      const popup = window.open("", STRIPE_CHECKOUT_POPUP_NAME);
      popup?.focus();
    } catch {
      /* ignore */
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="presentation"
    >
      <div className="absolute inset-0 bg-ink-900/50" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stripe-checkout-overlay-title"
        className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl text-center"
      >
        <div
          className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-ink-200 border-t-accent-600 animate-spin"
          aria-hidden
        />
        <h2
          id="stripe-checkout-overlay-title"
          className="text-base font-semibold text-ink-900"
        >
          {t("pricing.checkoutPopupTitle")}
        </h2>
        <p className="mt-2 text-sm text-ink-600 leading-relaxed">
          {t("pricing.checkoutPopupBody")}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            className="btn-primary w-full justify-center"
            onClick={focusPopup}
          >
            {t("pricing.checkoutPopupFocus")}
          </button>
          <button
            type="button"
            className="btn-secondary w-full justify-center"
            onClick={onDismiss}
          >
            {t("pricing.checkoutPopupDismiss")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
