import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  loadStripe,
  type Stripe,
} from "@stripe/stripe-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clearCheckoutPending,
  clearCheckoutPopupMode,
  markCheckoutPending,
  markCheckoutPopupMode,
} from "../lib/checkoutReturn";
import { createEmbeddedCheckoutSession } from "../lib/createEmbeddedCheckoutSession";
import type {
  StripeEmbeddedCheckout,
  StripeWithEmbeddedCheckout,
} from "../lib/stripeEmbeddedCheckout";

type TFn = (key: string) => string;

type Phase = "loading" | "ready" | "error";

export function StripeCheckoutModal({
  open,
  sb,
  t,
  onClose,
  onComplete,
}: {
  open: boolean;
  sb: SupabaseClient;
  t: TFn;
  onClose: () => void;
  onComplete: (sessionId: string) => void | Promise<void>;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);

  const destroyCheckout = useCallback(() => {
    checkoutRef.current?.destroy();
    checkoutRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    destroyCheckout();
    clearCheckoutPending();
    clearCheckoutPopupMode();
    onClose();
  }, [destroyCheckout, onClose]);

  useEffect(() => {
    if (!open) {
      destroyCheckout();
      setPhase("loading");
      setError(null);
      sessionIdRef.current = null;
      return;
    }

    markCheckoutPending();
    markCheckoutPopupMode();

    let cancelled = false;

    void (async () => {
      setPhase("loading");
      setError(null);

      const created = await createEmbeddedCheckoutSession(sb);
      if (cancelled) return;
      if (!created.ok) {
        clearCheckoutPending();
        clearCheckoutPopupMode();
        setPhase("error");
        setError(
          created.reason === "no_publishable_key"
            ? t("pricing.errStripeKey")
            : t("pricing.errCheckout"),
        );
        return;
      }

      const { clientSecret, sessionId, publishableKey } = created.session;
      sessionIdRef.current = sessionId;

      let stripe: Stripe | null;
      try {
        stripe = await loadStripe(publishableKey);
      } catch {
        stripe = null;
      }
      if (cancelled) return;
      if (!stripe || !mountRef.current) {
        clearCheckoutPending();
        clearCheckoutPopupMode();
        setPhase("error");
        setError(t("pricing.errCheckout"));
        return;
      }

      try {
        const embeddedStripe = stripe as Stripe & StripeWithEmbeddedCheckout;
        if (typeof embeddedStripe.initEmbeddedCheckout !== "function") {
          throw new Error("embedded_checkout_unsupported");
        }
        const checkout = await embeddedStripe.initEmbeddedCheckout({
          clientSecret,
          onComplete: () => {
            const sid = sessionIdRef.current;
            destroyCheckout();
            clearCheckoutPopupMode();
            if (sid) void Promise.resolve(onComplete(sid));
          },
        });
        if (cancelled) {
          checkout.destroy();
          return;
        }
        checkout.mount(mountRef.current);
        checkoutRef.current = checkout;
        setPhase("ready");
      } catch {
        clearCheckoutPending();
        clearCheckoutPopupMode();
        setPhase("error");
        setError(t("pricing.errCheckout"));
      }
    })();

    return () => {
      cancelled = true;
      destroyCheckout();
    };
  }, [open, sb, t, destroyCheckout, onComplete]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/55"
        aria-label={t("pricing.checkoutModalClose")}
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stripe-checkout-modal-title"
        className="relative flex w-full max-w-[min(100vw-1.5rem,32rem)] max-h-[min(92dvh,44rem)] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-200 px-4 py-3 sm:px-5">
          <h2
            id="stripe-checkout-modal-title"
            className="text-base font-semibold text-ink-900"
          >
            {t("pricing.checkoutModalTitle")}
          </h2>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800 transition-colors"
            onClick={handleClose}
            aria-label={t("pricing.checkoutModalClose")}
          >
            <XMarkIcon className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {phase === "loading" ? (
            <div className="flex min-h-[22rem] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <div
                className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-accent-600 animate-spin"
                aria-hidden
              />
              <p className="text-sm text-ink-600">{t("pricing.checkoutModalLoading")}</p>
            </div>
          ) : null}

          {phase === "error" ? (
            <div className="flex min-h-[14rem] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
              <p className="text-sm text-red-700">{error ?? t("pricing.errCheckout")}</p>
              <button type="button" className="btn-secondary" onClick={handleClose}>
                {t("pricing.checkoutModalClose")}
              </button>
            </div>
          ) : null}

          <div
            ref={mountRef}
            className={phase === "ready" ? "min-h-[22rem]" : "hidden"}
            aria-busy={phase === "loading"}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
