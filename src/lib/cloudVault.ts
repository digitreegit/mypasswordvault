import {
  applyVaultSnapshotChanges,
  getMeta,
  replaceVaultSnapshot,
  readVaultSnapshot,
  wipeAll,
  type VaultEntry,
  type VaultMeta,
} from "./storage";
import { AppError } from "./errors";
import { buildVaultBackupJson, parseVaultBackup, snapshotRevision } from "./vaultBackup";
import { getSupabase } from "./supabaseClient";
import type { PostgrestError } from "@supabase/supabase-js";
import { vaultPasskeysIndicateDifferentAccount } from "./passkey";
import {
  clearCloudSyncPending,
  hasCloudSyncPending,
  markCloudSyncPending,
} from "./cloudSyncPending";
import {
  clearVaultOwnerUserId,
  resolveVaultOwner,
  setVaultOwnerUserId,
  stampVaultMetaForUser,
} from "./vaultOwner";
import {
  mergeVaultSnapshots,
  sameSnapshot,
  syncBaseOf,
  type SyncBase,
  type VaultSnapshot,
} from "./vaultMerge";

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

type RemoteVaultRow = { json: string; updatedAt: string };

async function fetchRemoteVaultRow(userId: string): Promise<RemoteVaultRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_vaults")
    .select("vault_backup, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) assertSupabaseVaultOk(error);
  const raw = data?.vault_backup;
  if (typeof raw !== "string" || raw.length === 0) return null;
  return { json: raw, updatedAt: String(data?.updated_at ?? "") };
}

export async function fetchRemoteVaultBackup(userId: string): Promise<string | null> {
  return (await fetchRemoteVaultRow(userId))?.json ?? null;
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

/**
 * Compare-and-swap on `updated_at`, so a device never overwrites a snapshot it has not
 * merged. Returns false when another device wrote in between (the caller re-merges).
 */
async function writeRemoteVaultIfUnchanged(
  userId: string,
  backupJson: string,
  expectedUpdatedAt: string | null,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return true;
  const row = { vault_backup: backupJson, updated_at: new Date().toISOString() };
  if (expectedUpdatedAt === null) {
    const { error } = await supabase.from("user_vaults").insert({ user_id: userId, ...row });
    if (error?.code === "23505") return false;
    if (error) assertSupabaseVaultOk(error);
    return true;
  }
  const { data, error } = await supabase
    .from("user_vaults")
    .update(row)
    .eq("user_id", userId)
    .eq("updated_at", expectedUpdatedAt)
    .select("user_id");
  if (error) assertSupabaseVaultOk(error);
  return (data?.length ?? 0) > 0;
}

export async function deleteRemoteVaultBackup(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase
    .from("user_vaults")
    .delete()
    .eq("user_id", userId);
  if (error) assertSupabaseVaultOk(error);
  clearSyncBase(userId);
}

const SYNC_BASE_PREFIX = "mpw_sync_base_v1:";

function readSyncBase(userId: string): SyncBase | null {
  try {
    const raw = localStorage.getItem(SYNC_BASE_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SyncBase;
    if (typeof parsed?.verifier !== "string" || typeof parsed.entries !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSyncBase(userId: string, snapshot: VaultSnapshot): void {
  try {
    localStorage.setItem(SYNC_BASE_PREFIX + userId, JSON.stringify(syncBaseOf(snapshot)));
  } catch {
    /* without a base the next merge keeps every entry instead of dropping deletions */
  }
}

function clearSyncBase(userId: string): void {
  try {
    localStorage.removeItem(SYNC_BASE_PREFIX + userId);
  } catch {
    /* ignore */
  }
}

/** Old clients compare whole snapshots by their newest timestamp; keep that meaningful. */
function withRevision(snapshot: VaultSnapshot): VaultSnapshot {
  const revision = snapshotRevision(snapshot.meta, snapshot.entries);
  return revision > snapshot.meta.updatedAt
    ? { ...snapshot, meta: { ...snapshot.meta, updatedAt: revision } }
    : snapshot;
}

function normalizeEntry(e: VaultEntry): VaultEntry {
  return typeof e.enc === "string" && e.enc.length > 0
    ? { id: e.id, updatedAt: e.updatedAt, enc: e.enc }
    : { ...e, categoryId: e.categoryId ?? "", memo: e.memo ?? "" };
}

export type CloudReconcileResult =
  | "remote_applied"
  | "local_pushed"
  | "unchanged"
  | "empty";

function compareVaultSnapshots(
  remote: VaultSnapshot,
  local: VaultSnapshot,
): "remote" | "local" | "equal" {
  const remoteRev = snapshotRevision(remote.meta, remote.entries);
  const localRev = snapshotRevision(local.meta, local.entries);
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
  const metaNorm = { ...meta, cloudUserId: ownerUserId };
  const normalized = entries.map(normalizeEntry);
  await replaceVaultSnapshot(metaNorm, normalized);
  setVaultOwnerUserId(ownerUserId);
  writeSyncBase(ownerUserId, { meta: metaNorm, entries: normalized });
}

/**
 * Replace the local vault with the remote snapshot (ignores timestamps).
 * Use on a new device or when the local copy is wrong; unlock afterward with the same
 * master password and TOTP as when the vault was created.
 */
async function forcePullRemoteVaultInternal(userId: string): Promise<boolean> {
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
  if (remote) {
    const { meta, entries } = parseVaultBackup(remote);
    await importVaultSnapshot(meta, entries, userId);
    return;
  }
  await wipeAll();
  clearVaultOwnerUserId();
  setVaultOwnerUserId(userId);
  clearSyncBase(userId);
}

const MAX_SYNC_ATTEMPTS = 3;

/**
 * Bring this device and the cloud to the same vault: merge per entry against the last
 * synced state, write whichever side is behind, and never overwrite a cloud snapshot this
 * device has not merged. Requires a local vault owned by `userId`.
 */
async function syncLocalWithRemote(userId: string, attempt = 1): Promise<CloudReconcileResult> {
  const { meta: rawMeta, entries } = await readVaultSnapshot();
  if (!rawMeta) return "empty";
  const read = { meta: rawMeta, entries };
  const local: VaultSnapshot = { meta: stampVaultMetaForUser(rawMeta, userId), entries };
  const remoteRow = await fetchRemoteVaultRow(userId);
  const lastAttempt = attempt >= MAX_SYNC_ATTEMPTS;

  if (!remoteRow) {
    const outgoing = withRevision(local);
    const json = buildVaultBackupJson(outgoing.meta, outgoing.entries);
    if (lastAttempt) await upsertRemoteVaultBackup(userId, json);
    else if (!(await writeRemoteVaultIfUnchanged(userId, json, null))) {
      return syncLocalWithRemote(userId, attempt + 1);
    }
    writeSyncBase(userId, outgoing);
    clearCloudSyncPending(userId);
    return "local_pushed";
  }

  const remote = parseVaultBackup(remoteRow.json);
  // First sync on this device (e.g. right after updating): with nothing left unpushed, the
  // local copy is what it last synced, so deletions made elsewhere still apply. With a failed
  // push outstanding, keep everything rather than guess.
  const base = readSyncBase(userId) ??
    (hasCloudSyncPending(userId) ? null : syncBaseOf(local));
  const merged = mergeVaultSnapshots(local, remote, base);

  if (!merged) {
    // Re-created vault (different data key): entries cannot be mixed, keep the newer vault.
    const outgoing = withRevision(local);
    const winner = compareVaultSnapshots(remote, outgoing);
    if (winner === "remote") {
      await importVaultSnapshot(remote.meta, remote.entries, userId);
      return "remote_applied";
    }
    if (winner === "local") {
      const json = buildVaultBackupJson(outgoing.meta, outgoing.entries);
      if (lastAttempt) await upsertRemoteVaultBackup(userId, json);
      else if (!(await writeRemoteVaultIfUnchanged(userId, json, remoteRow.updatedAt))) {
        return syncLocalWithRemote(userId, attempt + 1);
      }
      writeSyncBase(userId, outgoing);
      clearCloudSyncPending(userId);
      return "local_pushed";
    }
    return "unchanged";
  }

  const result: VaultSnapshot = {
    meta: { ...merged.meta, cloudUserId: userId },
    entries: merged.entries.map(normalizeEntry),
  };
  const remoteBehind = !sameSnapshot(result, remote);
  const localBehind = !sameSnapshot(result, local);

  if (remoteBehind) {
    const outgoing = withRevision(result);
    const json = buildVaultBackupJson(outgoing.meta, outgoing.entries);
    if (lastAttempt) await upsertRemoteVaultBackup(userId, json);
    else if (!(await writeRemoteVaultIfUnchanged(userId, json, remoteRow.updatedAt))) {
      return syncLocalWithRemote(userId, attempt + 1);
    }
  }
  if (localBehind) {
    await applyVaultSnapshotChanges(read, result);
  }
  writeSyncBase(userId, result);
  clearCloudSyncPending(userId);
  if (localBehind) return "remote_applied";
  return remoteBehind ? "local_pushed" : "unchanged";
}

export type CloudPushResult = CloudReconcileResult | "failed";

/** Sync after a local change; may also pull changes made on other devices. */
async function pushVaultBackupToCloudInternal(userId: string): Promise<CloudPushResult> {
  const supabase = getSupabase();
  if (!supabase) return "unchanged";
  const m = await getMeta();
  if (!m) return "unchanged";
  if (resolveVaultOwner(m) !== userId) return "failed";
  try {
    return await syncLocalWithRemote(userId);
  } catch (e) {
    console.error("Cloud vault push failed", e);
    markCloudSyncPending(userId);
    return "failed";
  }
}

/**
 * Merge local IndexedDB with the cloud snapshot (per-entry three-way merge).
 * Does not decrypt secrets — only moves ciphertext JSON.
 */
async function reconcileCloudVaultInternal(
  userId: string,
  userEmail?: string | null,
): Promise<CloudReconcileResult> {
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

  if (!local) {
    const remote = await fetchRemoteVaultBackup(userId);
    if (!remote) return "empty";
    const { meta, entries } = parseVaultBackup(remote);
    await importVaultSnapshot(meta, entries, userId);
    return "remote_applied";
  }

  return syncLocalWithRemote(userId);
}

/** @deprecated Use reconcileCloudVault */
export async function reconcileCloudAtStartup(
  userId: string,
  userEmail?: string | null,
): Promise<void> {
  await reconcileCloudVault(userId, userEmail);
}

// Serialize account reconciliation and pending pushes, including across browser tabs.
let cloudQueue: Promise<unknown> = Promise.resolve();
function withCloudLock<T>(task: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => typeof navigator !== "undefined" && navigator.locks
    ? await navigator.locks.request("mpv-cloud-vault", task)
    : task();
  const result = cloudQueue.then(run, run);
  cloudQueue = result.catch(() => {});
  return result;
}
export function pushVaultBackupToCloud(userId: string): Promise<CloudPushResult> {
  return withCloudLock(() => pushVaultBackupToCloudInternal(userId));
}
export function reconcileCloudVault(userId: string, userEmail?: string | null): Promise<CloudReconcileResult> {
  return withCloudLock(() => reconcileCloudVaultInternal(userId, userEmail));
}
export function forcePullRemoteVault(userId: string): Promise<boolean> {
  return withCloudLock(() => forcePullRemoteVaultInternal(userId));
}
