import React from "react";
import { Shield } from "./Icons";
import { LanguageMenu } from "./LanguageMenu";
import type { Locale } from "../lib/i18n/locale";

interface ScreenHeaderProps {
  pageTitle: React.ReactNode;
  brandName: string;
  locale?: Locale;
  onLocaleChange?: (l: Locale) => void | Promise<void>;
  languageAriaLabel?: string;
  /** Shield + brand link here when set (e.g. `/` from sign-in → marketing site). */
  brandHomeHref?: string;
  brandHomeAriaLabel?: string;
  /** e.g. Close / Cancel on the same row as the page title */
  titleRowEnd?: React.ReactNode;
  className?: string;
  shieldClassName?: string;
  /** Forwarded to `<h1>` for dialog `aria-labelledby` */
  titleId?: string;
  /** Shown between the brand row and the page title (e.g. setup stepper). */
  beforeTitle?: React.ReactNode;
  /** Shown under the page title (e.g. auth sign-in subtitle). */
  subtitle?: React.ReactNode;
  titleClassName?: string;
  /** When false, hides the top-right language menu. Defaults to true. */
  showLanguageMenu?: boolean;
}

export function ScreenHeader({
  pageTitle,
  brandName,
  locale,
  onLocaleChange,
  languageAriaLabel,
  brandHomeHref,
  brandHomeAriaLabel,
  titleRowEnd,
  className,
  shieldClassName = "w-8 h-auto",
  titleId,
  beforeTitle,
  subtitle,
  titleClassName = "text-xl font-semibold text-ink-900 tracking-tight",
  showLanguageMenu = true,
}: ScreenHeaderProps) {
  return (
    <header
      className={["space-y-3", className].filter(Boolean).join(" ")}
    >
      <div className="flex items-center justify-between gap-2 min-h-[2.5rem]">
        {brandHomeHref ? (
          <a
            href={brandHomeHref}
            className="flex items-center gap-2 min-w-0 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            aria-label={brandHomeAriaLabel}
          >
            <Shield
              className={["text-accent-500 shrink-0", shieldClassName].filter(Boolean).join(" ")}
            />
            <span
              className="font-brand font-semibold text-base text-ink-800 tracking-tight truncate"
              translate="no"
            >
              {brandName}
            </span>
          </a>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <Shield
              className={["text-accent-500 shrink-0", shieldClassName].filter(Boolean).join(" ")}
            />
            <span
              className="font-brand font-semibold text-base text-ink-800 tracking-tight truncate"
              translate="no"
            >
              {brandName}
            </span>
          </div>
        )}
        {showLanguageMenu && locale && onLocaleChange ? (
          <LanguageMenu
            value={locale}
            onChange={(l) => void Promise.resolve(onLocaleChange(l))}
            ariaLabel={languageAriaLabel ?? "Language"}
            align="right"
          />
        ) : null}
      </div>
      {beforeTitle}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h1 id={titleId} className={["font-sans", titleClassName].join(" ")}>
            {pageTitle}
          </h1>
          {titleRowEnd ? (
            <div className="shrink-0 flex items-center">{titleRowEnd}</div>
          ) : null}
        </div>
        {subtitle ? (
          <p className="text-sm text-ink-500 leading-snug">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
