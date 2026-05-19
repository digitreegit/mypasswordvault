import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../lib/auth";
import { translate } from "../lib/i18n/bundles";
import {
  detectBrowserLocale,
  normalizeLocale,
  type Locale,
} from "../lib/i18n/locale";
import { isNativeApp } from "../lib/platform";
import { ScreenHeader } from "./ScreenHeader";
import { privacyPolicyUrl } from "../lib/privacyPolicyUrl";

const FAQ_ITEMS: readonly [questionKey: string, answerKey: string][] = [
  ["auth.faqTrustQ", "auth.faqTrustA"],
  ["auth.faqUseQ", "auth.faqUseA"],
  ["auth.faqWhatAuthenticatorQ", "auth.faqWhatAuthenticatorA"],
  ["auth.faqAuthenticatorQ", "auth.faqAuthenticatorA"],
  ["auth.faqPricingQ", "auth.faqPricingA"],
  ["auth.faqMasterQ", "auth.faqMasterA"],
  ["auth.faqExportQ", "auth.faqExportA"],
  ["auth.faqContactQ", "auth.faqContactA"],
];

export function AuthScreen() {
  const { configured, signInWithGoogle } = useAuth();
  const [locale, setLocale] = useState<Locale>(
    () => normalizeLocale(detectBrowserLocale())
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (key: string) => translate(locale, key);
  const privacyHref = privacyPolicyUrl();
  const brandHomeHref = isNativeApp() ? undefined : "/";

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
          <ScreenHeader
            brandName={t("app.brandName")}
            pageTitle={t("auth.notConfiguredTitle")}
            locale={locale}
            onLocaleChange={(l) => setLocale(normalizeLocale(l))}
            languageAriaLabel={t("settings.language")}
            brandHomeHref={brandHomeHref}
            brandHomeAriaLabel={brandHomeHref ? t("auth.brandHomeAria") : undefined}
          />
          <p className="text-sm text-ink-600 leading-snug whitespace-pre-line">
            {t("auth.notConfiguredBody")}
          </p>
          <p className="text-center text-sm pt-2">
            <a
              href={privacyHref}
              className="text-accent-600 hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("legal.privacyPolicy")}
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex justify-center px-4 py-10 sm:px-6 sm:py-12 bg-gradient-to-br from-ink-50 to-ink-100">
      <div className="card w-full max-w-xl p-5 sm:p-8 space-y-5 my-auto">
        <ScreenHeader
          brandName={t("app.brandName")}
          pageTitle={t("auth.title")}
          locale={locale}
          onLocaleChange={(l) => setLocale(normalizeLocale(l))}
          languageAriaLabel={t("settings.language")}
          brandHomeHref={brandHomeHref}
          brandHomeAriaLabel={brandHomeHref ? t("auth.brandHomeAria") : undefined}
        />
        <p className="text-sm text-ink-500 leading-snug">{t("auth.subtitle")}</p>

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

        <p className="text-xs text-ink-500 leading-snug">
          {t("auth.securityNote")}
        </p>

        <section
          className="border-t border-ink-100 pt-5 space-y-3"
          aria-labelledby="auth-faq-heading"
        >
          <h2 id="auth-faq-heading" className="text-sm font-semibold text-ink-800">
            {t("auth.faqTitle")}
          </h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map(([qKey, aKey]) => (
              <details
                key={qKey}
                className="group rounded-lg border border-ink-200 bg-ink-50/60"
              >
                <summary className="cursor-pointer list-none flex w-full items-start justify-between gap-2 p-3 text-left text-sm font-medium text-ink-800 [&::-webkit-details-marker]:hidden">
                  <span className="leading-snug pr-1">{t(qKey)}</span>
                  <span className="inline-flex shrink-0 text-ink-400 mt-0.5" aria-hidden>
                    <ChevronDownIcon className="h-4 w-4 group-open:hidden" />
                    <ChevronUpIcon className="hidden h-4 w-4 group-open:block" />
                  </span>
                </summary>
                <div className="px-3 pb-3 text-sm text-ink-600 leading-snug border-t border-ink-100/90 pt-2.5">
                  {aKey === "auth.faqContactA" ? (
                    <ContactFaqAnswer text={t(aKey)} />
                  ) : aKey === "auth.faqPricingA" ? (
                    <PricingFaqAnswer
                      text={t(aKey)}
                      linkLabel={t("auth.pricingLink")}
                    />
                  ) : (
                    t(aKey)
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>

        <p className="text-center text-sm pt-4 border-t border-ink-100">
          <a
            href={privacyHref}
            className="text-accent-600 hover:underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("legal.privacyPolicy")}
          </a>
        </p>
      </div>
    </div>
  );
}

const CONTACT_EMAIL = "contact@skyface.com";
const PRICING_LINK_MARKER = "__PRICING_LINK__";

const faqLinkClass = "text-accent-600 hover:underline font-medium";

function PricingFaqAnswer({
  text,
  linkLabel,
}: {
  text: string;
  linkLabel: string;
}) {
  const parts = text.split(PRICING_LINK_MARKER);
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 ? (
            <a href="#/pricing" className={faqLinkClass}>
              {linkLabel}
            </a>
          ) : null}
        </React.Fragment>
      ))}
    </>
  );
}

function ContactFaqAnswer({ text }: { text: string }) {
  const parts = text.split(CONTACT_EMAIL);
  if (parts.length === 1) {
    return <>{text}</>;
  }
  const out: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    out.push(<React.Fragment key={`p-${i}`}>{part}</React.Fragment>);
    if (i < parts.length - 1) {
      out.push(
        <a
          key={`a-${i}`}
          href={`mailto:${CONTACT_EMAIL}`}
          className={faqLinkClass}
        >
          {CONTACT_EMAIL}
        </a>
      );
    }
  });
  return <>{out}</>;
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
