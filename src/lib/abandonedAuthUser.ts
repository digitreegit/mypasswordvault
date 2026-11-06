/** Remember an empty account we signed out of so claim-auth-identity can delete it later. */

const KEY = "mpv_abandoned_empty_auth_user_v1";

export type AbandonedAuthProvider = "apple" | "google" | "email";

export type AbandonedAuthUser = {
  userId: string;
  provider: AbandonedAuthProvider;
  /** Set when provider === "email" (for UI copy). */
  email?: string;
  savedAt: number;
};

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function rememberAbandonedEmptyAuthUser(
  userId: string,
  provider: AbandonedAuthProvider,
  email?: string,
): void {
  try {
    const payload: AbandonedAuthUser = {
      userId,
      provider,
      email: email?.trim().toLowerCase() || undefined,
      savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

export function readAbandonedEmptyAuthUser(): AbandonedAuthUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AbandonedAuthUser;
    if (
      !parsed?.userId ||
      (parsed.provider !== "apple" &&
        parsed.provider !== "google" &&
        parsed.provider !== "email")
    ) {
      return null;
    }
    if (Date.now() - (parsed.savedAt || 0) > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAbandonedEmptyAuthUser(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function takeAbandonedEmptyAuthUser(
  provider: AbandonedAuthProvider,
): string | null {
  const row = readAbandonedEmptyAuthUser();
  if (!row || row.provider !== provider) return null;
  clearAbandonedEmptyAuthUser();
  return row.userId;
}
