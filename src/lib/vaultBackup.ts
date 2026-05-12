import { AppError } from "./errors";
import type { VaultEntry, VaultMeta } from "./storage";

export const VAULT_BACKUP_FORMAT = "mypasswordapp-backup" as const;
export const VAULT_BACKUP_VERSION = 1;

export interface VaultBackupPayload {
  format: typeof VAULT_BACKUP_FORMAT;
  version: number;
  exportedAt: number;
  meta: VaultMeta;
  entries: VaultEntry[];
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

export function parseVaultBackup(jsonText: string): VaultBackupPayload {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    throw new AppError("errors.invalidBackup");
  }
  if (!isRecord(raw)) throw new AppError("errors.invalidBackup");
  if (raw.format !== VAULT_BACKUP_FORMAT) throw new AppError("errors.invalidBackup");
  if (raw.version !== VAULT_BACKUP_VERSION) throw new AppError("errors.invalidBackup");
  if (!isRecord(raw.meta)) throw new AppError("errors.invalidBackup");
  const meta = raw.meta as unknown as VaultMeta;
  if (meta.id !== "vault") throw new AppError("errors.invalidBackup");
  if (typeof meta.salt !== "string" || typeof meta.verifier !== "string")
    throw new AppError("errors.invalidBackup");
  if (!Array.isArray(raw.entries)) throw new AppError("errors.invalidBackup");
  const entries = raw.entries as unknown as VaultEntry[];
  for (const e of entries) {
    if (!isRecord(e) || typeof e.id !== "string") {
      throw new AppError("errors.invalidBackup");
    }
  }
  return {
    format: VAULT_BACKUP_FORMAT,
    version: VAULT_BACKUP_VERSION,
    exportedAt:
      typeof raw.exportedAt === "number" && Number.isFinite(raw.exportedAt)
        ? raw.exportedAt
        : Date.now(),
    meta,
    entries,
  };
}

export function buildVaultBackupJson(meta: VaultMeta, entries: VaultEntry[]): string {
  return JSON.stringify({
    format: VAULT_BACKUP_FORMAT,
    version: VAULT_BACKUP_VERSION,
    exportedAt: Date.now(),
    meta,
    entries,
  });
}

export function downloadJsonFile(filename: string, json: string): void {
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
