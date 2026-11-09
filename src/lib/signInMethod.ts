import type { User, UserIdentity } from "@supabase/supabase-js";
import {
  getAuthLastMethod,
  getAuthLastMethodForEmail,
  isAuthLastMethod,
  type AuthLastMethod,
} from "./authLastUsed";

export type UserSignInMethod = "google" | "apple" | "email" | "unknown";

type OAuthProvider = "google" | "apple";

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

function preferredOAuthWhenLinked(
  google?: UserIdentity,
  apple?: UserIdentity
): OAuthProvider | null {
  const gAt = identitySignedInAt(google);
  const aAt = identitySignedInAt(apple);
  if (gAt < 0 && aAt < 0) return null;
  return gAt >= aAt ? "google" : "apple";
}

function preferredProviderWhenBothLinked(
  google?: UserIdentity,
  apple?: UserIdentity,
  email?: UserIdentity
): UserSignInMethod | null {
  const oauth = preferredOAuthWhenLinked(google, apple);
  const eAt = identitySignedInAt(email);
  if (!oauth) {
    return eAt >= 0 ? "email" : null;
  }
  const oAt = oauth === "google" ? identitySignedInAt(google) : identitySignedInAt(apple);
  return oAt >= eAt ? oauth : "email";
}

/** True when the account can sign in with email + password (not OAuth-only). */
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
  const appleIdentity = identities.find((i) => i.provider === "apple");
  const emailIdentity = identities.find((i) => i.provider === "email");
  const hasGoogle = Boolean(googleIdentity);
  const hasApple = Boolean(appleIdentity);
  const hasEmail = Boolean(emailIdentity);

  if (lastUsed === "google" || lastUsed === "apple" || lastUsed === "email") {
    return lastUsed;
  }

  if (hasEmail && !hasGoogle && !hasApple) return "email";
  if (hasGoogle && !hasApple && !hasEmail) return "google";
  if (hasApple && !hasGoogle && !hasEmail) return "apple";

  const preferred = preferredProviderWhenBothLinked(
    googleIdentity,
    appleIdentity,
    emailIdentity
  );
  if (preferred) return preferred;

  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers)) {
    const oauthOnly = providers.filter((p) => p === "google" || p === "apple");
    if (oauthOnly.length === 1 && !providers.includes("email")) {
      return oauthOnly[0] as OAuthProvider;
    }
    if (providers.includes("email") && !providers.includes("google") && !providers.includes("apple")) {
      return "email";
    }
  }

  const primary = user.app_metadata?.provider;
  if (primary === "google" || primary === "apple" || primary === "email") {
    return primary;
  }

  if (!userSupportsEmailPassword(user)) {
    const oauth = preferredOAuthWhenLinked(googleIdentity, appleIdentity);
    if (oauth) return oauth;
    if (hasApple) return "apple";
    if (hasGoogle) return "google";
  }
  if (userSupportsEmailPassword(user)) return "email";
  if (hasApple) return "apple";
  if (hasGoogle) return "google";
  return "unknown";
}

export function getUserSignInMethod(user: User): UserSignInMethod {
  const stored = resolveStoredSignInMethod(user);
  if (stored) return stored;
  return signInMethodFromUser(user, null);
}
