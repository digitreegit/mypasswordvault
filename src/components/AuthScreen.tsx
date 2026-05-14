import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { translate } from "../lib/i18n/bundles";
import {
  detectBrowserLocale,
  normalizeLocale,
  type Locale,
} from "../lib/i18n/locale";
import { LanguageMenu } from "./LanguageMenu";
import { Shield } from "./Icons";

export function AuthScreen() {
  const { configured, signInWithGoogle } = useAuth();
  const [locale, setLocale] = useState<Locale>(
    () => normalizeLocale(detectBrowserLocale())
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (key: string) => translate(locale, key);

  async function onGoogle() {
    if (!configured) return;
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      setError((e as Error)?.message ?? t("auth.errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-ink-50 to-ink-100">
        <div className="card w-full max-w-md p-5 sm:p-8 space-y-4">
          <div className="flex justify-end">
            <LanguageMenu
              value={locale}
              onChange={(l) => setLocale(normalizeLocale(l))}
              ariaLabel={t("settings.language")}
            />
          </div>
          <div className="flex items-center gap-2">
            <Shield className="text-accent-600" />
            <h1 className="text-xl font-semibold">{t("auth.notConfiguredTitle")}</h1>
          </div>
          <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-line">
            {t("auth.notConfiguredBody")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-ink-50 to-ink-100">
      <div className="card w-full max-w-md p-5 sm:p-8 space-y-5">
        <div className="flex justify-end">
          <LanguageMenu
            value={locale}
            onChange={(l) => setLocale(normalizeLocale(l))}
            ariaLabel={t("settings.language")}
          />
        </div>
        <div className="flex items-center gap-2">
          <Shield className="text-accent-600" />
          <h1 className="text-xl font-semibold">{t("auth.title")}</h1>
        </div>
        <p className="text-sm text-ink-500 leading-relaxed">{t("auth.subtitle")}</p>

        <button
          type="button"
          className="btn-secondary w-full justify-start border-ink-200 bg-white py-2.5"
          onClick={() => void onGoogle()}
          disabled={busy}
        >
          <span className="flex items-center gap-2">
            <GoogleGlyph />
            {t("auth.google")}
          </span>
        </button>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
        )}

        <p className="text-xs text-ink-500 leading-relaxed border-t border-ink-100 pt-4">
          {t("auth.securityNote")}
        </p>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
