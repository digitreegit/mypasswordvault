import { AppError } from "./errors";
import type { VaultEntry, VaultMeta } from "./storage";
import { isNativeApp } from "./platform";

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

/** Latest change time for LWW sync — max of meta and entry timestamps. */
export function snapshotRevision(meta: VaultMeta, entries: VaultEntry[]): number {
  let t = meta.updatedAt;
  for (const e of entries) {
    if (e.updatedAt > t) t = e.updatedAt;
  }
  return t;
}

export function snapshotRevisionFromPayload(payload: VaultBackupPayload): number {
  return snapshotRevision(payload.meta, payload.entries);
}

function sanitizeDownloadFilename(filename: string, fallbackExt: string): string {
  const trimmed = filename.trim();
  const safe = trimmed.replace(/[^\w.\-]+/g, "_");
  const ext = fallbackExt.startsWith(".") ? fallbackExt : `.${fallbackExt}`;
  if (safe.toLowerCase().endsWith(ext.toLowerCase())) return safe;
  return `${safe || "vault-backup"}${ext}`;
}

function downloadTextViaAnchor(
  filename: string,
  text: string,
  mimeType: string,
): void {
  const blob = new Blob([text], { type: mimeType });
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

async function tryWebShareText(
  filename: string,
  text: string,
  mimeType: string,
): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  try {
    const file = new File([text], filename, { type: mimeType });
    const data: ShareData = { files: [file], title: filename };
    if (typeof navigator.canShare === "function" && !navigator.canShare(data)) {
      return false;
    }
    await navigator.share(data);
    return true;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return true;
    return false;
  }
}

async function shareTextViaCapacitor(filename: string, text: string): Promise<void> {
  const { Directory, Encoding, Filesystem } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");

  await Filesystem.writeFile({
    path: filename,
    data: text,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  const { uri } = await Filesystem.getUri({
    path: filename,
    directory: Directory.Cache,
  });

  await Share.share({
    title: filename,
    url: uri,
  });
}

/** Web: browser download. Native: system share sheet (Save to Files, AirDrop, etc.). */
export async function downloadTextFile(
  filename: string,
  text: string,
  opts: { extension: string; mimeType: string },
): Promise<void> {
  const safeName = sanitizeDownloadFilename(filename, opts.extension);

  if (isNativeApp()) {
    if (await tryWebShareText(safeName, text, opts.mimeType)) return;
    try {
      await shareTextViaCapacitor(safeName, text);
      return;
    } catch {
      throw new AppError("settings.exportBackupFailed");
    }
  }

  downloadTextViaAnchor(safeName, text, opts.mimeType);
}

/** Web: browser download. Native: system share sheet (Save to Files, AirDrop, etc.). */
export async function downloadJsonFile(filename: string, json: string): Promise<void> {
  await downloadTextFile(filename, json, {
    extension: ".json",
    mimeType: "application/json;charset=utf-8",
  });
}

export async function downloadCsvFile(filename: string, csv: string): Promise<void> {
  await downloadTextFile(filename, csv, {
    extension: ".csv",
    mimeType: "text/csv;charset=utf-8",
  });
}
