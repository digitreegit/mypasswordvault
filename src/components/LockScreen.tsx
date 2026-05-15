import React, { useEffect, useState } from "react";
import { useVault } from "../lib/vault";
import { Shield, Lock, Check } from "./Icons";
import { LanguageMenu } from "./LanguageMenu";
import { isAppError } from "../lib/errors";
import { otpauthQrDataUrl, otpauthUri } from "../lib/totp";

type RebindStage = "master" | "totp";

export function LockScreen() {
  const {
    unlock,
    resetVault,
    locale,
    setLocale,
    pullVaultFromCloud,
    needsTotpRebindAfterCloudPull,
    dismissTotpRebindAfterCloudPull,
    beginTotpRebindAfterCloudPull,
    confirmTotpRebindAfterCloudPull,
    abortTotpRebindProgress,
    t,
  } = useVault();
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const [pullBusy, setPullBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const [rebindStage, setRebindStage] = useState<RebindStage>("master");
  const [rebindPw, setRebindPw] = useState("");
  const [rebindTotpSecret, setRebindTotpSecret] = useState("");
  const [rebindCode, setRebindCode] = useState("");
  const [rebindQrUrl, setRebindQrUrl] = useState("");
  const [rebindBusy, setRebindBusy] = useState(false);

  useEffect(() => {
    if (needsTotpRebindAfterCloudPull) {
      setRebindStage("master");
      setRebindPw("");
      setRebindTotpSecret("");
      setRebindCode("");
      setRebindQrUrl("");
      setError(null);
    }
  }, [needsTotpRebindAfterCloudPull]);

  useEffect(() => {
    if (rebindStage === "totp" && rebindTotpSecret) {
      void otpauthQrDataUrl(rebindTotpSecret, "vault")
        .then(setRebindQrUrl)
        .catch(() => {});
    }
  }, [rebindStage, rebindTotpSecret]);

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

  async function handlePullCloud() {
    setSyncMsg(null);
    setError(null);
    setPullBusy(true);
    try {
      await pullVaultFromCloud();
      setSyncMsg(t("lock.pullCloudDone"));
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("lock.errFailed")
      );
    } finally {
      setPullBusy(false);
    }
  }

  async function handleRebindMasterContinue() {
    setError(null);
    setRebindBusy(true);
    try {
      const { totpSecretBase32 } = await beginTotpRebindAfterCloudPull(rebindPw);
      setRebindTotpSecret(totpSecretBase32);
      setRebindStage("totp");
      setRebindCode("");
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("lock.errFailed")
      );
    } finally {
      setRebindBusy(false);
    }
  }

  async function handleRebindTotpConfirm() {
    setError(null);
    setRebindBusy(true);
    try {
      await confirmTotpRebindAfterCloudPull(rebindCode);
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("lock.errFailed")
      );
    } finally {
      setRebindBusy(false);
    }
  }

  if (needsTotpRebindAfterCloudPull) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-ink-50 to-ink-100">
        <div className="card w-full max-w-md p-5 sm:p-8 space-y-4">
          <div className="flex justify-end">
            <LanguageMenu
              value={locale}
              onChange={(l) => void setLocale(l)}
              ariaLabel={t("settings.language")}
            />
          </div>
          <div className="flex items-center gap-2">
            <Shield className="text-accent-500 w-8" />
            <h1 className="text-xl font-semibold">{t("lock.rebindTitle")}</h1>
          </div>
          {syncMsg && (
            <p className="text-xs text-ink-700 bg-ink-50 border border-ink-200 rounded-md p-2">
              {syncMsg}
            </p>
          )}

          {rebindStage === "master" && (
            <div className="space-y-4">
              <p className="text-sm text-ink-600 leading-relaxed">
                {t("lock.rebindSubtitleMaster")}
              </p>
              <div>
                <label className="label">{t("lock.masterPw")}</label>
                <input
                  type="password"
                  className="input"
                  value={rebindPw}
                  onChange={(e) => setRebindPw(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <button
                type="button"
                className="btn-primary w-full"
                disabled={rebindBusy || !rebindPw}
                onClick={() => void handleRebindMasterContinue()}
              >
                {rebindBusy ? t("app.loading") : t("lock.rebindContinue")}
              </button>
              <button
                type="button"
                className="btn-secondary text-sm w-full"
                disabled={rebindBusy}
                onClick={() => {
                  dismissTotpRebindAfterCloudPull();
                  setSyncMsg(null);
                  setError(null);
                }}
              >
                {t("lock.rebindUseOldTotp")}
              </button>
            </div>
          )}

          {rebindStage === "totp" && (
            <div className="space-y-4">
              <p className="text-sm text-ink-700">{t("lock.rebind2faIntro")}</p>
              <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-ink-50 border border-ink-200">
                {rebindQrUrl ? (
                  <img
                    src={rebindQrUrl}
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
                    value={rebindTotpSecret}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <a
                    className="text-xs text-accent-600 hover:underline mt-1 inline-block break-all"
                    href={otpauthUri(rebindTotpSecret, "vault")}
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
                  value={rebindCode}
                  onChange={(e) =>
                    setRebindCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  autoFocus
                />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  disabled={rebindBusy}
                  onClick={() => {
                    abortTotpRebindProgress();
                    setRebindStage("master");
                    setRebindCode("");
                    setError(null);
                  }}
                >
                  {t("setup.back")}
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1"
                  disabled={rebindBusy || rebindCode.length !== 6}
                  onClick={() => void handleRebindTotpConfirm()}
                >
                  <Check /> {t("lock.rebindConfirm")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-ink-50 to-ink-100">
      <div className="card w-full max-w-md p-5 sm:p-8 space-y-4">
        <div className="flex justify-end">
          <LanguageMenu
            value={locale}
            onChange={(l) => void setLocale(l)}
            ariaLabel={t("settings.language")}
          />
        </div>

        <div className="flex items-center gap-2">
          <Shield className="text-accent-500 w-8" />
          <h1 className="text-xl font-semibold">{t("lock.title")}</h1>
        </div>
        <p className="text-sm text-ink-500">{t("lock.subtitle")}</p>

        <form onSubmit={handle} className="space-y-4">
          <div>
            <label className="label">{t("lock.masterPw")}</label>
            <input
              type="password"
              className="input"
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
          {syncMsg && (
            <p className="text-xs text-ink-700 bg-ink-50 border border-ink-200 rounded-md p-2">
              {syncMsg}
            </p>
          )}
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

        <details className="pt-2 border-t border-ink-100 text-sm group">
          <summary className="cursor-pointer text-xs font-medium text-ink-600 hover:text-ink-800 list-none flex items-center gap-1 [&::-webkit-details-marker]:hidden">
            <span className="text-ink-400 group-open:rotate-90 transition-transform inline-block">
              ▸
            </span>
            {t("lock.syncTitle")}
          </summary>
          <div className="mt-3 space-y-2 pl-1">
            <p className="text-xs text-ink-600 leading-relaxed">{t("lock.pullCloudHint")}</p>
            <button
              type="button"
              className="btn-secondary text-sm w-full"
              onClick={() => void handlePullCloud()}
              disabled={pullBusy}
            >
              {pullBusy ? t("app.loading") : t("lock.pullCloud")}
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
