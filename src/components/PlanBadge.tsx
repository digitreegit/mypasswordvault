/** Pill label for FREE / PRO — white fill, light border, dark uppercase text. */
const PLAN_BADGE_CLASS =
  "inline-flex items-center justify-center rounded-full border border-ink-200 bg-white px-2 py-1 text-[0.5625rem] sm:text-[0.625rem] font-semibold uppercase tracking-[0.04em] text-ink-700 whitespace-nowrap leading-none shrink-0";

export function PlanBadge({
  label,
  className = "",
  href,
  ariaLabel,
}: {
  label: string;
  className?: string;
  /** Hash route (e.g. `#/admin`) — badge becomes a link to the admin page. */
  href?: string;
  ariaLabel?: string;
}) {
  const classNames = `${PLAN_BADGE_CLASS} ${className}`.trim();

  if (href) {
    return (
      <a
        href={href}
        className={`${classNames} no-underline hover:bg-ink-50 transition-colors cursor-pointer`}
        aria-label={ariaLabel ?? label}
        translate="no"
        onClick={(e) => {
          e.preventDefault();
          window.location.hash = href;
        }}
      >
        {label}
      </a>
    );
  }

  return (
    <span className={classNames} translate="no">
      {label}
    </span>
  );
}
