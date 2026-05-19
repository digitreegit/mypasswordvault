import { Capacitor } from "@capacitor/core";
import {
  canonicalAppUrl,
  isLocalDevHost,
  isVercelPreviewHost,
} from "./siteOrigin";

/** Custom URL scheme registered in iOS/Android for Supabase OAuth return. */
export const NATIVE_AUTH_SCHEME = "com.skyface.mypasswordvault";
export const NATIVE_AUTH_REDIRECT = `${NATIVE_AUTH_SCHEME}://auth/callback`;

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function getOAuthRedirectUrl(): string {
  if (isNativeApp()) return NATIVE_AUTH_REDIRECT;
  if (typeof window === "undefined") return canonicalAppUrl();
  const { hostname, pathname } = window.location;
  if (isLocalDevHost(hostname)) {
    return `${window.location.origin}${pathname || "/app/"}`;
  }
  if (isVercelPreviewHost(hostname)) return canonicalAppUrl();
  return `${window.location.origin}${pathname || "/app/"}`;
}
