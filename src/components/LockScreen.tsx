import React, { useCallback, useEffect, useState } from "react";
import { useCheckoutReturn } from "../hooks/useCheckoutReturn";
import {
  clearCheckoutPending,
  clearCheckoutPopupMode,
  type CheckoutReturn,
} from "../lib/checkoutReturn";
import { useVault } from "../lib/vault";
import { LockOpen, Eye, EyeOff } from "./Icons";
import { ScreenHeader } from "./ScreenHeader";
import { AppShell } from "./AppShell";
import { NativePinnedAppShell } from "./NativePinnedAppShell";
import { isAppError } from "../lib/errors";
import { passkeyRegisteredForCurrentSite } from "../lib/passkey";
import { isNativeApp } from "../lib/platform";

const LOCK_TAB_BASE =
  "flex-1 min-w-0 px-1 pb-2.5 pt-0.5 text-xs font-medium transition-colors border-b-2 -mb-px focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30 focus-visible:ring-offset-2 rounded-t-md";
const LOCK_TAB_ACTIVE = `${LOCK_TAB_BASE} border-accent-600 text-accent-700`;
const LOCK_TAB_INACTIVE = `${LOCK_TAB_BASE} border-transparent text-ink-500 hover:text-ink-800 hover:border-ink-200`;

export function LockScreen() {
  const {
    unlock,
    unlockWithPasskey,
    isPasskeySupported,
    meta,
    resetVault,
    finalizePaidCheckout,
    licensed,
    locale,
    setLocale,
    t,
  } = useVault();

  const onCheckoutReturn = useCallback(
    ({ result, sessionId }: { result: CheckoutReturn; sessionId: string | null }) => {
      if (result === "cancel") {
        clearCheckoutPending();
        clearCheckoutPopupMode();
        return;
      }
      void finalizePaidCheckout(sessionId);
    },
    [finalizePaidCheckout],
  );

  const { checkoutFlash, dismissCheckoutFlash } =
    useCheckoutReturn(onCheckoutReturn);
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

  const lockHeader = (
    <ScreenHeader
      brandName={t("app.brandName")}
      pageTitle={t("lock.title")}
      hideTitle={isNativeApp()}
      locale={locale}
      onLocaleChange={(l) => void setLocale(l)}
      languageAriaLabel={t("settings.language")}
      brandHomeHref={brandHomeHref}
      brandHomeAriaLabel={brandHomeHref ? t("auth.brandHomeAria") : undefined}
      className={isNativeApp() ? "mb-0" : undefined}
    />
  );

  const lockBody = (
    <>
      {isNativeApp() ? (
        <div className="setup-shell-intro mb-5 space-y-1">
          <h1 className="font-sans text-xl font-semibold text-ink-900 tracking-tight">
            {t("lock.title")}
          </h1>
          <p className="text-xs text-ink-500 leading-snug">{t("lock.subtitle")}</p>
        </div>
      ) : (
        <p className="text-xs text-ink-500 leading-snug">{t("lock.subtitle")}</p>
      )}

        {checkoutFlash ? (
          <div
            role="status"
            className={`rounded-md border px-3 py-2.5 text-sm leading-snug ${
              checkoutFlash === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-ink-200 bg-ink-50 text-ink-700"
            }`}
          >
            <p>
              {checkoutFlash === "success"
                ? t("pricing.checkoutSuccess")
                : t("pricing.checkoutCancel")}
            </p>
            {checkoutFlash === "success" && licensed ? (
              <p className="mt-1 font-medium text-emerald-900">
                {t("pricing.youAreLicensed")} {t("lock.checkoutUnlockHint")}
              </p>
            ) : null}
            <button
              type="button"
              className="mt-2 text-xs font-medium text-ink-600 hover:text-ink-900 underline"
              onClick={dismissCheckoutFlash}
            >
              {t("common.close")}
            </button>
          </div>
        ) : null}

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
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
            onClick={() => void handlePasskey()}
            disabled={busy}
          >
            <LockOpen className="w-4 h-4 shrink-0" aria-hidden />
            {t("lock.unlockPasskey")}
          </button>
        )}

        <p className="pt-1 text-center text-xs text-ink-600">
          <button
            type="button"
            className="font-semibold text-accent-600 hover:underline focus:outline-none focus-visible:underline"
            onClick={() => setShowBackup((v) => !v)}
          >
            {showBackup ? t("lock.hideBackup") : t("lock.useBackup")}
          </button>
        </p>

        {showBackup && (
          <>
            <div
              className="-mx-5 sm:-mx-8 border-t border-ink-200"
              role="separator"
              aria-hidden
            />
            <form onSubmit={handle} className="space-y-4 pt-4">
            <p className="text-xs text-ink-500 leading-snug">{t("lock.backupHint")}</p>
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
            <div
              role="tablist"
              aria-label={`${t("lock.backupTotpTab")} / ${t("lock.backupRecoveryTab")}`}
              className="flex border-b border-ink-200"
            >
              <button
                type="button"
                role="tab"
                id="lock-backup-tab-totp"
                aria-selected={backupMode === "totp"}
                aria-controls="lock-backup-panel"
                className={backupMode === "totp" ? LOCK_TAB_ACTIVE : LOCK_TAB_INACTIVE}
                onClick={() => setBackupMode("totp")}
              >
                {t("lock.backupTotpTab")}
              </button>
              <button
                type="button"
                role="tab"
                id="lock-backup-tab-recovery"
                aria-selected={backupMode === "recovery"}
                aria-controls="lock-backup-panel"
                className={
                  backupMode === "recovery" ? LOCK_TAB_ACTIVE : LOCK_TAB_INACTIVE
                }
                onClick={() => setBackupMode("recovery")}
              >
                {t("lock.backupRecoveryTab")}
              </button>
            </div>
            <div
              id="lock-backup-panel"
              role="tabpanel"
              className="space-y-4 pt-1"
              aria-labelledby={
                backupMode === "totp" ? "lock-backup-tab-totp" : "lock-backup-tab-recovery"
              }
            >
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
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
              disabled={
                busy ||
                !pw ||
                (backupMode === "totp" ? code.length !== 6 : code.length < 8)
              }
            >
              <LockOpen className="w-4 h-4 shrink-0" aria-hidden /> {t("lock.unlockBackup")}
            </button>

            <div className="pt-2">
              {!confirmReset ? (
                <div className="text-center">
                  <button
                    type="button"
                    className="text-xs text-ink-500 hover:text-red-600"
                    onClick={() => setConfirmReset(true)}
                  >
                    {t("lock.forget")}
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-left">
                  <p className="text-red-600 leading-snug mb-3">{t("lock.resetWarn")}</p>
                  <div className="flex gap-2 justify-start">
                    <button
                      type="button"
                      className="btn-secondary shrink-0 whitespace-nowrap"
                      onClick={() => setConfirmReset(false)}
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      type="button"
                      className="btn-danger flex-1 min-w-0 whitespace-nowrap"
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
          </>
        )}
    </>
  );

  if (isNativeApp()) {
    return (
      <NativePinnedAppShell header={lockHeader} remeasureKey={showBackup}>
        <div className="space-y-4">{lockBody}</div>
      </NativePinnedAppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-4">
        {lockHeader}
        {lockBody}
      </div>
    </AppShell>
  );
}
