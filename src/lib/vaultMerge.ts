import type { VaultEntry, VaultMeta } from "./storage";

export type VaultSnapshot = { meta: VaultMeta; entries: VaultEntry[] };

/**
 * What this device and the cloud last agreed on. Lets a sync tell "deleted on the other
 * device" apart from "added on this device" without storing tombstones in the snapshot.
 */
export type SyncBase = {
  /** Encrypted verifier of the vault's data key; a different key means a different vault. */
  verifier: string;
  metaSignature: string;
  entries: Record<string, number>;
};

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/** Meta content excluding bookkeeping that changes on every push. */
export function metaSignature(meta: VaultMeta): string {
  const { updatedAt: _updatedAt, cloudUserId: _owner, ...content } = meta;
  return canonicalJson(content);
}

export function syncBaseOf(snapshot: VaultSnapshot): SyncBase {
  const entries: Record<string, number> = {};
  for (const e of snapshot.entries) entries[e.id] = e.updatedAt;
  return {
    verifier: snapshot.meta.verifier,
    metaSignature: metaSignature(snapshot.meta),
    entries,
  };
}

export function sameEntries(a: VaultEntry[], b: VaultEntry[]): boolean {
  if (a.length !== b.length) return false;
  const byId = new Map(a.map((e) => [e.id, canonicalJson(e)]));
  return b.every((e) => byId.get(e.id) === canonicalJson(e));
}

export function sameSnapshot(a: VaultSnapshot, b: VaultSnapshot): boolean {
  return metaSignature(a.meta) === metaSignature(b.meta) && sameEntries(a.entries, b.entries);
}

/**
 * Per-entry three-way merge of two snapshots of the same vault.
 *
 * - Entry on both sides: the newer `updatedAt` wins.
 * - Entry on one side only: kept if it is new or edited since `base`; dropped if it was in
 *   `base` unchanged (the other side deleted it). Without a usable base nothing is dropped.
 * - Meta: the side that changed since `base` wins; if both or neither did, the newer one.
 *
 * Returns null when the snapshots were encrypted with different data keys (the vault was
 * re-created on one device); mixing their entries would make some undecryptable.
 */
export function mergeVaultSnapshots(
  local: VaultSnapshot,
  remote: VaultSnapshot,
  base: SyncBase | null,
): VaultSnapshot | null {
  if (local.meta.verifier !== remote.meta.verifier) return null;
  const usableBase = base && base.verifier === local.meta.verifier ? base : null;

  const localById = new Map(local.entries.map((e) => [e.id, e]));
  const remoteById = new Map(remote.entries.map((e) => [e.id, e]));
  const entries: VaultEntry[] = [];
  for (const id of new Set([...localById.keys(), ...remoteById.keys()])) {
    const l = localById.get(id);
    const r = remoteById.get(id);
    if (l && r) {
      entries.push(r.updatedAt > l.updatedAt ? r : l);
      continue;
    }
    const only = (l ?? r)!;
    const baseVersion = usableBase?.entries[id];
    if (baseVersion === undefined || only.updatedAt > baseVersion) entries.push(only);
  }

  const localSig = metaSignature(local.meta);
  const remoteSig = metaSignature(remote.meta);
  let meta: VaultMeta;
  if (localSig === remoteSig) {
    meta = local.meta;
  } else {
    const localChanged = !usableBase || localSig !== usableBase.metaSignature;
    const remoteChanged = !usableBase || remoteSig !== usableBase.metaSignature;
    if (localChanged && !remoteChanged) meta = local.meta;
    else if (remoteChanged && !localChanged) meta = remote.meta;
    else meta = remote.meta.updatedAt > local.meta.updatedAt ? remote.meta : local.meta;
  }
  return { meta, entries };
}
