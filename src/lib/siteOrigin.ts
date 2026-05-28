/** Canonical marketing + app host (override with VITE_PUBLIC_SITE_ORIGIN). */
export const CANONICAL_SITE_ORIGIN = "https://mypasswordvault.app";
export const CANONICAL_APP_PATH = "/app/";

export function publicSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_SITE_ORIGIN?.trim().replace(/\/+$/, "");
  return fromEnv || CANONICAL_SITE_ORIGIN;
}

export function isLocalDevHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** WebAuthn RP ID must be a domain name — IP literals (e.g. 127.0.0.1) are rejected by Chrome. */
export function isIpLiteralHost(hostname: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":");
}

/** Passkeys require a valid RP ID; use `localhost`, not `127.0.0.1`. */
export function isPasskeyOriginHost(hostname: string): boolean {
  if (hostname === "localhost") return true;
  if (isIpLiteralHost(hostname)) return false;
  return hostname.includes(".");
}

/** Dev only: move `127.0.0.1` → `localhost` so WebAuthn rpId is valid. */
export function redirectDevIpToLocalhost(): boolean {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  if (window.location.hostname !== "127.0.0.1") return false;
  const url = new URL(window.location.href);
  url.hostname = "localhost";
  window.location.replace(url.toString());
  return true;
}

export function isVercelPreviewHost(hostname: string): boolean {
  return hostname.endsWith(".vercel.app");
}

/** Redirect `*.vercel.app` → canonical domain (path, query, hash preserved). */
export function redirectVercelPreviewToCanonical(): boolean {
  if (typeof window === "undefined") return false;
  const { hostname, pathname, search, hash, protocol } = window.location;
  if (protocol !== "http:" && protocol !== "https:") return false;
  if (!isVercelPreviewHost(hostname)) return false;
  const path = pathname || "/";
  const target = `${publicSiteOrigin()}${path}${search}${hash}`;
  window.location.replace(target);
  return true;
}

export function canonicalAppUrl(): string {
  const base = publicSiteOrigin().replace(/\/+$/, "");
  return `${base}${CANONICAL_APP_PATH}`;
}

/** Stripe may still redirect to site root if PUBLIC_APP_URL omits `/app` — send checkout returns to the vault app. */
export function redirectCheckoutReturnToApp(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/app" || path.startsWith("/app/")) return false;
  const { search, hash } = window.location;
  if (!hash.includes("checkout=") && !search.includes("checkout=")) return false;
  window.location.replace(`${window.location.origin}/app/${search}${hash}`);
  return true;
}

/** Ensures Stripe return URL loads the vault app (`/app`), not the marketing site root. */
export function resolveAppBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  try {
    const u = new URL(trimmed);
    const path = u.pathname.replace(/\/$/, "") || "";
    if (path === "" || path === "/") {
      u.pathname = "/app";
    } else if (path !== "/app" && !path.startsWith("/app/")) {
      u.pathname = `${path}/app`.replace("//", "/");
    }
    return `${u.origin}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return trimmed.endsWith("/app") ? trimmed : `${trimmed}/app`;
  }
}

export function canonicalSiteHostname(): string {
  try {
    return new URL(publicSiteOrigin()).hostname;
  } catch {
    return "mypasswordvault.app";
  }
}
