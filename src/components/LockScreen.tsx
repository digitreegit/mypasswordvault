import React, { useEffect, useState } from "react";
import { useVault } from "../lib/vault";
import { Lock, Eye, EyeOff } from "./Icons";
import { ScreenHeader } from "./ScreenHeader";
import { isAppError } from "../lib/errors";
import { passkeyRegisteredForCurrentSite } from "../lib/passkey";
import { isNativeApp } from "../lib/platform";

export function LockScreen() {
  const {
    unlock,
    unlockWithPasskey,
    isPasskeySupported,
    meta,
    resetVault,
    locale,
    setLocale,
    t,
  } = useVault();
  const brandHomeHref = isNativeApp() ? undefined : "/";
  const [pw, setPw] = useState("");
  const [showMasterPw, setShowMasterPw] = useState(false);
  const [code, setCode] = useState("");
  const [backupMode, setBackupMode] = useState<"totp" | "recovery">("totp");
  const [showBackup, setShowBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  async function handlePasskey() {
    setError(null);
    setBusy(true);
    try {
      await unlockWithPasskey();
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

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await unlock(pw, code, backupMode);
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

  const hasPasskeyMeta =
    meta?.authVersion === 2 &&
    !!meta.passkeyDataKeyWrap &&
    (meta.passkeys?.length ?? 0) > 0;
  const passkeyWrongSite =
    isPasskeySupported && hasPasskeyMeta && meta
      ? !passkeyRegisteredForCurrentSite(meta)
      : false;
  const canPasskey =
    isPasskeySupported && hasPasskeyMeta && !passkeyWrongSite;

  useEffect(() => {
    if (!canPasskey) setShowBackup(true);
  }, [canPasskey]);

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-ink-50 to-ink-100">
      <div className="card w-full max-w-md p-5 sm:p-8 space-y-4">
        <ScreenHeader
          brandName={t("app.brandName")}
          pageTitle={t("lock.title")}
          locale={locale}
          onLocaleChange={(l) => void setLocale(l)}
          languageAriaLabel={t("settings.language")}
          brandHomeHref={brandHomeHref}
          brandHomeAriaLabel={brandHomeHref ? t("auth.brandHomeAria") : undefined}
        />
        <p className="text-sm text-ink-500 leading-snug">{t("lock.subtitle")}</p>

        {passkeyWrongSite && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3 leading-snug">
            {t("lock.passkeyWrongSite", {
              site: meta?.passkeyRpId ?? "another site",
            })}
          </p>
        )}

        {canPasskey && (
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => void handlePasskey()}
            disabled={busy}
          >
            {t("lock.unlockPasskey")}
          </button>
        )}

        <div className="pt-1">
          <button
            type="button"
            className="text-sm text-accent-600 hover:underline font-medium"
            onClick={() => setShowBackup((v) => !v)}
          >
            {showBackup ? t("lock.hideBackup") : t("lock.useBackup")}
          </button>
        </div>

        {showBackup && (
          <form onSubmit={handle} className="space-y-4 border-t border-ink-100 pt-4">
            <p className="text-xs text-ink-500">{t("lock.backupHint")}</p>
            <div>
              <label className="label">{t("lock.masterPw")}</label>
              <div className="relative">
                <input
                  type={showMasterPw ? "text" : "password"}
                  className="input pr-10"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  autoFocus
                  spellCheck={false}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-ink-400 hover:text-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30"
                  onClick={() => setShowMasterPw((v) => !v)}
                  title={showMasterPw ? t("vault.hide") : t("vault.show")}
                  aria-label={showMasterPw ? t("vault.hide") : t("vault.show")}
                >
                  {showMasterPw ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className={
                  backupMode === "totp"
                    ? "btn-primary flex-1"
                    : "btn-secondary flex-1"
                }
                onClick={() => setBackupMode("totp")}
              >
                {t("lock.backupTotpTab")}
              </button>
              <button
                type="button"
                className={
                  backupMode === "recovery"
                    ? "btn-primary flex-1"
                    : "btn-secondary flex-1"
                }
                onClick={() => setBackupMode("recovery")}
              >
                {t("lock.backupRecoveryTab")}
              </button>
            </div>
            <div>
              <label className="label">
                {backupMode === "totp" ? t("lock.totp") : t("lock.recoveryCode")}
              </label>
              <input
                className="input font-mono tracking-widest text-center text-lg"
                inputMode={backupMode === "totp" ? "numeric" : "text"}
                maxLength={backupMode === "totp" ? 6 : 24}
                value={code}
                onChange={(e) =>
                  setCode(
                    backupMode === "totp"
                      ? e.target.value.replace(/\D/g, "").slice(0, 6)
                      : e.target.value.toUpperCase()
                  )
                }
                placeholder={backupMode === "totp" ? "000000" : "XXXX-XXXX"}
              />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={
                busy ||
                !pw ||
                (backupMode === "totp" ? code.length !== 6 : code.length < 8)
              }
            >
              <Lock /> {t("lock.unlockBackup")}
            </button>

            <div className="pt-2">
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
        )}
      </div>
    </div>
  );
}
