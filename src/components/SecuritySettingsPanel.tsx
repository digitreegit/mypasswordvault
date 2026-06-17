import React, { useEffect, useState } from "react";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { isAuthV2 } from "../lib/authV2";
import { isAppError } from "../lib/errors";
import {
  isLegacyPasskeyWebAuthnName,
  passkeyRegisteredForCurrentSite,
} from "../lib/passkey";
import {
  getSettingsPasskeyAddOptions,
  type SettingsPasskeyAddOption,
} from "../lib/passkeyMethods";
import { isIpLiteralHost } from "../lib/siteOrigin";
import {
  copyTextForClipboard,
  otpauthQrDataUrl,
  TOTP_BACKUP_ACCOUNT,
} from "../lib/totp";
import { downloadTextFile } from "../lib/downloadTextFile";
import { isNativeApp } from "../lib/platform";
import { useVault } from "../lib/vault";
import { Check, Copy, Download } from "./Icons";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

function formatError(e: unknown, t: TFn): string {
  if (isAppError(e)) {
    const vars =
      e.code === "errors.passkeyInvalidState" &&
      typeof window !== "undefined"
        ? { host: window.location.hostname }
        : undefined;
    const msg = t(e.code, vars);
    if (import.meta.env.DEV && e.detail) {
      return `${msg} (${e.detail})`;
    }
    return msg;
  }
  return (e as Error)?.message ?? t("setup.errGeneric");
}

function isPasskeyLinked(pk: { prfVerified?: boolean }): boolean {
  return pk.prfVerified !== false;
}

function formatPasskeyDate(ts: number, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

function ConfiguredBadge({
  label,
  variant = "ok",
}: {
  label: string;
  variant?: "ok" | "alert";
}) {
  const isAlert = variant === "alert";
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 ${
        isAlert
          ? "border-red-200 bg-red-50"
          : "border-sky-200 bg-sky-50"
      }`}
    >
      {isAlert ? (
        <ExclamationTriangleIcon
          className="h-4 w-4 shrink-0 text-red-600"
          aria-hidden
        />
      ) : (
        <CheckIcon className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
      )}
      <span
        className={`text-sm font-medium ${
          isAlert ? "text-red-900" : "text-sky-900"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

const PASSKEY_ROW_ICON_SLOT =
  "flex h-8 w-8 shrink-0 items-center justify-center";

function passkeyAddOptionTitle(
  option: SettingsPasskeyAddOption,
  t: TFn,
): string {
  const base = t(option.labelKey);
  if (option.id === "platform") return base;
  return `${base} ${t("common.optional")}`;
}

function PasskeyAddOptionBox({
  title,
  subtitle,
  busy,
  onClick,
}: {
  title: string;
  subtitle?: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="w-full rounded-lg border border-ink-200 bg-white px-4 py-3.5 flex items-start justify-start gap-3 text-left transition-colors hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={busy}
      onClick={onClick}
    >
      <span className={`${PASSKEY_ROW_ICON_SLOT} text-ink-500`} aria-hidden>
        <PlusIcon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-ink-600 leading-snug">{subtitle}</p>
        ) : null}
      </div>
    </button>
  );
}

function SecuritySection({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5 sm:p-6 space-y-3">
      <h3 className="settings-card-title text-sm font-semibold text-ink-800">{title}</h3>
      <p className="settings-card-hint text-xs text-ink-600 leading-snug">{hint}</p>
      {children}
    </div>
  );
}

function SecurityCtaRow({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-t border-ink-100 pt-3">
      <button
        type="button"
        className="inline-flex items-center gap-1 py-0.5 text-[1rem] leading-normal font-medium text-sky-600 hover:text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 rounded-md"
        disabled={disabled}
        onClick={onClick}
      >
        <PlusCircleIcon
          className="h-4 w-4 shrink-0 text-sky-500"
          aria-hidden
        />
        <span>{label}</span>
      </button>
    </div>
  );
}

export function SecuritySettingsPanel() {
  const {
    meta,
    isPasskeySupported,
    addPasskey,
    completePasskeyPrf,
    passkeyWebAuthnLabelNeedsRefresh,
    passkeyIdentityEmail,
    locale,
    t,
    backupTotpEnabled,
    recoveryCodesRemaining,
    beginBackupTotpSettings,
    confirmBackupTotpSettings,
    cancelBackupTotpSettings,
    regenerateRecoveryCodes,
  } = useVault();

  const [totpEnrolling, setTotpEnrolling] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpCopyDone, setTotpCopyDone] = useState(false);
  const [totpBusy, setTotpBusy] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpSuccess, setTotpSuccess] = useState<string | null>(null);

  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [recoveryConfirm, setRecoveryConfirm] = useState(false);
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryCopyDone, setRecoveryCopyDone] = useState(false);

  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeySuccess, setPasskeySuccess] = useState<string | null>(null);
  const [passkeyAddOptions, setPasskeyAddOptions] = useState<
    SettingsPasskeyAddOption[]
  >([]);

  const passkeys = meta?.passkeys ?? [];
  const showPasskeys =
    meta && isAuthV2(meta) && isPasskeySupported && passkeys.length > 0;
  const wrongDomain =
    passkeys.length > 0 && meta ? !passkeyRegisteredForCurrentSite(meta) : false;

  const devIpBlocked =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    isIpLiteralHost(window.location.hostname);
  const localhostAppUrl =
    typeof window !== "undefined"
      ? `http://localhost:${window.location.port || "5173"}/app/`
      : "http://localhost:5173/app/";

  useEffect(() => {
    if (!showPasskeys || devIpBlocked) return;
    let cancelled = false;
    void getSettingsPasskeyAddOptions(passkeys).then((opts) => {
      if (!cancelled) setPasskeyAddOptions(opts);
    });
    return () => {
      cancelled = true;
    };
  }, [showPasskeys, devIpBlocked, passkeys]);

  async function handleAddPasskey(option: SettingsPasskeyAddOption) {
    setPasskeyError(null);
    setPasskeySuccess(null);
    setPasskeyBusy(true);
    try {
      await addPasskey({
        hints: option.hints,
        label: t(option.labelKey),
        kind: "platform",
      });
      setPasskeySuccess(t("settings.passkeysAdded"));
      window.setTimeout(() => setPasskeySuccess(null), 3000);
    } catch (e: unknown) {
      if (isAppError(e) && e.code === "errors.passkeyHybridPrfPending") {
        setPasskeyError(null);
        setPasskeySuccess(t(e.code));
      } else {
        setPasskeyError(formatError(e, t));
      }
    } finally {
      setPasskeyBusy(false);
    }
  }

  async function handleCompletePasskeyPrf(credentialId: string) {
    setPasskeyError(null);
    setPasskeySuccess(null);
    setPasskeyBusy(true);
    try {
      await completePasskeyPrf(credentialId);
      setPasskeySuccess(t("settings.passkeysAdded"));
      window.setTimeout(() => setPasskeySuccess(null), 3000);
    } catch (e: unknown) {
      if (isAppError(e) && e.code === "errors.passkeyHybridPrfPending") {
        setPasskeyError(t(e.code));
      } else {
        setPasskeyError(formatError(e, t));
      }
    } finally {
      setPasskeyBusy(false);
    }
  }

  useEffect(() => {
    if (!totpEnrolling || !totpSecret) {
      setQrUrl(null);
      return;
    }
    let cancelled = false;
    void otpauthQrDataUrl(totpSecret, TOTP_BACKUP_ACCOUNT).then((url) => {
      if (!cancelled) setQrUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [totpEnrolling, totpSecret]);

  async function startTotpEnrollment() {
    setTotpError(null);
    setTotpSuccess(null);
    if (backupTotpEnabled) return;
    setTotpBusy(true);
    try {
      const { totpSecretBase32 } = await beginBackupTotpSettings();
      if (!totpSecretBase32) return;
      setTotpSecret(totpSecretBase32);
      setTotpCode("");
      setTotpEnrolling(true);
    } catch (e: unknown) {
      setTotpError(formatError(e, t));
    } finally {
      setTotpBusy(false);
    }
  }

  function cancelTotpEnrollment() {
    cancelBackupTotpSettings();
    setTotpEnrolling(false);
    setTotpSecret("");
    setTotpCode("");
    setTotpError(null);
  }

  async function confirmTotpEnrollment() {
    setTotpError(null);
    setTotpBusy(true);
    try {
      await confirmBackupTotpSettings(totpCode);
      setTotpEnrolling(false);
      setTotpSecret("");
      setTotpCode("");
      setTotpSuccess(t("settings.securityTotpAdded"));
      setTimeout(() => setTotpSuccess(null), 3000);
    } catch (e: unknown) {
      setTotpError(formatError(e, t));
    } finally {
      setTotpBusy(false);
    }
  }

  async function handleRegenerateRecovery() {
    setRecoveryError(null);
    setRecoveryBusy(true);
    try {
      const { recoveryCodes: codes } = await regenerateRecoveryCodes();
      setRecoveryCodes(codes);
      setRecoveryConfirm(false);
    } catch (e: unknown) {
      setRecoveryError(formatError(e, t));
    } finally {
      setRecoveryBusy(false);
    }
  }

  if (!meta) return null;

  return (
    <div className="space-y-4">
      {showPasskeys ? (
        <SecuritySection
          title={t("settings.securityPasskeysTitle")}
          hint={t("settings.securityPasskeysHint")}
        >
          {devIpBlocked ? (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-3 leading-snug">
              {t("errors.passkeyUseLocalhost")}{" "}
              <a
                href={localhostAppUrl}
                className="font-medium text-accent-700 underline underline-offset-2"
              >
                {localhostAppUrl}
              </a>
            </p>
          ) : null}
          {wrongDomain ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2.5 leading-snug">
              {t("errors.passkeyWrongDomain")}
            </p>
          ) : null}
          {passkeyWebAuthnLabelNeedsRefresh ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3 leading-snug">
              {t("settings.securityPasskeyLegacyHint")}
              {passkeyIdentityEmail ? (
                <span className="mt-1 block font-medium text-amber-900">
                  {passkeyIdentityEmail}
                </span>
              ) : null}
            </p>
          ) : null}
          {passkeyError ? (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2.5">
              {passkeyError}
            </p>
          ) : null}
          {passkeySuccess ? (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md p-2.5">
              {passkeySuccess}
            </p>
          ) : null}
          <ul
            className="space-y-2 list-none p-0 m-0"
            aria-label={t("settings.passkeysListAria")}
          >
            {passkeys.map((pk) => {
              const linked = isPasskeyLinked(pk);
              return (
                <li
                  key={pk.id}
                  className={`flex flex-wrap items-start gap-3 rounded-lg border px-4 py-2.5 text-left ${
                    linked
                      ? "border-sky-200 bg-sky-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <span className={PASSKEY_ROW_ICON_SLOT} aria-hidden>
                    {linked ? (
                      <CheckIcon className="h-4 w-4 text-sky-600" />
                    ) : (
                      <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <p
                      className={`text-sm font-medium truncate ${
                        linked ? "text-sky-900" : "text-amber-900"
                      }`}
                    >
                      {pk.label ?? t("settings.passkeysUnnamed")}
                    </p>
                    {!linked ? (
                      <p className="text-xs text-amber-800 leading-snug">
                        {t("settings.passkeyFinishPrfHint")}
                      </p>
                    ) : passkeyIdentityEmail ? (
                      <p
                        className={`text-xs truncate ${
                          pk.webAuthnName &&
                          !isLegacyPasskeyWebAuthnName(pk.webAuthnName) &&
                          pk.webAuthnName.trim().toLowerCase() !==
                            passkeyIdentityEmail.toLowerCase()
                            ? "text-amber-800"
                            : "text-sky-700"
                        }`}
                      >
                        {passkeyIdentityEmail}
                      </p>
                    ) : pk.webAuthnName &&
                      isLegacyPasskeyWebAuthnName(pk.webAuthnName) ? (
                      <p className="text-xs text-amber-800 truncate">
                        {pk.webAuthnName}
                      </p>
                    ) : pk.webAuthnName ? (
                      <p className="text-xs text-sky-700 truncate">
                        {pk.webAuthnName}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-center">
                    <span
                      className={`text-xs ${
                        linked ? "text-sky-700" : "text-amber-700"
                      }`}
                    >
                      {formatPasskeyDate(pk.createdAt, locale)}
                    </span>
                    {!linked ? (
                      <button
                        type="button"
                        className="btn-secondary text-xs shrink-0 px-2 min-h-0 py-1"
                        disabled={passkeyBusy}
                        onClick={() => void handleCompletePasskeyPrf(pk.id)}
                      >
                        {passkeyBusy
                          ? t("settings.passkeyFinishPrfBusy")
                          : t("settings.passkeyFinishPrf")}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
            {!devIpBlocked
              ? passkeyAddOptions.map((option) => (
                  <li key={option.id} className="list-none">
                    <PasskeyAddOptionBox
                      title={passkeyAddOptionTitle(option, t)}
                      subtitle={
                        option.subtitleKey ? t(option.subtitleKey) : undefined
                      }
                      busy={passkeyBusy}
                      onClick={() => void handleAddPasskey(option)}
                    />
                  </li>
                ))
              : null}
          </ul>
        </SecuritySection>
      ) : null}

      <SecuritySection
        title={t("settings.securityTotpTitle")}
        hint={t("settings.securityTotpHint")}
      >
        {backupTotpEnabled ? (
          <ConfiguredBadge label={t("settings.securityTotpConfigured")} />
        ) : totpEnrolling ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-600 leading-snug">
              {t("setup.backupTotpIntro")}
            </p>
            <div className="flex flex-col items-center gap-3 p-3.5 rounded-lg bg-ink-50 border border-ink-200">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt=""
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
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={totpBusy || totpCode.length !== 6}
                onClick={() => void confirmTotpEnrollment()}
              >
                {totpBusy
                  ? t("settings.securityTotpConfirming")
                  : t("settings.securityTotpConfirm")}
              </button>
              <button
                type="button"
                className="btn-secondary flex-1"
                disabled={totpBusy}
                onClick={cancelTotpEnrollment}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <>
            {isNativeApp() ? (
              <p className="security-totp-skipped-banner text-sm leading-snug">
                {t("settings.securityTotpNotConfigured")}
              </p>
            ) : (
              <p className="settings-card-hint text-sm text-orange-700 leading-snug">
                {t("settings.securityTotpNotConfigured")}
              </p>
            )}
            <SecurityCtaRow
              label={t("settings.securityTotpSetup")}
              disabled={totpBusy}
              onClick={() => void startTotpEnrollment()}
            />
          </>
        )}
        {totpError ? <p className="text-sm text-red-600">{totpError}</p> : null}
        {totpSuccess ? (
          <p className="text-sm text-accent-700">{totpSuccess}</p>
        ) : null}
      </SecuritySection>

      <SecuritySection
        title={t("settings.securityRecoveryTitle")}
        hint={t("settings.securityRecoveryHint")}
      >
        <ConfiguredBadge
          variant={recoveryCodesRemaining === 0 ? "alert" : "ok"}
          label={t("settings.securityRecoveryRemaining", {
            count: recoveryCodesRemaining,
          })}
        />
        <p className="settings-card-hint text-xs text-ink-600 leading-snug">
          {t("settings.securityRecoveryOnceHint")}
        </p>

        {recoveryCodes ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-ink-900">
              {t("setup.recoveryCalloutTitle")}
            </p>
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
                  aria-label={
                    recoveryCopyDone
                      ? t("setup.copyRecoveryCodesDone")
                      : t("setup.copyRecoveryCodes")
                  }
                  onClick={() => {
                    void copyTextForClipboard(recoveryCodes.join("\n")).then(
                      () => {
                        setRecoveryCopyDone(true);
                        window.setTimeout(
                          () => setRecoveryCopyDone(false),
                          2500,
                        );
                      },
                    );
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
                  aria-label={t("setup.downloadRecoveryCodes")}
                  onClick={() => {
                    downloadTextFile(
                      "recovery-codes.txt",
                      recoveryCodes.join("\n"),
                    );
                  }}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => setRecoveryCodes(null)}
            >
              {t("settings.securityRecoveryDismiss")}
            </button>
          </div>
        ) : recoveryConfirm ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-600 leading-snug">
              {t("settings.securityRecoveryRegenerateWarn")}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={recoveryBusy}
                onClick={() => void handleRegenerateRecovery()}
              >
                {recoveryBusy
                  ? t("settings.securityRecoveryRegenerating")
                  : t("settings.securityRecoveryRegenerateConfirm")}
              </button>
              <button
                type="button"
                className="btn-secondary flex-1"
                disabled={recoveryBusy}
                onClick={() => setRecoveryConfirm(false)}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <SecurityCtaRow
            label={t("settings.securityRecoveryRegenerate")}
            disabled={recoveryBusy}
            onClick={() => {
              setRecoveryError(null);
              setRecoveryConfirm(true);
            }}
          />
        )}
        {recoveryError ? (
          <p className="text-sm text-red-600">{recoveryError}</p>
        ) : null}
      </SecuritySection>
    </div>
  );
}
