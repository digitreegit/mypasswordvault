import type { User } from "@supabase/supabase-js";

const RELAY_SUFFIX = "@privaterelay.appleid.com";
const DISMISS_PREFIX = "mpv_apple_relay_warn_dismiss:";
const CROSS_DISMISS_PREFIX = "mpv_cross_signin_banner_dismiss:";

export function isApplePrivateRelayEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(RELAY_SUFFIX);
}

function providersOf(user: User): Set<string> {
  const set = new Set<string>();
  for (const i of user.identities ?? []) {
    if (i.provider) set.add(i.provider);
  }
  const meta = user.app_metadata?.providers;
  if (Array.isArray(meta)) {
    for (const p of meta) {
      if (typeof p === "string") set.add(p);
    }
  }
  const primary = user.app_metadata?.provider;
  if (typeof primary === "string") set.add(primary);
  return set;
}

export function userHasAppleIdentity(user: User): boolean {
  return providersOf(user).has("apple");
}

export function userHasGoogleIdentity(user: User): boolean {
  return providersOf(user).has("google");
}

export function userHasEmailIdentity(user: User): boolean {
  return providersOf(user).has("email");
}

/** True when the account can also sign in without Apple (Google and/or email). */
export function userHasNonAppleSignIn(user: User): boolean {
  const p = providersOf(user);
  return p.has("google") || p.has("email");
}

/** True when the account can sign in without Google (Apple and/or email). */
export function userHasNonGoogleSignIn(user: User): boolean {
  const p = providersOf(user);
  return p.has("apple") || p.has("email");
}

/** Single-provider accounts that should be nudged to add a cross-platform method. */
export function missingCrossPlatformProviders(user: User): {
  needGoogle: boolean;
  needApple: boolean;
} {
  return {
    needGoogle: !userHasGoogleIdentity(user),
    needApple: !userHasAppleIdentity(user),
  };
}

/**
 * Apple Hide My Email orphan: relay address and no Google/email identity linked yet.
 * These accounts never match a web Google vault by email alone.
 */
export function isAppleRelayOrphanAccount(user: User): boolean {
  return (
    isApplePrivateRelayEmail(user.email) &&
    userHasAppleIdentity(user) &&
    !userHasNonAppleSignIn(user)
  );
}

/** Empty / brand-new vault — nudge to switch to Google instead of creating a second vault. */
export function shouldWarnEmptyRelayVault(
  user: User,
  opts: { vaultStatus: "fresh" | "locked" | "unlocked" | "loading"; entryCount: number }
): boolean {
  if (!isAppleRelayOrphanAccount(user)) return false;
  if (isRelayWarnDismissed(user.id)) return false;
  if (opts.vaultStatus === "fresh") return true;
  if (opts.vaultStatus === "unlocked" && opts.entryCount === 0) return true;
  // Locked: cannot count entries without unlock — still warn (safer than silent split).
  if (opts.vaultStatus === "locked") return true;
  return false;
}

/** Softer notice when the orphan vault already has entries (no auto-merge). */
export function shouldHintRelayVaultWithData(
  user: User,
  opts: { vaultStatus: "unlocked"; entryCount: number }
): boolean {
  if (!isAppleRelayOrphanAccount(user)) return false;
  if (isRelayWarnDismissed(user.id)) return false;
  return opts.entryCount > 0;
}

export function isRelayWarnDismissed(userId: string): boolean {
  try {
    return sessionStorage.getItem(DISMISS_PREFIX + userId) === "1";
  } catch {
    return false;
  }
}

export function dismissRelayWarn(userId: string): void {
  try {
    sessionStorage.setItem(DISMISS_PREFIX + userId, "1");
  } catch {
    /* private mode */
  }
}

export function isCrossSignInBannerDismissed(userId: string): boolean {
  try {
    return sessionStorage.getItem(CROSS_DISMISS_PREFIX + userId) === "1";
  } catch {
    return false;
  }
}

export function dismissCrossSignInBanner(userId: string): void {
  try {
    sessionStorage.setItem(CROSS_DISMISS_PREFIX + userId, "1");
  } catch {
    /* private mode */
  }
}

/** Fresh vault with only one OAuth/email method — ask if they already have another device vault. */
export function shouldShowAlreadyHaveVaultPrompt(
  user: User,
  opts: { vaultStatus: "fresh" | "locked" | "unlocked" | "loading"; entryCount: number },
): boolean {
  if (opts.vaultStatus !== "fresh" && !(opts.vaultStatus === "unlocked" && opts.entryCount === 0)) {
    return false;
  }
  if (isCrossSignInBannerDismissed(user.id)) return false;
  const p = providersOf(user);
  const methods = ["apple", "google", "email"].filter((m) => p.has(m));
  return methods.length === 1;
}
