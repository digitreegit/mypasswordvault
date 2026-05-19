import { isNativeApp } from "./platform";
import { isLocalDevHost, publicSiteOrigin } from "./siteOrigin";

/** Default when `window.location` is unavailable (SSR/tests). */
const PRIVACY_PATH = "/privacy.html";

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
    isLocalDevHost(hostname)
  ) {
    return `${origin}${PRIVACY_PATH}`;
  }

  return canonical;
}
