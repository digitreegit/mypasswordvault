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

export function canonicalSiteHostname(): string {
  try {
    return new URL(publicSiteOrigin()).hostname;
  } catch {
    return "mypasswordvault.app";
  }
}
