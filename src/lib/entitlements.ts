import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabaseClient";

/** Free tier: max password entries when signed in with Supabase and no license. */
export const FREE_ENTRY_LIMIT = 25;

export type PurchasePlatform = "web" | "ios" | "android";

export type UserEntitlement = {
  licensed: boolean;
  /** Stripe Checkout Session id recorded at purchase (display-only “license key”). */
  stripeCheckoutSessionId: string | null;
  purchasePlatform: PurchasePlatform | null;
};

function parsePurchasePlatform(raw: unknown): PurchasePlatform | null {
  if (raw === "web" || raw === "ios" || raw === "android") return raw;
  return null;
}

export type CachedEntitlement = { licensed: boolean; isAdmin: boolean };

const ENTITLEMENT_CACHE_PREFIX = "mpw_entitlement_v1:";

/**
 * Last server-confirmed plan per account, so an offline launch or a failed refresh
 * never shows a paying user as FREE. Display hint only; the server stays authoritative.
 */
export function readCachedEntitlement(userId: string): CachedEntitlement | null {
  try {
    const raw = localStorage.getItem(ENTITLEMENT_CACHE_PREFIX + userId);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<CachedEntitlement>;
    return { licensed: v.licensed === true, isAdmin: v.isAdmin === true };
  } catch {
    return null;
  }
}

export function writeCachedEntitlement(userId: string, v: CachedEntitlement): void {
  try {
    localStorage.setItem(ENTITLEMENT_CACHE_PREFIX + userId, JSON.stringify(v));
  } catch {
    /* storage full / private mode */
  }
}

/** Throws on network/server errors so callers never mistake an outage for "not licensed". */
export async function fetchUserEntitlement(userId: string): Promise<UserEntitlement> {
  if (!isSupabaseConfigured) {
    return { licensed: true, stripeCheckoutSessionId: null, purchasePlatform: null };
  }
  const sb = getSupabase();
  if (!sb) {
    return { licensed: true, stripeCheckoutSessionId: null, purchasePlatform: null };
  }
  const { data, error } = await sb
    .from("user_entitlements")
    .select("licensed, stripe_checkout_session_id, purchase_platform")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(`fetchUserEntitlement: ${error.message}`);
  }
  const sid =
    typeof data?.stripe_checkout_session_id === "string" &&
    data.stripe_checkout_session_id.trim()
      ? data.stripe_checkout_session_id.trim()
      : null;
  return {
    licensed: Boolean(data?.licensed),
    stripeCheckoutSessionId: sid,
    purchasePlatform: parsePurchasePlatform(data?.purchase_platform),
  };
}

/**
 * True when the server no longer has this device's session (e.g. revoked by a
 * global sign-out elsewhere). supabase-js clears the local session and emits
 * SIGNED_OUT in that case, so the app returns to the sign-in screen instead of
 * running on a still-unexpired access token as a free user. Network errors → false.
 */
export async function isServerSessionRevoked(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.auth.getUser();
    return Boolean(error && isAuthSessionMissingError(error));
  } catch {
    return false;
  }
}

export async function fetchUserLicensed(userId: string): Promise<boolean> {
  const e = await fetchUserEntitlement(userId);
  return e.licensed;
}
