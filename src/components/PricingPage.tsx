import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { translate } from "../lib/i18n/bundles";
import {
  detectBrowserLocale,
  normalizeLocale,
  readStoredLocale,
  type Locale,
} from "../lib/i18n/locale";
import { subscribeLocaleChanged } from "../lib/appLocale";
import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { fetchUserLicensed } from "../lib/entitlements";
import { useCheckoutReturn } from "../hooks/useCheckoutReturn";
import { confirmCheckoutSession } from "../lib/confirmCheckoutSession";
import {
  clearCheckoutPending,
  clearCheckoutPopupMode,
  finalizeCheckoutAfterPayment,
  type CheckoutReturn,
} from "../lib/checkoutReturn";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useProPurchase } from "../hooks/useProPurchase";
import { usesStoreBilling } from "../lib/platform";
import { PricingTiers } from "./PricingTiers";
import { StripeCheckoutModal } from "./StripeCheckoutModal";

export function PricingPage() {
  const { configured, loading, session, signInWithGoogle } = useAuth();
  const [locale, setLocale] = useState<Locale>(
    () => readStoredLocale() ?? normalizeLocale(detectBrowserLocale())
  );
  const [stripeBusy, setStripeBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [licensed, setLicensed] = useState<boolean | null>(null);
  const [checkoutFlash, setCheckoutFlash] = useState<string | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const t = useCallback(
    (k: string, v?: Record<string, string | number>) => translate(locale, k, v),
    [locale],
  );
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
  const uid = session?.user?.id;

  const reloadLicense = useCallback(async () => {
    if (!uid || !isSupabaseConfigured) {
      setLicensed(null);
      return;
    }
    setLicensed(await fetchUserLicensed(uid));
  }, [uid]);

  const onCheckoutReturn = useCallback(
    ({ result, sessionId }: { result: CheckoutReturn; sessionId: string | null }) => {
      if (result === "cancel") {
        clearCheckoutPending();
        clearCheckoutPopupMode();
        setCheckoutFlash(t("pricing.checkoutCancel"));
        return;
      }
      setCheckoutFlash(t("pricing.checkoutSuccess"));
      void (async () => {
        if (!uid) return;
        await finalizeCheckoutAfterPayment(
          async () => {
            const lic = await fetchUserLicensed(uid);
            setLicensed(lic);
            return lic;
          },
          confirmCheckoutSession,
          sessionId,
          () => setLicensed(true),
        );
      })();
    },
    [t, uid],
  );

  useCheckoutReturn(onCheckoutReturn);

  useEffect(() => {
    void reloadLicense();
  }, [reloadLicense]);

  useEffect(() => subscribeLocaleChanged(setLocale), []);

  const handleCheckoutClose = useCallback(() => {
    setCheckoutModalOpen(false);
    setStripeBusy(false);
  }, []);

  const handleCheckoutComplete = useCallback(
    async (sessionId: string) => {
      setCheckoutModalOpen(false);
      setStripeBusy(false);
      if (!uid) return;
      await finalizeCheckoutAfterPayment(
        async () => {
          const lic = await fetchUserLicensed(uid);
          setLicensed(lic);
          return lic;
        },
        confirmCheckoutSession,
        sessionId,
        () => setLicensed(true),
      );
      setCheckoutFlash(t("pricing.checkoutSuccess"));
    },
    [t, uid],
  );

  function startCheckout() {
    setErr(null);
    setStoreErr(null);
    if (!session) {
      setErr(t("pricing.errSignIn"));
      return;
    }
    if (storeBilling) {
      void (async () => {
        const r = await purchaseStore();
        if (r.ok) await reloadLicense();
      })();
      return;
    }
    setStripeBusy(true);
    setCheckoutModalOpen(true);
  }

  const sb = getSupabase();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-ink-50 text-ink-800 flex flex-col">
      <header className="border-b border-ink-200 bg-white px-4 py-3 sm:px-6">
        <a
          href="#/"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-600 hover:text-ink-900 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = "";
          }}
        >
          <ArrowLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
          {t("account.backToVault")}
        </a>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 sm:py-14">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
            {t("pricing.title")}
          </h1>
          <p className="mt-3 text-ink-600 text-sm sm:text-base leading-relaxed">
            {t("pricing.subtitle")}
          </p>
        </div>

        <PricingTiers
          t={t}
          configured={configured}
          loading={loading}
          session={session}
          licensed={licensed}
          busy={busy}
          err={err ?? storeErr}
          checkoutFlash={checkoutFlash}
          onCheckout={startCheckout}
          onSignIn={() => void signInWithGoogle()}
          storeBilling={storeBilling}
          storeReady={storeReady}
          storeBridgeStatus={bridgeStatus}
          storeProPrice={storeProPrice}
          onStorePurchase={startCheckout}
          layout="page"
        />

        <section className="mt-12 rounded-xl border border-ink-200 bg-white p-5 sm:p-6 text-sm text-ink-600 leading-relaxed">
          <h3 className="font-semibold text-ink-900 mb-2">{t("pricing.opsTitle")}</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>{t("pricing.ops1")}</li>
            <li>{t("pricing.ops2")}</li>
            <li>{t("pricing.ops3")}</li>
            <li>{t("pricing.ops4")}</li>
          </ol>
        </section>
      </main>
      {sb && checkoutModalOpen && !storeBilling ? (
        <StripeCheckoutModal
          open={checkoutModalOpen}
          sb={sb}
          t={t}
          onClose={handleCheckoutClose}
          onComplete={handleCheckoutComplete}
        />
      ) : null}
    </div>
  );
}
