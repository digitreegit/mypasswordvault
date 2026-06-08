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
import { buildVaultBackupJson, parseVaultBackup } from "./vaultBackup";
import { getSupabase } from "./supabaseClient";
import type { PostgrestError } from "@supabase/supabase-js";
import { vaultPasskeysIndicateDifferentAccount } from "./passkey";
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
 * On sign-in: merge local IndexedDB with cloud snapshot using `meta.updatedAt` (last-write-wins).
 * Does not decrypt secrets — only moves ciphertext JSON.
 */
export async function reconcileCloudAtStartup(
  userId: string,
  userEmail?: string | null,
): Promise<void> {
  const remote = await fetchRemoteVaultBackup(userId);
  const local = await getMeta();
  const localOwner = resolveVaultOwner(local);

  if (local && localOwner && localOwner !== userId) {
    await switchLocalVaultToAccount(userId);
    return;
  }

  if (
    local &&
    !localOwner &&
    vaultPasskeysIndicateDifferentAccount(local.passkeys, userEmail)
  ) {
    await switchLocalVaultToAccount(userId);
    return;
  }

  if (!remote && !local) return;

  if (!remote && local) {
    const stamped = stampVaultMetaForUser(local, userId);
    if (stamped !== local) await putMeta(stamped);
    const json = buildVaultBackupJson(stamped, await listEntries());
    await upsertRemoteVaultBackup(userId, json);
    return;
  }

  if (remote && !local) {
    const { meta, entries } = parseVaultBackup(remote);
    await importVaultSnapshot(meta, entries, userId);
    return;
  }

  if (remote && local) {
    const localJson = buildVaultBackupJson(
      stampVaultMetaForUser(local, userId),
      await listEntries(),
    );
    let remoteTime: number;
    let localTime: number;
    try {
      remoteTime = parseVaultBackup(remote).meta.updatedAt;
      localTime = parseVaultBackup(localJson).meta.updatedAt;
    } catch {
      await upsertRemoteVaultBackup(userId, localJson);
      return;
    }
    if (remoteTime > localTime) {
      const { meta, entries } = parseVaultBackup(remote);
      await importVaultSnapshot(meta, entries, userId);
    } else if (localTime > remoteTime) {
      await upsertRemoteVaultBackup(userId, localJson);
    }
  }
}
