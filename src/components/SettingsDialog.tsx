import React, { useEffect, useRef, useState } from "react";
import { useVault } from "../lib/vault";
import { useAuth } from "../lib/auth";
import { ChevronDown } from "./Icons";
import { downloadJsonFile } from "../lib/vaultBackup";
import { isAppError } from "../lib/errors";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const {
    meta,
    setAutoLockMinutes,
    exportBackup,
    importBackup,
    pullVaultFromCloud,
    entries,
    licensed,
    licenseKey,
    entitlementLoaded,
    freeEntryLimit,
    refreshEntitlements,
    t,
  } = useVault();
  const { configured, user, signOut, deleteAccount } = useAuth();
  const [mins, setMins] = useState<number>(meta?.autoLockMinutes ?? 5);
  const [busy, setBusy] = useState(false);
  const [pullBusy, setPullBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [importDraft, setImportDraft] = useState<string | null>(null);
  const [backupToast, setBackupToast] = useState<string | null>(null);
  const [licenseKeyCopied, setLicenseKeyCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      onClose();
    } catch (e: unknown) {
      setBackupToast(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePullCloud() {
    setBackupToast(null);
    setPullBusy(true);
    try {
      await pullVaultFromCloud();
      setBackupToast(t("settings.pullCloudDone"));
    } catch (e: unknown) {
      setBackupToast(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setPullBusy(false);
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

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg sm:max-w-xl max-h-[min(90dvh,90vh)] overflow-y-auto p-4 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 pb-1">
          <h1 className="font-sans text-xl font-semibold text-ink-900 tracking-tight">
            {t("settings.title")}
          </h1>
          <button type="button" className="btn-ghost text-sm shrink-0" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>

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
          <p className="text-xs text-ink-500 mt-1 leading-snug">
            {t("settings.autoLockHint")}
          </p>
        </div>

        {configured && user && (
          <div className="rounded-lg border border-ink-200 bg-ink-50/90 p-3 space-y-2">
            <h3 className="text-sm font-semibold text-ink-800">{t("settings.licenseTitle")}</h3>
            {!entitlementLoaded ? (
              <p className="text-xs text-ink-500">{t("settings.licenseLoading")}</p>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={
                      licensed
                        ? "text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-900"
                        : "text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md border border-ink-200 bg-white text-ink-700"
                    }
                    translate="no"
                  >
                    {licensed ? t("settings.planBadgeLicensed") : t("settings.planBadgeFree")}
                  </span>
                </div>
                {licensed ? (
                  <p className="text-xs font-medium text-emerald-800 leading-snug">
                    {t("settings.licenseStatusLicensed")}
                  </p>
                ) : (
                  <p className="text-xs text-ink-700 leading-snug">
                    {t("settings.licenseStatusFree", {
                      count: entries.length,
                      limit: freeEntryLimit,
                    })}
                  </p>
                )}
                {licensed && licenseKey ? (
                  <div className="space-y-1 pt-1">
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
                        {licenseKeyCopied ? t("settings.licenseKeyCopied") : t("settings.licenseCopyKey")}
                      </button>
                    </div>
                    <p className="text-xs text-ink-500 leading-snug">{t("settings.licenseKeyHint")}</p>
                  </div>
                ) : licensed ? (
                  <p className="text-xs text-ink-500 leading-snug pt-0.5">
                    {t("settings.licenseNoSessionId")}
                  </p>
                ) : null}
              </>
            )}
            <p className="text-xs text-ink-600 leading-snug border-t border-ink-100/80 pt-2">
              {t("settings.licenseFree", { limit: freeEntryLimit })}
            </p>
            <p className="text-xs text-ink-600 leading-snug">{t("settings.licensePaid")}</p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href="#/pricing"
                className="btn-primary justify-center flex-1 min-w-0"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = "#/pricing";
                  onClose();
                }}
              >
                {t("settings.licenseLink")}
              </a>
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
        )}

        {backupToast && (
          <p className="text-xs text-ink-600 bg-ink-50 rounded-md p-2 leading-snug">{backupToast}</p>
        )}

        <div className="pt-2 border-t border-ink-100 space-y-2">
          <h3 className="text-sm font-semibold text-ink-800">
            {t("settings.syncTitle")}
          </h3>
          <p className="text-xs text-ink-600 leading-snug">
            {t("settings.syncHint")}
          </p>
          {configured && user && (
            <div className="space-y-2 rounded-lg border border-ink-200 bg-ink-50/80 p-3">
              <p className="text-xs text-ink-600 leading-snug">
                {t("settings.pullCloudHint")}
              </p>
              <button
                type="button"
                className="btn-secondary text-sm w-full"
                disabled={busy || pullBusy}
                onClick={() => void handlePullCloud()}
              >
                {pullBusy ? t("app.loading") : t("settings.pullCloud")}
              </button>
            </div>
          )}
          <details className="group rounded-lg border border-ink-200 bg-white">
            <summary className="cursor-pointer text-sm font-medium text-ink-700 px-3 py-2 list-none flex items-center gap-1 [&::-webkit-details-marker]:hidden hover:bg-ink-50 rounded-lg">
              <span className="text-ink-400 text-xs group-open:rotate-90 transition-transform inline-block">
                ▸
              </span>
              {t("settings.fileBackupAdvanced")}
            </summary>
            <div className="px-3 pb-3 pt-0 space-y-2 border-t border-ink-100">
              <p className="text-xs text-ink-600 leading-snug pt-2">
                {t("settings.fileBackupAdvancedHint")}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="btn-secondary text-sm w-full"
                  disabled={busy || pullBusy}
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
                  className="btn-secondary text-sm w-full"
                  disabled={busy || pullBusy}
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
                      className="btn-secondary text-xs flex-1"
                      onClick={() => setImportDraft(null)}
                      disabled={busy}
                    >
                      {t("settings.importCancel")}
                    </button>
                    <button
                      type="button"
                      className="btn-primary text-xs flex-1 bg-amber-700 hover:bg-amber-800"
                      onClick={() => void applyImport()}
                      disabled={busy}
                    >
                      {t("settings.importApply")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>

        {configured && user && (
          <div className="pt-2 border-t border-ink-100 space-y-2">
            <h3 className="text-sm font-semibold text-ink-800">
              {t("settings.accountTitle")}
            </h3>
            <p className="text-xs text-ink-600 break-all leading-snug">
              {t("settings.signedInAs", {
                email: user.email ?? user.id,
              })}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                className="btn-danger text-sm flex-1 min-w-0"
                disabled={signingOut || deletingAccount || busy}
                onClick={async () => {
                  setSigningOut(true);
                  try {
                    await signOut();
                    onClose();
                  } finally {
                    setSigningOut(false);
                  }
                }}
              >
                {signingOut ? t("app.loading") : t("settings.signOut")}
              </button>
              <button
                type="button"
                className="btn-danger text-sm flex-1 min-w-0 border border-red-800 bg-red-700 hover:bg-red-800"
                disabled={signingOut || deletingAccount || busy}
                onClick={async () => {
                  const email = user.email ?? user.id;
                  if (
                    !window.confirm(
                      t("settings.deleteAccountConfirm", { email })
                    )
                  ) {
                    return;
                  }
                  setDeletingAccount(true);
                  setBackupToast(null);
                  try {
                    await deleteAccount();
                    onClose();
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
            </div>
            <p className="text-xs text-ink-500 leading-snug">
              {t("settings.signOutHint")}
            </p>
            <p className="text-xs text-red-800/90 leading-snug">
              {t("settings.deleteAccountHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
