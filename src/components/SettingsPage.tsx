import React, { useEffect, useMemo, useRef, useState } from "react";
import { useVault } from "../lib/vault";
import { useAuth } from "../lib/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ChevronDown, Shield } from "./Icons";
import { LOCALES, LOCALE_LABELS, type Locale } from "../lib/i18n/locale";
import { AccountCredentialPanel } from "./AccountCredentialPanel";
import { PlanBadge } from "./PlanBadge";
import { UserMenuDropdown } from "./UserMenuDropdown";
import { LanguageMenu } from "./LanguageMenu";
import { PricingDrawer } from "./PricingDrawer";
import { downloadJsonFile } from "../lib/vaultBackup";
import { isAppError } from "../lib/errors";

export type SettingsSection = "general" | "plan" | "backup" | "account";

export function settingsSectionFromPath(hashPath: string): SettingsSection {
  if (hashPath === "settings/plan") return "plan";
  if (hashPath === "settings/backup") return "backup";
  if (hashPath === "settings/account") return "account";
  return "general";
}

function settingsHref(section: SettingsSection): string {
  if (section === "general") return "#/settings";
  return `#/settings/${section}`;
}

function settingsTabClass(active: boolean): string {
  const base =
    "shrink-0 px-3 sm:px-4 pb-2.5 pt-1 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30 focus-visible:ring-offset-2 rounded-t-md";
  return active
    ? `${base} border-accent-600 text-accent-700`
    : `${base} border-transparent text-ink-500 hover:text-ink-800 hover:border-ink-200`;
}

function sidebarNavClass(active: boolean): string {
  return [
    "block rounded-md px-3 py-2 text-[14px] font-medium transition-colors",
    active
      ? "bg-ink-100 text-ink-900"
      : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
  ].join(" ");
}

const SETTINGS_PAGE = "max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8";

const SETTINGS_HEADER_ICON_BTN =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 transition-colors shrink-0";

export function SettingsPage({ section }: { section: SettingsSection }) {
  const {
    meta,
    setAutoLockMinutes,
    exportBackup,
    importBackup,
    entries,
    licensed,
    licenseKey,
    entitlementLoaded,
    freeEntryLimit,
    refreshEntitlements,
    locale,
    setLocale,
    t,
  } = useVault();
  const { configured, user, signOut, deleteAccount } = useAuth();
  const [mins, setMins] = useState<number>(meta?.autoLockMinutes ?? 5);
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [importDraft, setImportDraft] = useState<string | null>(null);
  const [backupToast, setBackupToast] = useState<string | null>(null);
  const [licenseKeyCopied, setLicenseKeyCopied] = useState(false);
  const [pricingDrawerOpen, setPricingDrawerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const vaultHref = "/app/#";
  const showAccountSections = Boolean(configured && user);
  const atEntryLimit = entries.length >= freeEntryLimit;
  const showHeaderUpgrade = atEntryLimit && !licensed && entitlementLoaded;

  function openPricingDrawer(e?: React.MouseEvent) {
    e?.preventDefault();
    setPricingDrawerOpen(true);
  }

  const navItems = useMemo(() => {
    const items: { id: SettingsSection; label: string }[] = [
      { id: "general", label: t("settings.navGeneral") },
    ];
    if (showAccountSections) {
      items.push({ id: "plan", label: t("settings.navPlan") });
    }
    items.push({ id: "backup", label: t("settings.navBackup") });
    if (showAccountSections) {
      items.push({ id: "account", label: t("settings.accountTitle") });
    }
    return items;
  }, [showAccountSections, t]);

  const activeSection = navItems.some((item) => item.id === section)
    ? section
    : (navItems[0]?.id ?? "general");

  const pageTitle =
    activeSection === "general"
      ? t("settings.navGeneral")
      : activeSection === "plan"
        ? t("settings.licenseTitle")
        : activeSection === "backup"
          ? t("settings.syncTitle")
          : t("settings.accountTitle");

  const pageSubtitle =
    activeSection === "general"
      ? t("settings.generalSubtitle")
      : activeSection === "plan"
        ? t("settings.planSubtitle")
        : activeSection === "backup"
          ? t("settings.backupSubtitle")
          : t("settings.accountSubtitle");

  useEffect(() => {
    setMins(meta?.autoLockMinutes ?? 5);
  }, [meta]);

  async function handleExport() {
    setBackupToast(null);
    try {
      const json = await exportBackup();
      const d = new Date().toISOString().slice(0, 10);
      downloadJsonFile(`mypasswordapp-vault-${d}.json`, json);
    } catch (e: unknown) {
      setBackupToast(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("setup.errGeneric")
      );
    }
  }

  async function applyImport() {
    if (!importDraft) return;
    setBusy(true);
    setBackupToast(null);
    try {
      await importBackup(importDraft);
      setImportDraft(null);
      window.location.hash = "#/";
    } catch (e: unknown) {
      setBackupToast(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyLicenseKey() {
    if (!licenseKey) return;
    setBackupToast(null);
    try {
      await navigator.clipboard.writeText(licenseKey);
      setLicenseKeyCopied(true);
      setTimeout(() => setLicenseKeyCopied(false), 2000);
    } catch {
      setBackupToast(t("settings.copyBackupFail"));
    }
  }

  function renderGeneral() {
    return (
      <div className="card p-5 sm:p-6 space-y-6">
        <div>
          <label className="label" htmlFor="settings-autolock">
            {t("settings.autoLock")}
          </label>
          <div className="relative">
            <select
              id="settings-autolock"
              className="input w-full appearance-none bg-white pr-11 disabled:opacity-60"
              value={mins}
              disabled={busy}
              onChange={(e) => {
                const v = Number(e.target.value);
                void (async () => {
                  setMins(v);
                  setBackupToast(null);
                  try {
                    await setAutoLockMinutes(v);
                  } catch (err: unknown) {
                    setMins(meta?.autoLockMinutes ?? 5);
                    setBackupToast(
                      isAppError(err)
                        ? t(err.code)
                        : (err as Error)?.message ?? t("setup.errGeneric")
                    );
                  }
                })();
              }}
            >
              <option value={1}>{t("autoLock.m1")}</option>
              <option value={5}>{t("autoLock.m5")}</option>
              <option value={15}>{t("autoLock.m15")}</option>
              <option value={30}>{t("autoLock.m30")}</option>
              <option value={0}>{t("autoLock.offBad")}</option>
            </select>
            <span
              className={`pointer-events-none absolute inset-y-0 right-3 flex items-center justify-end ${
                busy ? "text-ink-300" : "text-ink-400"
              }`}
              aria-hidden
            >
              <ChevronDown />
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-2 leading-snug">
            {t("settings.autoLockHint")}
          </p>
        </div>

        <div className="border-t border-ink-100 pt-6">
          <label className="label" htmlFor="settings-language">
            {t("settings.language")}
          </label>
          <div className="relative">
            <select
              id="settings-language"
              className="input w-full appearance-none bg-white pr-11"
              value={locale}
              onChange={(e) => {
                void setLocale(e.target.value as Locale);
              }}
            >
              {LOCALES.map((loc) => (
                <option key={loc} value={loc}>
                  {LOCALE_LABELS[loc]}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center justify-end text-ink-400"
              aria-hidden
            >
              <ChevronDown />
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-2 leading-snug">
            {t("settings.languageHint")}
          </p>
        </div>
      </div>
    );
  }

  function renderPlan() {
    if (!showAccountSections) return null;
    return (
      <div className="card p-5 sm:p-6 space-y-3">
        {!entitlementLoaded ? (
          <p className="text-sm text-ink-500">{t("settings.licenseLoading")}</p>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <PlanBadge
                label={
                  licensed ? t("settings.planBadgePro") : t("settings.planBadgeFree")
                }
              />
            </div>
            {licensed ? (
              <p className="text-sm font-medium text-emerald-800 leading-snug">
                {t("settings.licenseStatusLicensed")}
              </p>
            ) : (
              <p className="text-sm text-ink-700 leading-snug">
                {t("settings.licenseStatusFree", {
                  count: entries.length,
                  limit: freeEntryLimit,
                })}
              </p>
            )}
            {licensed && licenseKey ? (
              <div className="space-y-2 pt-1">
                <label className="label text-xs" htmlFor="settings-license-key">
                  {t("settings.licenseKeyLabel")}
                </label>
                <div className="flex gap-2 items-stretch">
                  <input
                    id="settings-license-key"
                    type="text"
                    readOnly
                    value={licenseKey}
                    className="input w-full min-w-0 font-mono text-xs bg-white"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="btn-secondary shrink-0 self-stretch px-3"
                    onClick={() => void copyLicenseKey()}
                  >
                    {licenseKeyCopied
                      ? t("settings.licenseKeyCopied")
                      : t("settings.licenseCopyKey")}
                  </button>
                </div>
                <p className="text-xs text-ink-500 leading-snug">
                  {t("settings.licenseKeyHint")}
                </p>
              </div>
            ) : licensed ? (
              <p className="text-xs text-ink-500 leading-snug">{t("settings.licenseNoSessionId")}</p>
            ) : null}
          </>
        )}
        <p className="text-xs text-ink-600 leading-snug border-t border-ink-100 pt-3">
          {t("settings.licenseFree", { limit: freeEntryLimit })}
        </p>
        <p className="text-xs text-ink-600 leading-snug">{t("settings.licensePaid")}</p>
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            className="btn-primary justify-center flex-1 min-w-0"
            onClick={openPricingDrawer}
          >
            {t("settings.licenseLink")}
          </button>
          <button
            type="button"
            className="btn-secondary flex-1 min-w-0 sm:max-w-[11rem] sm:flex-none"
            disabled={!entitlementLoaded}
            onClick={() => void refreshEntitlements()}
          >
            {t("settings.licenseRefresh")}
          </button>
        </div>
      </div>
    );
  }

  function renderBackup() {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <p className="text-sm text-amber-900 leading-snug">{t("settings.syncHint")}</p>
        </div>
        <div className="card p-5 sm:p-6 space-y-3">
          <h3 className="text-sm font-semibold text-ink-800">
            {t("settings.fileBackupAdvanced")}
          </h3>
          <p className="text-xs text-ink-600 leading-snug">
            {t("settings.fileBackupAdvancedHint")}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="btn-secondary text-sm flex-1"
              disabled={busy}
              onClick={() => void handleExport()}
            >
              {t("settings.exportBackup")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                try {
                  const text = await f.text();
                  setImportDraft(text);
                } catch {
                  setBackupToast(t("settings.copyBackupFail"));
                }
              }}
            />
            <button
              type="button"
              className="btn-secondary text-sm flex-1"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {t("settings.importBackup")}
            </button>
          </div>
          {importDraft && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm space-y-2">
              <p className="text-amber-900 leading-snug">{t("settings.importConfirm")}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary text-sm flex-1"
                  onClick={() => setImportDraft(null)}
                  disabled={busy}
                >
                  {t("settings.importCancel")}
                </button>
                <button
                  type="button"
                  className="btn-primary text-sm flex-1 bg-amber-700 hover:bg-amber-800"
                  onClick={() => void applyImport()}
                  disabled={busy}
                >
                  {t("settings.importApply")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }


  function renderAccount() {
    if (!showAccountSections || !user) return null;
    const email = user.email ?? user.id;
    return (
      <div className="space-y-4">
        <AccountCredentialPanel
          user={user}
          t={t}
          onMessage={(msg) => setBackupToast(msg)}
        />

        <div className="card p-5 sm:p-6 space-y-4">
        <div className="space-y-2">
          <button
            type="button"
            className="btn-danger-soft text-sm w-full sm:w-auto"
            disabled={signingOut || deletingAccount || busy}
            onClick={async () => {
              setSigningOut(true);
              try {
                await signOut();
                window.location.href = "/";
              } finally {
                setSigningOut(false);
              }
            }}
          >
            {signingOut ? t("app.loading") : t("settings.signOut")}
          </button>
          <p className="text-xs text-ink-500 leading-snug">{t("settings.signOutHint")}</p>
        </div>

        <hr className="border-ink-200" />

        <div className="space-y-2">
          <button
            type="button"
            className="btn-danger text-sm w-full sm:w-auto"
            disabled={signingOut || deletingAccount || busy}
            onClick={async () => {
              if (!window.confirm(t("settings.deleteAccountConfirm", { email }))) {
                return;
              }
              setDeletingAccount(true);
              setBackupToast(null);
              try {
                await deleteAccount();
                window.location.href = "/";
              } catch (e: unknown) {
                const code = (e as Error)?.message ?? "";
                setBackupToast(
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
          <p className="text-xs text-red-700 leading-snug">{t("settings.deleteAccountHint")}</p>
        </div>
        </div>
      </div>
    );
  }

  function renderSectionContent() {
    switch (activeSection) {
      case "plan":
        return renderPlan();
      case "backup":
        return renderBackup();
      case "account":
        return renderAccount();
      default:
        return renderGeneral();
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-white">
      <header className="w-full bg-white pt-[max(0.375rem,env(safe-area-inset-top))]">
        <div className="w-full border-b border-ink-200">
          <div
            className={`${SETTINGS_PAGE} flex items-center justify-between gap-3 py-1 sm:py-1.5`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Shield className="w-7 h-auto text-accent-500 shrink-0" />
              <span
                className="font-brand font-semibold text-base sm:text-[1.0625rem] text-ink-900 tracking-tight truncate leading-none -translate-y-0.5"
                translate="no"
              >
                {t("app.brandName")}
              </span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              {configured && user?.id ? (
                <>
                  {showHeaderUpgrade ? (
                    <button
                      type="button"
                      className="vault-header-upgrade-btn"
                      onClick={openPricingDrawer}
                    >
                      {t("vault.entryLimitUpgrade")}
                    </button>
                  ) : null}
                  {entitlementLoaded ? (
                    <PlanBadge
                      label={
                        licensed
                          ? t("vault.licenseBadgePro")
                          : t("vault.licenseBadgeFree")
                      }
                    />
                  ) : (
                    <span
                      className="h-[1.375rem] w-[2.75rem] rounded-full bg-ink-100 animate-pulse shrink-0"
                      aria-hidden
                    />
                  )}
                </>
              ) : null}
              <UserMenuDropdown />
              <LanguageMenu
                value={locale}
                onChange={(l) => void setLocale(l)}
                ariaLabel={t("settings.language")}
                align="right"
                triggerClassName={SETTINGS_HEADER_ICON_BTN}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col min-h-0 w-full">
        <div
          className={`flex flex-1 flex-col md:flex-row min-h-0 ${SETTINGS_PAGE}`}
        >
          <aside className="hidden md:block shrink-0 md:w-56 lg:w-60 md:py-8 md:pr-4">
            <a
              href={vaultHref}
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-600 hover:text-ink-900 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
              {t("account.backToVault")}
            </a>

            <p className="mt-6 mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-ink-400">
              {t("settings.sidebarSection")}
            </p>
            <nav className="flex flex-col gap-0.5" aria-label={t("settings.navAria")}>
              {navItems.map((item) => (
                <a
                  key={item.id}
                  id={`settings-tab-${item.id}`}
                  href={settingsHref(item.id)}
                  className={sidebarNavClass(activeSection === item.id)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0 overflow-y-auto py-6 sm:py-10 md:pl-6 md:pr-2 pb-6 sm:pb-10">
            <div className="md:hidden space-y-4">
              <a
                href={vaultHref}
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-600 hover:text-ink-900 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
                {t("account.backToVault")}
              </a>

              <nav
                className="flex gap-0 border-b border-ink-200 overflow-x-auto -mx-1 px-1"
                role="tablist"
                aria-label={t("settings.navAria")}
              >
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    id={`settings-tab-${item.id}`}
                    href={settingsHref(item.id)}
                    role="tab"
                    aria-selected={activeSection === item.id}
                    className={settingsTabClass(activeSection === item.id)}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div
              className="w-full max-w-none space-y-6 mt-6 md:mt-0"
              role="tabpanel"
              aria-labelledby={`settings-tab-${activeSection}`}
            >
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">
                  {pageTitle}
                </h1>
                <p className="text-sm text-ink-500 leading-snug">{pageSubtitle}</p>
              </div>

              {backupToast && (
                <p className="text-sm text-ink-600 bg-white border border-ink-200 rounded-md px-3 py-2 leading-snug">
                  {backupToast}
                </p>
              )}

              {renderSectionContent()}
            </div>
          </main>
        </div>
      </div>
      <PricingDrawer
        open={pricingDrawerOpen}
        onClose={() => setPricingDrawerOpen(false)}
      />
    </div>
  );
}
