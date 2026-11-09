import type { Session } from "@supabase/supabase-js";

export type AuthLastMethod = "google" | "apple" | "email";

export type PendingAuthMethod = {
  method: AuthLastMethod;
  email?: string;
};

const STORAGE_KEY = "mpv_auth_last_method";
const STORAGE_MAP_KEY = "mpv_auth_last_method_by_user";
const STORAGE_EMAIL_MAP_KEY = "mpv_auth_last_method_by_email";
const STORAGE_LAST_EMAIL_KEY = "mpv_auth_last_email";
const PENDING_AUTH_METHOD_KEY = "mpv_pending_auth_method";
const SIGN_IN_ATTEMPT_KEY = "mpv_sign_in_attempt";
const JUST_COMPLETED_KEY = "mpv_auth_just_completed";
export const AUTH_LAST_METHOD_CHANGED = "mpv-auth-last-method-changed";

const PENDING_MAX_AGE_MS = 30 * 60 * 1000;
const JUST_COMPLETED_MAX_AGE_MS = 60 * 1000;

export function isAuthLastMethod(value: string): value is AuthLastMethod {
  return value === "google" || value === "apple" || value === "email";
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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
  if (legacy && isAuthLastMethod(legacy)) {
    return { __legacy__: legacy };
  }
  return {};
}

function writeMethodMap(map: Record<string, AuthLastMethod>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(map));
}

function readEmailMethodMap(): Record<string, AuthLastMethod> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_EMAIL_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, AuthLastMethod>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeEmailMethodMap(map: Record<string, AuthLastMethod>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_EMAIL_MAP_KEY, JSON.stringify(map));
}

function readPendingRaw(maxAgeMs: number): PendingAuthMethod | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PENDING_AUTH_METHOD_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      method?: string;
      at?: number;
      email?: string;
    };
    if (!isAuthLastMethod(parsed?.method ?? "")) return null;
    if (!Number.isFinite(parsed.at) || Date.now() - parsed.at! > maxAgeMs) return null;
    return {
      method: parsed.method as AuthLastMethod,
      email: parsed.email?.trim() ? normalizeEmail(parsed.email) : undefined,
    };
  } catch {
    /* legacy "method:timestamp" */
  }

  const sep = raw.lastIndexOf(":");
  if (sep < 0) return null;
  const method = raw.slice(0, sep);
  const ts = Number(raw.slice(sep + 1));
  if (!isAuthLastMethod(method)) return null;
  if (!Number.isFinite(ts) || Date.now() - ts > maxAgeMs) return null;
  return { method };
}

export function getAuthLastMethod(userId?: string): AuthLastMethod | null {
  if (typeof window === "undefined") return null;
  const map = readMethodMap();
  if (userId && isAuthLastMethod(map[userId] ?? "")) {
    return map[userId];
  }
  if (isAuthLastMethod(map.__legacy__ ?? "")) return map.__legacy__;
  const legacy = window.localStorage.getItem(STORAGE_KEY);
  return legacy && isAuthLastMethod(legacy) ? legacy : null;
}

export function getAuthLastMethodForEmail(email: string): AuthLastMethod | null {
  if (typeof window === "undefined" || !email.trim()) return null;
  const method = readEmailMethodMap()[normalizeEmail(email)];
  return isAuthLastMethod(method ?? "") ? method : null;
}

export function getAuthLastEmail(): string | null {
  if (typeof window === "undefined") return null;
  const email = window.localStorage.getItem(STORAGE_LAST_EMAIL_KEY)?.trim();
  return email || null;
}

export function clearAuthLastEmail(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_LAST_EMAIL_KEY);
}

export function setAuthLastMethod(
  method: AuthLastMethod,
  userId?: string,
  email?: string | null
): void {
  if (typeof window === "undefined") return;
  if (userId) {
    const map = readMethodMap();
    map[userId] = method;
    writeMethodMap(map);
  }
  const normalizedEmail = email?.trim() ? normalizeEmail(email) : null;
  if (normalizedEmail) {
    const emailMap = readEmailMethodMap();
    emailMap[normalizedEmail] = method;
    writeEmailMethodMap(emailMap);
    window.localStorage.setItem(STORAGE_LAST_EMAIL_KEY, normalizedEmail);
  }
  window.localStorage.setItem(STORAGE_KEY, method);
  window.dispatchEvent(new CustomEvent(AUTH_LAST_METHOD_CHANGED));
}

export function clearAuthLastMethod(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(STORAGE_MAP_KEY);
  window.localStorage.removeItem(STORAGE_EMAIL_MAP_KEY);
  window.localStorage.removeItem(STORAGE_LAST_EMAIL_KEY);
}

/** Set immediately before starting a sign-in flow (survives OAuth redirect via localStorage). */
export function markPendingAuthMethod(method: AuthLastMethod, email?: string): void {
  if (typeof window === "undefined") return;
  const payload = {
    method,
    at: Date.now(),
    email: email?.trim() ? normalizeEmail(email) : undefined,
  };
  window.localStorage.setItem(PENDING_AUTH_METHOD_KEY, JSON.stringify(payload));
}

export function clearPendingAuthMethod(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_AUTH_METHOD_KEY);
}

/** Set before sign-in button action; used as tie-breaker and OAuth redirect hint. */
export function markSignInAttempt(method: AuthLastMethod): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SIGN_IN_ATTEMPT_KEY,
    JSON.stringify({ method, at: Date.now() })
  );
}

/** Read and remove the in-flight sign-in attempt (survives OAuth redirect). */
export function takeSignInAttempt(
  maxAgeMs = PENDING_MAX_AGE_MS
): AuthLastMethod | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SIGN_IN_ATTEMPT_KEY);
  window.localStorage.removeItem(SIGN_IN_ATTEMPT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { method?: string; at?: number };
    if (!isAuthLastMethod(parsed.method ?? "")) return null;
    if (!Number.isFinite(parsed.at) || Date.now() - parsed.at! > maxAgeMs) {
      return null;
    }
    return parsed.method as AuthLastMethod;
  } catch {
    return null;
  }
}

export function peekSignInAttempt(
  maxAgeMs = PENDING_MAX_AGE_MS
): AuthLastMethod | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SIGN_IN_ATTEMPT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { method?: string; at?: number };
    if (!isAuthLastMethod(parsed.method ?? "")) return null;
    if (!Number.isFinite(parsed.at) || Date.now() - parsed.at! > maxAgeMs) {
      return null;
    }
    return parsed.method as AuthLastMethod;
  } catch {
    return null;
  }
}

export function clearSignInAttempt(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SIGN_IN_ATTEMPT_KEY);
}

export function peekPendingAuthMethod(
  maxAgeMs = PENDING_MAX_AGE_MS
): PendingAuthMethod | null {
  return readPendingRaw(maxAgeMs);
}

export function consumePendingAuthMethod(
  maxAgeMs = PENDING_MAX_AGE_MS
): PendingAuthMethod | null {
  const pending = readPendingRaw(maxAgeMs);
  clearPendingAuthMethod();
  return pending;
}

export function markAuthJustCompleted(opts: {
  method?: AuthLastMethod;
  oauth?: boolean;
  recovery?: boolean;
}): void {
  if (typeof window === "undefined") return;
  const method =
    opts.method ??
    (opts.oauth ? "google" : opts.recovery ? "email" : undefined);
  window.localStorage.setItem(
    JUST_COMPLETED_KEY,
    JSON.stringify({ at: Date.now(), method, recovery: opts.recovery })
  );
}

export function readAuthJustCompleted(): {
  method?: AuthLastMethod;
  recovery?: boolean;
} | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(JUST_COMPLETED_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      at?: number;
      method?: AuthLastMethod;
      oauth?: boolean;
      recovery?: boolean;
    };
    if (!Number.isFinite(parsed.at) || Date.now() - parsed.at! > JUST_COMPLETED_MAX_AGE_MS) {
      window.localStorage.removeItem(JUST_COMPLETED_KEY);
      return null;
    }
    const method =
      parsed.method ??
      (parsed.oauth ? "google" : parsed.recovery ? "email" : undefined);
    return { method, recovery: parsed.recovery };
  } catch {
    window.localStorage.removeItem(JUST_COMPLETED_KEY);
    return null;
  }
}

export function clearAuthJustCompleted(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(JUST_COMPLETED_KEY);
}

export function recordGoogleSignIn(userId?: string, email?: string | null): void {
  clearPendingAuthMethod();
  setAuthLastMethod("google", userId, email);
}

export function recordEmailSignIn(userId?: string, email?: string | null): void {
  clearPendingAuthMethod();
  setAuthLastMethod("email", userId, email);
}

/** @deprecated Prefer recordSuccessfulSignIn */
export function recordLastUsedFromSession(session: Session | null): void {
  if (!session?.user) return;
  const pending = consumePendingAuthMethod();
  if (pending) {
    setAuthLastMethod(
      pending.method,
      session.user.id,
      session.user.email ?? pending.email
    );
  }
}

export function markPendingGoogleOAuth(): void {
  markPendingAuthMethod("google");
}

export function clearPendingGoogleOAuth(): void {
  clearPendingAuthMethod();
}
