import { getClientPlatform } from "./platform";
import { getSupabase, isSupabaseConfigured } from "./supabaseClient";
import { inferSignupCountry } from "./inferSignupCountry";

let lastRecordedUserId: string | null = null;

/** Persist first sign-in platform and region for admin dashboard. Idempotent. */
export async function recordSignupPlatform(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;
  if (lastRecordedUserId === userId) return;

  const sb = getSupabase();
  if (!sb) return;

  const platform = getClientPlatform();
  const country = inferSignupCountry();
  const { error } = await sb.rpc("record_signup_platform", {
    p_platform: platform,
    p_country: country,
  });
  if (error) {
    console.warn("record_signup_platform", error.message);
    return;
  }
  lastRecordedUserId = userId;
}
