import { Check } from "./Icons";

const PAID_FEATURE_KEYS = [
  "pricing.paidF1",
  "pricing.paidF2",
  "pricing.paidF3",
  "pricing.paidF4",
  "pricing.paidF5",
] as const;

type TFn = (key: string) => string;

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
        <ul className="mt-3 space-y-2.5">
          {PAID_FEATURE_KEYS.map((key) => (
            <li key={key} className="flex gap-2 text-[0.8125rem] leading-snug text-ink-700">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-accent-600"
                aria-hidden
              />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-ink-500 leading-snug border-t border-ink-200 pt-3">
        {t("pricing.paidOnce")} · $4.99
      </p>
    </aside>
  );
}
