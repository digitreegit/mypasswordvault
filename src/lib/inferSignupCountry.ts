import { detectBrowserLocale, readStoredLocale, type Locale } from "./i18n/locale";

const LOCALE_DEFAULT_COUNTRY: Partial<Record<Locale, string>> = {
  kr: "KR",
  cn: "CN",
  jp: "JP",
  de: "DE",
  fr: "FR",
  it: "IT",
  id: "ID",
  es: "ES",
};

function regionFromBcp47Tag(tag: string): string | null {
  const parts = tag.trim().split("-");
  if (parts.length < 2) return null;
  const region = parts[parts.length - 1]!.toUpperCase();
  return /^[A-Z]{2}$/.test(region) ? region : null;
}

/** Best-effort ISO 3166-1 alpha-2 from browser / app locale (not GPS). */
export function inferSignupCountry(): string | null {
  if (typeof navigator === "undefined") return null;

  for (const lang of [navigator.language, ...(navigator.languages ?? [])]) {
    if (!lang) continue;
    const fromTag = regionFromBcp47Tag(lang);
    if (fromTag) return fromTag;
  }

  const stored = readStoredLocale();
  if (stored && LOCALE_DEFAULT_COUNTRY[stored]) {
    return LOCALE_DEFAULT_COUNTRY[stored]!;
  }

  const browser = detectBrowserLocale();
  if (LOCALE_DEFAULT_COUNTRY[browser]) {
    return LOCALE_DEFAULT_COUNTRY[browser]!;
  }

  return null;
}
