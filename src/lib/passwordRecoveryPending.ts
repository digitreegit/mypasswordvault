const KEY = "mpv_password_recovery_pending";

export function isPasswordRecoveryPending(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(KEY) === "1";
}

export function setPasswordRecoveryPending(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, "1");
}

export function clearPasswordRecoveryPending(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}

/** True when the current URL still carries a Supabase recovery callback. */
export function urlIndicatesPasswordRecovery(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.replace(/^#/, "");
  if (hash && !hash.startsWith("/")) {
    const p = new URLSearchParams(hash);
    if (p.get("type") === "recovery") return true;
  }
  const q = new URLSearchParams(window.location.search);
  return q.get("type") === "recovery";
}
