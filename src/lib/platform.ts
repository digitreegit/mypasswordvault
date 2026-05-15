import { Capacitor } from "@capacitor/core";

/** Custom URL scheme registered in iOS/Android for Supabase OAuth return. */
export const NATIVE_AUTH_SCHEME = "com.skyface.mypasswordvault";
export const NATIVE_AUTH_REDIRECT = `${NATIVE_AUTH_SCHEME}://auth/callback`;

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function getOAuthRedirectUrl(): string {
  if (isNativeApp()) return NATIVE_AUTH_REDIRECT;
  if (typeof window === "undefined") return "/";
  return `${window.location.origin}${window.location.pathname || "/"}`;
}
