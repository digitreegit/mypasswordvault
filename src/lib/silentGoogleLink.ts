import { Capacitor } from "@capacitor/core";
import type { User } from "@supabase/supabase-js";
import {
  userHasAppleIdentity,
  userHasGoogleIdentity,
} from "./appleRelayAccount";
import { isNativeApp } from "./platform";

const FLAG_KEY = "mpv_silent_google_link_attempted_v1";

function flagKeyForUser(userId: string): string {
  return `${FLAG_KEY}:${userId}`;
}

export function hasAttemptedSilentGoogleLink(userId: string): boolean {
  if (typeof localStorage === "undefined") return true;
  try {
    return localStorage.getItem(flagKeyForUser(userId)) === "1";
  } catch {
    return true;
  }
}

export function markSilentGoogleLinkAttempted(userId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(flagKeyForUser(userId), "1");
  } catch {
    /* ignore quota */
  }
}

/** iOS Apple-only session that should get a one-shot Google link sheet. */
export function shouldSilentLinkGoogleAfterApple(user: User | null): boolean {
  if (!user) return false;
  if (!isNativeApp() || Capacitor.getPlatform() !== "ios") return false;
  if (!userHasAppleIdentity(user)) return false;
  if (userHasGoogleIdentity(user)) return false;
  if (hasAttemptedSilentGoogleLink(user.id)) return false;
  return true;
}

/**
 * Opens the Google account sheet once after Apple Sign-In.
 * Cancel is fine — marks attempted so we never nag.
 */
export async function maybeSilentLinkGoogleAfterApple(
  user: User | null,
  linkGoogleIdentity: () => Promise<void>,
): Promise<"skipped" | "started" | "done" | "cancelled"> {
  if (!shouldSilentLinkGoogleAfterApple(user) || !user) return "skipped";
  markSilentGoogleLinkAttempted(user.id);
  try {
    await linkGoogleIdentity();
    return "done";
  } catch (e) {
    const msg = String((e as Error)?.message ?? e ?? "").toLowerCase();
    if (
      msg.includes("cancel") ||
      msg.includes("dismiss") ||
      msg.includes("closed") ||
      msg.includes("abort")
    ) {
      return "cancelled";
    }
    // Non-cancel errors still count as attempted (flag already set).
    console.warn("silent Google link after Apple failed", e);
    return "cancelled";
  }
}
