const STORAGE_KEY = "mpv_cloud_sync_pending";

function readMap(): Record<string, true> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const map: Record<string, true> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v) map[k] = true;
    }
    return map;
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, true>): void {
  try {
    if (Object.keys(map).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

export function markCloudSyncPending(userId: string): void {
  const id = userId.trim();
  if (!id) return;
  const map = readMap();
  map[id] = true;
  writeMap(map);
}

export function clearCloudSyncPending(userId: string): void {
  const id = userId.trim();
  if (!id) return;
  const map = readMap();
  delete map[id];
  writeMap(map);
}

export function hasCloudSyncPending(userId: string): boolean {
  const id = userId.trim();
  if (!id) return false;
  return Boolean(readMap()[id]);
}
