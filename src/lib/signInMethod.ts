import type { User, UserIdentity } from "@supabase/supabase-js";
import { getAuthLastMethod } from "./authLastUsed";

export type UserSignInMethod = "google" | "email" | "unknown";

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
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers)) return providers.includes("email");
  return user.identities?.some((i) => i.provider === "email") ?? false;
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

  if (hasGoogle && !hasEmail) return "google";
  if (hasEmail && !hasGoogle) return "email";

  if (lastUsed === "google" || lastUsed === "email") return lastUsed;

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
  return signInMethodFromUser(user, getAuthLastMethod(user.id));
}
