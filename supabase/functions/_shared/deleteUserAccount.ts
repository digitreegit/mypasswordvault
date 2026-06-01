import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.8";

function isIgnorableAdminTableError(
  err: { message?: string; code?: string } | null,
): boolean {
  if (!err) return false;
  const m = err.message ?? "";
  const code = err.code ?? "";
  return (
    /column|does not exist|42703|admin_complaints|admin_complimentary|schema cache|PGRST204|42P01/i.test(
      m,
    ) ||
    code === "42703" ||
    code === "PGRST204" ||
    code === "42P01"
  );
}

async function resolveUserEmail(
  admin: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const fromAuth = (authUser?.user?.email ?? "").trim().toLowerCase();
  if (fromAuth) return fromAuth;

  const { data: ent } = await admin
    .from("user_entitlements")
    .select("account_email")
    .eq("user_id", userId)
    .maybeSingle();
  return (ent?.account_email ?? "").trim().toLowerCase();
}

/** Best-effort cleanup of admin-only rows tied to this account. */
async function cleanupAdminRecords(
  admin: SupabaseClient,
  userId: string,
  email: string,
): Promise<void> {
  const { error: compByUserErr } = await admin
    .from("admin_complaints")
    .delete()
    .eq("user_id", userId);
  if (compByUserErr && !isIgnorableAdminTableError(compByUserErr)) {
    console.error("delete-user: admin_complaints by user_id", compByUserErr);
  }

  if (!email) return;

  const { error: compByEmailErr } = await admin
    .from("admin_complaints")
    .delete()
    .ilike("account_email", email);
  if (compByEmailErr && !isIgnorableAdminTableError(compByEmailErr)) {
    console.error("delete-user: admin_complaints by email", compByEmailErr);
  }

  const now = new Date().toISOString();
  const { error: grantErr } = await admin
    .from("admin_complimentary_grants")
    .update({ revoked_at: now })
    .ilike("email", email)
    .is("revoked_at", null);
  if (grantErr && !isIgnorableAdminTableError(grantErr)) {
    console.error("delete-user: admin_complimentary_grants", grantErr);
  }
}

/**
 * Permanently delete a user account and all server-side data.
 * Same effect as Settings → Delete account (cloud vault, entitlements, auth).
 */
export async function permanentlyDeleteUserAccount(
  admin: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { error: "delete_failed" }> {
  const email = await resolveUserEmail(admin, userId);
  await cleanupAdminRecords(admin, userId, email);

  const { error: vaultErr } = await admin
    .from("user_vaults")
    .delete()
    .eq("user_id", userId);
  if (vaultErr) {
    console.error("delete-user: user_vaults", vaultErr);
    return { error: "delete_failed" };
  }

  const { error: entErr } = await admin
    .from("user_entitlements")
    .delete()
    .eq("user_id", userId);
  if (entErr) {
    console.error("delete-user: user_entitlements", entErr);
    return { error: "delete_failed" };
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) {
    console.error("delete-user: auth", delErr);
    return { error: "delete_failed" };
  }

  return { ok: true };
}
