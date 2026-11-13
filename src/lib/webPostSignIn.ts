import { isNativeApp } from "./platform";
import { isPasswordRecoveryPending } from "./passwordRecoveryPending";

/**
 * After an interactive web sign-in, return to the marketing site so the header
 * shows My Vault + the account dropdown (Settings / Sign out). Native apps and
 * deep-linked hash routes stay in /app/.
 */
export function shouldReturnToLandingAfterWebSignIn(): boolean {
  if (typeof window === "undefined") return false;
  if (isNativeApp()) return false;
  if (isPasswordRecoveryPending()) return false;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash || hash === "/") return true;
  if (hash.startsWith("/")) {
    const path = hash.split("?")[0].replace(/^\//, "").toLowerCase();
    if (path) return false;
  }
  return true;
}

export function redirectWebToLandingAfterSignIn(): boolean {
  if (!shouldReturnToLandingAfterWebSignIn()) return false;
  window.location.replace("/");
  return true;
}
