import React from "react";
import { AppBrand } from "./AppBrand";
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
  /** @deprecated Use global `.app-brand` sizing in index.css */
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
  /** Hide the page title block (brand + beforeTitle still render). Used when title scrolls below a sticky chrome. */
  hideTitle?: boolean;
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
  titleId,
  beforeTitle,
  subtitle,
  titleClassName = "font-semibold text-ink-900 tracking-tight",
  showLanguageMenu = true,
  hideTitle = false,
}: ScreenHeaderProps) {
  return (
    <header
      className={["space-y-3", className].filter(Boolean).join(" ")}
    >
      <div className="flex items-center justify-between gap-2 min-h-[2.5rem]">
        <AppBrand
          name={brandName}
          href={brandHomeHref}
          homeAriaLabel={brandHomeAriaLabel}
        />
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
      {!hideTitle ? (
      <div className="space-y-1 screen-page-title-block">
        <div className="flex items-start justify-between gap-2">
          <h1
            id={titleId}
            className={["font-sans screen-page-title", titleClassName].join(" ")}
          >
            {pageTitle}
          </h1>
          {titleRowEnd ? (
            <div className="shrink-0 flex items-center">{titleRowEnd}</div>
          ) : null}
        </div>
        {subtitle ? (
          <p className="web-auth-subtitle">{subtitle}</p>
        ) : null}
      </div>
      ) : null}
    </header>
  );
}
