import type { VaultMeta } from "./storage";

const STORAGE_KEY = "mpv_vault_cloud_user_id";

/** Supabase user id that owns the local vault ciphertext snapshot. */
export function getVaultOwnerUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const id = window.localStorage.getItem(STORAGE_KEY)?.trim();
    return id || null;
  } catch {
    return null;
  }
}

export function setVaultOwnerUserId(userId: string): void {
  if (typeof window === "undefined") return;
  const id = userId.trim();
  if (!id) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function clearVaultOwnerUserId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function resolveVaultOwner(meta: VaultMeta | null | undefined): string | null {
  const fromMeta = meta?.cloudUserId?.trim();
  if (fromMeta) return fromMeta;
  return getVaultOwnerUserId();
}

export function stampVaultMetaForUser(
  meta: VaultMeta,
  userId: string | null | undefined,
): VaultMeta {
  const id = userId?.trim();
  if (!id) return meta;
  setVaultOwnerUserId(id);
  if (meta.cloudUserId === id) return meta;
  return { ...meta, cloudUserId: id };
}
