import React from "react";
import { Shield } from "./Icons";
import { LanguageMenu } from "./LanguageMenu";
import type { Locale } from "../lib/i18n/locale";

interface ScreenHeaderProps {
  pageTitle: React.ReactNode;
  brandName: string;
  locale: Locale;
  onLocaleChange: (l: Locale) => void | Promise<void>;
  languageAriaLabel: string;
  /** Shield + brand link here when set (e.g. `/` from sign-in → marketing site). */
  brandHomeHref?: string;
  brandHomeAriaLabel?: string;
  /** e.g. Close / Cancel on the same row as the page title */
  titleRowEnd?: React.ReactNode;
  className?: string;
  shieldClassName?: string;
  /** Forwarded to `<h1>` for dialog `aria-labelledby` */
  titleId?: string;
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
}: ScreenHeaderProps) {
  return (
    <header
      className={["space-y-4 sm:space-y-5", className].filter(Boolean).join(" ")}
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
        <LanguageMenu
          value={locale}
          onChange={(l) => void Promise.resolve(onLocaleChange(l))}
          ariaLabel={languageAriaLabel}
          align="right"
        />
      </div>
      <div className="flex items-start justify-between gap-2">
        <h1
          id={titleId}
          className="font-sans text-xl font-semibold text-ink-900 tracking-tight"
        >
          {pageTitle}
        </h1>
        {titleRowEnd ? (
          <div className="shrink-0 flex items-center">{titleRowEnd}</div>
        ) : null}
      </div>
    </header>
  );
}
