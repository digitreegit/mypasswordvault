/**
 * Master-password vault continuity (confirm-then-map).
 *
 * Body:
 *  { action: "register", proof } — bind proof → this user (must have vault data)
 *  { action: "check", proof }    — empty caller + matching proof → match:true (no moves)
 *  { action: "absorb", proof }   — empty caller + matching proof → move logins onto
 *                                  vault owner, delete empty Auth user, return session
 */
import { isEmptyClaimableAccount } from "../_shared/emptyAccount.ts";
import {
  adminClient,
  getAdminApiKey,
  hashContinuityProof,
  isValidContinuityProof,
  userClient,
} from "../_shared/vaultContinuity.ts";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PRIVATE_RELAY =
  /@(privaterelay\.appleid\.com|icloud\.com)$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function isDisplayEmailCandidate(email: string | undefined | null): boolean {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || !e.includes("@")) return false;
  if (PRIVATE_RELAY.test(e)) return false;
  return true;
}

async function userHasVaultBackup(
  admin: ReturnType<typeof adminClient>,
  userId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("user_vaults")
    .select("vault_backup")
    .eq("user_id", userId)
    .maybeSingle();
  const backup = data?.vault_backup;
  return typeof backup === "string" && backup.trim().length >= 10;
}

/** Wipe public rows for an empty user without deleting auth.users yet. */
async function scrubPublicRowsForUser(
  admin: ReturnType<typeof adminClient>,
  userId: string,
): Promise<void> {
  await admin.from("user_vaults").delete().eq("user_id", userId);
  await admin.from("user_entitlements").delete().eq("user_id", userId);
  await admin.from("vault_continuity").delete().eq("user_id", userId);
  await admin.from("auth_passkeys").delete().eq("user_id", userId);
}

/**
 * Resolve canonical user for an empty caller + proof, or null if no match.
 */
async function findAbsorbTarget(
  admin: ReturnType<typeof adminClient>,
  callerId: string,
  proofHash: string,
): Promise<{ canonicalId: string } | { match: false; reason?: string }> {
  const emptyOk = await isEmptyClaimableAccount(admin, callerId);
  if (!emptyOk) {
    return { match: false, reason: "caller_not_empty" };
  }

  const { data: row } = await admin
    .from("vault_continuity")
    .select("user_id")
    .eq("proof_hash", proofHash)
    .maybeSingle();
  if (!row?.user_id || row.user_id === callerId) {
    return { match: false };
  }
  const canonicalId = row.user_id as string;
  if (!(await userHasVaultBackup(admin, canonicalId))) {
    return { match: false, reason: "canonical_no_vault" };
  }
  return { canonicalId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const adminKey = getAdminApiKey();
  if (!supabaseUrl || !anonKey || !adminKey) {
    return json({ error: "server_misconfigured" }, 500);
  }

  const authz = req.headers.get("Authorization") ?? "";
  if (!authz.toLowerCase().startsWith("bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: { action?: string; proof?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!isValidContinuityProof(body.proof)) {
    return json({ error: "invalid_proof" }, 400);
  }

  const userSb = userClient(supabaseUrl, anonKey, authz);
  const { data: userData, error: userErr } = await userSb.auth.getUser();
  if (userErr || !userData.user) {
    return json({ error: "unauthorized" }, 401);
  }
  const caller = userData.user;
  const admin = adminClient(supabaseUrl, adminKey);
  const proofHash = await hashContinuityProof(body.proof);

  if (body.action === "register") {
    if (!(await userHasVaultBackup(admin, caller.id))) {
      return json({ error: "no_vault" }, 409);
    }

    const { data: existing } = await admin
      .from("vault_continuity")
      .select("user_id")
      .eq("proof_hash", proofHash)
      .maybeSingle();
    if (existing?.user_id && existing.user_id !== caller.id) {
      return json({ error: "proof_taken" }, 409);
    }

    await admin.from("vault_continuity").delete().eq("user_id", caller.id);
    const { error: upsertErr } = await admin.from("vault_continuity").upsert(
      {
        proof_hash: proofHash,
        user_id: caller.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "proof_hash" },
    );
    if (upsertErr) {
      console.error("vault-continuity register", upsertErr);
      return json({ error: "store_failed" }, 500);
    }
    return json({ ok: true });
  }

  if (body.action === "check") {
    const target = await findAbsorbTarget(admin, caller.id, proofHash);
    if (!("canonicalId" in target)) {
      return json({
        ok: true,
        match: false,
        reason: "reason" in target ? target.reason : undefined,
      });
    }
    return json({
      ok: true,
      match: true,
      canonicalUserId: target.canonicalId,
    });
  }

  if (body.action === "absorb") {
    const target = await findAbsorbTarget(admin, caller.id, proofHash);
    if (!("canonicalId" in target)) {
      return json({
        ok: true,
        absorbed: false,
        reason: "reason" in target ? target.reason : undefined,
      });
    }
    const canonicalId = target.canonicalId;

    const { data: canonicalUser, error: canErr } =
      await admin.auth.admin.getUserById(canonicalId);
    if (canErr || !canonicalUser.user) {
      return json({ error: "canonical_missing" }, 500);
    }

    const webEmail = caller.email?.trim() ?? "";
    const preferDisplayEmail = isDisplayEmailCandidate(webEmail);

    await scrubPublicRowsForUser(admin, caller.id);

    const { error: rpcErr } = await admin.rpc("admin_absorb_empty_auth_user", {
      p_empty_user_id: caller.id,
      p_canonical_user_id: canonicalId,
    });
    if (rpcErr) {
      console.error("vault-continuity absorb rpc", rpcErr);
      return json({ error: "absorb_failed", detail: rpcErr.message }, 500);
    }

    // After empty Auth user is gone, prefer normal web email as display primary.
    // Apple identity stays; Hide My Email is not rewritten.
    if (preferDisplayEmail) {
      const { error: emailErr } = await admin.auth.admin.updateUserById(
        canonicalId,
        { email: webEmail, email_confirm: true },
      );
      if (emailErr) {
        console.warn("vault-continuity display email", emailErr.message);
      }
    }

    const { data: afterUser } = await admin.auth.admin.getUserById(canonicalId);
    const sessionEmail =
      afterUser?.user?.email ||
      (preferDisplayEmail ? webEmail : null) ||
      canonicalUser.user.email;
    if (!sessionEmail) {
      return json({ error: "session_mint_failed" }, 500);
    }

    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: sessionEmail,
      });
    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("vault-continuity generateLink", linkErr);
      return json({ error: "session_mint_failed" }, 500);
    }

    return json({
      ok: true,
      absorbed: true,
      canonicalUserId: canonicalId,
      tokenHash: linkData.properties.hashed_token,
    });
  }

  return json({ error: "unknown_action" }, 400);
});
