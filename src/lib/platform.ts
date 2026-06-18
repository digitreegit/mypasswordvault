import { Capacitor } from "@capacitor/core";
import {
  canonicalAppUrl,
  isLocalDevHost,
  isVercelPreviewHost,
} from "./siteOrigin";

/** Custom URL scheme registered in iOS/Android for Supabase OAuth return. */
export const NATIVE_AUTH_SCHEME = "com.skyface.mypasswordvault";
export const NATIVE_AUTH_REDIRECT = `${NATIVE_AUTH_SCHEME}://auth/callback`;

/** App Store / Play non-consumable SKU — must match store consoles. */
export const STORE_PRO_PRODUCT_ID = "com.skyface.mypasswordvault.pro_lifetime";

/** Capacitor bundled WebView hostname — must match `server.hostname` and Apple Associated Domains. */
export const NATIVE_PASSKEY_HOSTNAME = "mypasswordvault.app";

export type NativePlatform = "ios" | "android";
export type ClientPlatform = NativePlatform | "web";

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function getNativePlatform(): NativePlatform | null {
  if (!isNativeApp()) return null;
  const p = Capacitor.getPlatform();
  if (p === "ios") return "ios";
  if (p === "android") return "android";
  return null;
}

export function getClientPlatform(): ClientPlatform {
  return getNativePlatform() ?? "web";
}

/** Web uses Stripe; native shells use store IAP (no Stripe card UI in-app). */
export function usesStoreBilling(): boolean {
  return isNativeApp();
}

type StorePricingCopyKey =
  | "storeBridgeLoading"
  | "storeBridgeFailed"
  | "storeBridgeFailedHint";

/** iOS vs Google Play pricing / IAP status copy. */
export function storePricingMessageKey(part: StorePricingCopyKey): string {
  return getNativePlatform() === "android"
    ? `pricing.${part}Android`
    : `pricing.${part}`;
}

export function storeBridgeMissingErrorCode(): string {
  return getNativePlatform() === "android"
    ? "errors.storeBridgeMissingAndroid"
    : "errors.storeBridgeMissing";
}

type StoreRestoreCopyKey = "storeRestoreTitle" | "storeRestoreHint";

/** iOS App Store vs Google Play restore copy. */
export function storeRestoreMessageKey(part: StoreRestoreCopyKey): string {
  return getNativePlatform() === "android"
    ? `pricing.${part}Android`
    : `pricing.${part}`;
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
