export const LOCALES = [
  "en",
  "es",
  "kr",
  "cn",
  "jp",
  "de",
  "fr",
  "it",
  "id",
  "th",
  "vi",
] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  kr: "한국어",
  cn: "简体中文",
  jp: "日本語",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  id: "Bahasa Indonesia",
  th: "ไทย",
  vi: "Tiếng Việt",
};

const ALIAS: Record<string, Locale> = {
  en: "en",
  "en-us": "en",
  "en-gb": "en",
  es: "es",
  "es-es": "es",
  "es-mx": "es",
  ko: "kr",
  kr: "kr",
  "ko-kr": "kr",
  zh: "cn",
  "zh-cn": "cn",
  "zh-hans": "cn",
  "zh-sg": "cn",
  ja: "jp",
  jp: "jp",
  "ja-jp": "jp",
  de: "de",
  "de-de": "de",
  fr: "fr",
  "fr-fr": "fr",
  it: "it",
  "it-it": "it",
  id: "id",
  "id-id": "id",
  th: "th",
  "th-th": "th",
  vi: "vi",
  "vi-vn": "vi",
};

export const LOCALE_STORAGE_KEY = "mypasswordapp-locale";

export function normalizeLocale(raw: string | undefined | null): Locale {
  if (!raw) return "en";
  const k = raw.trim().toLowerCase().replace("_", "-");
  if ((LOCALES as readonly string[]).includes(k)) return k as Locale;
  const short = k.split("-")[0] ?? k;
  if ((LOCALES as readonly string[]).includes(short)) return short as Locale;
  return ALIAS[k] ?? ALIAS[short] ?? "en";
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const list = [
    navigator.language,
    ...(navigator.languages ?? []),
  ].filter(Boolean);
  for (const lang of list) {
    const n = normalizeLocale(lang);
    if (n !== "en" || lang.toLowerCase().startsWith("en")) return n;
  }
  return "en";
}

export function localeToHtmlLang(locale: Locale): string {
  const map: Record<Locale, string> = {
    en: "en",
    es: "es",
    kr: "ko",
    cn: "zh-CN",
    jp: "ja",
    de: "de",
    fr: "fr",
    it: "it",
    id: "id",
    th: "th",
    vi: "vi",
  };
  return map[locale];
}
