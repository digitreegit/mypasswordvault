import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  decryptString,
  deriveKey,
  encryptString,
  fromBase64,
  newSalt,
  toBase64,
  VERIFIER_PLAINTEXT,
} from "./crypto";
import {
  deleteEntry,
  getMeta,
  listEntries,
  newId,
  putEntry,
  putMeta,
  type VaultEntry,
  type VaultMeta,
  wipeAll,
} from "./storage";
import { generateTotpSecretBase32, verifyTotp } from "./totp";
import { AppError } from "./errors";
import { translate } from "./i18n/bundles";
import {
  detectBrowserLocale,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type Locale,
} from "./i18n/locale";
import { buildVaultBackupJson, parseVaultBackup } from "./vaultBackup";

export type VaultStatus = "loading" | "fresh" | "locked" | "unlocked";

export interface DecryptedEntry {
  id: string;
  site: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  updatedAt: number;
}

interface VaultContextValue {
  status: VaultStatus;
  meta: VaultMeta | null;
  entries: DecryptedEntry[];
  autoLockMinutes: number;

  setup: (
    masterPassword: string,
    autoLockMinutes: number
  ) => Promise<{ totpSecretBase32: string }>;
  confirmTotpEnrollment: (code: string) => Promise<void>;
  abortSetup: () => Promise<void>;
  unlock: (masterPassword: string, totpCode: string) => Promise<void>;
  lock: () => void;
  resetVault: () => Promise<void>;
  setAutoLockMinutes: (m: number) => Promise<void>;
  locale: Locale;
  setLocale: (l: Locale) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;

  /** Encrypted vault snapshot (JSON). Use on any device with the same master password + 2FA. */
  exportBackup: () => Promise<string>;
  /** Replace local vault with backup; locks the app. */
  importBackup: (jsonText: string) => Promise<void>;

  upsertEntry: (
    partial: Partial<DecryptedEntry> & { id?: string }
  ) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  touchActivity: () => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

// In-memory only — never persisted.
interface Session {
  key: CryptoKey;
  totpSecret: string;
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>("loading");
  const [meta, setMeta] = useState<VaultMeta | null>(null);
  const [entries, setEntries] = useState<DecryptedEntry[]>([]);
  const sessionRef = useRef<Session | null>(null);
  // During setup we may have a derived key but no committed meta yet.
  const pendingSetupRef = useRef<{
    key: CryptoKey;
    salt: Uint8Array;
    totpSecret: string;
    autoLockMinutes: number;
  } | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const localeRef = useRef<Locale>("en");

  function readStoredLocale(): Locale | null {
    try {
      const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (raw) return normalizeLocale(raw);
    } catch {
      /* ignore */
    }
    return null;
  }

  const [locale, setLocaleState] = useState<Locale>(
    () => readStoredLocale() ?? detectBrowserLocale()
  );

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    (async () => {
      const m = await getMeta();
      if (!m) {
        setStatus("fresh");
      } else {
        setMeta(m);
        if (m.locale) {
          const L = normalizeLocale(m.locale);
          setLocaleState(L);
          try {
            localStorage.setItem(LOCALE_STORAGE_KEY, L);
          } catch {
            /* ignore */
          }
        }
        setStatus("locked");
      }
    })();
  }, []);

  // Auto-lock on inactivity.
  useEffect(() => {
    if (status !== "unlocked") return;
    const minutes = meta?.autoLockMinutes ?? 5;
    if (minutes <= 0) return;
    const interval = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs > minutes * 60_000) {
        lockInternal();
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, [status, meta?.autoLockMinutes]);

  // Lock when tab/window is hidden for too long, and on beforeunload clear in-memory.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) lastActivityRef.current = Date.now();
    };
    const onBeforeUnload = () => {
      sessionRef.current = null;
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  const touchActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const lockInternal = useCallback(() => {
    sessionRef.current = null;
    setEntries([]);
    setStatus("locked");
  }, []);

  const lock = useCallback(() => lockInternal(), [lockInternal]);

  const setLocale = useCallback(async (next: Locale) => {
    const L = normalizeLocale(next);
    setLocaleState(L);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, L);
    } catch {
      /* ignore */
    }
    const m = await getMeta();
    if (m) {
      const updated: VaultMeta = { ...m, locale: L, updatedAt: Date.now() };
      await putMeta(updated);
      setMeta(updated);
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale]
  );

  const loadEntries = useCallback(async (key: CryptoKey) => {
    const raw = await listEntries();
    const decrypted: DecryptedEntry[] = [];
    for (const e of raw) {
      let password = "";
      if (e.passwordEnc) {
        try {
          password = await decryptString(key, e.passwordEnc);
        } catch {
          password = "";
        }
      }
      decrypted.push({
        id: e.id,
        site: e.site,
        url: e.url,
        username: e.username,
        password,
        notes: e.notes,
        updatedAt: e.updatedAt,
      });
    }
    setEntries(decrypted);
  }, []);

  const setup = useCallback(
    async (masterPassword: string, autoLockMinutes: number) => {
      if (masterPassword.length < 10) {
        throw new AppError("errors.masterTooShort");
      }
      const salt = newSalt();
      const key = await deriveKey(masterPassword, salt);
      const totpSecret = generateTotpSecretBase32();
      pendingSetupRef.current = {
        key,
        salt,
        totpSecret,
        autoLockMinutes,
      };
      return { totpSecretBase32: totpSecret };
    },
    []
  );

  const abortSetup = useCallback(async () => {
    pendingSetupRef.current = null;
  }, []);

  const confirmTotpEnrollment = useCallback(async (code: string) => {
    const pending = pendingSetupRef.current;
    if (!pending) throw new AppError("errors.noPendingSetup");
    if (!verifyTotp(pending.totpSecret, code)) {
      throw new AppError("errors.invalidOtp");
    }
    const verifierEnc = await encryptString(pending.key, VERIFIER_PLAINTEXT);
    const totpEnc = await encryptString(pending.key, pending.totpSecret);
    const now = Date.now();
    const m: VaultMeta = {
      id: "vault",
      salt: toBase64(pending.salt),
      verifier: verifierEnc,
      totpSecret: totpEnc,
      totpLabel: "vault",
      autoLockMinutes: pending.autoLockMinutes,
      locale: localeRef.current,
      createdAt: now,
      updatedAt: now,
    };
    await putMeta(m);
    sessionRef.current = { key: pending.key, totpSecret: pending.totpSecret };
    pendingSetupRef.current = null;
    setMeta(m);
    setEntries([]);
    lastActivityRef.current = Date.now();
    setStatus("unlocked");
  }, []);

  const unlock = useCallback(
    async (masterPassword: string, totpCode: string) => {
      const m = await getMeta();
      if (!m) throw new AppError("errors.notInitialized");
      const salt = fromBase64(m.salt);
      const key = await deriveKey(masterPassword, salt);
      let verified: string;
      try {
        verified = await decryptString(key, m.verifier);
      } catch {
        throw new AppError("errors.wrongMaster");
      }
      if (verified !== VERIFIER_PLAINTEXT) {
        throw new AppError("errors.wrongMaster");
      }
      const totpSecret = await decryptString(key, m.totpSecret);
      if (!verifyTotp(totpSecret, totpCode)) {
        throw new AppError("errors.wrongTotp");
      }
      sessionRef.current = { key, totpSecret };
      setMeta(m);
      lastActivityRef.current = Date.now();
      await loadEntries(key);
      setStatus("unlocked");
    },
    [loadEntries]
  );

  const resetVault = useCallback(async () => {
    await wipeAll();
    sessionRef.current = null;
    pendingSetupRef.current = null;
    setMeta(null);
    setEntries([]);
    setStatus("fresh");
  }, []);

  const setAutoLockMinutes = useCallback(
    async (mins: number) => {
      if (!meta) return;
      const next: VaultMeta = {
        ...meta,
        autoLockMinutes: mins,
        updatedAt: Date.now(),
      };
      await putMeta(next);
      setMeta(next);
    },
    [meta]
  );

  const upsertEntry = useCallback(
    async (partial: Partial<DecryptedEntry> & { id?: string }) => {
      const session = sessionRef.current;
      if (!session) throw new AppError("errors.locked");
      const id = partial.id ?? newId();
      const existing = entries.find((e) => e.id === id);
      const merged: DecryptedEntry = {
        id,
        site: partial.site ?? existing?.site ?? "",
        url: partial.url ?? existing?.url ?? "",
        username: partial.username ?? existing?.username ?? "",
        password: partial.password ?? existing?.password ?? "",
        notes: partial.notes ?? existing?.notes ?? "",
        updatedAt: Date.now(),
      };
      const passwordEnc = merged.password
        ? await encryptString(session.key, merged.password)
        : "";
      const persisted: VaultEntry = {
        id: merged.id,
        site: merged.site,
        url: merged.url,
        username: merged.username,
        passwordEnc,
        notes: merged.notes,
        updatedAt: merged.updatedAt,
      };
      await putEntry(persisted);
      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.id === id);
        if (idx === -1) return [merged, ...prev];
        const copy = prev.slice();
        copy[idx] = merged;
        return copy;
      });
      lastActivityRef.current = Date.now();
    },
    [entries]
  );

  const removeEntry = useCallback(async (id: string) => {
    await deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    lastActivityRef.current = Date.now();
  }, []);

  const exportBackup = useCallback(async () => {
    const m = await getMeta();
    if (!m) throw new AppError("errors.notInitialized");
    const raw = await listEntries();
    return buildVaultBackupJson(m, raw);
  }, []);

  const importBackup = useCallback(async (jsonText: string) => {
    const { meta, entries } = parseVaultBackup(jsonText);
    sessionRef.current = null;
    pendingSetupRef.current = null;
    await wipeAll();
    await putMeta(meta);
    for (const e of entries) {
      await putEntry(e);
    }
    setMeta(meta);
    if (meta.locale) {
      const L = normalizeLocale(meta.locale);
      setLocaleState(L);
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, L);
      } catch {
        /* ignore */
      }
    }
    setEntries([]);
    setStatus("locked");
  }, []);

  const value = useMemo<VaultContextValue>(
    () => ({
      status,
      meta,
      entries,
      autoLockMinutes: meta?.autoLockMinutes ?? 5,
      setup,
      confirmTotpEnrollment,
      abortSetup,
      unlock,
      lock,
      resetVault,
      setAutoLockMinutes,
      locale,
      setLocale,
      t,
      exportBackup,
      importBackup,
      upsertEntry,
      removeEntry,
      touchActivity,
    }),
    [
      status,
      meta,
      entries,
      locale,
      setup,
      confirmTotpEnrollment,
      abortSetup,
      unlock,
      lock,
      resetVault,
      setAutoLockMinutes,
      setLocale,
      t,
      exportBackup,
      importBackup,
      upsertEntry,
      removeEntry,
      touchActivity,
    ]
  );

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
}

export function useVault(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
