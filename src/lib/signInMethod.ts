import type { User, UserIdentity } from "@supabase/supabase-js";
import {
  getAuthLastMethod,
  getAuthLastMethodForEmail,
  type AuthLastMethod,
} from "./authLastUsed";

export type UserSignInMethod = "google" | "email" | "unknown";

/** Last-used method from local storage (same sources as the sign-in screen badge). */
export function resolveStoredSignInMethod(user: User): AuthLastMethod | null {
  const lastByEmail = user.email
    ? getAuthLastMethodForEmail(user.email)
    : null;
  const lastGlobal = getAuthLastMethod();
  const lastByUser = getAuthLastMethod(user.id);
  // Email map + global key update on every login; per-user map can lag after linking.
  return lastByEmail ?? lastGlobal ?? lastByUser;
}

function identitySignedInAt(identity?: UserIdentity): number {
  if (!identity?.last_sign_in_at) return -1;
  const ms = Date.parse(identity.last_sign_in_at);
  return Number.isFinite(ms) ? ms : -1;
}

function preferredProviderWhenBothLinked(
  google?: UserIdentity,
  email?: UserIdentity
): UserSignInMethod | null {
  const gAt = identitySignedInAt(google);
  const eAt = identitySignedInAt(email);
  if (gAt < 0 && eAt < 0) return null;
  return gAt >= eAt ? "google" : "email";
}

/** True when the account can sign in with email + password (not Google-only). */
export function userSupportsEmailPassword(user: User): boolean {
  if (resolveStoredSignInMethod(user) === "email") return true;

  const hasEmailIdentity =
    user.identities?.some((i) => i.provider === "email") ?? false;
  if (hasEmailIdentity) return true;

  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers) && providers.includes("email")) return true;

  return user.app_metadata?.provider === "email";
}

export function signInMethodFromUser(
  user: User,
  lastUsed?: UserSignInMethod | null
): UserSignInMethod {
  const identities = user.identities ?? [];
  const googleIdentity = identities.find((i) => i.provider === "google");
  const emailIdentity = identities.find((i) => i.provider === "email");
  const hasGoogle = Boolean(googleIdentity);
  const hasEmail = Boolean(emailIdentity);

  if (lastUsed === "google" || lastUsed === "email") return lastUsed;

  if (hasGoogle && !hasEmail) return "google";
  if (hasEmail && !hasGoogle) return "email";

  const preferred = preferredProviderWhenBothLinked(googleIdentity, emailIdentity);
  if (preferred) return preferred;

  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers)) {
    if (providers.includes("google") && !providers.includes("email")) return "google";
    if (providers.includes("email") && !providers.includes("google")) return "email";
  }

  const primary = user.app_metadata?.provider;
  if (primary === "google" || primary === "email") return primary;

  if (hasGoogle && !userSupportsEmailPassword(user)) return "google";
  if (userSupportsEmailPassword(user)) return "email";
  if (hasGoogle) return "google";
  return "unknown";
}

export function getUserSignInMethod(user: User): UserSignInMethod {
  const stored = resolveStoredSignInMethod(user);
  if (stored === "google" || stored === "email") return stored;
  return signInMethodFromUser(user, null);
}
