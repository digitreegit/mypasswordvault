import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { AuthEmailTakenError, isAuthEmailTakenError } from "../lib/authErrors";
import {
  AUTH_LAST_METHOD_CHANGED,
  getAuthLastMethod,
  recordEmailSignIn,
  type AuthLastMethod,
} from "../lib/authLastUsed";
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
import { privacyPolicyUrl, termsOfUseUrl } from "../lib/privacyPolicyUrl";
import { Eye, EyeOff } from "./Icons";

type AuthView = "signin" | "signup" | "forgot" | "new-password";

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
  if (
    e instanceof AuthEmailTakenError ||
    isAuthEmailTakenError(e) ||
    lower.includes("already registered") ||
    lower.includes("already exists")
  ) {
    return t("auth.errEmailTaken");
  }
  if (lower.includes("password") && lower.includes("6")) {
    return t("auth.errWeakPassword");
  }
  if (msg === "email_send_failed" || msg === "server_misconfigured") {
    return t("auth.errResetSend");
  }
  if (msg === "function_not_deployed" || msg === "function_unreachable") {
    return t("auth.errResetNotDeployed");
  }
  if (lower.includes("auth session missing")) {
    return t("auth.errRecoverySession");
  }
  return msg || t("auth.errGeneric");
}

const authTextLinkClass =
  "text-ink-900 font-semibold hover:underline focus:outline-none focus-visible:underline";

const authLegalLinkClass =
  "text-ink-900 font-normal hover:underline focus:outline-none focus-visible:underline";

const authInfoBoxClass =
  "text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 leading-snug";

function LastUsedBadge({
  label,
  positionClassName = "top-0 -right-2",
}: {
  label: string;
  positionClassName?: string;
}) {
  return (
    <span
      className={`absolute z-10 rounded-full border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-[8px] font-semibold tracking-wide text-accent-700 uppercase leading-none ${positionClassName}`}
    >
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
    passwordRecoveryPending,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    updatePassword,
  } = useAuth();
  const [locale, setLocale] = useState<Locale>(
    () => normalizeLocale(detectBrowserLocale())
  );
  const [view, setView] = useState<AuthView>(() =>
    passwordRecoveryPending ? "new-password" : "signin"
  );
  /** Bump to re-read `mpv_auth_last_method` from localStorage after each login attempt. */
  const [lastUsedRevision, setLastUsedRevision] = useState(0);
  const lastUsed: AuthLastMethod | null = getAuthLastMethod();
  void lastUsedRevision;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const t = (key: string) => translate(locale, key);
  const brandHomeHref = isNativeApp() ? undefined : "/";

  const refreshLastUsed = () => setLastUsedRevision((n) => n + 1);

  useEffect(() => {
    const onFocus = () => refreshLastUsed();
    const onLastUsedChange = () => refreshLastUsed();
    refreshLastUsed();
    window.addEventListener("focus", onFocus);
    window.addEventListener(AUTH_LAST_METHOD_CHANGED, onLastUsedChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(AUTH_LAST_METHOD_CHANGED, onLastUsedChange);
    };
  }, []);

  useEffect(() => {
    if (passwordRecoveryPending) {
      setView("new-password");
      setError(null);
      setInfo(null);
    }
  }, [passwordRecoveryPending]);

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
          : view === "signin"
            ? t("auth.subtitle")
            : undefined;

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
        recordEmailSignIn();
        refreshLastUsed();
      } else if (view === "signup") {
        await signUpWithEmail(email, password);
        const supabase = getSupabase();
        const { data } = await supabase!.auth.getSession();
        if (data.session) {
          recordEmailSignIn();
          refreshLastUsed();
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
        <div className="card w-full max-w-md p-6 sm:p-8 space-y-4">
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
        </div>
      </div>
    );
  }

  const showSignInSignUp = view === "signin" || view === "signup";

  return (
    <div className="min-h-[100dvh] flex justify-center px-4 py-10 sm:px-6 sm:py-12 bg-gradient-to-br from-ink-50 to-ink-100">
      <div className="card w-full max-w-md p-6 sm:p-8 space-y-5 my-auto">
        <ScreenHeader
          brandName={t("app.brandName")}
          pageTitle={pageTitle}
          subtitle={pageSubtitle}
          titleClassName="text-2xl font-bold text-ink-900 tracking-tight"
          locale={locale}
          onLocaleChange={(l) => setLocale(normalizeLocale(l))}
          languageAriaLabel={t("settings.language")}
          brandHomeHref={brandHomeHref}
          brandHomeAriaLabel={brandHomeHref ? t("auth.brandHomeAria") : undefined}
        />

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
              className="btn-primary w-full py-2.5"
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
            {info && <p className={authInfoBoxClass}>{info}</p>}
            <button
              type="submit"
              className="btn-primary w-full py-2.5"
              disabled={busy || !email.trim()}
            >
              {busy ? t("app.loading") : t("auth.sendResetLink")}
            </button>
            <p className="text-center text-xs text-ink-600">
              {t("auth.hasAccount")}{" "}
              <button
                type="button"
                className={authTextLinkClass}
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

        {showSignInSignUp && (
          <div className="space-y-4">
            <div className="relative pt-2">
              {view === "signin" && lastUsed === "google" && (
                <LastUsedBadge label={t("auth.lastUsed")} />
              )}
              <button
                type="button"
                className="btn-secondary w-full justify-center border-ink-200 bg-white py-2.5 shadow-sm hover:bg-ink-50"
                onClick={() => void onGoogle()}
                disabled={busy}
              >
                <span className="flex items-center justify-center gap-2">
                  <GoogleGlyph />
                  {t("auth.google")}
                </span>
              </button>
            </div>

            <OrDivider text={t("auth.or")} />

            <form className="flex flex-col" onSubmit={(e) => void onEmailSubmit(e)}>
              <div className="flex flex-col gap-3">
                <EmailField
                  id="auth-email"
                  label={t("auth.email")}
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={setEmail}
                  lastUsedLabel={
                    view === "signin" && lastUsed === "email"
                      ? t("auth.lastUsed")
                      : undefined
                  }
                />
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label htmlFor="auth-password" className="label mb-0">
                      {t("auth.password")}
                    </label>
                    {view === "signin" && (
                      <button
                        type="button"
                        className={`text-xs shrink-0 ${authTextLinkClass}`}
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
                {info && <p className={authInfoBoxClass}>{info}</p>}
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-2.5 mt-5"
                disabled={busy || !email.trim() || !password}
              >
                {busy
                  ? t("app.loading")
                  : view === "signup"
                    ? t("auth.signUp")
                    : t("auth.signIn")}
              </button>
            </form>

            <p className="text-center text-xs text-ink-600">
              {view === "signin" ? (
                <>
                  {t("auth.noAccount")}{" "}
                  <button
                    type="button"
                    className={authTextLinkClass}
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
                    className={authTextLinkClass}
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

            <TermsNotice
              text={t("auth.termsNotice")}
              termsHref={termsOfUseUrl()}
              privacyHref={privacyPolicyUrl()}
              termsLabel={t("legal.termsOfUse")}
              privacyLabel={t("legal.privacyPolicy")}
            />
          </div>
        )}

        {showSignInSignUp && isDefaultSupabaseProjectHost() && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 leading-snug">
            {translate(locale, "auth.oauthHostWarning", {
              host: getSupabaseAuthHostname(),
            })}
          </p>
        )}
      </div>
    </div>
  );
}

const TERMS_MARKER = "__TERMS__";
const PRIVACY_MARKER = "__PRIVACY__";

function TermsNotice({
  text,
  termsHref,
  privacyHref,
  termsLabel,
  privacyLabel,
}: {
  text: string;
  termsHref: string;
  privacyHref: string;
  termsLabel: string;
  privacyLabel: string;
}) {
  const parts = text.split(/(__TERMS__|__PRIVACY__)/);
  return (
    <p className="text-left text-xs text-ink-500 leading-snug">
      {parts.map((part, i) => {
        if (part === TERMS_MARKER) {
          return (
            <a
              key={`terms-${i}`}
              href={termsHref}
              className={authLegalLinkClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              {termsLabel}
            </a>
          );
        }
        if (part === PRIVACY_MARKER) {
          return (
            <a
              key={`privacy-${i}`}
              href={privacyHref}
              className={authLegalLinkClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              {privacyLabel}
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </p>
  );
}

function EmailField({
  id,
  label,
  placeholder,
  value,
  onChange,
  lastUsedLabel,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  /** When set, shows LAST USED on the input’s top-right corner (sign-in email). */
  lastUsedLabel?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className={lastUsedLabel ? "relative" : undefined}>
        {lastUsedLabel ? (
          <LastUsedBadge label={lastUsedLabel} positionClassName="-top-2 -right-2" />
        ) : null}
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
          {show ? (
            <EyeOff width={18} height={18} />
          ) : (
            <Eye width={18} height={18} />
          )}
        </button>
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
