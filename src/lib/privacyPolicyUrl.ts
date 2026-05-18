import { isNativeApp } from "./platform";

/** Default when `window.location` is unavailable (SSR/tests). */
const PRIVACY_PATH = "/privacy.html";

/** Static privacy page host (marketing site on Vercel). Override via VITE_PUBLIC_SITE_ORIGIN. */
const DEFAULT_SITE_ORIGIN = "https://mypasswordvault.app";

function publicSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_SITE_ORIGIN?.trim().replace(/\/+$/, "");
  return fromEnv || DEFAULT_SITE_ORIGIN;
}

/**
 * Privacy policy URL for in-app links (sign-in footer, vault footer).
 * Local dev uses same-origin `/privacy.html`; deployed/native shells use the public site.
 */
export function privacyPolicyUrl(): string {
  const canonical = `${publicSiteOrigin()}${PRIVACY_PATH}`;

  if (typeof window === "undefined" || !window.location) return canonical;
  if (isNativeApp()) return canonical;

  const { protocol, origin, hostname } = window.location;
  if (
    (protocol === "http:" || protocol === "https:") &&
    (hostname === "localhost" || hostname === "127.0.0.1")
  ) {
    return `${origin}${PRIVACY_PATH}`;
  }

  return canonical;
}
