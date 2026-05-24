import { Capacitor } from "@capacitor/core";
import { isNativeApp } from "./platform";

export type SignInLogDevice = "desktop" | "mobile" | "tablet" | "ios" | "android";

const LOCATION_FETCH_MS = 4000;

function isMobileUserAgent(ua: string): boolean {
  return /iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    ua
  );
}

function isTabletUserAgent(ua: string): boolean {
  if (/iPad/i.test(ua)) return true;
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return true;
  if (typeof window !== "undefined") {
    return (
      navigator.maxTouchPoints > 1 &&
      window.matchMedia("(min-width: 768px) and (max-width: 1024px)").matches
    );
  }
  return false;
}

export function detectSignInDevice(): SignInLogDevice {
  if (isNativeApp()) {
    const platform = Capacitor.getPlatform();
    if (platform === "ios") return "ios";
    if (platform === "android") return "android";
  }
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (isTabletUserAgent(ua)) return "tablet";
  if (isMobileUserAgent(ua)) return "mobile";
  return "desktop";
}

function uniqueLocationParts(parts: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const trimmed = part?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function formatSignInLocationLabel(parts: {
  city?: string;
  region?: string;
  country?: string;
}): string | null {
  const label = uniqueLocationParts([parts.city, parts.region, parts.country]).join(
    ", "
  );
  return label || null;
}

async function fetchLocationFromIp(): Promise<string | null> {
  if (typeof fetch === "undefined") return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOCATION_FETCH_MS);
  try {
    const res = await fetch("https://ipwho.is/", {
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      success?: boolean;
      city?: string;
      region?: string;
      country?: string;
    };
    if (!data.success) return null;
    return formatSignInLocationLabel(data);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveSignInLogContext(): Promise<{
  device: SignInLogDevice;
  location: string | null;
}> {
  const device = detectSignInDevice();
  const location = await fetchLocationFromIp();
  return { device, location };
}
