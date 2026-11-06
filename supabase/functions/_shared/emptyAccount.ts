import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.8";

export type AuthProvider = "apple" | "google" | "email";

/**
 * Strict "empty duplicate" check for claim-auth-identity.
 * Any real vault backup, PRO license, or complimentary grant blocks deletion.
 */
export async function isEmptyClaimableAccount(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: vault, error: vaultErr } = await admin
    .from("user_vaults")
    .select("vault_backup")
    .eq("user_id", userId)
    .maybeSingle();
  if (vaultErr) {
    console.error("emptyAccount: user_vaults", vaultErr);
    return false;
  }
  const backup = vault?.vault_backup;
  if (typeof backup === "string" && backup.trim().length >= 10) {
    return false;
  }

  const { data: ent, error: entErr } = await admin
    .from("user_entitlements")
    .select("licensed, complimentary_grant, store_transaction_id, stripe_checkout_session_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (entErr) {
    console.error("emptyAccount: user_entitlements", entErr);
    return false;
  }
  if (ent?.licensed === true) return false;
  if (ent?.complimentary_grant === true) return false;
  if (ent?.store_transaction_id) return false;
  if (ent?.stripe_checkout_session_id) return false;

  const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(
    userId,
  );
  if (authErr || !authUser?.user) {
    console.error("emptyAccount: getUserById", authErr);
    return false;
  }
  const email = (authUser.user.email ?? "").trim().toLowerCase();
  if (email) {
    const { data: grants, error: grantErr } = await admin
      .from("admin_complimentary_grants")
      .select("id")
      .ilike("email", email)
      .is("revoked_at", null)
      .limit(1);
    if (grantErr) {
      // Table may be missing on some envs — ignore schema errors, fail closed on others.
      const m = grantErr.message ?? "";
      if (!/does not exist|42P01|schema cache|PGRST204/i.test(m)) {
        console.error("emptyAccount: complimentary", grantErr);
        return false;
      }
    } else if ((grants?.length ?? 0) > 0) {
      return false;
    }
  }

  return true;
}

export function userHasProvider(
  user: { identities?: { provider: string }[] | null; app_metadata?: Record<string, unknown> },
  provider: AuthProvider,
): boolean {
  const identities = user.identities ?? [];
  if (identities.some((i) => i.provider === provider)) return true;
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers) && providers.includes(provider)) return true;
  return user.app_metadata?.provider === provider;
}
