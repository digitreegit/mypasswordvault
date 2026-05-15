/** Default when `window.location` is unavailable (SSR/tests). */
const PRIVACY_PATH = "/privacy.html";

/** Public production host for native shells (Capacitor) where origin is non-HTTP. */
const PRIVACY_CANONICAL_ORIGIN = "https://vault.skyface.com";

/**
 * Canonical privacy policy URL: same-origin in normal HTTPS deployments;
 * fallback to production host in native/custom schemes so store review links resolve.
 */
export function privacyPolicyUrl(): string {
  if (typeof window === "undefined" || !window.location) return PRIVACY_PATH;
  const { protocol, origin } = window.location;
  if (protocol === "http:" || protocol === "https:") return `${origin}${PRIVACY_PATH}`;
  return `${PRIVACY_CANONICAL_ORIGIN}${PRIVACY_PATH}`;
}
