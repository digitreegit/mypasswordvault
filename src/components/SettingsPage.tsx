import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useVault } from "../lib/vault";
import { useAuth } from "../lib/auth";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { ChevronDown } from "./Icons";
import { ModalCloseButton } from "./ModalCloseButton";
import { LOCALES, LOCALE_LABELS, type Locale } from "../lib/i18n/locale";
import { AccountCredentialPanel } from "./AccountCredentialPanel";
import { PlanBadge } from "./PlanBadge";
import { UserMenuDropdown } from "./UserMenuDropdown";
import { NativeTopHeader, NATIVE_HEADER_ICON_BTN } from "./NativeTopHeader";
import {
  SettingsFreeFeatures,
  SettingsFreePlanUpgrade,
  SettingsProFeatures,
} from "./CheckoutProFeatures";
import { PricingDrawer } from "./PricingDrawer";
import { downloadJsonFile } from "../lib/vaultBackup";
import { isAppError } from "../lib/errors";
import { SecuritySettingsPanel } from "./SecuritySettingsPanel";
import {
  nativeFixedHeaderClass,
  nativeMainScrollClass,
  nativeScreenRootClass,
  vaultHomeHref,
} from "../lib/nativeLayout";
import { isNativeApp } from "../lib/platform";

export type SettingsSection = "general" | "plan" | "security" | "backup" | "account";

export function settingsSectionFromPath(hashPath: string): SettingsSection {
  if (hashPath === "settings/plan") return "plan";
  if (hashPath === "settings/security") return "security";
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
    "settings-mobile-tab shrink-0 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30 focus-visible:ring-offset-2 rounded-t-md touch-manipulation";
  return active
    ? `${base} border-accent-600 text-accent-700`
    : `${base} border-transparent text-ink-500 hover:text-ink-800 hover:border-ink-200`;
}

function sidebarNavClass(active: boolean): string {
  return [
    "block rounded-md px-3 py-2 text-[14px] font-medium transition-colors",
    active
      ? "bg-ink-50 text-ink-900"
      : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
  ].join(" ");
}

const SETTINGS_PAGE =
  "settings-page max-w-6xl mx-auto w-full min-w-0 box-border px-4 sm:px-6 lg:px-8";

const SETTINGS_HEADER_ICON_BTN = NATIVE_HEADER_ICON_BTN;

const SETTINGS_BACK_TO_VAULT_CLASS =
  "settings-back-to-vault-btn btn-secondary inline-flex items-center gap-1.5 self-start shrink-0";

export function SettingsPage({ section }: { section: SettingsSection }) {
  const {
    meta,
    setAutoLockMinutes,
    exportBackup,
    importBackup,
    entries,
    licensed,
    isAdmin,
    licenseKey,
    entitlementLoaded,
    freeEntryLimit,
    atEntryLimit,
    locale,
    setLocale,
    t,
    refreshEntitlements,
  } = useVault();
  const { configured, user, session, loading: authLoading, signOut, deleteAccount } = useAuth();
  const [mins, setMins] = useState<number>(meta?.autoLockMinutes ?? 5);
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(
    null,
  );
  const [importDraft, setImportDraft] = useState<string | null>(null);
  const [backupToast, setBackupToast] = useState<string | null>(null);
  const [licenseKeyCopied, setLicenseKeyCopied] = useState(false);
  const [pricingDrawerOpen, setPricingDrawerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const vaultHref = vaultHomeHref();
  const native = isNativeApp();
  const showAccountSections = Boolean(configured && user);
  const showHeaderUpgrade =
    atEntryLimit && !licensed && !isAdmin && entitlementLoaded;
  const hasUnlimitedEntries = licensed || isAdmin;

  function openPricingDrawer(e?: React.MouseEvent) {
    e?.preventDefault();
    void refreshEntitlements({ keepLoaded: true }).then((lic) => {
      if (lic) return;
      setPricingDrawerOpen(true);
    });
  }

  useEffect(() => {
    if (section === "plan" && showAccountSections) {
      void refreshEntitlements();
    }
  }, [section, showAccountSections, refreshEntitlements]);

  const showPlanComparison =
    showAccountSections && entitlementLoaded && !hasUnlimitedEntries && !isAdmin;
  const showProFeaturesOnPlan =
    showAccountSections && entitlementLoaded && hasUnlimitedEntries;

  const navItems = useMemo(() => {
    const items: { id: SettingsSection; label: string }[] = [
      { id: "general", label: t("settings.navGeneral") },
    ];
    if (showAccountSections) {
      items.push({ id: "plan", label: t("settings.navPlan") });
    }
    items.push({ id: "security", label: t("settings.navSecurity") });
    items.push({ id: "backup", label: t("settings.navBackup") });
    if (showAccountSections) {
      items.push({ id: "account", label: t("settings.accountTitle") });
    }
    return items;
  }, [showAccountSections, t]);

  const activeSection = navItems.some((item) => item.id === section)
    ? section
    : (navItems[0]?.id ?? "general");

  const tablistRef = useRef<HTMLDivElement>(null);
  const tabTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const wrap = tablistRef.current;
    const tab = wrap?.querySelector<HTMLElement>(`#settings-tab-${activeSection}`);
    tab?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [activeSection]);

  const onTabStripTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    tabTouchStartRef.current = {
      x: e.touches[0]?.clientX ?? 0,
      y: e.touches[0]?.clientY ?? 0,
    };
  }, []);

  const onTabStripTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const start = tabTouchStartRef.current;
    const touch = e.touches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4) {
      e.stopPropagation();
    }
  }, []);

  const pageTitle =
    activeSection === "general"
      ? t("settings.navGeneral")
      : activeSection === "plan"
        ? t("settings.licenseTitle")
        : activeSection === "security"
          ? t("settings.navSecurity")
          : activeSection === "backup"
            ? t("settings.syncTitle")
            : t("settings.accountTitle");

  const pageSubtitle =
    activeSection === "general"
      ? t("settings.generalSubtitle")
      : activeSection === "plan"
        ? t("settings.planSubtitle")
        : activeSection === "security"
          ? t("settings.securitySubtitle")
          : activeSection === "backup"
            ? t("settings.backupSubtitle")
            : t("settings.accountSubtitle");

  useEffect(() => {
    setMins(meta?.autoLockMinutes ?? 5);
  }, [meta]);

  useEffect(() => {
    if (!deleteAccountModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deletingAccount) {
        setDeleteAccountModalOpen(false);
        setDeleteAccountError(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [deleteAccountModalOpen, deletingAccount]);

  function openDeleteAccountModal() {
    setDeleteAccountError(null);
    setDeleteAccountModalOpen(true);
  }

  function closeDeleteAccountModal() {
    if (deletingAccount) return;
    setDeleteAccountModalOpen(false);
    setDeleteAccountError(null);
  }

  async function submitDeleteAccount() {
    setDeletingAccount(true);
    setDeleteAccountError(null);
    setBackupToast(null);
    try {
      await deleteAccount();
      window.location.href = "/";
    } catch (e: unknown) {
      const code = (e as Error)?.message ?? "";
      setDeleteAccountError(
        code === "function_not_deployed"
          ? t("settings.deleteAccountNotDeployed")
          : t("settings.deleteAccountFailed"),
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  async function handleExport() {
    setBackupToast(null);
    try {
      const json = await exportBackup();
      const d = new Date().toISOString().slice(0, 10);
      await downloadJsonFile(`mypasswordapp-vault-${d}.json`, json);
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
      <div className="space-y-4">
        <div className="card p-5 sm:p-6 space-y-3">
          <h3
            id="settings-autolock-title"
            className="settings-card-title text-sm font-semibold text-ink-800"
          >
            {t("settings.autoLock")}
          </h3>
          <p className="settings-card-hint text-xs text-ink-600 leading-snug">
            {t("settings.autoLockHint")}
          </p>
          <div className="relative">
            <select
              id="settings-autolock"
              aria-labelledby="settings-autolock-title"
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
        </div>

        <div className="card p-5 sm:p-6 space-y-3">
          <h3
            id="settings-language-title"
            className="settings-card-title text-sm font-semibold text-ink-800"
          >
            {t("settings.language")}
          </h3>
          <p className="settings-card-hint text-xs text-ink-600 leading-snug">
            {t("settings.languageHint")}
          </p>
          <div className="relative">
            <select
              id="settings-language"
              aria-labelledby="settings-language-title"
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
        </div>
      </div>
    );
  }

  function renderPlan() {
    if (!showAccountSections) return null;
    return (
      <div className="space-y-5 sm:space-y-6">
        <div className="card p-5 sm:p-6 space-y-3">
          {!entitlementLoaded ? (
            <p className="text-sm text-ink-500">{t("settings.licenseLoading")}</p>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <PlanBadge
                  label={
                    isAdmin
                      ? t("settings.planBadgeAdmin")
                      : licensed
                        ? t("settings.planBadgePro")
                        : t("settings.planBadgeFree")
                  }
                />
              </div>
              {hasUnlimitedEntries ? (
                <p className="text-sm font-medium text-emerald-600 leading-snug">
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
              {showProFeaturesOnPlan ? (
                <SettingsProFeatures t={t} />
              ) : null}
              {showPlanComparison ? (
                <>
                  <SettingsFreeFeatures t={t} />
                  <SettingsFreePlanUpgrade
                    t={t}
                    busy={false}
                    err={null}
                    checkoutDisabled={!configured || authLoading || !session}
                    onCheckout={openPricingDrawer}
                  />
                </>
              ) : null}
              {licensed && licenseKey ? (
                <div className="space-y-2 pt-1">
                  <label className="label text-xs" htmlFor="settings-license-key">
                    {t("settings.licenseKeyLabel")}
                  </label>
                  <div className="flex min-h-[2.375rem] items-center rounded-md border border-ink-200 bg-ink-100 pr-1.5">
                    <div
                      id="settings-license-key"
                      role="textbox"
                      aria-readonly="true"
                      className="min-w-0 flex-1 px-3 py-2 text-sm text-ink-500 break-all select-text cursor-default"
                    >
                      {licenseKey}
                    </div>
                    <button
                      type="button"
                      className="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-ink-500 transition-colors hover:bg-ink-200/80 hover:text-ink-800"
                      aria-label={
                        licenseKeyCopied
                          ? t("settings.licenseKeyCopied")
                          : t("settings.licenseCopyKey")
                      }
                      title={
                        licenseKeyCopied
                          ? t("settings.licenseKeyCopied")
                          : t("settings.licenseCopyKey")
                      }
                      onClick={() => void copyLicenseKey()}
                    >
                      {licenseKeyCopied ? (
                        <CheckIcon className="h-4 w-4 text-emerald-600" aria-hidden />
                      ) : (
                        <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-ink-500 leading-snug">
                    {t("settings.licenseKeyHint")}
                  </p>
                </div>
              ) : licensed ? (
                <p className="text-xs text-ink-500 leading-snug">
                  {t("settings.licenseNoSessionId")}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  }

  function renderBackup() {
    return (
      <div className="space-y-4">
        <p className="settings-sync-hint text-ink-900 leading-snug">{t("settings.syncHint")}</p>
        <div className="card p-5 sm:p-6 space-y-3">
          <h3 className="settings-card-title text-sm font-semibold text-ink-800">
            {t("settings.fileBackupAdvanced")}
          </h3>
          <p className="settings-card-hint text-xs text-ink-600 leading-snug">
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
          <p className="settings-account-action-hint text-ink-500 leading-snug">{t("settings.signOutHint")}</p>
        </div>

        <hr className="border-ink-200" />

        <div className="space-y-2">
          <button
            type="button"
            className="btn-danger text-sm w-full sm:w-auto"
            disabled={signingOut || deletingAccount || busy}
            onClick={openDeleteAccountModal}
          >
            {t("settings.deleteAccount")}
          </button>
          <p className="settings-account-action-hint text-red-700 leading-snug">{t("settings.deleteAccountHint")}</p>
        </div>
        </div>
      </div>
    );
  }

  function renderSecurity() {
    return <SecuritySettingsPanel />;
  }

  function renderSectionContent() {
    switch (activeSection) {
      case "plan":
        return renderPlan();
      case "security":
        return renderSecurity();
      case "backup":
        return renderBackup();
      case "account":
        return renderAccount();
      default:
        return renderGeneral();
    }
  }

  function navigateToVault(e: React.MouseEvent) {
    e.preventDefault();
    window.location.hash = vaultHref.replace(/^#/, "");
  }

  function renderSettingsTabList() {
    return (
      <div
        ref={tablistRef}
        className="settings-mobile-tablist-wrap min-w-0 w-full"
        onTouchStart={onTabStripTouchStart}
        onTouchMove={onTabStripTouchMove}
      >
        <nav
          className="settings-mobile-tablist flex flex-nowrap gap-0 border-b border-ink-200"
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
    );
  }

  return (
    <div className={nativeScreenRootClass("bg-white")}>
      <div className={nativeFixedHeaderClass()}>
        {native ? (
          <div className="settings-native-chrome w-full bg-white">
            <div className={SETTINGS_PAGE}>
              <a
                href={vaultHref}
                className="settings-native-back"
                onClick={navigateToVault}
              >
                <ChevronLeftIcon className="settings-native-back__icon" aria-hidden />
                {t("account.backToVault")}
              </a>
            </div>
            <div className={SETTINGS_PAGE}>{renderSettingsTabList()}</div>
          </div>
        ) : (
          <NativeTopHeader
            brandName={t("app.brandName")}
            trailing={
              configured && user?.id ? (
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
                        isAdmin
                          ? t("vault.licenseBadgeAdmin")
                          : licensed
                            ? t("vault.licenseBadgePro")
                            : t("vault.licenseBadgeFree")
                      }
                      href={isAdmin ? "#/admin" : undefined}
                      ariaLabel={isAdmin ? t("admin.title") : undefined}
                    />
                  ) : (
                    <span
                      className="h-[1.375rem] w-[2.75rem] rounded-full bg-ink-100 animate-pulse shrink-0"
                      aria-hidden
                    />
                  )}
                  <UserMenuDropdown triggerClassName={SETTINGS_HEADER_ICON_BTN} />
                </>
              ) : null
            }
            locale={locale}
            onLocaleChange={(l) => void setLocale(l)}
            languageAriaLabel={t("settings.language")}
          />
        )}
      </div>

      <div
        className={nativeMainScrollClass(
          `${SETTINGS_PAGE} ${native ? "pt-4 pb-6" : "py-6 sm:py-10 pb-6 sm:pb-10"} w-full`,
        )}
      >
        <div className="flex flex-col md:flex-row md:gap-6 min-w-0">
          <aside
            className={`${native ? "hidden" : "hidden md:block"} shrink-0 md:w-56 lg:w-60 md:pr-4`}
          >
            <a
              href={vaultHref}
              className={SETTINGS_BACK_TO_VAULT_CLASS}
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = vaultHref.replace(/^#/, "");
              }}
            >
              <ArrowLeftIcon className="h-3 w-3 shrink-0 ui-icon-fixed" aria-hidden />
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

          <div className="flex-1 min-w-0">
            {!native ? (
              <div className="md:hidden min-w-0 w-full space-y-4">
                <a
                  href={vaultHref}
                  className={SETTINGS_BACK_TO_VAULT_CLASS}
                  onClick={navigateToVault}
                >
                  <ArrowLeftIcon className="h-3 w-3 shrink-0 ui-icon-fixed" aria-hidden />
                  {t("account.backToVault")}
                </a>

                {renderSettingsTabList()}
              </div>
            ) : null}

            <div
              className={`w-full max-w-none space-y-6 ${native ? "mt-0" : "mt-6 md:mt-0"}`}
              role="tabpanel"
              aria-labelledby={`settings-tab-${activeSection}`}
            >
              <div className="space-y-1">
                <h1 className="settings-section-title text-2xl font-semibold text-ink-900 tracking-tight">
                  {pageTitle}
                </h1>
                <p className="settings-section-subtitle text-sm text-ink-500 leading-snug">
                  {pageSubtitle}
                </p>
              </div>

              {backupToast && (
                <p className="text-sm text-ink-600 bg-white border border-ink-200 rounded-md px-3 py-2 leading-snug">
                  {backupToast}
                </p>
              )}

              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>
      <PricingDrawer
        open={pricingDrawerOpen}
        onClose={() => setPricingDrawerOpen(false)}
      />

      {deleteAccountModalOpen && user
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
              role="presentation"
              onClick={closeDeleteAccountModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-delete-account-title"
                className="card w-full max-w-md shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="action-modal__header px-5 py-3 border-b border-ink-200">
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      id="settings-delete-account-title"
                      className="font-sans text-lg font-semibold text-ink-900 tracking-tight leading-tight"
                    >
                      {t("settings.deleteAccount")}
                    </h2>
                    <ModalCloseButton
                      onClick={closeDeleteAccountModal}
                      ariaLabel={t("common.close")}
                      disabled={deletingAccount}
                    />
                  </div>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <p className="text-sm text-ink-700 leading-snug">
                    {t("settings.deleteAccountModalBody", {
                      email: user.email ?? user.id,
                    })}
                  </p>
                  <p className="text-sm text-red-700 leading-snug">
                    {t("settings.deleteAccountModalWarning")}
                  </p>
                  {deleteAccountError ? (
                    <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {deleteAccountError}
                    </p>
                  ) : null}
                </div>
                <div className="action-modal__footer px-5 py-3 border-t border-ink-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                  <button
                    type="button"
                    className="btn-secondary text-sm w-full sm:w-auto"
                    onClick={closeDeleteAccountModal}
                    disabled={deletingAccount}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    className="btn-danger text-sm w-full sm:w-auto"
                    disabled={deletingAccount}
                    onClick={() => void submitDeleteAccount()}
                  >
                    {deletingAccount ? t("app.loading") : t("settings.deleteAccount")}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
