import { Check } from "./Icons";

export const CHECKOUT_PAID_FEATURE_KEYS = [
  "pricing.paidF3",
  "pricing.paidTierUnlimited",
  "pricing.paidF4",
  "pricing.freeF2",
  "pricing.freeF3",
  "pricing.freeF4",
  "pricing.paidF5",
] as const;

/** Settings → Plan (free): included with Free tier. */
export const SETTINGS_FREE_FEATURE_KEYS = [
  "pricing.freeF1",
  "pricing.freeF2",
  "pricing.freeF3",
  "pricing.freeF4",
  "pricing.freeF5",
] as const;

/** Settings → Plan (licensed): checkout list without one-time payment line. */
export const SETTINGS_PRO_FEATURE_KEYS = [
  "pricing.paidTierUnlimited",
  "pricing.paidF4",
  "pricing.freeF2",
  "pricing.freeF3",
  "pricing.freeF4",
  "pricing.paidF5",
] as const;

/** Settings → Plan (free): PRO upsell bullets only (no duplicated Free lines). */
export const SETTINGS_FREE_UPGRADE_PRO_KEYS = [
  "pricing.paidTierUnlimited",
  "pricing.paidF4",
] as const;

/** Pricing page / drawer PRO tier — short bullet list. */
export const PRICING_PAID_FEATURE_KEYS = [
  "pricing.paidF2",
  "pricing.paidTierUnlimited",
  "pricing.paidF3",
  "pricing.paidF4",
] as const;

type TFn = (key: string) => string;

export function ProFeaturesBulletList({
  t,
  keys = CHECKOUT_PAID_FEATURE_KEYS,
  className = "",
  itemClassName = "text-[0.8125rem]",
}: {
  t: TFn;
  keys?: readonly string[];
  className?: string;
  itemClassName?: string;
}) {
  return (
    <ul className={`space-y-2.5 ${className}`.trim()}>
      {keys.map((key) => (
        <li
          key={key}
          className={`flex gap-2 leading-snug text-ink-700 ${itemClassName}`.trim()}
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden />
          <span>{t(key)}</span>
        </li>
      ))}
    </ul>
  );
}

/** PRO plan features on Settings → Plan (licensed / admin) — bullet list only. */
export function SettingsProFeatures({ t }: { t: TFn }) {
  return (
    <div className="border-t border-ink-100 pt-4">
      <ProFeaturesBulletList t={t} keys={SETTINGS_PRO_FEATURE_KEYS} itemClassName="text-sm" />
    </div>
  );
}

/** Free tier bullets on Settings → Plan. */
export function SettingsFreeFeatures({ t }: { t: TFn }) {
  return (
    <div className="border-t border-ink-100 pt-4">
      <ProFeaturesBulletList t={t} keys={SETTINGS_FREE_FEATURE_KEYS} itemClassName="text-sm" />
    </div>
  );
}

/** Upgrade CTA + PRO bullets on Settings → Plan (free accounts). */
export function SettingsFreePlanUpgrade({
  t,
  busy,
  err,
  checkoutDisabled,
  onCheckout,
}: {
  t: TFn;
  busy: boolean;
  err: string | null;
  checkoutDisabled: boolean;
  onCheckout: () => void;
}) {
  return (
    <div className="border-t border-ink-100 pt-4 space-y-3">
      {err ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {err}
        </p>
      ) : null}
      <p className="text-xs text-ink-600 leading-snug">{t("settings.licensePaid")}</p>
      <button
        type="button"
        className="btn-primary w-full justify-center sm:w-auto"
        disabled={checkoutDisabled}
        onClick={() => void onCheckout()}
      >
        {busy ? t("app.loading") : t("settings.upgradeToPro")}
      </button>
      <ProFeaturesBulletList
        t={t}
        keys={SETTINGS_FREE_UPGRADE_PRO_KEYS}
        itemClassName="text-sm"
      />
    </div>
  );
}

export function CheckoutProFeatures({ t }: { t: TFn }) {
  return (
    <aside className="flex flex-col gap-4 text-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">
          {t("pricing.tierPaid")}
        </p>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-600">
          {t("pricing.checkoutModalUpgradeIntro")}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink-900">
          {t("pricing.checkoutModalFeaturesTitle")}
        </h3>
        <ProFeaturesBulletList t={t} className="mt-3" />
      </div>
      <p className="text-xs text-ink-500 leading-snug border-t border-ink-200 pt-3">
        {t("pricing.paidOnce")} · $4.99
      </p>
    </aside>
  );
}
