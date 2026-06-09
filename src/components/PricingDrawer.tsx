import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../lib/auth";
import { getSupabase } from "../lib/supabaseClient";
import { useVault } from "../lib/vault";
import { useProPurchase } from "../hooks/useProPurchase";
import { usesStoreBilling, isNativeApp } from "../lib/platform";
import { initNativeStoreBridge } from "../lib/initNativeStoreBridge";
import { PricingTiers } from "./PricingTiers";
import { StripeCheckoutModal } from "./StripeCheckoutModal";

export function PricingDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { configured, loading, session, user, signInWithGoogle } = useAuth();
  const {
    t,
    licensed,
    entitlementLoaded,
    refreshEntitlements,
    finalizePaidCheckout,
  } = useVault();
  const [stripeBusy, setStripeBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const storeBilling = usesStoreBilling();
  const {
    busy: storeBusy,
    err: storeErr,
    setErr: setStoreErr,
    storeReady,
    bridgeStatus,
    storeProPrice,
    purchaseStore,
  } = useProPurchase(t);
  const busy = storeBilling ? storeBusy : stripeBusy;

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    setErr(null);
    void (async () => {
      const lic = await refreshEntitlements({ keepLoaded: true });
      if (lic) onClose();
    })();
    if (storeBilling) void initNativeStoreBridge();
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open, refreshEntitlements, onClose, storeBilling]);

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
      if (e.key === "Escape" && !checkoutModalOpen) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, checkoutModalOpen]);

  const handleCheckoutClose = useCallback(() => {
    setCheckoutModalOpen(false);
    setStripeBusy(false);
  }, []);

  const handleCheckoutComplete = useCallback(
    async (sessionId: string) => {
      setCheckoutModalOpen(false);
      setStripeBusy(false);
      await finalizePaidCheckout(sessionId);
      onClose();
    },
    [finalizePaidCheckout, onClose],
  );

  const startCheckout = useCallback(() => {
    setErr(null);
    setStoreErr(null);
    if (!session) {
      setErr(t("pricing.errSignIn"));
      return;
    }
    if (storeBilling) {
      void (async () => {
        if (await refreshEntitlements({ keepLoaded: true })) {
          onClose();
          return;
        }
        const r = await purchaseStore();
        if (r.ok) {
          await refreshEntitlements();
          onClose();
        }
      })();
      return;
    }
    setStripeBusy(true);
    setCheckoutModalOpen(true);
  }, [
    session,
    storeBilling,
    purchaseStore,
    refreshEntitlements,
    onClose,
    setStoreErr,
    t,
  ]);

  const sb = getSupabase();

  if (!open) return null;

  const licensedKnown = entitlementLoaded ? licensed : null;
  const native = isNativeApp();
  const userEmail = user?.email ?? session?.user?.email ?? "";

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] flex flex-col justify-end" role="presentation">
        <button
          type="button"
          className={`absolute inset-0 bg-ink-900/45 transition-opacity duration-300 ${
            entered ? "opacity-100" : "opacity-0"
          }`}
          aria-label={t("vault.entryLimitModalClose")}
          onClick={checkoutModalOpen ? undefined : onClose}
          disabled={checkoutModalOpen}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pricing-drawer-title"
          className={
            native
              ? `pricing-drawer-sheet relative flex w-full max-h-[min(92dvh,720px)] flex-col bg-white rounded-t-2xl shadow-[0_-8px_40px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out ${
                  entered ? "translate-y-0" : "translate-y-full"
                }`
              : `pricing-drawer-panel absolute inset-y-0 right-0 flex w-full max-w-[min(100%,32rem)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
                  entered ? "translate-x-0" : "translate-x-full"
                }`
          }
          onClick={(e) => e.stopPropagation()}
        >
          {native ? (
            <div
              className="pricing-drawer-handle mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ink-300"
              aria-hidden
            />
          ) : null}
          <header
            className="pricing-drawer-header shrink-0 flex items-start justify-between gap-3 border-b border-ink-200 px-4 py-4 sm:px-6"
          >
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
              className="modal-close-btn inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800 transition-colors disabled:opacity-40"
              onClick={onClose}
              disabled={checkoutModalOpen}
              aria-label={t("vault.entryLimitModalClose")}
            >
              <XMarkIcon className="modal-close-btn__icon h-5 w-5" aria-hidden />
            </button>
          </header>

          <div className="pricing-drawer-body keyboard-scroll-root native-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <PricingTiers
              t={t}
              configured={configured}
              loading={loading}
              session={session}
              userEmail={userEmail}
              licensed={licensedKnown}
              entitlementLoaded={entitlementLoaded}
              busy={busy}
              err={err ?? storeErr}
              onCheckout={startCheckout}
              onSignIn={() => void signInWithGoogle()}
              storeBilling={storeBilling}
              storeReady={storeReady}
              storeBridgeStatus={bridgeStatus}
              storeProPrice={storeProPrice}
              onStorePurchase={startCheckout}
              layout="drawer"
            />
          </div>
        </div>
      </div>
      {sb && checkoutModalOpen && !storeBilling ? (
        <StripeCheckoutModal
          open={checkoutModalOpen}
          sb={sb}
          t={t}
          onClose={handleCheckoutClose}
          onComplete={handleCheckoutComplete}
        />
      ) : null}
    </>,
    document.body,
  );
}
