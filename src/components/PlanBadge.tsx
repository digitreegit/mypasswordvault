/** Pill label for FREE / PRO — white fill, light border, dark uppercase text. */
const PLAN_BADGE_CLASS =
  "inline-flex items-center justify-center rounded-full border border-ink-200 bg-white px-2 py-1 text-[0.5625rem] sm:text-[0.625rem] font-semibold uppercase tracking-[0.04em] text-ink-700 whitespace-nowrap leading-none shrink-0";

export function PlanBadge({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <span className={`${PLAN_BADGE_CLASS} ${className}`.trim()} translate="no">
      {label}
    </span>
  );
}
