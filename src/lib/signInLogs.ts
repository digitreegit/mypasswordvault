import { resolveSignInLogContext, type SignInLogDevice } from "./signInLogContext";

export type SignInLogMethod = "google" | "email" | "unknown";

export type SignInLogEntry = {
  id: string;
  at: number;
  method: SignInLogMethod;
  event: string;
  device?: SignInLogDevice;
  location?: string | null;
};

const STORAGE_KEY = "mpv_sign_in_logs";
const MAX_PER_USER = 50;
export const SIGN_IN_LOGS_CHANGED = "mpv-sign-in-logs-changed";

function notifySignInLogsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SIGN_IN_LOGS_CHANGED));
}

export function subscribeSignInLogsChanged(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(SIGN_IN_LOGS_CHANGED, handler);
  return () => window.removeEventListener(SIGN_IN_LOGS_CHANGED, handler);
}

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
  void (async () => {
    const { device, location } = await resolveSignInLogContext();
    const store = readStore();
    const list = store[userId] ?? [];
    list.unshift({
      id: crypto.randomUUID(),
      at: Date.now(),
      method: entry.method,
      event: entry.event,
      device,
      location,
    });
    store[userId] = list.slice(0, MAX_PER_USER);
    writeStore(store);
    notifySignInLogsChanged();
  })();
}

export function getSignInLogs(userId: string): SignInLogEntry[] {
  if (!userId) return [];
  return readStore()[userId] ?? [];
}

export function formatSignInLogMeta(
  row: SignInLogEntry,
  t: (key: string) => string
): string {
  const device = row.device
    ? t(`account.signInDevice.${row.device}`)
    : t("account.signInDevice.unknown");
  const location = row.location?.trim() || t("account.signInLocation.unknown");
  return `${device} · ${location}`;
}

export function formatSignInLogTime(ts: number, locale: string): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
      timeZoneName: "short",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export function clearSignInLogsForUser(userId: string): void {
  if (!userId) return;
  const store = readStore();
  delete store[userId];
  writeStore(store);
}

export type { SignInLogDevice };
