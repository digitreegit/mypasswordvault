import React, { useEffect, useMemo, useState } from "react";
import { useVault } from "../lib/vault";
import { otpauthQrDataUrl, otpauthUri } from "../lib/totp";
import { passwordStrengthScore } from "../lib/passwordGenerator";
import { Check, Eye, EyeOff, ChevronDown } from "./Icons";
import { ScreenHeader } from "./ScreenHeader";
import { isAppError } from "../lib/errors";

type Stage = "password" | "enroll-2fa";

export function SetupScreen() {
  const { setup, confirmTotpEnrollment, abortSetup, locale, setLocale, t } =
    useVault();
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

  const strengthScore = useMemo(() => passwordStrengthScore(pw), [pw]);

  useEffect(() => {
    if (stage === "enroll-2fa" && totpSecret) {
      otpauthQrDataUrl(totpSecret, "vault").then(setQrUrl).catch(() => {});
    }
  }, [stage, totpSecret]);

  async function handleCreate() {
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
      const { totpSecretBase32 } = await setup(pw, autoLock);
      setTotpSecret(totpSecretBase32);
      setStage("enroll-2fa");
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    setError(null);
    setBusy(true);
    try {
      await confirmTotpEnrollment(code);
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
          pageTitle={
            stage === "password" ? t("setup.pageTitle") : t("setup.pageTitle2fa")
          }
          locale={locale}
          onLocaleChange={(l) => void setLocale(l)}
          languageAriaLabel={t("settings.language")}
          className="mb-1"
        />
        <p className="text-sm text-ink-500 mb-6 leading-snug">{t("setup.subtitle")}</p>

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
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-ink-400 hover:text-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30"
                  onClick={() => setShowMasterPw((v) => !v)}
                  title={showMasterPw ? t("vault.hide") : t("vault.show")}
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
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-ink-400 hover:text-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  title={showConfirmPw ? t("vault.hide") : t("vault.show")}
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
                <span
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400"
                  aria-hidden
                >
                  <ChevronDown />
                </span>
              </div>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button
              className="btn-primary w-full"
              onClick={handleCreate}
              disabled={busy}
            >
              {t("setup.next2fa")}
            </button>
            <p className="text-xs text-ink-500 leading-snug">{t("setup.forgetWarn")}</p>
          </div>
        )}

        {stage === "enroll-2fa" && (
          <div className="space-y-4">
            <p className="text-sm text-ink-700 leading-snug">{t("setup.2faIntro")}</p>
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
                <a
                  className="text-xs text-accent-600 hover:underline mt-1 inline-block break-all"
                  href={otpauthUri(totpSecret, "vault")}
                >
                  {t("setup.openOtpauth")}
                </a>
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
            <div className="flex gap-2">
              <button
                className="btn-secondary flex-1"
                onClick={async () => {
                  await abortSetup();
                  setStage("password");
                  setCode("");
                  setError(null);
                }}
                disabled={busy}
              >
                {t("setup.back")}
              </button>
              <button
                className="btn-primary flex-1"
                onClick={handleConfirm}
                disabled={busy || code.length !== 6}
              >
                <Check /> {t("setup.confirmStart")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
