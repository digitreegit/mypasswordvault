const STORAGE_PREFIX = "mpv_utm_";
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type MarketingUtmKey = (typeof UTM_KEYS)[number];

export function captureMarketingAttributionFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    let touched = false;
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (!value) continue;
      sessionStorage.setItem(STORAGE_PREFIX + key, value);
      touched = true;
    }
    if (touched) {
      sessionStorage.setItem(
        STORAGE_PREFIX + "captured_at",
        new Date().toISOString(),
      );
    }
  } catch {
    /* ignore blocked storage */
  }
}

export function getMarketingAttribution(): Partial<
  Record<MarketingUtmKey, string>
> {
  const out: Partial<Record<MarketingUtmKey, string>> = {};
  if (typeof window === "undefined") return out;
  try {
    for (const key of UTM_KEYS) {
      const value = sessionStorage.getItem(STORAGE_PREFIX + key);
      if (value) out[key] = value;
    }
  } catch {
    /* ignore */
  }
  return out;
}
