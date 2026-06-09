import React, { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  EnvelopeIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { ModalCloseButton } from "./ModalCloseButton";
import { AUTH_LAST_METHOD_CHANGED } from "../lib/authLastUsed";
import { getUserSignInMethod, useAuth } from "../lib/auth";
import { isAppError } from "../lib/errors";
import { Eye, EyeOff, GoogleIcon } from "./Icons";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

function ModalShell({
  title,
  onClose,
  closeAriaLabel,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  closeAriaLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40">
      <div
        className="card w-full max-w-md max-h-[min(85dvh,85vh)] overflow-hidden flex flex-col shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
      >
        <div className="action-modal__header px-5 py-4 border-b border-ink-200 flex items-start justify-between gap-2">
          <h2
            id="account-modal-title"
            className="font-sans text-lg font-semibold text-ink-900 tracking-tight"
          >
            {title}
          </h2>
          <ModalCloseButton onClick={onClose} ariaLabel={closeAriaLabel} />
        </div>
        <div className="px-5 py-4 keyboard-scroll-root min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
        {footer ? (
          <div className="action-modal__footer px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  showAria,
  hideAria,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  showAria: string;
  hideAria: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className="input w-full pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          spellCheck={false}
        />
        <button
          type="button"
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-ink-400 hover:text-accent-600"
          onClick={onToggleShow}
          aria-label={show ? hideAria : showAria}
        >
          {show ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </button>
      </div>
    </div>
  );
}

export function AccountCredentialPanel({
  user,
  t,
  onMessage,
}: {
  user: User;
  t: TFn;
  onMessage: (msg: string | null) => void;
}) {
  const { signInWithEmail, updatePassword, updateEmail } = useAuth();
  const [, bumpAuthMethod] = useState(0);

  useEffect(() => {
    const onChange = () => bumpAuthMethod((n) => n + 1);
    window.addEventListener(AUTH_LAST_METHOD_CHANGED, onChange);
    return () => window.removeEventListener(AUTH_LAST_METHOD_CHANGED, onChange);
  }, []);

  const signInMethod = getUserSignInMethod(user);
  const showEmailActions = signInMethod === "email";
  const email = user.email ?? user.id;

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [emailDraft, setEmailDraft] = useState(user.email ?? "");

  function closePasswordModal() {
    setPasswordOpen(false);
    setCurrentPw("");
    setNewPw("");
    setShowCurrentPw(false);
    setShowNewPw(false);
    setError(null);
  }

  function closeEmailModal() {
    setEmailOpen(false);
    setEmailDraft("");
    setError(null);
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user.email) return;
    setError(null);
    if (newPw.length < 6) {
      setError(t("auth.errWeakPassword"));
      return;
    }
    setBusy(true);
    try {
      await signInWithEmail(user.email, currentPw);
      await updatePassword(newPw);
      closePasswordModal();
      onMessage(t("account.passwordUpdated"));
    } catch (err: unknown) {
      setError(
        isAppError(err) ? t(err.code) : (err as Error)?.message ?? t("auth.errInvalidCredentials")
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = emailDraft.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await updateEmail(trimmed);
      closeEmailModal();
      onMessage(t("account.emailUpdated"));
    } catch (err: unknown) {
      setError(
        isAppError(err) ? t(err.code) : (err as Error)?.message ?? t("setup.errGeneric")
      );
    } finally {
      setBusy(false);
    }
  }

  const methodLabel =
    signInMethod === "google"
      ? t("account.signInMethod.google")
      : signInMethod === "email"
        ? t("account.signInMethod.email")
        : t("account.signInMethod.unknown");

  const passwordFormReady =
    currentPw.trim().length > 0 && newPw.trim().length > 0;
  const emailFormReady = emailDraft.trim().length > 0;

  return (
    <>
      <div className="rounded-lg border border-ink-200 bg-white px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {signInMethod === "google" ? (
              <GoogleIcon className="h-5 w-5 shrink-0" />
            ) : (
              <EnvelopeIcon className="h-5 w-5 shrink-0 text-ink-500" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">{methodLabel}</p>
              <p className="text-sm text-ink-500 truncate break-all">{email}</p>
            </div>
          </div>
          {showEmailActions ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="btn-secondary text-sm whitespace-nowrap"
                onClick={() => {
                  setError(null);
                  setPasswordOpen(true);
                }}
              >
                {t("account.passwordTitle")}
              </button>
              <button
                type="button"
                className="btn-secondary h-10 min-w-10 px-0"
                onClick={() => {
                  setError(null);
                  setEmailDraft("");
                  setEmailOpen(true);
                }}
                title={t("settings.updateEmailTooltip")}
                aria-label={t("settings.updateEmailTooltip")}
              >
                <PencilSquareIcon className="h-4 w-4 text-ink-600" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {passwordOpen ? (
        <ModalShell
          title={t("settings.changePasswordTitle")}
          onClose={closePasswordModal}
          closeAriaLabel={t("common.close")}
        >
          <form id="account-change-password" onSubmit={handlePasswordSave} className="space-y-4">
            <p className="text-sm text-ink-600 leading-snug">
              {t("settings.changePasswordSubtitle")}
            </p>
            {error ? (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            ) : null}
            <PasswordInput
              id="account-current-pw"
              label={t("settings.currentPassword")}
              value={currentPw}
              onChange={setCurrentPw}
              show={showCurrentPw}
              onToggleShow={() => setShowCurrentPw((v) => !v)}
              showAria={t("vault.show")}
              hideAria={t("vault.hide")}
              autoComplete="current-password"
            />
            <PasswordInput
              id="account-new-pw"
              label={t("auth.password")}
              value={newPw}
              onChange={setNewPw}
              show={showNewPw}
              onToggleShow={() => setShowNewPw((v) => !v)}
              showAria={t("vault.show")}
              hideAria={t("vault.hide")}
              autoComplete="new-password"
            />
            <hr className="border-ink-200" />
            <button
              type="submit"
              className="btn-primary text-sm w-full"
              disabled={busy || !passwordFormReady}
            >
              {busy ? t("app.loading") : t("auth.saveNewPassword")}
            </button>
          </form>
        </ModalShell>
      ) : null}

      {emailOpen ? (
        <ModalShell
          title={t("settings.updateEmailTitle")}
          onClose={closeEmailModal}
          closeAriaLabel={t("common.close")}
          footer={
            <>
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={closeEmailModal}
                disabled={busy}
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                form="account-update-email"
                className="btn-primary text-sm"
                disabled={busy || !emailFormReady}
              >
                {busy ? t("app.loading") : t("settings.updateEmailConfirm")}
              </button>
            </>
          }
        >
          <form id="account-update-email" onSubmit={handleEmailSave} className="space-y-3">
            {error ? (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            ) : null}
            <div>
              <label className="label" htmlFor="account-new-email">
                {t("settings.updateEmailLabel")}
              </label>
              <input
                id="account-new-email"
                type="email"
                className="input w-full"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                placeholder={t("settings.updateEmailPlaceholder")}
                autoComplete="email"
                required
              />
            </div>
            <p className="text-xs text-ink-500 leading-snug">{t("settings.updateEmailHint")}</p>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}
