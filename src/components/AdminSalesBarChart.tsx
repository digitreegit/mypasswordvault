import React, { useMemo } from "react";
import type { AdminStats } from "../lib/adminApi";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

const PLATFORM_SEGMENTS = [
  { key: "web", labelKey: "admin.platformWeb", colorClass: "bg-sky-500" },
  { key: "ios", labelKey: "admin.platformIos", colorClass: "bg-red-500" },
  {
    key: "android",
    labelKey: "admin.platformAndroid",
    colorClass: "bg-emerald-500",
  },
] as const;

type Segment = {
  key: string;
  label: string;
  value: number;
  colorClass: string;
};

function LegendItem({
  colorClass,
  label,
  value,
  muted = false,
}: {
  colorClass: string;
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs ${
        muted ? "text-ink-400" : "text-ink-700"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorClass}`}
        aria-hidden
      />
      <span>{label}</span>
      <span
        className={`tabular-nums ${value > 0 ? "text-ink-500" : "text-ink-300"}`}
      >
        {value}
      </span>
    </div>
  );
}

function StackedStorageBar({
  segments,
  total,
  ariaLabel,
}: {
  segments: Segment[];
  total: number;
  ariaLabel: string;
}) {
  const active = segments.filter((s) => s.value > 0);
  const denom = total > 0 ? total : 1;

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-sm bg-ink-100 flex"
      role="img"
      aria-label={ariaLabel}
    >
      {total <= 0 ? (
        <div className="h-full w-full bg-ink-100" aria-hidden />
      ) : (
        active.map((seg) => {
          const pct = (seg.value / denom) * 100;
          return (
            <div
              key={seg.key}
              className={`h-full shrink-0 ${seg.colorClass}`}
              style={{
                width: `${pct}%`,
                minWidth: seg.value > 0 ? "3px" : undefined,
              }}
              title={`${seg.label}: ${seg.value}`}
            />
          );
        })
      )}
    </div>
  );
}

export function AdminSalesBarChart({
  stats,
  t,
  formatMoney,
  variant = "card",
}: {
  stats: AdminStats;
  t: TFn;
  formatMoney: (cents: number | null, currency: string) => string;
  variant?: "card" | "embedded";
}) {
  const total = stats.sales_total ?? 0;
  const platform = stats.sales_by_platform ?? { web: 0, ios: 0, android: 0 };
  let web = platform.web;
  const ios = platform.ios;
  const android = platform.android;
  const assigned = web + ios + android;
  if (total > assigned) web += total - assigned;

  const segments = useMemo<Segment[]>(
    () =>
      PLATFORM_SEGMENTS.map((item) => ({
        key: item.key,
        label: t(item.labelKey),
        value:
          item.key === "web"
            ? web
            : item.key === "ios"
              ? ios
              : android,
        colorClass: item.colorClass,
      })),
    [android, ios, t, web],
  );

  const barTotal = web + ios + android;

  const ariaLabel = segments
    .filter((s) => s.value > 0)
    .map((s) => `${s.label} ${s.value}`)
    .join(", ");

  const chartBody = (
    <>
      {variant === "embedded" ? (
        <p className="text-xs font-semibold text-ink-700">
          {t("admin.statsByPlatform")}
        </p>
      ) : (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-sm font-semibold text-ink-900">
            {t("admin.statsSalesProTotal")}
          </h2>
          <p className="text-sm text-ink-600 tabular-nums">
            {t("admin.chartSalesSummary", {
              total,
              amount: "",
            }).replace(/\s*·\s*$/, "")}
            {" · "}
            <span className="font-medium text-emerald-600">
              {formatMoney(stats.sales_amount_cents_total ?? 0, "usd")}
            </span>
          </p>
        </div>
      )}

      <div className={variant === "embedded" ? "mt-2" : "mt-3"}>
        <StackedStorageBar
          segments={segments}
          total={barTotal}
          ariaLabel={ariaLabel || t("admin.chartSalesEmpty")}
        />
      </div>

      <div
        className="mt-2 flex flex-wrap gap-x-4 gap-y-2"
        aria-label={t("admin.chartPlatformLegend")}
      >
        {segments.map((seg) => (
          <LegendItem
            key={seg.key}
            colorClass={seg.colorClass}
            label={seg.label}
            value={seg.value}
          />
        ))}
      </div>
    </>
  );

  if (variant === "embedded") {
    return (
      <div className="pt-3" aria-label={t("admin.chartSalesTitle")}>
        {chartBody}
      </div>
    );
  }

  return (
    <section
      className="rounded-xl border border-ink-200 bg-white p-4 sm:p-5 shadow-sm"
      aria-label={t("admin.chartSalesTitle")}
    >
      {chartBody}
    </section>
  );
}

const UNKNOWN_REGION_COLOR = "bg-ink-300";

const REGION_SEGMENT_COLORS = [
  "bg-amber-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-pink-500",
  "bg-fuchsia-500",
  "bg-violet-500",
  "bg-indigo-500",
  "bg-sky-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-lime-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-cyan-500",
  "bg-blue-500",
  "bg-purple-500",
] as const;

export function AdminRegionBarChart({
  items,
  title,
  labelForCountry,
  summaryKey = "admin.chartRegionSummary",
  t,
  variant = "card",
}: {
  items: { country: string; count: number }[];
  title: string;
  labelForCountry: (country: string) => string;
  summaryKey?: string;
  t: TFn;
  variant?: "card" | "embedded";
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  const segments = useMemo<Segment[]>(() => {
    let colorIndex = 0;
    return items.map((item) => ({
      key: item.country,
      label: labelForCountry(item.country),
      value: item.count,
      colorClass:
        item.country === "unknown"
          ? UNKNOWN_REGION_COLOR
          : REGION_SEGMENT_COLORS[
              colorIndex++ % REGION_SEGMENT_COLORS.length
            ],
    }));
  }, [items, labelForCountry]);

  if (items.length === 0 && variant !== "embedded") return null;

  const ariaLabel = segments
    .filter((s) => s.value > 0)
    .map((s) => `${s.label} ${s.value}`)
    .join(", ");

  const chartBody = (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          className={
            variant === "embedded"
              ? "text-xs font-semibold text-ink-700"
              : "text-sm font-semibold text-ink-900"
          }
        >
          {title}
        </h2>
        {items.length > 0 ? (
          <p
            className={`tabular-nums ${
              variant === "embedded" ? "text-xs text-ink-500" : "text-sm text-ink-600"
            }`}
          >
            {t(summaryKey, {
              total,
              regions: items.length,
            })}
          </p>
        ) : null}
      </div>

      <div className={variant === "embedded" ? "mt-2" : "mt-3"}>
        <StackedStorageBar
          segments={segments}
          total={total}
          ariaLabel={ariaLabel || t("admin.chartSalesEmpty")}
        />
      </div>

      {items.length > 0 ? (
        <div
          className={`flex flex-wrap gap-x-4 gap-y-2 ${
            variant === "embedded" ? "mt-2" : "mt-3"
          }`}
        >
          {segments.map((seg) => (
            <LegendItem
              key={seg.key}
              colorClass={seg.colorClass}
              label={seg.label}
              value={seg.value}
              muted={seg.key === "unknown"}
            />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-ink-400">{t("admin.chartSalesEmpty")}</p>
      )}
    </>
  );

  if (variant === "embedded") {
    return (
      <div className="pt-3" aria-label={title}>
        {chartBody}
      </div>
    );
  }

  return (
    <section
      className="rounded-xl border border-ink-200 bg-white p-4 sm:p-5 shadow-sm"
      aria-label={title}
    >
      {chartBody}
    </section>
  );
}
