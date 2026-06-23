// Per-entry encryption.
//
// Every sensitive entry field (site, url, username, password, notes, memo,
// categoryId) is serialized to JSON and encrypted as a single AES-GCM blob
// (`VaultEntry.enc`). Only `id` and `updatedAt` remain in plaintext — they are
// needed for sync (last-write-wins) and storage keys and reveal nothing.
//
// Legacy vaults stored most fields in plaintext with only the password
// encrypted (`passwordEnc`). `decryptEntry` transparently reads both formats so
// older snapshots keep working until they are migrated to the encrypted form.

import { decryptString, encryptString } from "./crypto";
import type { VaultCategory, VaultEntry } from "./storage";

export interface EntrySecret {
  categoryId: string;
  site: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  memo: string;
}

const EMPTY_SECRET: EntrySecret = {
  categoryId: "",
  site: "",
  url: "",
  username: "",
  password: "",
  notes: "",
  memo: "",
};

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeSecret(raw: unknown): EntrySecret {
  if (raw === null || typeof raw !== "object") return { ...EMPTY_SECRET };
  const r = raw as Record<string, unknown>;
  return {
    categoryId: asString(r.categoryId),
    site: asString(r.site),
    url: asString(r.url),
    username: asString(r.username),
    password: asString(r.password),
    notes: asString(r.notes),
    memo: asString(r.memo),
  };
}

/** True when the row stores all fields in a single encrypted blob (new format). */
export function isEncryptedEntry(e: VaultEntry): boolean {
  return typeof e.enc === "string" && e.enc.length > 0;
}

export async function encryptEntrySecret(
  key: CryptoKey,
  secret: EntrySecret
): Promise<string> {
  return encryptString(key, JSON.stringify(secret));
}

/** Build a storage row that keeps only id/updatedAt in plaintext. */
export async function buildEncryptedEntryRow(
  key: CryptoKey,
  id: string,
  updatedAt: number,
  secret: EntrySecret
): Promise<VaultEntry> {
  const enc = await encryptEntrySecret(key, secret);
  return { id, updatedAt, enc };
}

/** Decrypt a row in either the new (enc blob) or legacy (plaintext) format. */
export async function decryptEntry(
  key: CryptoKey,
  e: VaultEntry
): Promise<EntrySecret> {
  if (isEncryptedEntry(e)) {
    try {
      const json = await decryptString(key, e.enc as string);
      return normalizeSecret(JSON.parse(json));
    } catch {
      return { ...EMPTY_SECRET };
    }
  }
  let password = "";
  if (e.passwordEnc) {
    try {
      password = await decryptString(key, e.passwordEnc);
    } catch {
      password = "";
    }
  }
  return {
    categoryId: asString(e.categoryId),
    site: asString(e.site),
    url: asString(e.url),
    username: asString(e.username),
    password,
    notes: asString(e.notes),
    memo: asString(e.memo),
  };
}

/** Encrypt the category list (folder labels) into a single AES-GCM blob. */
export async function encryptCategories(
  key: CryptoKey,
  categories: VaultCategory[]
): Promise<string> {
  return encryptString(key, JSON.stringify(categories ?? []));
}

export async function decryptCategories(
  key: CryptoKey,
  enc: string
): Promise<VaultCategory[]> {
  try {
    const arr = JSON.parse(await decryptString(key, enc));
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((c) => c && typeof c.id === "string")
      .map((c) => ({ id: c.id as string, name: asString(c.name) }));
  } catch {
    return [];
  }
}
