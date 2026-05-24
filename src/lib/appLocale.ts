import type { Locale } from "./i18n/locale";

export const LOCALE_CHANGED = "mpv-locale-changed";

export function notifyLocaleChanged(locale: Locale): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LOCALE_CHANGED, { detail: locale }));
}

export function subscribeLocaleChanged(
  handler: (locale: Locale) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => {
    const locale = (event as CustomEvent<Locale>).detail;
    if (locale) handler(locale);
  };
  window.addEventListener(LOCALE_CHANGED, listener);
  return () => window.removeEventListener(LOCALE_CHANGED, listener);
}
