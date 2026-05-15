import React, { useEffect, useRef, useState } from "react";
import { useVault } from "../lib/vault";
import { useAuth } from "../lib/auth";
import { LanguageMenu } from "./LanguageMenu";
import { ChevronDown } from "./Icons";
import { downloadJsonFile } from "../lib/vaultBackup";
import { isAppError } from "../lib/errors";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const {
    meta,
    locale,
    setLocale,
    setAutoLockMinutes,
    exportBackup,
    importBackup,
    pullVaultFromCloud,
    t,
  } = useVault();
  const { configured, user, signOut } = useAuth();
  const [mins, setMins] = useState<number>(meta?.autoLockMinutes ?? 5);
  const [busy, setBusy] = useState(false);
  const [pullBusy, setPullBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [importDraft, setImportDraft] = useState<string | null>(null);
  const [backupToast, setBackupToast] = useState<string | null>(null);
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

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md max-h-[min(90dvh,90vh)] overflow-y-auto p-4 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t("settings.title")}</h2>
          <button type="button" className="btn-ghost text-sm shrink-0" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-700 shrink-0">
            {t("settings.language")}
          </span>
          <LanguageMenu
            value={locale}
            onChange={(l) => {
              void (async () => {
                setBackupToast(null);
                try {
                  await setLocale(l);
                } catch (e: unknown) {
                  setBackupToast(
                    isAppError(e)
                      ? t(e.code)
                      : (e as Error)?.message ?? t("setup.errGeneric")
                  );
                }
              })();
            }}
            ariaLabel={t("settings.language")}
            align="right"
          />
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
          <p className="text-xs text-ink-500 mt-1">
            {t("settings.autoLockHint")}
          </p>
        </div>

        {backupToast && (
          <p className="text-xs text-ink-600 bg-ink-50 rounded-md p-2">{backupToast}</p>
        )}

        <div className="pt-2 border-t border-ink-100 space-y-2">
          <h3 className="text-sm font-semibold text-ink-800">
            {t("settings.syncTitle")}
          </h3>
          <p className="text-xs text-ink-600 leading-relaxed">
            {t("settings.syncHint")}
          </p>
          {configured && user && (
            <div className="space-y-2 rounded-lg border border-ink-200 bg-ink-50/80 p-3">
              <p className="text-xs text-ink-600 leading-relaxed">
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
              <p className="text-xs text-ink-600 leading-relaxed pt-2">
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
                  <p className="text-amber-900">{t("settings.importConfirm")}</p>
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
            <p className="text-xs text-ink-600 break-all">
              {t("settings.signedInAs", {
                email: user.email ?? user.id,
              })}
            </p>
            <button
              type="button"
              className="btn-danger text-sm w-full"
              disabled={signingOut || busy}
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
              {t("settings.signOut")}
            </button>
            <p className="text-xs text-ink-500 leading-relaxed">
              {t("settings.signOutHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
