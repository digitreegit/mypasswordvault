import { isNativeApp } from "./platform";

/** Full-page shell: fixed viewport on Capacitor, min-height page on web. */
export function nativeScreenRootClass(extra = ""): string {
  if (!isNativeApp()) {
    return `min-h-screen min-h-[100dvh] flex flex-col w-full min-w-0 overflow-x-hidden ${extra}`.trim();
  }
  return `native-screen flex flex-col ${extra}`.trim();
}

/** Pinned header region (not document scroll). */
export function nativeFixedHeaderClass(extra = ""): string {
  if (!isNativeApp()) {
    return `sticky top-0 z-10 w-full ${extra}`.trim();
  }
  return `native-screen__header z-10 w-full shrink-0 ${extra}`.trim();
}

/** Main content scroll area inside a native-screen. */
export function nativeMainScrollClass(extra = ""): string {
  if (!isNativeApp()) {
    return `flex-1 min-w-0 ${extra}`.trim();
  }
  return `native-screen__scroll native-scroll ${extra}`.trim();
}

/** Hash route to the unlocked vault list (Capacitor serves the SPA at `/`, not `/app/`). */
export function vaultHomeHref(): string {
  return "#/";
}
