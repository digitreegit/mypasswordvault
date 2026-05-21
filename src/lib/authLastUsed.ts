import type { Session } from "@supabase/supabase-js";

export type AuthLastMethod = "google" | "email";

const STORAGE_KEY = "mpv_auth_last_method";
const PENDING_AUTH_METHOD_KEY = "mpv_pending_auth_method";
export const AUTH_LAST_METHOD_CHANGED = "mpv-auth-last-method-changed";

export function getAuthLastMethod(): AuthLastMethod | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "google" || v === "email" ? v : null;
}

export function setAuthLastMethod(method: AuthLastMethod): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, method);
  window.dispatchEvent(new CustomEvent(AUTH_LAST_METHOD_CHANGED));
}

export function clearAuthLastMethod(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Set immediately before starting a sign-in flow. */
export function markPendingAuthMethod(method: AuthLastMethod): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    PENDING_AUTH_METHOD_KEY,
    `${method}:${Date.now()}`
  );
}

export function clearPendingAuthMethod(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_AUTH_METHOD_KEY);
}

function consumePendingAuthMethod(maxAgeMs = 30 * 60 * 1000): AuthLastMethod | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PENDING_AUTH_METHOD_KEY);
  window.sessionStorage.removeItem(PENDING_AUTH_METHOD_KEY);
  if (!raw) return null;
  const sep = raw.lastIndexOf(":");
  if (sep < 0) return null;
  const method = raw.slice(0, sep);
  const ts = Number(raw.slice(sep + 1));
  if (method !== "google" && method !== "email") return null;
  if (!Number.isFinite(ts) || Date.now() - ts > maxAgeMs) return null;
  return method;
}

/** Apply pending sign-in method from the current attempt (email or Google button). */
export function applyPendingAuthMethod(): boolean {
  const pending = consumePendingAuthMethod();
  if (!pending) return false;
  setAuthLastMethod(pending);
  return true;
}

/** After OAuth redirect session is ready (web or native callback). */
export function recordGoogleSignIn(): void {
  clearPendingAuthMethod();
  setAuthLastMethod("google");
}

export function recordEmailSignIn(): void {
  clearPendingAuthMethod();
  setAuthLastMethod("email");
}

/** @deprecated Prefer applyPendingAuthMethod / recordGoogleSignIn */
export function recordLastUsedFromSession(session: Session | null): void {
  if (!session?.user) return;
  applyPendingAuthMethod();
}

export function markPendingGoogleOAuth(): void {
  markPendingAuthMethod("google");
}

export function clearPendingGoogleOAuth(): void {
  clearPendingAuthMethod();
}
