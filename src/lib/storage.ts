import { openDB, type IDBPDatabase } from "idb";
import type { Locale } from "./i18n/locale";

const DB_NAME = "mypasswordapp";
const DB_VERSION = 1;

const STORE_META = "meta";
const STORE_ENTRIES = "entries";

export interface VaultCategory {
  id: string;
  name: string;
}

export interface VaultMeta {
  id: "vault";
  // base64 PBKDF2 salt
  salt: string;
  // base64 encrypted verifier (well-known plaintext encrypted with master key)
  verifier: string;
  // base64 encrypted TOTP secret (encrypted with master key); empty until 2FA enrolled
  totpSecret: string;
  // base32 TOTP secret label hint (issuer/account)
  totpLabel: string;
  // app settings
  autoLockMinutes: number;
  /** Optional folder labels for entries (`VaultEntry.categoryId`). */
  categories?: VaultCategory[];
  /** UI language (plaintext; not secret). */
  locale?: Locale;
  createdAt: number;
  updatedAt: number;
}

export interface VaultEntry {
  id: string;
  /** References `VaultMeta.categories[].id`; empty = uncategorized. */
  categoryId: string;
  site: string;
  url: string;
  username: string;
  // base64 (AES-GCM) encrypted password
  passwordEnc: string;
  notes: string;
  /** Long-form notes; shown in expanded accordion (distinct from short `notes`). */
  memo: string;
  updatedAt: number;
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

export async function wipeAll(): Promise<void> {
  const d = await db();
  await d.clear(STORE_META);
  await d.clear(STORE_ENTRIES);
}

export function newId(): string {
  // 128-bit random id, hex encoded
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}
