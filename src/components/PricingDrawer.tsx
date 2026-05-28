import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../lib/auth";
import { getSupabase } from "../lib/supabaseClient";
import { startStripeCheckout } from "../lib/startStripeCheckout";
import { useVault } from "../lib/vault";
import { PricingTiers } from "./PricingTiers";

export function PricingDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { configured, loading, session, signInWithGoogle } = useAuth();
  const { t, licensed, entitlementLoaded, refreshEntitlements } = useVault();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    setErr(null);
    void refreshEntitlements();
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open, refreshEntitlements]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const startCheckout = useCallback(async () => {
    setErr(null);
    const sb = getSupabase();
    if (!sb || !session) {
      setErr(t("pricing.errSignIn"));
      return;
    }
    setBusy(true);
    try {
      const result = await startStripeCheckout(sb);
      if (!result.ok) {
        setErr(t("pricing.errCheckout"));
      }
    } catch (e) {
      setErr((e as Error)?.message ?? t("pricing.errCheckout"));
    } finally {
      setBusy(false);
    }
  }, [session, t]);

  if (!open) return null;

  const licensedKnown = entitlementLoaded ? licensed : null;

  return createPortal(
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button
        type="button"
        className={`absolute inset-0 bg-ink-900/40 transition-opacity duration-300 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        aria-label={t("vault.entryLimitModalClose")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-drawer-title"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[min(100vw,56rem)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          entered ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 flex items-start justify-between gap-3 border-b border-ink-200 px-4 py-4 sm:px-6">
          <div className="min-w-0 pr-2">
            <h2
              id="pricing-drawer-title"
              className="text-lg sm:text-xl font-semibold text-ink-900 tracking-tight"
            >
              {t("pricing.title")}
            </h2>
            <p className="mt-1 text-sm text-ink-600 leading-snug">{t("pricing.subtitle")}</p>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800 transition-colors"
            onClick={onClose}
            aria-label={t("vault.entryLimitModalClose")}
          >
            <XMarkIcon className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <PricingTiers
            t={t}
            configured={configured}
            loading={loading}
            session={session}
            licensed={licensedKnown}
            busy={busy}
            err={err}
            onCheckout={() => void startCheckout()}
            onSignIn={() => void signInWithGoogle()}
            layout="drawer"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
