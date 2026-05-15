import type { Locale } from "./locale";
import { MESSAGES_EN } from "./en";
import { MESSAGES_KR } from "./langs/kr";
import {
  MESSAGES_DE,
  MESSAGES_ES,
  MESSAGES_FR,
  MESSAGES_IT,
} from "./langs/world_eu";
import {
  MESSAGES_CN,
  MESSAGES_ID,
  MESSAGES_JP,
} from "./langs/world_asia";

export const BUNDLES: Record<Locale, Record<string, string>> = {
  en: MESSAGES_EN,
  es: MESSAGES_ES,
  kr: MESSAGES_KR,
  cn: MESSAGES_CN,
  jp: MESSAGES_JP,
  de: MESSAGES_DE,
  fr: MESSAGES_FR,
  it: MESSAGES_IT,
  id: MESSAGES_ID,
};

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const table = BUNDLES[locale] ?? MESSAGES_EN;
  let s = table[key] ?? MESSAGES_EN[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{{${k}}}`).join(String(v));
    }
  }
  return s;
}
