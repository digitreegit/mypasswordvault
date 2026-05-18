import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { translate } from "../lib/i18n/bundles";
import {
  detectBrowserLocale,
  normalizeLocale,
  type Locale,
} from "../lib/i18n/locale";
import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { FREE_ENTRY_LIMIT, fetchUserLicensed } from "../lib/entitlements";
import { isNativeApp } from "../lib/platform";
import { Check } from "./Icons";

function parseCheckoutQuery(): "success" | "cancel" | null {
  if (typeof window === "undefined") return null;
  const q = window.location.hash.split("?")[1];
  if (!q) return null;
  const v = new URLSearchParams(q).get("checkout");
  if (v === "success") return "success";
  if (v === "cancel") return "cancel";
  return null;
}

function clearCheckoutQuery() {
  const base = window.location.hash.split("?")[0] || "#/pricing";
  window.history.replaceState(null, "", base);
}

export function PricingPage() {
  const { configured, loading, session, signInWithGoogle } = useAuth();
  const [locale] = useState<Locale>(() => normalizeLocale(detectBrowserLocale()));
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

  useEffect(() => {
    void reloadLicense();
  }, [reloadLicense]);

  useEffect(() => {
    const q = parseCheckoutQuery();
    if (q === "success") {
      setCheckoutFlash(t("pricing.checkoutSuccess"));
      clearCheckoutQuery();
      void reloadLicense();
    } else if (q === "cancel") {
      setCheckoutFlash(t("pricing.checkoutCancel"));
      clearCheckoutQuery();
    }
  }, [reloadLicense, t]);

  async function startCheckout() {
    setErr(null);
    const sb = getSupabase();
    if (!sb || !session) {
      setErr(t("pricing.errSignIn"));
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await sb.functions.invoke<{ url?: string }>(
        "create-checkout-session",
        { body: {} },
      );
      if (error) {
        setErr(error.message || t("pricing.errCheckout"));
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setErr(t("pricing.errCheckout"));
    } catch (e) {
      setErr((e as Error)?.message ?? t("pricing.errCheckout"));
    } finally {
      setBusy(false);
    }
  }

  const backHref = isNativeApp() ? undefined : "/";

  return (
    <div className="min-h-screen min-h-[100dvh] bg-ink-50 text-ink-800 flex flex-col">
      <header className="border-b border-ink-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {backHref ? (
            <a
              href={backHref}
              className="text-sm font-medium text-accent-700 hover:text-accent-800 shrink-0"
            >
              {t("pricing.backHome")}
            </a>
          ) : null}
          <a
            href="#/"
            className="text-sm text-ink-600 hover:text-ink-900 shrink-0"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = "";
            }}
          >
            {t("pricing.backApp")}
          </a>
        </div>
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

        {checkoutFlash && (
          <div
            className="mb-8 rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-700 shadow-sm"
            role="status"
          >
            {checkoutFlash}
          </div>
        )}

        {!configured && (
          <p className="mb-8 text-center text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            {t("pricing.supabaseRequired")}
          </p>
        )}

        {configured && loading && (
          <p className="text-center text-ink-500 text-sm mb-8">{t("app.authLoading")}</p>
        )}

        {configured && uid && licensed === true && (
          <div className="mb-8 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 text-center">
            {t("pricing.youAreLicensed")}
          </div>
        )}

        {err && (
          <p className="mb-6 text-center text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {err}
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2 md:gap-8 items-stretch">
          <section className="card p-6 sm:p-8 flex flex-col border-ink-200">
            <h2 className="text-lg font-semibold text-accent-700 uppercase tracking-wide">
              {t("pricing.tierFree")}
            </h2>
            <p className="mt-4 text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">$0</p>
            <p className="text-sm text-ink-500 mt-1">{t("pricing.freeForever")}</p>
            <p className="mt-4 text-sm text-ink-600 leading-relaxed">{t("pricing.freeDesc")}</p>
            <ul className="mt-6 space-y-3 text-sm text-ink-700 flex-1">
              {(
                [
                  "pricing.freeF1",
                  "pricing.freeF2",
                  "pricing.freeF3",
                  "pricing.freeF4",
                  "pricing.freeF5",
                ] as const
              ).map((k) => (
                <li key={k} className="flex gap-2">
                  <Check className="h-5 w-5 shrink-0 text-accent-600" aria-hidden />
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-ink-500 leading-snug border-t border-ink-100 pt-4">
              {t("pricing.freeFootnote", { limit: FREE_ENTRY_LIMIT })}
            </p>
          </section>

          <section className="relative card p-6 sm:p-8 flex flex-col border-2 border-accent-500 shadow-md pt-9">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-[0.68rem] sm:text-xs font-semibold uppercase tracking-wider bg-accent-600 text-white shadow-md whitespace-nowrap">
              {t("pricing.mostPopular")}
            </span>
            <h2 className="text-lg font-semibold text-accent-700 uppercase tracking-wide">
              {t("pricing.tierPaid")}
            </h2>
            <p className="mt-4 text-3xl sm:text-4xl font-bold text-ink-900 tracking-tight">$4.99</p>
            <p className="text-sm text-ink-500 mt-1">{t("pricing.paidOnce")}</p>
            <p className="mt-4 text-sm text-ink-600 leading-relaxed">{t("pricing.paidDesc")}</p>
            <ul className="mt-6 space-y-3 text-sm text-ink-700 flex-1">
              {(
                [
                  "pricing.paidF1",
                  "pricing.paidF2",
                  "pricing.paidF3",
                  "pricing.paidF4",
                  "pricing.paidF5",
                ] as const
              ).map((k) => (
                <li key={k} className="flex gap-2">
                  <Check className="h-5 w-5 shrink-0 text-accent-600" aria-hidden />
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-4 border-t border-ink-100 space-y-3">
              {!session ? (
                <button
                  type="button"
                  className="btn-primary w-full justify-center"
                  disabled={!configured || busy || loading}
                  onClick={() => void signInWithGoogle()}
                >
                  {t("pricing.signInToBuy")}
                </button>
              ) : licensed === true ? (
                <button type="button" className="btn-secondary w-full justify-center" disabled>
                  {t("pricing.alreadyLicensed")}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary w-full justify-center"
                  disabled={
                    !configured || busy || loading || (Boolean(session) && licensed === null)
                  }
                  onClick={() => void startCheckout()}
                >
                  {busy ? t("app.loading") : t("pricing.ctaBuy")}
                </button>
              )}
              <p className="text-xs text-ink-500 leading-snug text-left">
                {t("pricing.signInHint")}
              </p>
            </div>
          </section>
        </div>

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
