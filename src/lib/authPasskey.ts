import { client } from "@passwordless-id/webauthn";
import type { AuthenticationJSON, RegistrationJSON } from "@passwordless-id/webauthn";
import { Capacitor } from "@capacitor/core";
import { getSupabase } from "./supabaseClient";
import { AppError } from "./errors";
import { isNativeApp, NATIVE_PASSKEY_HOSTNAME } from "./platform";
import { isLocalDevHost, isPasskeyOriginHost } from "./siteOrigin";
import { mapPasskeyClientError } from "./passkey";

const ACCOUNT_PASSKEY_FLAG = "mpv_account_passkey_register_attempted_v1";

function flagKey(userId: string): string {
  return `${ACCOUNT_PASSKEY_FLAG}:${userId}`;
}

export function hasAttemptedAccountPasskeyRegister(userId: string): boolean {
  if (typeof localStorage === "undefined") return true;
  try {
    return localStorage.getItem(flagKey(userId)) === "1";
  } catch {
    return true;
  }
}

export function markAccountPasskeyRegisterAttempted(userId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(flagKey(userId), "1");
  } catch {
    /* ignore */
  }
}

function accountPasskeyRpId(): string {
  if (typeof window === "undefined") return NATIVE_PASSKEY_HOSTNAME;
  if (isNativeApp()) return NATIVE_PASSKEY_HOSTNAME;
  const host = window.location.hostname;
  if (isLocalDevHost(host)) return host;
  return NATIVE_PASSKEY_HOSTNAME;
}

export function isAccountPasskeySupported(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential || !client.isAvailable()) return false;
  if (isNativeApp()) {
    return Capacitor.getPlatform() === "ios" || Capacitor.getPlatform() === "android";
  }
  return isPasskeyOriginHost(window.location.hostname);
}

async function invokeRegister(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const supabase = getSupabase();
  if (!supabase) throw new AppError("errors.passkeyFailed");
  const { data, error } = await supabase.functions.invoke("auth-passkey-register", {
    body,
  });
  if (error) throw new AppError("errors.passkeyFailed");
  const res = (data ?? {}) as Record<string, unknown>;
  if (res.error) throw new AppError("errors.passkeyFailed");
  return res;
}

async function invokeLogin(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const supabase = getSupabase();
  if (!supabase) throw new AppError("errors.passkeyFailed");
  // Login challenge is public — invoke still sends anon key via client.
  const { data, error } = await supabase.functions.invoke("auth-passkey-login", {
    body,
  });
  if (error) throw new AppError("errors.passkeyFailed");
  const res = (data ?? {}) as Record<string, unknown>;
  if (res.error) throw new AppError("errors.passkeyFailed");
  return res;
}

/** Register a discoverable account passkey for the signed-in user (iOS/web). */
export async function registerAccountPasskey(): Promise<boolean> {
  if (!isAccountPasskeySupported()) return false;
  const challengeRes = await invokeRegister({ action: "challenge" });
  const challengeId = String(challengeRes.challengeId ?? "");
  const challenge = String(challengeRes.challenge ?? "");
  const userId = String(challengeRes.userId ?? "");
  const userName = String(challengeRes.userName ?? userId);
  const userDisplayName = String(challengeRes.userDisplayName ?? userName);
  if (!challengeId || !challenge || !userId) {
    throw new AppError("errors.passkeyFailed");
  }

  let registration: RegistrationJSON;
  try {
    registration = await client.register({
      user: { id: userId, name: userName, displayName: userDisplayName },
      challenge,
      domain: accountPasskeyRpId(),
      discoverable: "required",
      userVerification: "required",
      attestation: false,
    });
  } catch (err) {
    throw mapPasskeyClientError(err, "setup");
  }

  await invokeRegister({
    action: "complete",
    challengeId,
    registration,
  });
  return true;
}

/**
 * One-shot after vault setup on iOS: Face ID sheet for account passkey.
 * Cancel is fine; marks attempted so we do not loop.
 */
export async function maybeRegisterAccountPasskeyAfterSetup(
  userId: string | null | undefined,
): Promise<"skipped" | "done" | "cancelled"> {
  if (!userId) return "skipped";
  if (!isNativeApp() || Capacitor.getPlatform() !== "ios") return "skipped";
  if (!isAccountPasskeySupported()) return "skipped";
  if (hasAttemptedAccountPasskeyRegister(userId)) return "skipped";
  markAccountPasskeyRegisterAttempted(userId);
  try {
    await registerAccountPasskey();
    return "done";
  } catch (e) {
    const msg = String((e as Error)?.message ?? e ?? "").toLowerCase();
    if (
      msg.includes("cancel") ||
      msg.includes("abort") ||
      msg.includes("notallowed") ||
      msg.includes("passkeycancelled")
    ) {
      return "cancelled";
    }
    console.warn("account passkey register after setup failed", e);
    return "cancelled";
  }
}

/** Web (or any client): sign in with a discoverable account passkey. */
export async function signInWithAccountPasskey(): Promise<void> {
  if (!isAccountPasskeySupported()) {
    throw new AppError("errors.passkeyNotSupported");
  }
  const supabase = getSupabase();
  if (!supabase) throw new AppError("errors.passkeyFailed");

  const challengeRes = await invokeLogin({ action: "challenge" });
  const challengeId = String(challengeRes.challengeId ?? "");
  const challenge = String(challengeRes.challenge ?? "");
  if (!challengeId || !challenge) throw new AppError("errors.passkeyFailed");

  let authentication: AuthenticationJSON;
  try {
    authentication = await client.authenticate({
      challenge,
      domain: accountPasskeyRpId(),
      userVerification: "required",
      // Empty allowCredentials → discoverable / Conditional UI style pick.
      allowCredentials: [],
    });
  } catch (err) {
    throw mapPasskeyClientError(err, "unlock");
  }

  const complete = await invokeLogin({
    action: "complete",
    challengeId,
    authentication,
  });
  const tokenHash = String(complete.tokenHash ?? "");
  if (!tokenHash) throw new AppError("errors.passkeyFailed");

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });
  if (error) throw error;
}

/**
 * Start Conditional UI (browser autofill) for account passkeys when available.
 * Returns an abort controller; call abort() on unmount.
 */
export function startAccountPasskeyConditionalUI(
  onSuccess: () => void,
  onError?: (e: unknown) => void,
): AbortController | null {
  if (typeof window === "undefined" || isNativeApp()) return null;
  if (!isAccountPasskeySupported()) return null;
  const PK = PublicKeyCredential as typeof PublicKeyCredential & {
    isConditionalMediationAvailable?: () => Promise<boolean>;
  };
  if (
    typeof PublicKeyCredential === "undefined" ||
    typeof PK.isConditionalMediationAvailable !== "function"
  ) {
    return null;
  }

  const ac = new AbortController();
  void (async () => {
    try {
      const available = await PK.isConditionalMediationAvailable!();
      if (!available || ac.signal.aborted) return;

      const challengeRes = await invokeLogin({ action: "challenge" });
      const challengeId = String(challengeRes.challengeId ?? "");
      const challenge = String(challengeRes.challenge ?? "");
      if (!challengeId || !challenge || ac.signal.aborted) return;

      const authentication = await client.authenticate({
        challenge,
        domain: accountPasskeyRpId(),
        userVerification: "required",
        allowCredentials: [],
        customProperties: {
          mediation: "conditional",
          signal: ac.signal,
        },
      });
      if (ac.signal.aborted) return;

      const complete = await invokeLogin({
        action: "complete",
        challengeId,
        authentication,
      });
      const tokenHash = String(complete.tokenHash ?? "");
      if (!tokenHash) return;
      const supabase = getSupabase();
      if (!supabase) return;
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      });
      if (error) throw error;
      onSuccess();
    } catch (e) {
      if (ac.signal.aborted) return;
      const name = (e as { name?: string })?.name ?? "";
      if (name === "AbortError" || name === "NotAllowedError") return;
      onError?.(e);
    }
  })();
  return ac;
}
