import { getSupabase, isSupabaseConfigured } from "./supabaseClient";

/** Free tier: max password entries when signed in with Supabase and no license. */
export const FREE_ENTRY_LIMIT = 25;

export type UserEntitlement = {
  licensed: boolean;
  /** Stripe Checkout Session id recorded at purchase (display-only “license key”). */
  stripeCheckoutSessionId: string | null;
};

export async function fetchUserEntitlement(userId: string): Promise<UserEntitlement> {
  if (!isSupabaseConfigured) {
    return { licensed: true, stripeCheckoutSessionId: null };
  }
  const sb = getSupabase();
  if (!sb) {
    return { licensed: true, stripeCheckoutSessionId: null };
  }
  const { data, error } = await sb
    .from("user_entitlements")
    .select("licensed, stripe_checkout_session_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("fetchUserEntitlement", error.message);
    return { licensed: false, stripeCheckoutSessionId: null };
  }
  const sid =
    typeof data?.stripe_checkout_session_id === "string" &&
    data.stripe_checkout_session_id.trim()
      ? data.stripe_checkout_session_id.trim()
      : null;
  return { licensed: Boolean(data?.licensed), stripeCheckoutSessionId: sid };
}

export async function fetchUserLicensed(userId: string): Promise<boolean> {
  const e = await fetchUserEntitlement(userId);
  return e.licensed;
}
