export type AuthLastMethod = "google" | "email";

const STORAGE_KEY = "mpv_auth_last_method";

export function getAuthLastMethod(): AuthLastMethod | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "google" || v === "email" ? v : null;
}

export function setAuthLastMethod(method: AuthLastMethod): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, method);
}
