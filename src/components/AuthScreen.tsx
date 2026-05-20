import React, { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../lib/auth";
import { getAuthLastMethod, type AuthLastMethod } from "../lib/authLastUsed";
import { translate } from "../lib/i18n/bundles";
import {
  detectBrowserLocale,
  normalizeLocale,
  type Locale,
} from "../lib/i18n/locale";
import { isNativeApp } from "../lib/platform";
import { requestPasswordResetEmail } from "../lib/passwordReset";
import {
  getSupabase,
  getSupabaseAuthHostname,
  isDefaultSupabaseProjectHost,
} from "../lib/supabaseClient";
import { ScreenHeader } from "./ScreenHeader";
import { privacyPolicyUrl } from "../lib/privacyPolicyUrl";
import { Eye, EyeOff } from "./Icons";

type AuthView = "signin" | "signup" | "forgot" | "new-password";

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

function hasRecoveryInUrl(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.replace(/^#/, "");
  if (hash) {
    const p = new URLSearchParams(hash);
    if (p.get("type") === "recovery") return true;
  }
  const q = new URLSearchParams(window.location.search);
  return q.get("type") === "recovery";
}

function mapAuthError(
  locale: Locale,
  e: unknown,
  t: (key: string) => string
): string {
  const msg = (e as Error)?.message ?? "";
  const lower = msg.toLowerCase();
  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("invalid email or password")
  ) {
    return t("auth.errInvalidCredentials");
  }
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return t("auth.errEmailTaken");
  }
  if (lower.includes("password") && lower.includes("6")) {
    return t("auth.errWeakPassword");
  }
  if (msg === "email_send_failed" || msg === "server_misconfigured") {
    return t("auth.errResetSend");
  }
  return msg || t("auth.errGeneric");
}

function LastUsedBadge({ label }: { label: string }) {
  return (
    <span className="inline-block mb-1 rounded-full bg-accent-600 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
      {label}
    </span>
  );
}

function OrDivider({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-ink-400">
      <span className="h-px flex-1 bg-ink-200" aria-hidden />
      <span>{text}</span>
      <span className="h-px flex-1 bg-ink-200" aria-hidden />
    </div>
  );
}

export function AuthScreen() {
  const {
    configured,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    updatePassword,
  } = useAuth();
  const [locale, setLocale] = useState<Locale>(
    () => normalizeLocale(detectBrowserLocale())
  );
  const [view, setView] = useState<AuthView>(() =>
    hasRecoveryInUrl() ? "new-password" : "signin"
  );
  const [lastUsed, setLastUsed] = useState<AuthLastMethod | null>(() =>
    getAuthLastMethod()
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const t = (key: string) => translate(locale, key);
  const privacyHref = privacyPolicyUrl();
  const brandHomeHref = isNativeApp() ? undefined : "/";

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("new-password");
        setError(null);
        setInfo(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const pageTitle =
    view === "signup"
      ? t("auth.titleSignUp")
      : view === "forgot"
        ? t("auth.titleForgot")
        : view === "new-password"
          ? t("auth.titleNewPassword")
          : t("auth.title");

  const pageSubtitle =
    view === "signup"
      ? t("auth.subtitleSignUp")
      : view === "forgot"
        ? t("auth.subtitleForgot")
        : view === "new-password"
          ? t("auth.subtitleNewPassword")
          : t("auth.subtitle");

  function clearMessages() {
    setError(null);
    setInfo(null);
  }

  async function onGoogle() {
    if (!configured) return;
    clearMessages();
    setBusy(true);
    try {
      await signInWithGoogle();
      setLastUsed("google");
    } catch (e: unknown) {
      setError(mapAuthError(locale, e, t));
    } finally {
      setBusy(false);
    }
  }

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    clearMessages();
    setBusy(true);
    try {
      if (view === "signin") {
        await signInWithEmail(email, password);
        setLastUsed("email");
      } else if (view === "signup") {
        await signUpWithEmail(email, password);
        const supabase = getSupabase();
        const { data } = await supabase!.auth.getSession();
        if (data.session) {
          setLastUsed("email");
        } else {
          setInfo(t("auth.checkEmailConfirm"));
          setView("signin");
        }
      }
    } catch (err: unknown) {
      setError(mapAuthError(locale, err, t));
    } finally {
      setBusy(false);
    }
  }

  async function onForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured || !email.trim()) return;
    clearMessages();
    setBusy(true);
    try {
      await requestPasswordResetEmail(email);
      setInfo(t("auth.resetSent"));
    } catch (err: unknown) {
      setError(mapAuthError(locale, err, t));
    } finally {
      setBusy(false);
    }
  }

  async function onNewPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    if (password !== passwordConfirm) {
      setError(t("auth.errPasswordMismatch"));
      return;
    }
    clearMessages();
    setBusy(true);
    try {
      await updatePassword(password);
      setPassword("");
      setPasswordConfirm("");
    } catch (err: unknown) {
      setError(mapAuthError(locale, err, t));
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

  const showGoogleBlock = view === "signin" || view === "signup";
  const showEmailSignIn = view === "signin" || view === "signup";

  return (
    <div className="min-h-[100dvh] flex justify-center px-4 py-10 sm:px-6 sm:py-12 bg-gradient-to-br from-ink-50 to-ink-100">
      <div className="card w-full max-w-xl p-5 sm:p-8 space-y-5 my-auto">
        <ScreenHeader
          brandName={t("app.brandName")}
          pageTitle={pageTitle}
          locale={locale}
          onLocaleChange={(l) => setLocale(normalizeLocale(l))}
          languageAriaLabel={t("settings.language")}
          brandHomeHref={brandHomeHref}
          brandHomeAriaLabel={brandHomeHref ? t("auth.brandHomeAria") : undefined}
        />
        <p className="text-sm text-ink-500 leading-snug">{pageSubtitle}</p>

        {view === "new-password" && (
          <form className="space-y-4" onSubmit={(e) => void onNewPasswordSubmit(e)}>
            <PasswordField
              id="auth-new-pw"
              label={t("auth.password")}
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              showAria={t("vault.show")}
              hideAria={t("vault.hide")}
              autoComplete="new-password"
            />
            <PasswordField
              id="auth-new-pw2"
              label={t("auth.passwordConfirm")}
              value={passwordConfirm}
              onChange={setPasswordConfirm}
              show={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              showAria={t("vault.show")}
              hideAria={t("vault.hide")}
              autoComplete="new-password"
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={busy || !password || !passwordConfirm}
            >
              {busy ? t("app.loading") : t("auth.saveNewPassword")}
            </button>
          </form>
        )}

        {view === "forgot" && (
          <form className="space-y-4" onSubmit={(e) => void onForgotSubmit(e)}>
            <EmailField
              id="auth-forgot-email"
              label={t("auth.email")}
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={setEmail}
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
            )}
            {info && (
              <p className="text-sm text-accent-800 bg-accent-50 border border-accent-200 rounded-md px-3 py-2">
                {info}
              </p>
            )}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={busy || !email.trim()}
            >
              {busy ? t("app.loading") : t("auth.sendResetLink")}
            </button>
            <p className="text-center text-sm text-ink-600">
              {t("auth.hasAccount")}{" "}
              <button
                type="button"
                className="text-accent-600 hover:underline font-medium"
                onClick={() => {
                  clearMessages();
                  setView("signin");
                }}
              >
                {t("auth.switchSignIn")}
              </button>
            </p>
          </form>
        )}

        {(view === "signin" || view === "signup") && (
          <>
            {showGoogleBlock && (
              <div className="space-y-1">
                {lastUsed === "google" && (
                  <LastUsedBadge label={t("auth.lastUsed")} />
                )}
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
              </div>
            )}

            {showEmailSignIn && (
              <>
                <OrDivider text={t("auth.or")} />
                <form className="space-y-3" onSubmit={(e) => void onEmailSubmit(e)}>
                  {lastUsed === "email" && (
                    <LastUsedBadge label={t("auth.lastUsed")} />
                  )}
                  <EmailField
                    id="auth-email"
                    label={t("auth.email")}
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={setEmail}
                  />
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label htmlFor="auth-password" className="label mb-0">
                        {t("auth.password")}
                      </label>
                      {view === "signin" && (
                        <button
                          type="button"
                          className="text-xs text-accent-600 hover:underline font-medium shrink-0"
                          onClick={() => {
                            clearMessages();
                            setView("forgot");
                          }}
                        >
                          {t("auth.forgotPassword")}
                        </button>
                      )}
                    </div>
                    <PasswordField
                      id="auth-password"
                      suppressLabel
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      onToggleShow={() => setShowPassword((v) => !v)}
                      showAria={t("vault.show")}
                      hideAria={t("vault.hide")}
                      autoComplete={
                        view === "signup" ? "new-password" : "current-password"
                      }
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                      {error}
                    </p>
                  )}
                  {info && (
                    <p className="text-sm text-accent-800 bg-accent-50 border border-accent-200 rounded-md px-3 py-2">
                      {info}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn-primary w-full"
                    disabled={busy || !email.trim() || !password}
                  >
                    {busy
                      ? t("app.loading")
                      : view === "signup"
                        ? t("auth.signUp")
                        : t("auth.signIn")}
                  </button>
                </form>
              </>
            )}

            {view === "signup" && (
              <p className="text-xs text-ink-500 leading-snug">{t("auth.termsNotice")}</p>
            )}

            <p className="text-center text-sm text-ink-600">
              {view === "signin" ? (
                <>
                  {t("auth.noAccount")}{" "}
                  <button
                    type="button"
                    className="text-accent-600 hover:underline font-medium"
                    onClick={() => {
                      clearMessages();
                      setView("signup");
                    }}
                  >
                    {t("auth.switchSignUp")}
                  </button>
                </>
              ) : (
                <>
                  {t("auth.hasAccount")}{" "}
                  <button
                    type="button"
                    className="text-accent-600 hover:underline font-medium"
                    onClick={() => {
                      clearMessages();
                      setView("signin");
                    }}
                  >
                    {t("auth.switchSignIn")}
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {showGoogleBlock && isDefaultSupabaseProjectHost() && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 leading-snug">
            {translate(locale, "auth.oauthHostWarning", {
              host: getSupabaseAuthHostname(),
            })}
          </p>
        )}

        {view !== "forgot" && view !== "new-password" && (
          <p className="text-xs text-ink-500 leading-snug">{t("auth.securityNote")}</p>
        )}

        {(view === "signin" || view === "signup") && (
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
        )}

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

function EmailField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type="email"
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="email"
        spellCheck={false}
      />
    </div>
  );
}

function PasswordField({
  id,
  label,
  suppressLabel,
  value,
  onChange,
  show,
  onToggleShow,
  showAria,
  hideAria,
  autoComplete,
}: {
  id: string;
  label?: string;
  suppressLabel?: boolean;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  showAria: string;
  hideAria: string;
  autoComplete?: string;
}) {
  return (
    <div>
      {!suppressLabel && label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className="input pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          spellCheck={false}
        />
        <button
          type="button"
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-ink-400 hover:text-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30"
          onClick={onToggleShow}
          title={show ? hideAria : showAria}
          aria-label={show ? hideAria : showAria}
        >
          {show ? <EyeOff /> : <Eye />}
        </button>
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
