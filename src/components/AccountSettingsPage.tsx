import React, { useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { useVault } from "../lib/vault";
import { getSignInLogs } from "../lib/signInLogs";
import { LanguageMenu } from "./LanguageMenu";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Shield } from "./Icons";
import { isNativeApp } from "../lib/platform";
import { isAppError } from "../lib/errors";

type AccountSection = "preferences" | "logs";

function formatLogTime(ts: number, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

function sidebarNavClass(active: boolean): string {
  return [
    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-ink-100 text-ink-900"
      : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
  ].join(" ");
}

export function AccountSettingsPage({ section }: { section: AccountSection }) {
  const { user, updateEmail, updatePassword, signOut, deleteAccount } = useAuth();
  const { locale, setLocale, t } = useVault();

  const [emailDraft, setEmailDraft] = useState(user?.email ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const brandHomeHref = isNativeApp() ? undefined : "/";
  const vaultHref = "/app/#";
  const logs = useMemo(
    () => (user?.id ? getSignInLogs(user.id) : []),
    [user?.id, section]
  );
  const htmlLocale =
    locale === "kr" ? "ko" : locale === "cn" ? "zh-CN" : locale === "jp" ? "ja" : locale;

  const pageTitle =
    section === "logs" ? t("account.navSignInLogs") : t("account.navPreferences");
  const pageSubtitle =
    section === "logs" ? t("account.signInLogsHint") : t("account.preferencesSubtitle");

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await updateEmail(emailDraft);
      setMessage(t("account.emailUpdated"));
    } catch (err: unknown) {
      setError(
        isAppError(err) ? t(err.code) : (err as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (pw.length < 6) {
      setError(t("auth.errWeakPassword"));
      return;
    }
    if (pw !== pw2) {
      setError(t("auth.errPasswordMismatch"));
      return;
    }
    setBusy(true);
    try {
      await updatePassword(pw);
      setPw("");
      setPw2("");
      setMessage(t("account.passwordUpdated"));
    } catch (err: unknown) {
      setError(
        isAppError(err) ? t(err.code) : (err as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setBusy(false);
    }
  }

  const alerts = (
    <>
      {message && (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </>
  );

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-gradient-to-br from-ink-50 to-ink-100">
      <header className="relative z-30 shrink-0 overflow-visible border-b border-ink-200 bg-white/90 backdrop-blur-sm py-3">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 overflow-visible">
          {brandHomeHref ? (
            <a
              href={brandHomeHref}
              className="flex items-center gap-2 min-w-0 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
              aria-label={t("auth.brandHomeAria")}
            >
              <Shield className="w-8 h-auto text-accent-500 shrink-0" />
              <span
                className="font-brand font-semibold text-base text-ink-800 tracking-tight truncate"
                translate="no"
              >
                {t("app.brandName")}
              </span>
            </a>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="w-8 h-auto text-accent-500 shrink-0" />
              <span
                className="font-brand font-semibold text-base text-ink-800 tracking-tight truncate"
                translate="no"
              >
                {t("app.brandName")}
              </span>
            </div>
          )}
          <LanguageMenu
            value={locale}
            onChange={(l) => void setLocale(l)}
            ariaLabel={t("settings.language")}
            align="right"
          />
        </div>
      </header>

      <div className="flex flex-1 flex-col min-h-0 w-full">
        <div className="flex flex-1 flex-col md:flex-row min-h-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <aside className="shrink-0 md:w-56 lg:w-60 border-b md:border-b-0 md:border-y-0 md:border-l md:border-r border-ink-200 bg-white/60 md:bg-white/70 px-4 py-4 md:py-8 md:pl-6 md:pr-4">
          <a
            href={vaultHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
            {t("account.backToVault")}
          </a>

          <p className="mt-6 mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-ink-400">
            {t("account.sidebarSection")}
          </p>
          <nav className="flex md:flex-col gap-1 md:gap-0.5" aria-label={t("account.navAria")}>
            <a href="#/account" className={sidebarNavClass(section === "preferences")}>
              {t("account.navPreferences")}
            </a>
            <a href="#/account/logs" className={sidebarNavClass(section === "logs")}>
              {t("account.navSignInLogs")}
            </a>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto py-6 sm:py-10 md:pl-6 md:pr-2">
          <div className="w-full max-w-none space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">
                {pageTitle}
              </h1>
              <p className="text-sm text-ink-500 leading-snug">{pageSubtitle}</p>
            </div>

            {alerts}

            {section === "logs" ? (
              <div className="card p-5 sm:p-6 space-y-4">
                {logs.length === 0 ? (
                  <p className="text-sm text-ink-500">{t("account.signInLogsEmpty")}</p>
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {logs.map((row) => (
                      <li
                        key={row.id}
                        className="py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 first:pt-0 last:pb-0"
                      >
                        <span className="font-medium text-ink-800">
                          {t(`account.signInMethod.${row.method}`)}
                        </span>
                        <span className="text-ink-500 text-xs sm:text-sm">
                          {formatLogTime(row.at, htmlLocale)} · {row.event}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <section className="card p-5 sm:p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-ink-800">
                    {t("account.profileTitle")}
                  </h2>
                  <form onSubmit={handleEmailSave} className="space-y-3">
                    <div>
                      <label className="label" htmlFor="account-email">
                        {t("auth.email")}
                      </label>
                      <input
                        id="account-email"
                        type="email"
                        className="input w-full"
                        value={emailDraft}
                        onChange={(e) => setEmailDraft(e.target.value)}
                        autoComplete="email"
                        required
                      />
                    </div>
                    <button type="submit" className="btn-primary text-sm" disabled={busy}>
                      {t("account.saveEmail")}
                    </button>
                    <p className="text-xs text-ink-500 leading-snug">
                      {t("account.emailChangeHint")}
                    </p>
                  </form>
                </section>

                <section className="card p-5 sm:p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-ink-800">
                    {t("account.passwordTitle")}
                  </h2>
                  <form onSubmit={handlePasswordSave} className="space-y-3">
                    <div>
                      <label className="label" htmlFor="account-new-pw">
                        {t("account.newPassword")}
                      </label>
                      <input
                        id="account-new-pw"
                        type="password"
                        className="input w-full"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="account-new-pw2">
                        {t("auth.passwordConfirm")}
                      </label>
                      <input
                        id="account-new-pw2"
                        type="password"
                        className="input w-full"
                        value={pw2}
                        onChange={(e) => setPw2(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                    <button type="submit" className="btn-primary text-sm" disabled={busy}>
                      {t("account.savePassword")}
                    </button>
                  </form>
                </section>

                <section className="card p-5 sm:p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-red-800">
                    {t("settings.accountTitle")}
                  </h2>
                  <p className="text-xs text-ink-600 break-all leading-snug">
                    {t("settings.signedInAs", {
                      email: user?.email ?? user?.id ?? "",
                    })}
                  </p>
                  <button
                    type="button"
                    className="btn-danger-soft text-sm w-full sm:w-auto"
                    disabled={busy || deletingAccount}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await signOut();
                        window.location.href = "/";
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {t("settings.signOut")}
                  </button>
                  <button
                    type="button"
                    className="btn-danger text-sm w-full sm:w-auto"
                    disabled={busy || deletingAccount}
                    onClick={async () => {
                      const email = user?.email ?? user?.id ?? "";
                      if (!window.confirm(t("settings.deleteAccountConfirm", { email }))) {
                        return;
                      }
                      setDeletingAccount(true);
                      setError(null);
                      try {
                        await deleteAccount();
                        window.location.href = "/";
                      } catch (e: unknown) {
                        const code = (e as Error)?.message ?? "";
                        setError(
                          code === "function_not_deployed"
                            ? t("settings.deleteAccountNotDeployed")
                            : t("settings.deleteAccountFailed")
                        );
                      } finally {
                        setDeletingAccount(false);
                      }
                    }}
                  >
                    {deletingAccount ? t("app.loading") : t("settings.deleteAccount")}
                  </button>
                  <p className="text-xs text-red-700 leading-snug">
                    {t("settings.deleteAccountHint")}
                  </p>
                </section>
              </div>
            )}
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
