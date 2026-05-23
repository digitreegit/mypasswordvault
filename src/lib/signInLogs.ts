export type SignInLogMethod = "google" | "email" | "unknown";

export type SignInLogEntry = {
  id: string;
  at: number;
  method: SignInLogMethod;
  event: string;
};

const STORAGE_KEY = "mpv_sign_in_logs";
const MAX_PER_USER = 50;

type Store = Record<string, SignInLogEntry[]>;

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function appendSignInLog(
  userId: string,
  entry: { method: SignInLogMethod; event: string }
): void {
  if (!userId) return;
  const store = readStore();
  const list = store[userId] ?? [];
  list.unshift({
    id: crypto.randomUUID(),
    at: Date.now(),
    method: entry.method,
    event: entry.event,
  });
  store[userId] = list.slice(0, MAX_PER_USER);
  writeStore(store);
}

export function getSignInLogs(userId: string): SignInLogEntry[] {
  if (!userId) return [];
  return readStore()[userId] ?? [];
}

export function clearSignInLogsForUser(userId: string): void {
  if (!userId) return;
  const store = readStore();
  delete store[userId];
  writeStore(store);
}
