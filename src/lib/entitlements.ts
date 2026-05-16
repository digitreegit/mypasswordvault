import { getSupabase, isSupabaseConfigured } from "./supabaseClient";

/** Free tier: max password entries when signed in with Supabase and no license. */
export const FREE_ENTRY_LIMIT = 25;

export async function fetchUserLicensed(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  const sb = getSupabase();
  if (!sb) return true;
  const { data, error } = await sb
    .from("user_entitlements")
    .select("licensed")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("fetchUserLicensed", error.message);
    return false;
  }
  return Boolean(data?.licensed);
}
