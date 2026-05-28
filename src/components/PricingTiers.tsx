import React from "react";
import type { Session } from "@supabase/supabase-js";
import { FREE_ENTRY_LIMIT } from "../lib/entitlements";
import { Check } from "./Icons";

export type PricingTiersProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  configured: boolean;
  loading: boolean;
  session: Session | null;
  licensed: boolean | null;
  busy: boolean;
  err: string | null;
  checkoutFlash?: string | null;
  onCheckout: () => void;
  onSignIn: () => void;
  /** `drawer` uses a side-by-side two-column grid (compact cards). */
  layout?: "page" | "drawer";
};

const drawerCardClass = "card p-4 flex flex-col min-w-0";
const pageCardClass = "card p-5 sm:p-6 flex flex-col";

export function PricingTiers({
  t,
  configured,
  loading,
  session,
  licensed,
  busy,
  err,
  checkoutFlash,
  onCheckout,
  onSignIn,
  layout = "page",
}: PricingTiersProps) {
  const isDrawer = layout === "drawer";
  const gridClass = isDrawer
    ? "grid gap-4 grid-cols-2 items-stretch min-w-0"
    : "grid gap-6 md:grid-cols-2 md:gap-8 items-stretch";
  const cardClass = isDrawer ? drawerCardClass : pageCardClass;
  const tierTitleClass = isDrawer
    ? "text-sm font-semibold text-accent-700 uppercase tracking-wide"
    : "text-lg font-semibold text-accent-700 uppercase tracking-wide";
  const priceClass = isDrawer
    ? "mt-2 text-2xl font-bold text-ink-900 tracking-tight"
    : "mt-3 text-3xl font-bold text-ink-900 tracking-tight";
  const listClass = isDrawer
    ? "mt-4 space-y-2 text-xs text-ink-700 flex-1"
    : "mt-5 space-y-2.5 text-sm text-ink-700 flex-1";
  const checkClass = isDrawer ? "h-4 w-4 shrink-0 text-accent-600" : "h-5 w-5 shrink-0 text-accent-600";

  return (
    <div className="space-y-4">
      {checkoutFlash ? (
        <div
          className="rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-700 shadow-sm"
          role="status"
        >
          {checkoutFlash}
        </div>
      ) : null}

      {!configured ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          {t("pricing.supabaseRequired")}
        </p>
      ) : null}

      {configured && loading ? (
        <p className="text-ink-500 text-sm">{t("app.authLoading")}</p>
      ) : null}

      {configured && session && licensed === true ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {t("pricing.youAreLicensed")}
        </div>
      ) : null}

      {err ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {err}
        </p>
      ) : null}

      <div className={gridClass}>
        <section className={`${cardClass} border-ink-200`}>
          <h2 className={tierTitleClass}>{t("pricing.tierFree")}</h2>
          <p className={priceClass}>$0</p>
          <p className="text-xs text-ink-500 mt-1">{t("pricing.freeForever")}</p>
          <p className={`mt-2 ${isDrawer ? "text-xs" : "text-sm"} text-ink-600 leading-relaxed`}>
            {t("pricing.freeDesc")}
          </p>
          <ul className={listClass}>
            {(
              [
                "pricing.freeF1",
                "pricing.freeF2",
                "pricing.freeF3",
                "pricing.freeF4",
                "pricing.freeF5",
              ] as const
            ).map((k) => (
              <li key={k} className="flex gap-1.5">
                <Check className={checkClass} aria-hidden />
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
          <p
            className={
              isDrawer
                ? "mt-4 text-[0.65rem] text-ink-500 leading-snug border-t border-ink-100 pt-2"
                : "mt-5 text-xs text-ink-500 leading-snug border-t border-ink-100 pt-3"
            }
          >
            {t("pricing.freeFootnote", { limit: FREE_ENTRY_LIMIT })}
          </p>
        </section>

        <section
          className={`relative ${cardClass} border-2 border-accent-500 shadow-md ${isDrawer ? "pt-7" : "pt-8"}`}
        >
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-full text-[0.62rem] font-semibold uppercase tracking-wider bg-accent-600 text-white shadow-md whitespace-nowrap">
            {t("pricing.mostPopular")}
          </span>
          <h2 className={tierTitleClass}>{t("pricing.tierPaid")}</h2>
          <p className={priceClass}>$4.99</p>
          <p className="text-xs text-ink-500 mt-1">{t("pricing.paidOnce")}</p>
          <p className={`mt-2 ${isDrawer ? "text-xs" : "text-sm"} text-ink-600 leading-relaxed`}>
            {t("pricing.paidDesc")}
          </p>
          <ul className={listClass}>
            {(
              [
                "pricing.paidF1",
                "pricing.paidF2",
                "pricing.paidF3",
                "pricing.paidF4",
                "pricing.paidF5",
              ] as const
            ).map((k) => (
              <li key={k} className="flex gap-1.5">
                <Check className={checkClass} aria-hidden />
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>

          {licensed !== true ? (
            <div
              className={`${isDrawer ? "mt-4 pt-2" : "mt-6 pt-3"} border-t border-ink-100 space-y-2`}
            >
              {!session ? (
                <button
                  type="button"
                  className="btn-primary w-full justify-center"
                  disabled={!configured || busy || loading}
                  onClick={() => void onSignIn()}
                >
                  {t("pricing.signInToBuy")}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary w-full justify-center"
                  disabled={
                    !configured || busy || loading || (Boolean(session) && licensed === null)
                  }
                  onClick={() => void onCheckout()}
                >
                  {busy ? t("app.loading") : t("pricing.ctaBuy")}
                </button>
              )}
              <p className="text-xs text-ink-500 leading-snug">{t("pricing.signInHint")}</p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
