import { CANONICAL_APP_PATH, isLocalDevHost } from "./siteOrigin";

/** App base URL for Stripe embedded checkout return (hash route lives under /app/). */
export function checkoutAppBaseUrl(): string {
  if (typeof window === "undefined") return "https://mypasswordvault.app/app";
  const origin = window.location.origin;
  const path = window.location.pathname.replace(/\/$/, "") || "";
  if (isLocalDevHost(window.location.hostname)) {
    return path.startsWith("/app") ? `${origin}/app` : `${origin}${CANONICAL_APP_PATH}`.replace(/\/$/, "");
  }
  if (path.startsWith("/app")) return `${origin}/app`;
  return `${origin}${CANONICAL_APP_PATH}`.replace(/\/$/, "");
}
