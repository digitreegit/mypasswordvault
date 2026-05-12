import React, { useRef, useState } from "react";
import { useVault } from "../lib/vault";
import { Shield, Lock } from "./Icons";
import { LanguageMenu } from "./LanguageMenu";
import { isAppError } from "../lib/errors";
import { downloadJsonFile } from "../lib/vaultBackup";

export function LockScreen() {
  const {
    unlock,
    resetVault,
    locale,
    setLocale,
    exportBackup,
    importBackup,
    t,
  } = useVault();
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const lockFileRef = useRef<HTMLInputElement>(null);
  const [importDraft, setImportDraft] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await unlock(pw, code);
    } catch (err: unknown) {
      setError(
        isAppError(err)
          ? t(err.code)
          : (err as Error)?.message ?? t("lock.errFailed")
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    setSyncMsg(null);
    try {
      const json = await exportBackup();
      const d = new Date().toISOString().slice(0, 10);
      downloadJsonFile(`mypasswordapp-vault-${d}.json`, json);
    } catch (e: unknown) {
      setSyncMsg(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("setup.errGeneric")
      );
    }
  }

  async function applyImport() {
    if (!importDraft) return;
    setImportBusy(true);
    setError(null);
    setSyncMsg(null);
    try {
      await importBackup(importDraft);
      setImportDraft(null);
      setPw("");
      setCode("");
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setImportBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-ink-50 to-ink-100">
      <div className="card w-full max-w-md p-8 space-y-4">
        <div className="flex justify-end">
          <LanguageMenu
            value={locale}
            onChange={(l) => void setLocale(l)}
            ariaLabel={t("settings.language")}
          />
        </div>
        <form onSubmit={handle} className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="text-accent-600" />
            <h1 className="text-xl font-semibold">{t("lock.title")}</h1>
          </div>
          <p className="text-sm text-ink-500">{t("lock.subtitle")}</p>
          <div>
            <label className="label">{t("lock.masterPw")}</label>
            <input
              type="password"
              className="input font-mono"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">{t("lock.totp")}</label>
            <input
              className="input font-mono tracking-widest text-center text-lg"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy || !pw || code.length !== 6}
          >
            <Lock /> {t("lock.unlock")}
          </button>

          <div className="pt-2 border-t border-ink-100">
            {!confirmReset ? (
              <button
                type="button"
                className="text-xs text-ink-500 hover:text-red-600"
                onClick={() => setConfirmReset(true)}
              >
                {t("lock.forget")}
              </button>
            ) : (
              <div className="space-y-2 text-xs">
                <p className="text-red-600">{t("lock.resetWarn")}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => setConfirmReset(false)}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    className="btn-danger text-xs"
                    onClick={async () => {
                      await resetVault();
                    }}
                  >
                    {t("lock.deleteAll")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="pt-4 border-t border-ink-100 space-y-2">
          <p className="text-xs font-medium text-ink-700">{t("lock.syncTitle")}</p>
          <button
            type="button"
            className="btn-secondary text-sm w-full"
            onClick={() => void handleExport()}
          >
            {t("lock.exportBackup")}
          </button>
          <input
            ref={lockFileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                setImportDraft(await f.text());
              } catch {
                setSyncMsg(t("settings.copyBackupFail"));
              }
            }}
          />
          <button
            type="button"
            className="btn-secondary text-sm w-full"
            onClick={() => lockFileRef.current?.click()}
            disabled={importBusy}
          >
            {t("lock.importBackup")}
          </button>
          {importDraft && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm space-y-2">
              <p className="text-amber-900">{t("lock.importConfirm")}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary text-xs flex-1"
                  onClick={() => setImportDraft(null)}
                  disabled={importBusy}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  className="btn-primary text-xs flex-1 bg-amber-700 hover:bg-amber-800"
                  onClick={() => void applyImport()}
                  disabled={importBusy}
                >
                  {t("settings.importApply")}
                </button>
              </div>
            </div>
          )}
          {syncMsg && (
            <p className="text-xs text-ink-600 bg-ink-50 rounded-md p-2">{syncMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
}
