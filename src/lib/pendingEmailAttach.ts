/** Brief handoff: empty email signup → Apple vault → attach same email to that vault. */

const KEY = "mpv_pending_email_attach_v1";
const MAX_AGE_MS = 20 * 60 * 1000;

export type PendingEmailAttach = {
  emptyUserId: string;
  email: string;
  /** Cleared immediately after attach attempt. Session-only. */
  password: string;
  savedAt: number;
};

export function savePendingEmailAttach(opts: {
  emptyUserId: string;
  email: string;
  password: string;
}): void {
  try {
    const payload: PendingEmailAttach = {
      emptyUserId: opts.emptyUserId,
      email: opts.email.trim().toLowerCase(),
      password: opts.password,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

export function readPendingEmailAttach(): PendingEmailAttach | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingEmailAttach;
    if (
      !parsed?.emptyUserId ||
      !parsed.email ||
      typeof parsed.password !== "string" ||
      !parsed.password
    ) {
      return null;
    }
    if (Date.now() - (parsed.savedAt || 0) > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingEmailAttach(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
