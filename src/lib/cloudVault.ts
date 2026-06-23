import {
  getMeta,
  listEntries,
  putEntry,
  putMeta,
  wipeAll,
  type VaultEntry,
  type VaultMeta,
} from "./storage";
import { AppError } from "./errors";
import { buildVaultBackupJson, parseVaultBackup, snapshotRevision, snapshotRevisionFromPayload } from "./vaultBackup";
import { getSupabase } from "./supabaseClient";
import type { PostgrestError } from "@supabase/supabase-js";
import { vaultPasskeysIndicateDifferentAccount } from "./passkey";
import {
  clearCloudSyncPending,
  markCloudSyncPending,
} from "./cloudSyncPending";
import {
  clearVaultOwnerUserId,
  resolveVaultOwner,
  setVaultOwnerUserId,
  stampVaultMetaForUser,
} from "./vaultOwner";

/** PostgREST when `user_vaults` was never created in the project. */
function assertSupabaseVaultOk(error: PostgrestError | null): void {
  if (!error) return;
  const msg = error.message ?? "";
  if (
    error.code === "PGRST205" ||
    /user_vaults/i.test(msg) ||
    (/schema cache/i.test(msg) && /could not find the table/i.test(msg))
  ) {
    throw new AppError("errors.missingUserVaultsTable");
  }
  throw error;
}

export async function fetchRemoteVaultBackup(
  userId: string
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_vaults")
    .select("vault_backup")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) assertSupabaseVaultOk(error);
  const raw = data?.vault_backup;
  if (typeof raw !== "string" || raw.length === 0) return null;
  return raw;
}

export async function upsertRemoteVaultBackup(
  userId: string,
  backupJson: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("user_vaults").upsert(
    {
      user_id: userId,
      vault_backup: backupJson,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) assertSupabaseVaultOk(error);
}

export async function deleteRemoteVaultBackup(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase
    .from("user_vaults")
    .delete()
    .eq("user_id", userId);
  if (error) assertSupabaseVaultOk(error);
}

/** Push local vault snapshot to Supabase; tracks offline pending state. */
export async function pushVaultBackupToCloud(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return true;
  const m = await getMeta();
  if (!m) return true;
  try {
    const stamped = stampVaultMetaForUser(m, userId);
    const entries = await listEntries();
    const revision = snapshotRevision(stamped, entries);
    const metaForPush =
      revision > stamped.updatedAt
        ? { ...stamped, updatedAt: revision }
        : stamped;
    if (metaForPush !== stamped) await putMeta(metaForPush);
    const json = buildVaultBackupJson(metaForPush, entries);
    await upsertRemoteVaultBackup(userId, json);
    clearCloudSyncPending(userId);
    return true;
  } catch (e) {
    console.error("Cloud vault push failed", e);
    markCloudSyncPending(userId);
    return false;
  }
}

export type CloudReconcileResult =
  | "remote_applied"
  | "local_pushed"
  | "unchanged"
  | "empty";

function compareVaultSnapshots(
  remote: ReturnType<typeof parseVaultBackup>,
  local: ReturnType<typeof parseVaultBackup>,
): "remote" | "local" | "equal" {
  const remoteRev = snapshotRevisionFromPayload(remote);
  const localRev = snapshotRevisionFromPayload(local);
  if (remoteRev > localRev) return "remote";
  if (localRev > remoteRev) return "local";
  if (remote.entries.length !== local.entries.length) {
    return remote.entries.length > local.entries.length ? "remote" : "local";
  }
  return "equal";
}

async function importVaultSnapshot(
  meta: VaultMeta,
  entries: VaultEntry[],
  ownerUserId: string,
): Promise<void> {
  await wipeAll();
  const metaNorm = stampVaultMetaForUser(
    { ...meta, categories: meta.categories ?? [] },
    ownerUserId,
  );
  await putMeta(metaNorm);
  for (const e of entries) {
    if (typeof e.enc === "string" && e.enc.length > 0) {
      await putEntry({ id: e.id, updatedAt: e.updatedAt, enc: e.enc });
      continue;
    }
    const row: VaultEntry = {
      ...e,
      categoryId: typeof e.categoryId === "string" ? e.categoryId : "",
      memo: typeof e.memo === "string" ? e.memo : "",
    };
    await putEntry(row);
  }
}

/**
 * Replace the local vault with the remote snapshot (ignores timestamps).
 * Use on a new device or when the local copy is wrong; unlock afterward with the same
 * master password and TOTP as when the vault was created.
 */
export async function forcePullRemoteVault(userId: string): Promise<boolean> {
  const remote = await fetchRemoteVaultBackup(userId);
  if (!remote) return false;
  let payload: ReturnType<typeof parseVaultBackup>;
  try {
    payload = parseVaultBackup(remote);
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("errors.invalidBackup");
  }
  const { meta, entries } = payload;
  await importVaultSnapshot(meta, entries, userId);
  return true;
}

async function switchLocalVaultToAccount(userId: string): Promise<void> {
  const remote = await fetchRemoteVaultBackup(userId);
  await wipeAll();
  clearVaultOwnerUserId();
  if (remote) {
    const { meta, entries } = parseVaultBackup(remote);
    await importVaultSnapshot(meta, entries, userId);
    return;
  }
  setVaultOwnerUserId(userId);
}

/**
 * Merge local IndexedDB with cloud snapshot (entry-aware last-write-wins).
 * Does not decrypt secrets — only moves ciphertext JSON.
 */
export async function reconcileCloudVault(
  userId: string,
  userEmail?: string | null,
): Promise<CloudReconcileResult> {
  const remote = await fetchRemoteVaultBackup(userId);
  const local = await getMeta();
  const localOwner = resolveVaultOwner(local);

  if (local && localOwner && localOwner !== userId) {
    await switchLocalVaultToAccount(userId);
    return "remote_applied";
  }

  if (
    local &&
    !localOwner &&
    vaultPasskeysIndicateDifferentAccount(local.passkeys, userEmail)
  ) {
    await switchLocalVaultToAccount(userId);
    return "remote_applied";
  }

  if (!remote && !local) return "empty";

  if (!remote && local) {
    const stamped = stampVaultMetaForUser(local, userId);
    if (stamped !== local) await putMeta(stamped);
    const entries = await listEntries();
    const revision = snapshotRevision(stamped, entries);
    const metaForPush =
      revision > stamped.updatedAt
        ? { ...stamped, updatedAt: revision }
        : stamped;
    if (metaForPush !== stamped) await putMeta(metaForPush);
    const json = buildVaultBackupJson(metaForPush, entries);
    await upsertRemoteVaultBackup(userId, json);
    clearCloudSyncPending(userId);
    return "local_pushed";
  }

  if (remote && !local) {
    const { meta, entries } = parseVaultBackup(remote);
    await importVaultSnapshot(meta, entries, userId);
    return "remote_applied";
  }

  if (remote && local) {
    const stamped = stampVaultMetaForUser(local, userId);
    const entries = await listEntries();
    const revision = snapshotRevision(stamped, entries);
    const metaForLocal =
      revision > stamped.updatedAt ? { ...stamped, updatedAt: revision } : stamped;
    const localJson = buildVaultBackupJson(metaForLocal, entries);
    let remotePayload: ReturnType<typeof parseVaultBackup>;
    let localPayload: ReturnType<typeof parseVaultBackup>;
    try {
      remotePayload = parseVaultBackup(remote);
      localPayload = parseVaultBackup(localJson);
    } catch {
      await upsertRemoteVaultBackup(userId, localJson);
      clearCloudSyncPending(userId);
      return "local_pushed";
    }
    const winner = compareVaultSnapshots(remotePayload, localPayload);
    if (winner === "remote") {
      const { meta, entries: remoteEntries } = remotePayload;
      await importVaultSnapshot(meta, remoteEntries, userId);
      return "remote_applied";
    }
    if (winner === "local") {
      if (metaForLocal !== stamped) await putMeta(metaForLocal);
      await upsertRemoteVaultBackup(userId, localJson);
      clearCloudSyncPending(userId);
      return "local_pushed";
    }
    return "unchanged";
  }

  return "unchanged";
}

/** @deprecated Use reconcileCloudVault */
export async function reconcileCloudAtStartup(
  userId: string,
  userEmail?: string | null,
): Promise<void> {
  await reconcileCloudVault(userId, userEmail);
}
