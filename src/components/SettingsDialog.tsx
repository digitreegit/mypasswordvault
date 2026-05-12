import React, { useEffect, useRef, useState } from "react";
import { useVault } from "../lib/vault";
import { LanguageMenu } from "./LanguageMenu";
import { downloadJsonFile } from "../lib/vaultBackup";
import { isAppError } from "../lib/errors";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const {
    meta,
    locale,
    setLocale,
    setAutoLockMinutes,
    resetVault,
    exportBackup,
    importBackup,
    t,
  } = useVault();
  const [mins, setMins] = useState<number>(meta?.autoLockMinutes ?? 5);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [importDraft, setImportDraft] = useState<string | null>(null);
  const [backupToast, setBackupToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMins(meta?.autoLockMinutes ?? 5);
  }, [meta]);

  async function save() {
    setBusy(true);
    try {
      await setAutoLockMinutes(mins);
      onClose();
    } finally {
      setBusy(false);
    }
  }

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

  async function handleCopyBackup() {
    setBackupToast(null);
    try {
      const json = await exportBackup();
      if (json.length > 1_500_000) {
        setBackupToast(t("settings.copyBackupFail"));
        return;
      }
      await navigator.clipboard.writeText(json);
      setBackupToast(t("settings.copyBackupOk"));
    } catch {
      setBackupToast(t("settings.copyBackupFail"));
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

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{t("settings.title")}</h2>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-700 shrink-0">
            {t("settings.language")}
          </span>
          <LanguageMenu
            value={locale}
            onChange={(l) => void setLocale(l)}
            ariaLabel={t("settings.language")}
            align="right"
          />
        </div>

        <div>
          <label className="label" htmlFor="settings-autolock">
            {t("settings.autoLock")}
          </label>
          <select
            id="settings-autolock"
            className="input"
            value={mins}
            onChange={(e) => setMins(Number(e.target.value))}
          >
            <option value={1}>{t("autoLock.m1")}</option>
            <option value={5}>{t("autoLock.m5")}</option>
            <option value={15}>{t("autoLock.m15")}</option>
            <option value={30}>{t("autoLock.m30")}</option>
            <option value={0}>{t("autoLock.offBad")}</option>
          </select>
          <p className="text-xs text-ink-500 mt-1">
            {t("settings.autoLockHint")}
          </p>
        </div>

        <div className="pt-2 border-t border-ink-100 space-y-2">
          <h3 className="text-sm font-semibold text-ink-800">
            {t("settings.syncTitle")}
          </h3>
          <p className="text-xs text-ink-600 leading-relaxed">
            {t("settings.syncHint")}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn-secondary text-sm w-full"
              onClick={() => void handleExport()}
            >
              {t("settings.exportBackup")}
            </button>
            <button
              type="button"
              className="btn-secondary text-sm w-full"
              onClick={() => void handleCopyBackup()}
            >
              {t("settings.copyBackup")}
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
          {backupToast && (
            <p className="text-xs text-ink-600 bg-ink-50 rounded-md p-2">
              {backupToast}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button className="btn-primary flex-1" onClick={save} disabled={busy}>
            {t("common.save")}
          </button>
        </div>

        <div className="pt-4 border-t border-ink-100 space-y-2">
          <h3 className="text-sm font-medium text-red-600">
            {t("settings.danger")}
          </h3>
          {!confirmReset ? (
            <button
              className="btn-danger text-xs"
              onClick={() => setConfirmReset(true)}
            >
              {t("settings.resetVault")}
            </button>
          ) : (
            <div className="space-y-2 text-xs">
              <p className="text-red-600">{t("settings.resetDesc")}</p>
              <div className="flex gap-2">
                <button
                  className="btn-secondary text-xs"
                  onClick={() => setConfirmReset(false)}
                >
                  {t("common.cancel")}
                </button>
                <button
                  className="btn-danger text-xs"
                  onClick={async () => {
                    await resetVault();
                    onClose();
                  }}
                >
                  {t("settings.permanentDelete")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
