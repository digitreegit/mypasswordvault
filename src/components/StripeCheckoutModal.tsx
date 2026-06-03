import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clearCheckoutPending,
  clearCheckoutPopupMode,
  markCheckoutPending,
  markCheckoutPopupMode,
} from "../lib/checkoutReturn";
import {
  createEmbeddedCheckoutSession,
  resolveStripePublishableKey,
} from "../lib/createEmbeddedCheckoutSession";
import type {
  StripeEmbeddedCheckout,
  StripeWithEmbeddedCheckout,
} from "../lib/stripeEmbeddedCheckout";
import { usesStoreBilling } from "../lib/platform";
import { CheckoutProFeatures } from "./CheckoutProFeatures";

type TFn = (key: string) => string;

type Phase = "loading" | "ready" | "error";

function checkoutErrorMessage(reason: string, t: TFn): string {
  switch (reason) {
    case "no_publishable_key":
      return t("pricing.errStripeKey");
    case "unauthorized":
      return t("pricing.errSignIn");
    case "server_misconfigured":
    case "stripe_error":
    case "no_checkout_secret":
      return t("pricing.errCheckout");
    default:
      return import.meta.env.DEV
        ? `${t("pricing.errCheckout")} (${reason})`
        : t("pricing.errCheckout");
  }
}

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
  const initIdRef = useRef(0);
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

    if (usesStoreBilling()) {
      return;
    }

    markCheckoutPending();
    markCheckoutPopupMode();

    const initId = ++initIdRef.current;
    let cancelled = false;

    void (async () => {
      setPhase("loading");
      setError(null);

      let publishableKey = resolveStripePublishableKey(null);
      if (!publishableKey) {
        const probe = await createEmbeddedCheckoutSession(sb);
        if (cancelled || initId !== initIdRef.current) return;
        if (!probe.ok) {
          clearCheckoutPending();
          clearCheckoutPopupMode();
          setPhase("error");
          setError(checkoutErrorMessage(probe.reason, t));
          return;
        }
        publishableKey = probe.session.publishableKey;
      }

      let stripe: Stripe | null;
      try {
        stripe = await loadStripe(publishableKey);
      } catch (e) {
        if (import.meta.env.DEV) console.error("loadStripe failed", e);
        stripe = null;
      }
      if (cancelled || initId !== initIdRef.current) return;
      if (!stripe || !mountRef.current) {
        clearCheckoutPending();
        clearCheckoutPopupMode();
        setPhase("error");
        setError(t("pricing.errCheckout"));
        return;
      }

      const embeddedStripe = stripe as Stripe & StripeWithEmbeddedCheckout;
      if (typeof embeddedStripe.createEmbeddedCheckoutPage !== "function") {
        clearCheckoutPending();
        clearCheckoutPopupMode();
        setPhase("error");
        setError(t("pricing.errCheckout"));
        if (import.meta.env.DEV) {
          console.error("Stripe.createEmbeddedCheckoutPage is not available");
        }
        return;
      }

      try {
        const checkout = await embeddedStripe.createEmbeddedCheckoutPage({
          fetchClientSecret: async () => {
            const created = await createEmbeddedCheckoutSession(sb);
            if (!created.ok) {
              throw new Error(created.reason);
            }
            sessionIdRef.current = created.session.sessionId;
            return created.session.clientSecret;
          },
          onComplete: () => {
            const sid = sessionIdRef.current;
            destroyCheckout();
            clearCheckoutPopupMode();
            if (sid) void Promise.resolve(onComplete(sid));
          },
        });
        if (cancelled || initId !== initIdRef.current) {
          checkout.destroy();
          return;
        }
        checkout.mount(mountRef.current);
        checkoutRef.current = checkout;
        setPhase("ready");
      } catch (e) {
        if (cancelled || initId !== initIdRef.current) return;
        clearCheckoutPending();
        clearCheckoutPopupMode();
        setPhase("error");
        const reason = e instanceof Error ? e.message : "checkout_mount_failed";
        setError(checkoutErrorMessage(reason, t));
        if (import.meta.env.DEV) {
          console.error("Stripe embedded checkout mount failed", e);
        }
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
    if (open && usesStoreBilling()) {
      onClose();
    }
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || usesStoreBilling()) return null;

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
        className="relative flex w-full max-w-[min(calc(100%-1.5rem),56rem)] max-h-[min(92dvh,44rem)] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
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

        <div className="flex flex-1 min-h-0 flex-col sm:flex-row">
          <div className="relative flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain">
            <div className="relative min-h-[22rem] w-full">
              {phase === "loading" ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white px-6 py-10 text-center">
                  <div
                    className="h-8 w-8 rounded-full border-2 border-ink-200 border-t-accent-600 animate-spin"
                    aria-hidden
                  />
                  <p className="text-sm text-ink-600">{t("pricing.checkoutModalLoading")}</p>
                </div>
              ) : null}
              {phase === "error" ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white px-6 py-10 text-center">
                  <p className="text-sm text-red-700">{error ?? t("pricing.errCheckout")}</p>
                  <button type="button" className="btn-secondary" onClick={handleClose}>
                    {t("pricing.checkoutModalClose")}
                  </button>
                </div>
              ) : null}
              {/* Stripe requires an empty mount target — no child nodes. */}
              <div ref={mountRef} className="min-h-[22rem] w-full" />
            </div>
          </div>
          <div className="shrink-0 border-t border-ink-200 bg-ink-50/90 px-5 py-5 sm:w-[17.5rem] sm:border-t-0 sm:border-l lg:w-[20rem] lg:px-6 lg:py-6 overflow-y-auto overscroll-contain">
            <CheckoutProFeatures t={t} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
