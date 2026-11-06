import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth";
import { useVault } from "../lib/vault";
import {
  dismissCrossSignInBanner,
  dismissRelayWarn,
  isAppleRelayOrphanAccount,
  missingCrossPlatformProviders,
  shouldHintRelayVaultWithData,
  shouldShowAlreadyHaveVaultPrompt,
  shouldWarnEmptyRelayVault,
  userHasAppleIdentity,
  userHasEmailIdentity,
  userHasGoogleIdentity,
} from "../lib/appleRelayAccount";
import {
  clearAbandonedEmptyAuthUser,
  readAbandonedEmptyAuthUser,
  rememberAbandonedEmptyAuthUser,
} from "../lib/abandonedAuthUser";
import {
  clearPendingEmailAttach,
  readPendingEmailAttach,
  savePendingEmailAttach,
} from "../lib/pendingEmailAttach";
import { getNativePlatform } from "../lib/platform";
import { isAppError } from "../lib/errors";

/**
 * Low-friction continuity. Critical path: Apple Hide My Email vault ↔ web email signup
 * becomes one user_id without asking the user to understand linking.
 */
export function AccountContinuityBanner() {
  const {
    user,
    signOut,
    linkAppleIdentity,
    linkGoogleIdentity,
    attachPendingEmailIdentity,
    signInWithApple,
    signInWithGoogle,
    emailIdentityLinked,
  } = useAuth();
  const { status, entries, t } = useVault();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [emailPw, setEmailPw] = useState("");
  const [emailStep, setEmailStep] = useState<"ask" | "password">("ask");
  const [, bump] = useState(0);
  const autoEmailTried = useRef(false);

  const entryCount = entries.length;
  const hasVaultData = status === "unlocked" && entryCount > 0;
  const pendingEmail = readPendingEmailAttach();

  // After Apple (or other) vault opens, silently attach the empty email signup.
  useEffect(() => {
    if (!user || status === "loading" || autoEmailTried.current) return;
    const pending = readPendingEmailAttach();
    if (!pending || pending.emptyUserId === user.id) return;
    if (userHasEmailIdentity(user)) {
      clearPendingEmailAttach();
      clearAbandonedEmptyAuthUser();
      return;
    }
    autoEmailTried.current = true;
    setBusy(true);
    void (async () => {
      try {
        await attachPendingEmailIdentity();
        setDoneMsg(t("continuity.linkEmailDone"));
        bump((n) => n + 1);
      } catch (e: unknown) {
        autoEmailTried.current = false;
        setError(
          isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("auth.errGeneric"),
        );
        bump((n) => n + 1);
      } finally {
        setBusy(false);
      }
    })();
  }, [user, status, attachPendingEmailIdentity, t]);

  useEffect(() => {
    if (!user || !hasVaultData) return;
    const abandoned = readAbandonedEmptyAuthUser();
    if (!abandoned) return;
    const missing = missingCrossPlatformProviders(user);
    if (
      (abandoned.provider === "google" && missing.needGoogle) ||
      (abandoned.provider === "apple" && missing.needApple)
    ) {
      bump((n) => n + 1);
    }
  }, [user, hasVaultData]);

  if (!user || status === "loading") return null;

  const showEmptyRelay = shouldWarnEmptyRelayVault(user, {
    vaultStatus: status,
    entryCount,
  });
  const showRelayData =
    status === "unlocked" &&
    shouldHintRelayVaultWithData(user, { vaultStatus: "unlocked", entryCount });
  const showAlreadyHave = shouldShowAlreadyHaveVaultPrompt(user, {
    vaultStatus: status,
    entryCount,
  });
  const missing = missingCrossPlatformProviders(user);
  const abandoned = readAbandonedEmptyAuthUser();
  const showOAuthAttach =
    hasVaultData &&
    abandoned &&
    ((abandoned.provider === "google" && missing.needGoogle) ||
      (abandoned.provider === "apple" && missing.needApple));

  const showEmailAttachRetry =
    Boolean(pendingEmail) &&
    pendingEmail!.emptyUserId !== user.id &&
    !emailIdentityLinked &&
    Boolean(error);

  const soleEmail =
    userHasEmailIdentity(user) &&
    !userHasGoogleIdentity(user) &&
    !userHasAppleIdentity(user);

  const showAddMethods =
    !showEmptyRelay &&
    !showAlreadyHave &&
    !showOAuthAttach &&
    !showEmailAttachRetry &&
    (status === "unlocked" || status === "fresh") &&
    (missing.needGoogle || missing.needApple) &&
    (isAppleRelayOrphanAccount(user) ||
      (userHasGoogleIdentity(user) && missing.needApple) ||
      (userHasAppleIdentity(user) && missing.needGoogle));

  if (
    !showEmptyRelay &&
    !showRelayData &&
    !showAlreadyHave &&
    !showAddMethods &&
    !showOAuthAttach &&
    !showEmailAttachRetry &&
    !doneMsg
  ) {
    return null;
  }

  async function openOtherVault(target: "apple" | "google") {
    if (!user) return;
    setBusy(true);
    setError(null);
    const leaving = userHasAppleIdentity(user)
      ? "apple"
      : userHasGoogleIdentity(user)
        ? "google"
        : "email";
    try {
      rememberAbandonedEmptyAuthUser(
        user.id,
        leaving,
        leaving === "email" ? user.email ?? undefined : undefined,
      );
      await signOut();
      if (target === "apple") await signInWithApple();
      else await signInWithGoogle();
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("auth.errGeneric"),
      );
      setBusy(false);
    }
  }

  /** Empty email → confirm password once → Apple vault → auto-attach same email. */
  async function openIphoneVaultFromEmail() {
    if (!user?.email) return;
    if (emailPw.length < 6) {
      setError(t("continuity.errEmailAttachNeedPassword"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      rememberAbandonedEmptyAuthUser(user.id, "email", user.email);
      savePendingEmailAttach({
        emptyUserId: user.id,
        email: user.email,
        password: emailPw,
      });
      await signOut();
      await signInWithApple();
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("auth.errGeneric"),
      );
      setBusy(false);
    }
  }

  async function onLink(provider: "apple" | "google") {
    setBusy(true);
    setError(null);
    setDoneMsg(null);
    try {
      if (provider === "apple") await linkAppleIdentity();
      else await linkGoogleIdentity();
      setDoneMsg(
        provider === "apple"
          ? t("continuity.linkAppleDone")
          : t("continuity.linkGoogleDone"),
      );
      bump((n) => n + 1);
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("auth.errGeneric"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function retryEmailAttach() {
    setBusy(true);
    setError(null);
    try {
      await attachPendingEmailIdentity();
      setDoneMsg(t("continuity.linkEmailDone"));
      bump((n) => n + 1);
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("auth.errGeneric"),
      );
    } finally {
      setBusy(false);
    }
  }

  function onDismissRelay() {
    if (!user) return;
    dismissRelayWarn(user.id);
    bump((n) => n + 1);
  }

  function onDismissCross() {
    if (!user) return;
    dismissCrossSignInBanner(user.id);
    bump((n) => n + 1);
  }

  if (doneMsg) {
    return (
      <div
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        role="status"
      >
        {doneMsg}
      </div>
    );
  }

  // Retry sheet if silent email attach failed after Apple login
  if (showEmailAttachRetry && pendingEmail) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40"
        role="dialog"
        aria-modal="true"
      >
        <div className="card w-full max-w-md shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200">
            <h2 className="font-sans text-lg font-semibold text-ink-900">
              {t("continuity.attachEmailTitle")}
            </h2>
          </div>
          <div className="px-5 py-4 text-sm text-ink-700 space-y-2">
            <p>{t("continuity.attachEmailBody", { email: pendingEmail.email })}</p>
            {error ? <p className="text-red-600">{error}</p> : null}
          </div>
          <div className="px-5 py-3 border-t border-ink-100 flex flex-col gap-2">
            <button
              type="button"
              className="btn-primary w-full"
              disabled={busy}
              onClick={() => void retryEmailAttach()}
            >
              {t("continuity.attachEmail")}
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              disabled={busy}
              onClick={() => {
                clearPendingEmailAttach();
                clearAbandonedEmptyAuthUser();
                bump((n) => n + 1);
              }}
            >
              {t("continuity.later")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showEmptyRelay || showAlreadyHave) {
    const onAppleOnly =
      userHasAppleIdentity(user) && !userHasGoogleIdentity(user) && !userHasEmailIdentity(user);
    const onGoogleOnly =
      userHasGoogleIdentity(user) && !userHasAppleIdentity(user);
    const onEmailOnly = soleEmail;

    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40"
        role="dialog"
        aria-modal="true"
        aria-labelledby="continuity-gate-title"
      >
        <div className="card w-full max-w-md shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200">
            <h2
              id="continuity-gate-title"
              className="font-sans text-lg font-semibold text-ink-900"
            >
              {onEmailOnly
                ? t("continuity.gateEmailTitle")
                : showEmptyRelay
                  ? t("continuity.gateWrongTitle")
                  : t("continuity.gateEmptyTitle")}
            </h2>
          </div>
          <div className="px-5 py-4 text-sm text-ink-700 leading-relaxed space-y-3">
            <p>
              {onEmailOnly
                ? t("continuity.gateEmailBody")
                : showEmptyRelay
                  ? t("continuity.gateWrongBody")
                  : t("continuity.gateEmptyBody")}
            </p>
            {onEmailOnly && emailStep === "password" ? (
              <div>
                <label htmlFor="continuity-email-pw" className="label">
                  {t("continuity.emailPasswordLabel")}
                </label>
                <input
                  id="continuity-email-pw"
                  type="password"
                  className="input w-full"
                  value={emailPw}
                  onChange={(e) => setEmailPw(e.target.value)}
                  autoComplete="current-password"
                  placeholder={t("continuity.emailPasswordPlaceholder")}
                />
                <p className="text-xs text-ink-500 mt-1.5 leading-snug">
                  {t("continuity.emailPasswordHint")}
                </p>
              </div>
            ) : null}
            {error ? <p className="text-red-600">{error}</p> : null}
          </div>
          <div className="px-5 py-3 border-t border-ink-100 flex flex-col gap-2">
            {onEmailOnly ? (
              emailStep === "ask" ? (
                <button
                  type="button"
                  className="btn w-full border border-black bg-black text-white"
                  disabled={busy || getNativePlatform() === "android"}
                  onClick={() => {
                    setError(null);
                    setEmailStep("password");
                  }}
                >
                  {t("continuity.openIphoneVault")}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn w-full border border-black bg-black text-white"
                  disabled={busy || emailPw.length < 6}
                  onClick={() => void openIphoneVaultFromEmail()}
                >
                  {t("continuity.openIphoneVaultContinue")}
                </button>
              )
            ) : null}
            {onGoogleOnly ? (
              <button
                type="button"
                className="btn w-full border border-black bg-black text-white"
                disabled={busy || getNativePlatform() === "android"}
                onClick={() => void openOtherVault("apple")}
              >
                {t("continuity.openIphoneVault")}
              </button>
            ) : null}
            {onAppleOnly || (showEmptyRelay && userHasAppleIdentity(user)) ? (
              <button
                type="button"
                className="btn-primary w-full"
                disabled={busy}
                onClick={() => void openOtherVault("google")}
              >
                {t("continuity.openWithGoogle")}
              </button>
            ) : null}
            <button
              type="button"
              className="btn-secondary w-full"
              disabled={busy}
              onClick={() => {
                setEmailStep("ask");
                setEmailPw("");
                if (showEmptyRelay) onDismissRelay();
                else onDismissCross();
              }}
            >
              {t("continuity.startFresh")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showOAuthAttach && abandoned) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40"
        role="dialog"
        aria-modal="true"
      >
        <div className="card w-full max-w-md shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-200">
            <h2 className="font-sans text-lg font-semibold text-ink-900">
              {t("continuity.attachTitle")}
            </h2>
          </div>
          <div className="px-5 py-4 text-sm text-ink-700 space-y-2">
            <p>{t("continuity.attachBody")}</p>
            {error ? <p className="text-red-600">{error}</p> : null}
          </div>
          <div className="px-5 py-3 border-t border-ink-100 flex flex-col gap-2">
            <button
              type="button"
              className="btn-primary w-full"
              disabled={busy}
              onClick={() => void onLink(abandoned.provider as "apple" | "google")}
            >
              {abandoned.provider === "google"
                ? t("continuity.attachGoogle")
                : t("continuity.attachApple")}
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              disabled={busy}
              onClick={() => {
                clearAbandonedEmptyAuthUser();
                bump((n) => n + 1);
              }}
            >
              {t("continuity.later")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showRelayData) {
    return (
      <div
        className="rounded-lg border border-amber-300 bg-amber-50 text-amber-950 px-4 py-3 space-y-3 text-sm leading-snug"
        role="status"
      >
        <p className="font-semibold">{t("continuity.webReadyTitle")}</p>
        <p>{t("continuity.webReadyBody")}</p>
        {error ? <p className="text-red-700">{error}</p> : null}
        <div className="flex flex-col sm:flex-row gap-2">
          {missing.needGoogle ? (
            <button
              type="button"
              className="btn-primary text-sm"
              disabled={busy}
              onClick={() => void onLink("google")}
            >
              {t("continuity.attachGoogle")}
            </button>
          ) : null}
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={busy}
            onClick={onDismissRelay}
          >
            {t("continuity.later")}
          </button>
        </div>
      </div>
    );
  }

  const canLinkApple = missing.needApple && getNativePlatform() !== "android";
  return (
    <div
      className="rounded-lg border border-ink-200 bg-ink-50 text-ink-800 px-4 py-3 space-y-3 text-sm leading-snug"
      role="status"
    >
      <p className="font-semibold">{t("continuity.oneMoreTitle")}</p>
      <p>{t("continuity.oneMoreBody")}</p>
      {error ? <p className="text-red-700">{error}</p> : null}
      <div className="flex flex-col sm:flex-row gap-2">
        {missing.needGoogle ? (
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={busy}
            onClick={() => void onLink("google")}
          >
            {t("continuity.attachGoogle")}
          </button>
        ) : null}
        {canLinkApple ? (
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={busy}
            onClick={() => void onLink("apple")}
          >
            {t("continuity.attachApple")}
          </button>
        ) : null}
        <button
          type="button"
          className="btn-secondary text-sm"
          disabled={busy}
          onClick={onDismissCross}
        >
          {t("continuity.later")}
        </button>
      </div>
    </div>
  );
}
