import React, { useEffect, useMemo, useState } from "react";
import {
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { CautionNotice } from "./CautionNotice";
import { useVault } from "../lib/vault";
import {
  copyTextForClipboard,
  otpauthQrDataUrl,
  TOTP_BACKUP_ACCOUNT,
} from "../lib/totp";
import { passwordStrengthScore } from "../lib/passwordGenerator";
import { Check, Copy, Download, Eye, EyeOff, ChevronDown } from "./Icons";
import { ScreenHeader } from "./ScreenHeader";
import { AppShell } from "./AppShell";
import { NativePinnedAppShell } from "./NativePinnedAppShell";
import { downloadTextFile } from "../lib/downloadTextFile";
import { isAppError } from "../lib/errors";
import { isNativeApp } from "../lib/platform";
import { PasskeySetupPicker } from "./PasskeySetupPicker";
import type { PasskeyMethodId, PasskeyMethodOption } from "../lib/passkeyMethods";

type Stage = "password" | "passkey" | "backup-totp" | "recovery";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

function formatSetupError(e: unknown, t: TFn): string {
  if (isAppError(e)) {
    const msg = t(e.code);
    if (import.meta.env.DEV && e.detail) {
      return `${msg} (${e.detail})`;
    }
    return msg;
  }
  return (e as Error)?.message ?? t("setup.errGeneric");
}

const SETUP_STEPS: { id: Stage; labelKey: string }[] = [
  { id: "password", labelKey: "setup.stepPassword" },
  { id: "passkey", labelKey: "setup.stepPasskey" },
  { id: "backup-totp", labelKey: "setup.stepBackupTotp" },
  { id: "recovery", labelKey: "setup.stepRecovery" },
];

function SetupStepper({ stage, t }: { stage: Stage; t: TFn }) {
  const currentIdx = SETUP_STEPS.findIndex((s) => s.id === stage);

  return (
    <nav aria-label={t("setup.stepperAria")} className="mb-6">
      <ol className="flex items-start">
        {SETUP_STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const lineDone = i > 0 && i <= currentIdx;
          return (
            <li
              key={step.id}
              className="relative flex flex-1 flex-col items-center min-w-0"
              aria-current={active ? "step" : undefined}
            >
              {i > 0 && (
                <span
                  aria-hidden
                  className={[
                    "absolute top-3 right-1/2 h-px -translate-y-1/2",
                    lineDone ? "bg-ink-300" : "bg-ink-200",
                  ].join(" ")}
                  style={{ width: "calc(100% - 1.5rem)", marginRight: "0.75rem" }}
                />
              )}
              <span
                className={[
                  "relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold transition-colors",
                  active
                    ? "bg-accent-600 text-white ring-2 ring-accent-100"
                    : done
                      ? "bg-ink-100 text-ink-500"
                      : "bg-ink-100 text-ink-400",
                ].join(" ")}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={[
                  "mt-1.5 px-0.5 text-center text-[0.65rem] leading-tight sm:text-xs",
                  active
                    ? "font-semibold text-ink-900"
                    : done
                      ? "font-medium text-ink-500"
                      : "text-ink-400",
                ].join(" ")}
              >
                {t(step.labelKey)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SetupCallout({
  variant,
  title,
  children,
}: {
  variant: "recommend" | "important";
  title?: string;
  children: React.ReactNode;
}) {
  const styles =
    variant === "recommend"
      ? "border-amber-300 bg-amber-50 text-amber-950"
      : "border-blue-200 bg-blue-50 text-blue-950";

  return (
    <div className={`rounded-lg border px-3.5 py-3 text-sm leading-snug ${styles}`}>
      {title && (
        <p className="mb-1 font-semibold flex items-center gap-1.5">
          {variant === "important" && (
            <ShieldCheckIcon className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
          )}
          {title}
        </p>
      )}
      <p className={title ? "text-[0.8125rem] opacity-90" : "font-medium"}>
        {children}
      </p>
    </div>
  );
}

function PasskeyHelpModal({ t, onClose }: { t: TFn; onClose: () => void }) {
  const paragraphs = t("setup.passkeyHelpBody").split("\n\n");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40">
      <div
        className="card w-full max-w-md overflow-hidden flex flex-col shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passkey-help-title"
      >
        <div className="px-5 py-4 border-b border-ink-200 flex items-start justify-between gap-2">
          <h2
            id="passkey-help-title"
            className="font-sans text-lg font-semibold text-ink-900 tracking-tight"
          >
            {t("setup.passkeyHelpTitle")}
          </h2>
          <button
            type="button"
            className="btn-ghost p-1.5 -mr-1 text-ink-500 shrink-0"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <XMarkIcon className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm text-ink-700 leading-relaxed">
          {paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-ink-200 bg-ink-50/80">
          <button type="button" className="btn-primary w-full" onClick={onClose}>
            {t("setup.passkeyHelpGotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SetupScreen() {
  const {
    setup,
    registerPasskeyInSetup,
    beginBackupTotpEnrollment,
    confirmBackupTotpEnrollment,
    skipBackupTotpEnrollment,
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
  const [passkeyHelpOpen, setPasskeyHelpOpen] = useState(false);
  const [registeredPasskeyIds, setRegisteredPasskeyIds] = useState<
    Set<PasskeyMethodId>
  >(new Set());

  const [totpSecret, setTotpSecret] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [recoveryAck, setRecoveryAck] = useState(false);
  const [totpCopyDone, setTotpCopyDone] = useState(false);
  const [recoveryCopyDone, setRecoveryCopyDone] = useState(false);
  const [recoveryDownloadDone, setRecoveryDownloadDone] = useState(false);

  const brandHomeHref = isNativeApp() ? undefined : "/";

  const strengthScore = useMemo(() => passwordStrengthScore(pw), [pw]);

  useEffect(() => {
    if (stage === "backup-totp" && totpSecret) {
      otpauthQrDataUrl(totpSecret, TOTP_BACKUP_ACCOUNT)
        .then(setQrUrl)
        .catch(() => {});
      setTotpCopyDone(false);
    }
  }, [stage, totpSecret]);

  const pageTitle = useMemo((): React.ReactNode => {
    switch (stage) {
      case "password":
        return t("setup.pageTitle");
      case "passkey":
        return (
          <span className="inline-flex items-center gap-1.5">
            {t("setup.pageTitlePasskey")}
            <button
              type="button"
              className="inline-flex shrink-0 p-0.5 rounded-md text-accent-600 hover:text-accent-700 hover:bg-accent-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40"
              onClick={() => setPasskeyHelpOpen(true)}
              aria-label={t("setup.passkeyHelpTitle")}
              title={t("setup.passkeyHelpTitle")}
            >
              <QuestionMarkCircleIcon className="h-5 w-5" aria-hidden />
            </button>
          </span>
        );
      case "backup-totp":
        return t("setup.pageTitleBackupTotp");
      case "recovery":
        return t("setup.pageTitleRecovery");
    }
  }, [stage, t]);

  const stageIntro = useMemo(() => {
    switch (stage) {
      case "password":
        return t("setup.subtitle");
      case "passkey":
        return t("setup.passkeyIntro");
      case "backup-totp":
        return t("setup.backupTotpIntro");
      case "recovery":
        return t("setup.recoveryIntro");
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
      setError(formatSetupError(e, t));
    } finally {
      setBusy(false);
    }
  }

  async function handlePasskeyContinue(toRegister: PasskeyMethodOption[]) {
    setError(null);
    if (!isPasskeySupported) {
      setError(t("errors.passkeyNotSupported"));
      return;
    }
    setBusy(true);
    const completed = new Set(registeredPasskeyIds);
    try {
      for (const method of toRegister) {
        await registerPasskeyInSetup({
          hints: method.hints ?? ["client-device"],
          label: t(method.labelKey),
        });
        completed.add(method.id);
        setRegisteredPasskeyIds(new Set(completed));
      }
      if (completed.size === 0) {
        setError(t("errors.passkeyRequired"));
        return;
      }
      const { totpSecretBase32 } = await beginBackupTotpEnrollment();
      setTotpSecret(totpSecretBase32);
      setStage("backup-totp");
    } catch (e: unknown) {
      setError(formatSetupError(e, t));
    } finally {
      setBusy(false);
    }
  }

  async function handleSkipTotp() {
    setError(null);
    setBusy(true);
    try {
      const { recoveryCodes: codes } = await skipBackupTotpEnrollment();
      setRecoveryCodes(codes);
      setStage("recovery");
    } catch (e: unknown) {
      setError(formatSetupError(e, t));
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
      setError(formatSetupError(e, t));
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
      setError(formatSetupError(e, t));
    } finally {
      setBusy(false);
    }
  }

  const setupHeader = (
    <ScreenHeader
      brandName={t("app.brandName")}
      pageTitle={pageTitle}
      hideTitle
      locale={locale}
      onLocaleChange={(l) => void setLocale(l)}
      languageAriaLabel={t("settings.language")}
      brandHomeHref={brandHomeHref}
      brandHomeAriaLabel={brandHomeHref ? t("auth.brandHomeAria") : undefined}
      beforeTitle={
        <div>
          <div
            className="-mx-5 sm:-mx-8 h-px bg-ink-200"
            role="presentation"
          />
          <div className="pt-4">
            <SetupStepper stage={stage} t={t} />
          </div>
        </div>
      }
      className="mb-0"
    />
  );

  const setupBody = (
    <>
      <div className="setup-shell-intro mb-5 space-y-1">
        <h1 className="font-sans text-xl font-semibold text-ink-900 tracking-tight">
          {pageTitle}
        </h1>
        <p className="text-sm text-ink-500 leading-snug">{stageIntro}</p>
      </div>
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
            <CautionNotice showIcon>{t("setup.forgetWarn")}</CautionNotice>
          </div>
        )}

        {stage === "passkey" && (
          <PasskeySetupPicker
            t={t}
            busy={busy}
            error={error}
            registeredIds={registeredPasskeyIds}
            unsupported={!isPasskeySupported}
            onContinue={handlePasskeyContinue}
            onBack={async () => {
              await abortSetup();
              setStage("password");
              setError(null);
              setRegisteredPasskeyIds(new Set());
            }}
          />
        )}

        {stage === "backup-totp" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 p-3.5 rounded-lg bg-ink-50 border border-ink-200">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="TOTP QR"
                  width={160}
                  height={160}
                  className="rounded-md bg-white p-2 max-w-full h-auto w-[min(100%,160px)]"
                />
              ) : (
                <div className="w-[160px] h-[160px] bg-white rounded-md animate-pulse" />
              )}
              <div className="w-full">
                <label className="label">{t("setup.secretKey")}</label>
                <div className="flex min-h-[2.375rem] items-center rounded-md border border-ink-200 bg-white pr-1">
                  <input
                    className="input min-w-0 flex-1 border-0 bg-transparent py-2 pl-3 pr-2 font-mono text-xs shadow-none select-all focus:ring-0"
                    readOnly
                    value={totpSecret}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
                    aria-label={
                      totpCopyDone
                        ? t("setup.copyTotpSecretDone")
                        : t("setup.copyTotpSecret")
                    }
                    title={
                      totpCopyDone
                        ? t("setup.copyTotpSecretDone")
                        : t("setup.copyTotpSecret")
                    }
                    onClick={() => {
                      void copyTextForClipboard(totpSecret).then(() => {
                        setTotpCopyDone(true);
                        window.setTimeout(() => setTotpCopyDone(false), 2500);
                      });
                    }}
                  >
                    {totpCopyDone ? (
                      <Check className="h-4 w-4 text-accent-600" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
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
            <div className="space-y-3">
              <button
                type="button"
                className="btn-secondary w-full text-sm"
                onClick={handleSkipTotp}
                disabled={busy}
              >
                {t("setup.skipBackupTotp")}
              </button>
              <CautionNotice showIcon>{t("setup.backupTotpRecommend")}</CautionNotice>
            </div>
          </div>
        )}

        {stage === "recovery" && (
          <div className="space-y-4">
            <SetupCallout
              variant="important"
              title={t("setup.recoveryCalloutTitle")}
            >
              {t("setup.recoveryCalloutBody")}
            </SetupCallout>
            <div className="relative">
              <ul className="font-mono text-sm bg-ink-50 border border-ink-200 rounded-lg p-3 pr-[4.5rem] space-y-1 list-none">
                {recoveryCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <div className="absolute right-2 top-2 flex items-center gap-0.5">
                <button
                  type="button"
                  className="p-2 rounded-md text-ink-400 hover:text-accent-600 hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30"
                  title={
                    recoveryCopyDone
                      ? t("setup.copyRecoveryCodesDone")
                      : t("setup.copyRecoveryCodes")
                  }
                  aria-label={
                    recoveryCopyDone
                      ? t("setup.copyRecoveryCodesDone")
                      : t("setup.copyRecoveryCodes")
                  }
                  onClick={() => {
                    void copyTextForClipboard(recoveryCodes.join("\n")).then(() => {
                      setRecoveryCopyDone(true);
                      window.setTimeout(() => setRecoveryCopyDone(false), 2500);
                    });
                  }}
                >
                  {recoveryCopyDone ? (
                    <Check className="w-4 h-4 text-accent-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  className="p-2 rounded-md text-ink-400 hover:text-accent-600 hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30"
                  title={
                    recoveryDownloadDone
                      ? t("setup.downloadRecoveryCodesDone")
                      : t("setup.downloadRecoveryCodes")
                  }
                  aria-label={
                    recoveryDownloadDone
                      ? t("setup.downloadRecoveryCodesDone")
                      : t("setup.downloadRecoveryCodes")
                  }
                  onClick={() => {
                    downloadTextFile(
                      "my-password-vault-recovery-codes.txt",
                      recoveryCodes.join("\n")
                    );
                    setRecoveryDownloadDone(true);
                    window.setTimeout(() => setRecoveryDownloadDone(false), 2500);
                  }}
                >
                  {recoveryDownloadDone ? (
                    <Check className="w-4 h-4 text-accent-600" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <label className="flex items-start gap-2.5 text-sm text-ink-700 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
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

    </>
  );

  const passkeyHelp = passkeyHelpOpen ? (
    <PasskeyHelpModal t={t} onClose={() => setPasskeyHelpOpen(false)} />
  ) : null;

  if (isNativeApp()) {
    return (
      <>
        <NativePinnedAppShell header={setupHeader} remeasureKey={stage}>
          {setupBody}
        </NativePinnedAppShell>
        {passkeyHelp}
      </>
    );
  }

  return (
    <>
      <AppShell wide>
        {setupHeader}
        {setupBody}
      </AppShell>
      {passkeyHelp}
    </>
  );
}
