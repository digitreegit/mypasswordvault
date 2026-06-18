import React from "react";
import { AppBrand } from "./AppBrand";
import { LanguageMenu } from "./LanguageMenu";
import type { Locale } from "../lib/i18n/locale";

/** Shared horizontal gutters for vault/settings/lock top chrome. */
export const NATIVE_TOP_HEADER_ROW_CLASS =
  "vault-page max-w-6xl mx-auto w-full min-w-0 box-border pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] sm:pl-[max(1rem,env(safe-area-inset-left,0px))] sm:pr-[max(1rem,env(safe-area-inset-right,0px))] md:pl-[max(1.5rem,env(safe-area-inset-left,0px))] md:pr-[max(1.5rem,env(safe-area-inset-right,0px))] lg:pl-[max(2rem,env(safe-area-inset-left,0px))] lg:pr-[max(2rem,env(safe-area-inset-right,0px))]";

export const NATIVE_HEADER_ICON_BTN =
  "ui-icon-btn ui-icon-btn--compact ui-icon-btn--round text-ink-600 shrink-0";

type NativeTopHeaderProps = {
  brandName: string;
  locale?: Locale;
  onLocaleChange?: (l: Locale) => void | Promise<void>;
  languageAriaLabel?: string;
  brandHomeHref?: string;
  brandHomeAriaLabel?: string;
  trailing?: React.ReactNode;
  /** Fixed Capacitor header omits outer safe-area padding (handled by host). */
  fixedHost?: boolean;
};

/** Vault/settings/lock shared top brand row. */
export function NativeTopHeader({
  brandName,
  locale,
  onLocaleChange,
  languageAriaLabel,
  brandHomeHref,
  brandHomeAriaLabel,
  trailing,
  fixedHost = false,
}: NativeTopHeaderProps) {
  return (
    <div
      className={[
        "vault-top-header w-full bg-white",
        fixedHost ? "vault-top-header--fixed-host" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="w-full border-b border-ink-200">
        <div
          className={`${NATIVE_TOP_HEADER_ROW_CLASS} native-top-header-row flex items-center justify-between gap-2 min-h-[2.5rem]`}
        >
          <AppBrand
            name={brandName}
            href={brandHomeHref}
            homeAriaLabel={brandHomeAriaLabel}
            variant="topbar"
          />
          <div className="flex items-center gap-2.5 shrink-0">
            {trailing}
            {locale && onLocaleChange ? (
              <LanguageMenu
                value={locale}
                onChange={(l) => void Promise.resolve(onLocaleChange(l))}
                ariaLabel={languageAriaLabel ?? "Language"}
                align="right"
                triggerClassName={NATIVE_HEADER_ICON_BTN}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
