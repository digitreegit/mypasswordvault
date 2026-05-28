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
import { startStripeCheckout } from "../lib/startStripeCheckout";
import { useCheckoutReturn } from "../hooks/useCheckoutReturn";
import { confirmCheckoutSession } from "../lib/confirmCheckoutSession";
import {
  clearCheckoutPending,
  finalizeCheckoutAfterPayment,
  type CheckoutReturn,
} from "../lib/checkoutReturn";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { PricingTiers } from "./PricingTiers";

export function PricingPage() {
  const { configured, loading, session, signInWithGoogle } = useAuth();
  const [locale, setLocale] = useState<Locale>(
    () => readStoredLocale() ?? normalizeLocale(detectBrowserLocale())
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [licensed, setLicensed] = useState<boolean | null>(null);
  const [checkoutFlash, setCheckoutFlash] = useState<string | null>(null);

  const t = useCallback(
    (k: string, v?: Record<string, string | number>) => translate(locale, k, v),
    [locale],
  );
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
      setCheckoutFlash(
        result === "success"
          ? t("pricing.checkoutSuccess")
          : t("pricing.checkoutCancel"),
      );
      if (result === "cancel") {
        clearCheckoutPending();
        return;
      }
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

  async function startCheckout() {
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
  }

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
          err={err}
          checkoutFlash={checkoutFlash}
          onCheckout={() => void startCheckout()}
          onSignIn={() => void signInWithGoogle()}
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
    </div>
  );
}
