import React, { useEffect, useMemo, useState } from "react";
import { useVault } from "../lib/vault";
import {
  copyTextForClipboard,
  otpauthQrDataUrl,
  TOTP_BACKUP_ACCOUNT,
} from "../lib/totp";
import { passwordStrengthScore } from "../lib/passwordGenerator";
import { Check, Eye, EyeOff, ChevronDown } from "./Icons";
import { ScreenHeader } from "./ScreenHeader";
import { isAppError } from "../lib/errors";

type Stage = "password" | "passkey" | "backup-totp" | "recovery";

export function SetupScreen() {
  const {
    setup,
    registerPasskeyInSetup,
    beginBackupTotpEnrollment,
    confirmBackupTotpEnrollment,
    finalizeEnrollment,
    abortSetup,
    isPasskeySupported,
    locale,
    setLocale,
    t,
  } = useVault();
  const [stage, setStage] = useState<Stage>("password");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showMasterPw, setShowMasterPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [autoLock, setAutoLock] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [totpSecret, setTotpSecret] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [recoveryAck, setRecoveryAck] = useState(false);
  const [totpCopyDone, setTotpCopyDone] = useState(false);

  const strengthScore = useMemo(() => passwordStrengthScore(pw), [pw]);

  useEffect(() => {
    if (stage === "backup-totp" && totpSecret) {
      otpauthQrDataUrl(totpSecret, TOTP_BACKUP_ACCOUNT)
        .then(setQrUrl)
        .catch(() => {});
      setTotpCopyDone(false);
    }
  }, [stage, totpSecret]);

  const pageTitle = useMemo(() => {
    switch (stage) {
      case "password":
        return t("setup.pageTitle");
      case "passkey":
        return t("setup.pageTitlePasskey");
      case "backup-totp":
        return t("setup.pageTitleBackupTotp");
      case "recovery":
        return t("setup.pageTitleRecovery");
    }
  }, [stage, t]);

  async function handlePasswordNext() {
    setError(null);
    if (pw.length < 10) {
      setError(t("setup.errMin"));
      return;
    }
    if (pw !== pw2) {
      setError(t("setup.errMismatch"));
      return;
    }
    setBusy(true);
    try {
      await setup(pw, autoLock);
      setStage("passkey");
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRegisterPasskey() {
    setError(null);
    if (!isPasskeySupported) {
      setError(t("errors.passkeyNotSupported"));
      return;
    }
    setBusy(true);
    try {
      await registerPasskeyInSetup();
      const { totpSecretBase32 } = await beginBackupTotpEnrollment();
      setTotpSecret(totpSecretBase32);
      setStage("backup-totp");
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmTotp() {
    setError(null);
    setBusy(true);
    try {
      const { recoveryCodes: codes } = await confirmBackupTotpEnrollment(code);
      setRecoveryCodes(codes);
      setStage("recovery");
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleFinish() {
    if (!recoveryAck) return;
    setError(null);
    setBusy(true);
    try {
      await finalizeEnrollment();
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-ink-50 to-ink-100">
      <div className="card w-full max-w-md p-5 sm:p-8">
        <ScreenHeader
          brandName={t("app.brandName")}
          pageTitle={pageTitle}
          locale={locale}
          onLocaleChange={(l) => void setLocale(l)}
          languageAriaLabel={t("settings.language")}
          className="mb-1"
        />
        <p className="text-sm text-ink-500 mb-6 leading-snug">
          {stage === "password" && t("setup.subtitle")}
          {stage === "passkey" && t("setup.passkeyIntro")}
          {stage === "backup-totp" && t("setup.backupTotpIntro")}
          {stage === "recovery" && t("setup.recoveryIntro")}
        </p>

        {stage === "password" && (
          <div className="space-y-4">
            <div>
              <label className="label">{t("setup.masterPw")}</label>
              <div className="relative">
                <input
                  type={showMasterPw ? "text" : "password"}
                  className="input pr-10"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder={t("setup.placeholderMin")}
                  autoFocus
                  spellCheck={false}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-ink-400 hover:text-accent-600"
                  onClick={() => setShowMasterPw((v) => !v)}
                  aria-label={showMasterPw ? t("vault.hide") : t("vault.show")}
                >
                  {showMasterPw ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <div className="flex-1 h-1.5 rounded bg-ink-100 overflow-hidden">
                  <div
                    className={[
                      "h-full transition-all",
                      strengthScore <= 1
                        ? "bg-red-400"
                        : strengthScore === 2
                          ? "bg-yellow-400"
                          : strengthScore === 3
                            ? "bg-green-400"
                            : "bg-emerald-500",
                    ].join(" ")}
                    style={{ width: `${(strengthScore / 4) * 100}%` }}
                  />
                </div>
                <span className="text-ink-500 w-20 text-right shrink-0">
                  {t(`strength.${strengthScore}`)}
                </span>
              </div>
            </div>
            <div>
              <label className="label">{t("setup.masterPwConfirm")}</label>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  className="input pr-10"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  spellCheck={false}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-ink-400 hover:text-accent-600"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  aria-label={showConfirmPw ? t("vault.hide") : t("vault.show")}
                >
                  {showConfirmPw ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">{t("setup.autoLock")}</label>
              <div className="relative">
                <select
                  className="input w-full appearance-none pr-10"
                  value={autoLock}
                  onChange={(e) => setAutoLock(Number(e.target.value))}
                >
                  <option value={1}>{t("autoLock.m1")}</option>
                  <option value={5}>{t("autoLock.m5")}</option>
                  <option value={15}>{t("autoLock.m15")}</option>
                  <option value={30}>{t("autoLock.m30")}</option>
                  <option value={0}>{t("autoLock.off")}</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400">
                  <ChevronDown />
                </span>
              </div>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button
              className="btn-primary w-full"
              onClick={handlePasswordNext}
              disabled={busy}
            >
              {t("setup.nextPasskey")}
            </button>
            <p className="text-xs text-ink-500 leading-snug">{t("setup.forgetWarn")}</p>
          </div>
        )}

        {stage === "passkey" && (
          <div className="space-y-4">
            <button
              type="button"
              className="btn-primary w-full"
              onClick={handleRegisterPasskey}
              disabled={busy || !isPasskeySupported}
            >
              {t("setup.registerPasskey")}
            </button>
            {!isPasskeySupported && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2">
                {t("setup.passkeyUnsupported")}
              </p>
            )}
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={async () => {
                await abortSetup();
                setStage("password");
                setError(null);
              }}
              disabled={busy}
            >
              {t("setup.back")}
            </button>
          </div>
        )}

        {stage === "backup-totp" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-ink-50 border border-ink-200">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="TOTP QR"
                  width={200}
                  height={200}
                  className="rounded-md bg-white p-2 max-w-full h-auto w-[min(100%,200px)]"
                />
              ) : (
                <div className="w-[200px] h-[200px] bg-white rounded-md animate-pulse" />
              )}
              <div className="w-full">
                <label className="label">{t("setup.secretKey")}</label>
                <input
                  className="input font-mono text-xs select-all"
                  readOnly
                  value={totpSecret}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  className="text-xs text-accent-600 hover:underline mt-1 font-medium"
                  onClick={() => {
                    void copyTextForClipboard(totpSecret).then(() => {
                      setTotpCopyDone(true);
                      window.setTimeout(() => setTotpCopyDone(false), 2500);
                    });
                  }}
                >
                  {totpCopyDone
                    ? t("setup.copyTotpSecretDone")
                    : t("setup.copyTotpSecret")}
                </button>
                <p className="text-xs text-ink-500 mt-2 leading-snug">
                  {t("setup.totpAuthenticatorHint")}
                </p>
              </div>
            </div>
            <div>
              <label className="label">{t("setup.totpCode")}</label>
              <input
                className="input font-mono tracking-widest text-center text-lg"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                autoFocus
              />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button
              className="btn-primary w-full"
              onClick={handleConfirmTotp}
              disabled={busy || code.length !== 6}
            >
              {t("setup.nextRecovery")}
            </button>
          </div>
        )}

        {stage === "recovery" && (
          <div className="space-y-4">
            <ul className="font-mono text-sm bg-ink-50 border border-ink-200 rounded-lg p-3 space-y-1 list-none">
              {recoveryCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <label className="flex items-start gap-2 text-sm text-ink-700 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={recoveryAck}
                onChange={(e) => setRecoveryAck(e.target.checked)}
              />
              <span>{t("setup.recoveryAck")}</span>
            </label>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button
              className="btn-primary w-full"
              onClick={handleFinish}
              disabled={busy || !recoveryAck}
            >
              <Check /> {t("setup.confirmStart")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}