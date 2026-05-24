import type { Session } from "@supabase/supabase-js";

export type AuthLastMethod = "google" | "email";

const STORAGE_KEY = "mpv_auth_last_method";
const STORAGE_MAP_KEY = "mpv_auth_last_method_by_user";
const PENDING_AUTH_METHOD_KEY = "mpv_pending_auth_method";
export const AUTH_LAST_METHOD_CHANGED = "mpv-auth-last-method-changed";

function readMethodMap(): Record<string, AuthLastMethod> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_MAP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, AuthLastMethod>;
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    /* ignore */
  }
  const legacy = window.localStorage.getItem(STORAGE_KEY);
  if (legacy === "google" || legacy === "email") {
    return { __legacy__: legacy };
  }
  return {};
}

function writeMethodMap(map: Record<string, AuthLastMethod>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(map));
}

export function getAuthLastMethod(userId?: string): AuthLastMethod | null {
  if (typeof window === "undefined") return null;
  const map = readMethodMap();
  if (userId && (map[userId] === "google" || map[userId] === "email")) {
    return map[userId];
  }
  if (map.__legacy__ === "google" || map.__legacy__ === "email") return map.__legacy__;
  const legacy = window.localStorage.getItem(STORAGE_KEY);
  return legacy === "google" || legacy === "email" ? legacy : null;
}

export function setAuthLastMethod(method: AuthLastMethod, userId?: string): void {
  if (typeof window === "undefined") return;
  if (userId) {
    const map = readMethodMap();
    map[userId] = method;
    writeMethodMap(map);
  }
  window.localStorage.setItem(STORAGE_KEY, method);
  window.dispatchEvent(new CustomEvent(AUTH_LAST_METHOD_CHANGED));
}

export function clearAuthLastMethod(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(STORAGE_MAP_KEY);
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
export function applyPendingAuthMethod(userId?: string): boolean {
  const pending = consumePendingAuthMethod();
  if (!pending) return false;
  setAuthLastMethod(pending, userId);
  return true;
}

/** After OAuth redirect session is ready (web or native callback). */
export function recordGoogleSignIn(userId?: string): void {
  clearPendingAuthMethod();
  setAuthLastMethod("google", userId);
}

export function recordEmailSignIn(userId?: string): void {
  clearPendingAuthMethod();
  setAuthLastMethod("email", userId);
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
