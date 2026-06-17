import React, { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { StoreBridgeStatus } from "../lib/initNativeStoreBridge";
import { FREE_ENTRY_LIMIT } from "../lib/entitlements";
import { getNativePlatform, storePricingMessageKey } from "../lib/platform";
import { Check } from "./Icons";
import { PRICING_PAID_FEATURE_KEYS } from "./CheckoutProFeatures";

export type PricingTiersProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  configured: boolean;
  loading: boolean;
  session: Session | null;
  userEmail?: string;
  licensed: boolean | null;
  entitlementLoaded?: boolean;
  busy: boolean;
  err: string | null;
  checkoutFlash?: string | null;
  onCheckout: () => void;
  onSignIn: () => void;
  /** Native app: in-app store purchase instead of Stripe. */
  storeBilling?: boolean;
  storeReady?: boolean;
  storeBridgeStatus?: StoreBridgeStatus;
  /** App Store / Play localized price, e.g. ₩7,700 */
  storeProPrice?: string | null;
  onStorePurchase?: () => void;
  /** `drawer` uses plan tabs (PRO default) instead of side-by-side cards. */
  layout?: "page" | "drawer";
};

const pageCardClass = "card p-5 sm:p-6 flex flex-col";

type TierTab = "free" | "pro";

function tierTabClass(active: boolean): string {
  return [
    "flex-1 min-w-0 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
    active
      ? "bg-white text-ink-900 shadow-sm ring-1 ring-ink-200"
      : "text-ink-600 hover:text-ink-900",
  ].join(" ");
}

export function PricingTiers({
  t,
  configured,
  loading,
  session,
  userEmail = "",
  licensed,
  entitlementLoaded = true,
  busy,
  err,
  checkoutFlash,
  onCheckout,
  onSignIn,
  storeBilling = false,
  storeReady = false,
  storeBridgeStatus = "idle",
  storeProPrice = null,
  onStorePurchase,
  layout = "page",
}: PricingTiersProps) {
  const isDrawer = layout === "drawer";
  const [activeTier, setActiveTier] = useState<TierTab>("pro");
  const nativePlatform = getNativePlatform();
  const storeUpgradeLabel = (() => {
    if (!isDrawer || !storeBilling) {
      return t(
        nativePlatform === "android" ? "pricing.ctaBuyPlay" : "pricing.upgradeToPro",
      );
    }
    if (storeProPrice) {
      return t("pricing.ctaPay", { price: storeProPrice });
    }
    return t("pricing.ctaPayGeneric");
  })();
  const cardClass = isDrawer ? "card p-5 flex flex-col min-w-0" : pageCardClass;
  const tierTitleClass = isDrawer
    ? "text-base font-semibold text-accent-700 uppercase tracking-wide"
    : "text-lg font-semibold text-accent-700 uppercase tracking-wide";
  const priceClass = isDrawer
    ? "mt-2 text-3xl font-bold text-ink-900 tracking-tight"
    : "mt-3 text-3xl font-bold text-ink-900 tracking-tight";
  const listClass = isDrawer
    ? "mt-4 space-y-2.5 text-sm text-ink-700 flex-1"
    : "mt-5 space-y-2.5 text-sm text-ink-700 flex-1";
  const checkClass = "h-5 w-5 shrink-0 text-accent-600";

  const storeStatusMessage = (() => {
    if (!storeBilling || storeReady) return null;
    if (storeBridgeStatus === "loading" || storeBridgeStatus === "idle") {
      return t(storePricingMessageKey("storeBridgeLoading"));
    }
    return t(storePricingMessageKey("storeBridgeFailedHint"));
  })();

  const freeSection = (
    <section className={`${cardClass} border-ink-200`}>
      <h2 className={tierTitleClass}>{t("pricing.tierFree")}</h2>
      <p className={priceClass}>$0</p>
      <p className="text-xs text-ink-500 mt-1">{t("pricing.freeForever")}</p>
      <p className="mt-2 text-sm text-ink-600 leading-relaxed">{t("pricing.freeDesc")}</p>
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
          <li key={k} className="flex gap-2">
            <Check className={checkClass} aria-hidden />
            <span>{t(k)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-ink-500 leading-snug border-t border-ink-100 pt-3">
        {t("pricing.freeFootnote", { limit: FREE_ENTRY_LIMIT })}
      </p>
    </section>
  );

  const proActions =
    licensed === true && storeBilling ? (
      <div className="mt-6 pt-3 border-t border-ink-100 space-y-2">
        {userEmail ? (
          <p className="text-xs text-ink-600 leading-snug">
            {t("pricing.signedInAs", { email: userEmail })}
          </p>
        ) : null}
        <span className="inline-flex items-center rounded-full bg-accent-600 px-3 py-1 text-sm font-semibold text-white tracking-wide">
          {t("pricing.tierPaid")}
        </span>
      </div>
    ) : licensed !== true ? (
      <div className="mt-6 pt-3 space-y-2">
        {!session ? (
          <button
            type="button"
            className="btn-primary w-full justify-center"
            disabled={!configured || busy || loading}
            onClick={() => void onSignIn()}
          >
            {t("pricing.signInToBuy")}
          </button>
        ) : storeBilling ? (
          <>
            {userEmail ? (
              <p className="text-xs text-ink-600 leading-snug">
                {t("pricing.signedInAs", { email: userEmail })}
              </p>
            ) : null}
            {!entitlementLoaded ? (
              <p className="text-sm text-ink-500">{t("pricing.licenseChecking")}</p>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-primary w-full justify-center"
                  disabled={
                    !configured ||
                    busy ||
                    loading ||
                    licensed === null ||
                    !entitlementLoaded
                  }
                  onClick={() =>
                    void (onStorePurchase ? onStorePurchase() : onCheckout())
                  }
                >
                  {busy ? t("app.loading") : storeUpgradeLabel}
                </button>
                {storeStatusMessage ? (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 leading-snug">
                    {storeStatusMessage}
                  </p>
                ) : storeReady ? (
                  <p className="text-xs text-ink-500 leading-snug">
                    {t("pricing.storeNote")}
                  </p>
                ) : null}
              </>
            )}
          </>
        ) : (
          <button
            type="button"
            className="btn-primary w-full justify-center"
            disabled={
              !configured ||
              busy ||
              loading ||
              (Boolean(session) && licensed === null)
            }
            onClick={() => void onCheckout()}
          >
            {busy ? t("app.loading") : t("pricing.ctaBuy")}
          </button>
        )}
        {!storeBilling ? (
          <p className="text-xs text-ink-500 leading-snug">{t("pricing.signInHint")}</p>
        ) : null}
      </div>
    ) : null;

  const proSection = (
    <section
      className={`relative ${cardClass} border-2 border-accent-500 shadow-md pt-8`}
    >
      <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-full text-[0.62rem] font-semibold uppercase tracking-wider bg-accent-600 text-white shadow-md whitespace-nowrap">
        {t("pricing.mostPopular")}
      </span>
      <h2 className={tierTitleClass}>{t("pricing.tierPaid")}</h2>
      <p className={priceClass}>
        {storeBilling
          ? storeProPrice ?? "…"
          : "$4.99"}
      </p>
      <p className="text-xs text-ink-500 mt-1">
        {storeBilling ? t("pricing.paidOnceStore") : t("pricing.paidOnce")}
      </p>
      <p className="mt-2 text-sm text-ink-600 leading-relaxed">{t("pricing.paidDesc")}</p>
      <ul className={listClass}>
        {PRICING_PAID_FEATURE_KEYS.map((k) => (
          <li key={k} className="flex gap-2">
            <Check className={checkClass} aria-hidden />
            <span>{t(k)}</span>
          </li>
        ))}
      </ul>
      {proActions}
    </section>
  );

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

      {configured && session && licensed === true && !storeBilling ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {t("pricing.youAreLicensed")}
        </div>
      ) : null}

      {err ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {err}
        </p>
      ) : null}

      {isDrawer ? (
        <>
          <div
            className="flex gap-1 rounded-lg border border-ink-200 bg-ink-50 p-1"
            role="tablist"
            aria-label={t("pricing.planTabsAria")}
          >
            <button
              type="button"
              role="tab"
              id="pricing-tab-free"
              aria-selected={activeTier === "free"}
              aria-controls="pricing-panel-free"
              className={tierTabClass(activeTier === "free")}
              onClick={() => setActiveTier("free")}
            >
              {t("pricing.tierFree")}
            </button>
            <button
              type="button"
              role="tab"
              id="pricing-tab-pro"
              aria-selected={activeTier === "pro"}
              aria-controls="pricing-panel-pro"
              className={tierTabClass(activeTier === "pro")}
              onClick={() => setActiveTier("pro")}
            >
              {t("pricing.tierPaid")}
            </button>
          </div>
          <div
            role="tabpanel"
            id={activeTier === "free" ? "pricing-panel-free" : "pricing-panel-pro"}
            aria-labelledby={
              activeTier === "free" ? "pricing-tab-free" : "pricing-tab-pro"
            }
          >
            {activeTier === "free" ? freeSection : proSection}
          </div>
        </>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 md:gap-8 items-stretch">
          {freeSection}
          {proSection}
        </div>
      )}
    </div>
  );
}
