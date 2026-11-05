import { openDB, type IDBPDatabase } from "idb";
import type { Locale } from "./i18n/locale";
import { metaSignature } from "./vaultMerge";

const DB_NAME = "mypasswordapp";
const DB_VERSION = 1;

const STORE_META = "meta";
const STORE_ENTRIES = "entries";

export interface VaultCategory {
  id: string;
  name: string;
}

/** WebAuthn credential stored in vault meta (public key only). */
export type PasskeyKind = "platform" | "security-key" | "hybrid";

export interface StoredPasskey {
  id: string;
  publicKey: string;
  algorithm: string;
  counter: number;
  transports: string[];
  createdAt: number;
  /** User-facing label chosen during setup (e.g. "Touch ID", "Security key"). */
  label?: string;
  /** Registration method — used to hide duplicate add options in Settings. */
  kind?: PasskeyKind;
  /** WebAuthn `user.name` saved on the device (shown in OS passkey prompts). */
  webAuthnName?: string;
  /** False when registered on device but PRF verification against the vault failed. */
  prfVerified?: boolean;
}

export interface VaultMeta {
  id: "vault";
  /** `2` = passkey-primary + backup TOTP + recovery codes. Omit = legacy TOTP-only. */
  authVersion?: number;
  // base64 PBKDF2 salt
  salt: string;
  /** PBKDF2 iteration count used to derive the password key. Omit = legacy (310k). */
  pbkdf2Iterations?: number;
  /** v2: AES-GCM wrap of random data key, encrypted with password-derived key. */
  passwordWrap?: string;
  /** v2: PRF-wrapped data key for passwordless passkey unlock. */
  passkeyDataKeyWrap?: string;
  /** v2: base64 salt for WebAuthn PRF extension. */
  prfSalt?: string;
  passkeys?: StoredPasskey[];
  /** Hostname (rpId) where passkeys were registered, e.g. `localhost` or `app.example.com`. */
  passkeyRpId?: string;
  recoveryCodeHashes?: string[];
  // base64 encrypted verifier (well-known plaintext encrypted with master key)
  verifier: string;
  // base64 encrypted backup TOTP secret (encrypted with vault data key)
  totpSecret: string;
  // base32 TOTP secret label hint (issuer/account)
  totpLabel: string;
  /**
   * Plaintext marker that an authenticator is configured. Password unlock then
   * requires either its current code or a one-time recovery code.
   *
   * This check is enforced by the client; the master password still derives
   * the key that decrypts the local vault.
   */
  requireSecondFactorAtUnlock?: boolean;
  // app settings
  autoLockMinutes: number;
  /**
   * Optional folder labels for entries (`VaultEntry.categoryId`).
   * In-memory (after unlock) this holds plaintext names; at rest / in the cloud
   * snapshot the names are encrypted into `categoriesEnc` instead.
   */
  categories?: VaultCategory[];
  /** AES-GCM blob (base64) of the categories array — encrypted-at-rest form. */
  categoriesEnc?: string;
  /** UI language (plaintext; not secret). */
  locale?: Locale;
  /** Supabase user id that owns this vault snapshot (cloud sync + account switch). */
  cloudUserId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VaultEntry {
  id: string;
  updatedAt: number;
  /**
   * New format: AES-GCM blob (base64) of the full secret payload
   * (categoryId, site, url, username, password, notes, memo). When present,
   * the legacy plaintext fields below are unused.
   */
  enc?: string;
  // ---- Legacy plaintext format (read-only fallback until migrated) ----
  /** References `VaultMeta.categories[].id`; empty = uncategorized. */
  categoryId?: string;
  site?: string;
  url?: string;
  username?: string;
  /** base64 (AES-GCM) encrypted password (legacy: only this field was encrypted). */
  passwordEnc?: string;
  notes?: string;
  /** Long-form notes; shown in expanded accordion (distinct from short `notes`). */
  memo?: string;
}

let _db: IDBPDatabase | null = null;

async function db(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(d) {
      if (!d.objectStoreNames.contains(STORE_META)) {
        d.createObjectStore(STORE_META, { keyPath: "id" });
      }
      if (!d.objectStoreNames.contains(STORE_ENTRIES)) {
        d.createObjectStore(STORE_ENTRIES, { keyPath: "id" });
      }
    },
  });
  return _db;
}

export async function getMeta(): Promise<VaultMeta | undefined> {
  return (await db()).get(STORE_META, "vault");
}

export async function putMeta(meta: VaultMeta): Promise<void> {
  await (await db()).put(STORE_META, meta);
}

export async function listEntries(): Promise<VaultEntry[]> {
  const all: VaultEntry[] = await (await db()).getAll(STORE_ENTRIES);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function putEntry(entry: VaultEntry): Promise<void> {
  await (await db()).put(STORE_ENTRIES, entry);
}

export async function deleteEntry(id: string): Promise<void> {
  await (await db()).delete(STORE_ENTRIES, id);
}

/** Erase everything on this device, including vaults stashed for other accounts. */
export async function wipeAll(): Promise<void> {
  const d = await db();
  const tx = d.transaction([STORE_META, STORE_ENTRIES], "readwrite");
  await Promise.all([tx.objectStore(STORE_META).clear(), tx.objectStore(STORE_ENTRIES).clear(), tx.done]);
}

/** Erase the active vault only; vaults stashed for other accounts stay. */
export async function clearActiveVault(): Promise<void> {
  const d = await db();
  const tx = d.transaction([STORE_META, STORE_ENTRIES], "readwrite");
  await Promise.all([tx.objectStore(STORE_META).delete("vault"), tx.objectStore(STORE_ENTRIES).clear(), tx.done]);
}

// Stashed vaults share the meta store under their own key, so a version bump (which old
// open tabs would block) is not needed.
const STASH_PREFIX = "stash:";

type StashedVault = { id: string; meta: VaultMeta; entries: VaultEntry[]; stashedAt: number };

/**
 * Keep an account's ciphertext snapshot on this device while another account uses it, so
 * edits that never reached the cloud are not lost on account switch.
 */
export async function stashVaultForAccount(
  userId: string,
  snapshot: { meta: VaultMeta; entries: VaultEntry[] },
): Promise<void> {
  const record: StashedVault = { id: STASH_PREFIX + userId, ...snapshot, stashedAt: Date.now() };
  await (await db()).put(STORE_META, record);
}

export async function deleteStashedVault(userId: string): Promise<void> {
  await (await db()).delete(STORE_META, STASH_PREFIX + userId);
}

/** Make the account's stashed vault the active vault (and drop the stash) in one transaction. */
export async function restoreStashedVault(userId: string): Promise<boolean> {
  const d = await db();
  const tx = d.transaction([STORE_META, STORE_ENTRIES], "readwrite");
  const metaStore = tx.objectStore(STORE_META);
  const entryStore = tx.objectStore(STORE_ENTRIES);
  try {
    const stash = (await metaStore.get(STASH_PREFIX + userId)) as StashedVault | undefined;
    if (!stash) {
      await tx.done;
      return false;
    }
    await Promise.all([
      metaStore.delete(STASH_PREFIX + userId),
      entryStore.clear(),
      metaStore.put({ ...stash.meta, id: "vault", cloudUserId: userId }),
      ...stash.entries.map((e) => entryStore.put(e)),
      tx.done,
    ]);
    return true;
  } catch (error) {
    try { tx.abort(); } catch { /* already aborted */ }
    await tx.done.catch(() => {});
    throw error;
  }
}

export function newId(): string {
  // 128-bit random id, hex encoded
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Replace a snapshot atomically: a failed write must leave the previous vault intact. */
export async function replaceVaultSnapshot(meta: VaultMeta, entries: VaultEntry[]): Promise<void> {
  const d = await db();
  const tx = d.transaction([STORE_META, STORE_ENTRIES], "readwrite");
  const writes: Promise<unknown>[] = [];
  try {
    writes.push(tx.objectStore(STORE_META).delete("vault"), tx.objectStore(STORE_ENTRIES).clear());
    writes.push(tx.objectStore(STORE_META).put(meta));
    for (const entry of entries) writes.push(tx.objectStore(STORE_ENTRIES).put(entry));
    await Promise.all([...writes, tx.done]);
  } catch (error) {
    try { tx.abort(); } catch { /* already aborted */ }
    await Promise.allSettled([...writes, tx.done]);
    throw error;
  }
}

/**
 * Write a merged cloud snapshot over the rows it was computed from. Rows and meta that
 * changed locally after `read` was taken are left alone (the next sync merges them), so a
 * background sync can never clobber an edit made while it was in flight.
 * Returns false when something was skipped for that reason.
 */
export async function applyVaultSnapshotChanges(
  read: { meta: VaultMeta; entries: VaultEntry[] },
  next: { meta: VaultMeta; entries: VaultEntry[] },
): Promise<boolean> {
  const d = await db();
  const tx = d.transaction([STORE_META, STORE_ENTRIES], "readwrite");
  const metaStore = tx.objectStore(STORE_META);
  const entryStore = tx.objectStore(STORE_ENTRIES);
  try {
    const [currentMeta, current] = await Promise.all([
      metaStore.get("vault") as Promise<VaultMeta | undefined>,
      entryStore.getAll() as Promise<VaultEntry[]>,
    ]);
    const readVersion = new Map(read.entries.map((e) => [e.id, e.updatedAt]));
    const currentById = new Map(current.map((e) => [e.id, e]));
    const nextIds = new Set(next.entries.map((e) => e.id));
    let complete = true;
    const writes: Promise<unknown>[] = [];

    for (const entry of next.entries) {
      const cur = currentById.get(entry.id);
      if (cur?.updatedAt !== readVersion.get(entry.id)) {
        complete = false;
        continue;
      }
      if (!cur || cur.updatedAt !== entry.updatedAt || cur.enc !== entry.enc) {
        writes.push(entryStore.put(entry));
      }
    }
    for (const cur of current) {
      if (nextIds.has(cur.id)) continue;
      if (readVersion.get(cur.id) === cur.updatedAt) writes.push(entryStore.delete(cur.id));
      else complete = false;
    }

    const metaUnchanged =
      currentMeta !== undefined &&
      currentMeta.updatedAt === read.meta.updatedAt &&
      metaSignature(currentMeta) === metaSignature(read.meta);
    if (metaUnchanged) {
      if (metaSignature(currentMeta) !== metaSignature(next.meta) ||
          currentMeta.updatedAt !== next.meta.updatedAt ||
          currentMeta.cloudUserId !== next.meta.cloudUserId) {
        writes.push(metaStore.put(next.meta));
      }
    } else {
      complete = false;
    }

    await Promise.all([...writes, tx.done]);
    return complete;
  } catch (error) {
    try { tx.abort(); } catch { /* already aborted */ }
    await tx.done.catch(() => {});
    throw error;
  }
}

/** Read key metadata and ciphertext rows from the same IndexedDB snapshot. */
export async function readVaultSnapshot(): Promise<{ meta: VaultMeta | undefined; entries: VaultEntry[] }> {
  const tx = (await db()).transaction([STORE_META, STORE_ENTRIES], "readonly");
  const [meta, entries] = await Promise.all([
    tx.objectStore(STORE_META).get("vault"), tx.objectStore(STORE_ENTRIES).getAll(), tx.done,
  ]);
  return { meta, entries };
}
