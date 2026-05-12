import React, { useEffect, useMemo, useRef, useState } from "react";
import { useVault } from "../lib/vault";
import { otpauthQrDataUrl, otpauthUri } from "../lib/totp";
import { passwordStrengthScore } from "../lib/passwordGenerator";
import { Shield, Check } from "./Icons";
import { LanguageMenu } from "./LanguageMenu";
import { isAppError } from "../lib/errors";

type Stage = "password" | "enroll-2fa";

export function SetupScreen() {
  const {
    setup,
    confirmTotpEnrollment,
    abortSetup,
    locale,
    setLocale,
    importBackup,
    t,
  } = useVault();
  const [stage, setStage] = useState<Stage>("password");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [autoLock, setAutoLock] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [totpSecret, setTotpSecret] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [code, setCode] = useState("");

  const setupFileRef = useRef<HTMLInputElement>(null);
  const [restoreDraft, setRestoreDraft] = useState<string | null>(null);
  const [restoreBusy, setRestoreBusy] = useState(false);

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

  async function applyRestore() {
    if (!restoreDraft) return;
    setRestoreBusy(true);
    setError(null);
    try {
      await importBackup(restoreDraft);
      setRestoreDraft(null);
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setRestoreBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-ink-50 to-ink-100">
      <div className="card w-full max-w-md p-8">
        <div className="flex justify-end mb-2">
          <LanguageMenu
            value={locale}
            onChange={(l) => void setLocale(l)}
            ariaLabel={t("settings.language")}
          />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="text-accent-600" />
          <h1 className="text-xl font-semibold">{t("setup.title")}</h1>
        </div>
        <p className="text-sm text-ink-500 mb-6">{t("setup.subtitle")}</p>

        {stage === "password" && (
          <div className="space-y-4">
            <div>
              <label className="label">{t("setup.masterPw")}</label>
              <input
                type="password"
                className="input font-mono"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder={t("setup.placeholderMin")}
                autoFocus
              />
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
              <input
                type="password"
                className="input font-mono"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
              />
            </div>
            <div>
              <label className="label">{t("setup.autoLock")}</label>
              <select
                className="input"
                value={autoLock}
                onChange={(e) => setAutoLock(Number(e.target.value))}
              >
                <option value={1}>{t("autoLock.m1")}</option>
                <option value={5}>{t("autoLock.m5")}</option>
                <option value={15}>{t("autoLock.m15")}</option>
                <option value={30}>{t("autoLock.m30")}</option>
                <option value={0}>{t("autoLock.off")}</option>
              </select>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button
              className="btn-primary w-full"
              onClick={handleCreate}
              disabled={busy}
            >
              {t("setup.next2fa")}
            </button>
            <p className="text-xs text-ink-500">{t("setup.forgetWarn")}</p>
          </div>
        )}

        {stage === "enroll-2fa" && (
          <div className="space-y-4">
            <p className="text-sm text-ink-700">{t("setup.2faIntro")}</p>
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-ink-50 border border-ink-200">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="TOTP QR"
                  width={200}
                  height={200}
                  className="rounded-md bg-white p-2"
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

        <div className="mt-6 pt-4 border-t border-ink-100 space-y-2">
          <p className="text-xs font-medium text-ink-700">{t("lock.syncTitle")}</p>
          <input
            ref={setupFileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                setRestoreDraft(await f.text());
              } catch {
                setError(t("settings.copyBackupFail"));
              }
            }}
          />
          <button
            type="button"
            className="btn-secondary text-sm w-full"
            onClick={() => setupFileRef.current?.click()}
            disabled={restoreBusy || busy}
          >
            {t("setup.restoreBackup")}
          </button>
          {restoreDraft && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm space-y-2">
              <p className="text-amber-900">{t("setup.restoreConfirm")}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary text-xs flex-1"
                  onClick={() => setRestoreDraft(null)}
                  disabled={restoreBusy}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  className="btn-primary text-xs flex-1 bg-amber-700 hover:bg-amber-800"
                  onClick={() => void applyRestore()}
                  disabled={restoreBusy}
                >
                  {t("setup.restoreApply")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
