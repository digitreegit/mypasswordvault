import React, { useCallback, useState } from "react";
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
    recoveryCodesRemaining,
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
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const needSecondFactor = meta?.requireSecondFactorAtUnlock === true;
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
  const passwordPrimary = !canPasskey;
  const showPwForm = passwordPrimary || showPasswordForm;
  const canUseRecovery = recoveryCodesRemaining > 0;
  const lockSubtitle = canPasskey
    ? t("lock.subtitle")
    : needSecondFactor
      ? t("lock.subtitleBackup")
      : t("lock.subtitlePassword");

  async function handlePasskey() {
    setPasskeyError(null);
    setBusy(true);
    try {
      await unlockWithPasskey();
    } catch (err: unknown) {
      if (
        isAppError(err) &&
        (err.code === "errors.passkeyCancelled" ||
          err.code === "errors.passkeyTimeout")
      ) {
        return;
      }
      setPasskeyError(
        isAppError(err)
          ? t(err.code)
          : (err as Error)?.message ?? t("lock.errFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordUnlock(e: React.FormEvent) {
    e.preventDefault();
    setBackupError(null);
    setBusy(true);
    try {
      if (needSecondFactor) {
        await unlock(pw, totpCode, "totp");
      } else {
        await unlock(pw);
      }
    } catch (err: unknown) {
      setBackupError(
        isAppError(err)
          ? t(err.code)
          : (err as Error)?.message ?? t("lock.errFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRecoveryUnlock(e: React.FormEvent) {
    e.preventDefault();
    setBackupError(null);
    setBusy(true);
    try {
      await unlock(pw, recoveryCode, "recovery");
    } catch (err: unknown) {
      setBackupError(
        isAppError(err)
          ? t(err.code)
          : (err as Error)?.message ?? t("lock.errFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  const masterPasswordField = (
    <div>
      <label className="label">{t("lock.masterPw")}</label>
      <div className="relative">
        <input
          type={showMasterPw ? "text" : "password"}
          className="input pr-10"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus={passwordPrimary || showPasswordForm}
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
  );

  const resetBlock = (
    <div className="pt-2">
      {!confirmReset ? (
        <div className="text-center">
          <button
            type="button"
            className="lock-panel-hint !text-red-600 hover:!text-red-700"
            onClick={() => setConfirmReset(true)}
          >
            {t("lock.forget")}
          </button>
        </div>
      ) : (
        <div className="space-y-2 text-sm text-left">
          <p className="text-red-600 leading-snug mb-3">{t("lock.resetWarn")}</p>
          <div className="flex gap-2 justify-start items-center">
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={() => setConfirmReset(false)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="btn-danger flex-1 min-w-0 whitespace-normal text-center leading-snug !h-auto py-2.5"
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
  );

  const passwordForm = (
    <div className={`space-y-4 ${canPasskey ? "pt-4" : ""}`}>
      {canPasskey ? (
        <p className="lock-panel-hint">
          {needSecondFactor ? t("lock.backupHint") : t("lock.backupHintPwOnly")}
        </p>
      ) : null}

      <form onSubmit={handlePasswordUnlock} className="space-y-4">
        {masterPasswordField}
        {needSecondFactor ? (
          <div>
            <label className="label">{t("lock.totp")}</label>
            <input
              className="input font-mono tracking-widest text-center text-lg"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) =>
                setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
            />
          </div>
        ) : null}
        {backupError && !showRecovery ? (
          <div className="text-sm text-red-600">{backupError}</div>
        ) : null}
        <button
          type="submit"
          className="btn-primary w-full inline-flex items-center justify-center gap-2"
          disabled={
            busy ||
            !pw ||
            (needSecondFactor ? totpCode.length !== 6 : false)
          }
        >
          <LockOpen className="w-4 h-4 shrink-0" aria-hidden />{" "}
          {needSecondFactor && canPasskey ? t("lock.unlockBackup") : t("lock.unlock")}
        </button>
      </form>
    </div>
  );

  // Shown under the password form (primary or after passkey backup CTA expands).
  const recoveryBlock = canUseRecovery ? (
    <div className="space-y-3 border-t border-ink-100 pt-3">
      <p className="text-center lock-panel-link">
        <button
          type="button"
          className="font-semibold text-ink-600 hover:text-ink-800 hover:underline focus:outline-none focus-visible:underline"
          onClick={() => {
            setBackupError(null);
            setShowRecovery((v) => !v);
          }}
        >
          {showRecovery ? t("lock.hideRecovery") : t("lock.useRecovery")}
        </button>
      </p>
      {showRecovery ? (
        <form onSubmit={handleRecoveryUnlock} className="space-y-4">
          <p className="lock-panel-hint">{t("lock.recoveryHint")}</p>
          <div>
            <label className="label">{t("lock.recoveryCode")}</label>
            <input
              className="input font-mono tracking-widest text-center text-lg"
              inputMode="text"
              maxLength={24}
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              autoFocus
            />
          </div>
          {backupError ? (
            <div className="text-sm text-red-600">{backupError}</div>
          ) : null}
          <button
            type="submit"
            className="btn-secondary w-full inline-flex items-center justify-center gap-2"
            disabled={busy || !pw || recoveryCode.length < 8}
          >
            <LockOpen className="w-4 h-4 shrink-0" aria-hidden />{" "}
            {t("lock.unlockRecovery")}
          </button>
        </form>
      ) : null}
    </div>
  ) : null;

  const lockHeader = (
    <ScreenHeader
      brandName={t("app.brandName")}
      pageTitle={t("lock.title")}
      subtitle={isNativeApp() ? undefined : lockSubtitle}
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
          <p className="web-auth-subtitle">{lockSubtitle}</p>
        </div>
      ) : null}

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
        <>
          <button
            type="button"
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
            onClick={() => void handlePasskey()}
            disabled={busy}
          >
            <LockOpen className="w-4 h-4 shrink-0" aria-hidden />
            {t("lock.unlockPasskey")}
          </button>
          {passkeyError ? (
            <p className="text-sm text-red-600 leading-snug">{passkeyError}</p>
          ) : null}
          <p className="pt-1 text-center lock-panel-link">
            <button
              type="button"
              className="font-semibold text-ink-600 hover:text-ink-800 hover:underline focus:outline-none focus-visible:underline"
              onClick={() => {
                setPasskeyError(null);
                setBackupError(null);
                setShowRecovery(false);
                setShowPasswordForm((v) => !v);
              }}
            >
              {showPasswordForm ? t("lock.hideBackup") : t("lock.useBackup")}
            </button>
          </p>
        </>
      )}

      {/* Passkey-primary collapsed: only passkey + "Use master password instead".
          Password / authenticator / recovery / reset appear after that CTA expands. */}
      {showPwForm ? (
        <>
          {canPasskey ? (
            <div
              className="-mx-5 sm:-mx-8 border-t border-ink-200"
              role="separator"
              aria-hidden
            />
          ) : null}
          {passwordForm}
          {recoveryBlock}
          {resetBlock}
        </>
      ) : null}
    </>
  );

  if (isNativeApp()) {
    return (
      <NativePinnedAppShell
        header={lockHeader}
        remeasureKey={`${showPwForm}-${showRecovery}`}
      >
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
