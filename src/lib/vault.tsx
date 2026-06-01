import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  decryptString,
  encryptString,
  toBase64,
  VERIFIER_PLAINTEXT,
} from "./crypto";
import {
  assertMasterPassword,
  createAuthV2Material,
  dataKeyFromPrfWrap,
  isAuthV2,
  wrapDataKeyWithPrf,
} from "./authV2";
import {
  authenticateVaultPasskey,
  currentPasskeyRpId,
  isPasskeySupported,
  newPrfSalt,
  passkeyRegisteredForCurrentSite,
  derivePrfAfterRegistration,
  readPrfFirst,
  registerVaultPasskey,
} from "./passkey";
import {
  generateRecoveryCodes,
  hashRecoveryCodes,
  matchRecoveryCode,
} from "./recoveryCodes";
import { TOTP_BACKUP_ACCOUNT } from "./totp";
import {
  deleteEntry,
  getMeta,
  listEntries,
  newId,
  putEntry,
  putMeta,
  type VaultCategory,
  type VaultEntry,
  type StoredPasskey,
  type VaultMeta,
  wipeAll,
} from "./storage";
import { generateTotpSecretBase32, verifyTotp } from "./totp";
import { AppError } from "./errors";
import { notifyLocaleChanged } from "./appLocale";
import { translate } from "./i18n/bundles";
import {
  detectBrowserLocale,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  persistStoredLocale,
  readStoredLocale,
  type Locale,
} from "./i18n/locale";
import { buildVaultBackupJson, parseVaultBackup } from "./vaultBackup";
import {
  deleteRemoteVaultBackup,
  reconcileCloudAtStartup,
  upsertRemoteVaultBackup,
} from "./cloudVault";
import {
  CHECKOUT_COMPLETE_MESSAGE,
  clearCheckoutPending,
  finalizeCheckoutAfterPayment,
  isCheckoutPending,
  takeRememberedCheckoutSessionId,
} from "./checkoutReturn";
import { confirmCheckoutSession } from "./confirmCheckoutSession";
import { FREE_ENTRY_LIMIT, fetchUserEntitlement } from "./entitlements";
import { isSupabaseConfigured } from "./supabaseClient";

export type VaultStatus = "loading" | "fresh" | "locked" | "unlocked";

export interface DecryptedEntry {
  id: string;
  categoryId: string;
  site: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  memo: string;
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
  ) => Promise<void>;
  registerPasskeyInSetup: (opts: {
    hints?: ("client-device" | "security-key" | "hybrid")[];
    label: string;
  }) => Promise<void>;
  beginBackupTotpEnrollment: () => Promise<{ totpSecretBase32: string }>;
  confirmBackupTotpEnrollment: (code: string) => Promise<{ recoveryCodes: string[] }>;
  /** Skip backup TOTP; still issues one-time recovery codes. */
  skipBackupTotpEnrollment: () => Promise<{ recoveryCodes: string[] }>;
  finalizeEnrollment: () => Promise<void>;
  abortSetup: () => Promise<void>;
  isPasskeySupported: boolean;
  unlockWithPasskey: () => Promise<void>;
  unlock: (masterPassword: string, secondFactor: string, mode: "totp" | "recovery") => Promise<void>;
  lock: () => void;
  resetVault: () => Promise<void>;
  setAutoLockMinutes: (m: number) => Promise<void>;
  locale: Locale;
  setLocale: (l: Locale) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;

  /** Encrypted vault snapshot (JSON). Optional offline copy; same master password + 2FA. */
  exportBackup: () => Promise<string>;
  /** Replace local vault with backup; locks the app. */
  importBackup: (jsonText: string) => Promise<void>;

  upsertEntry: (
    partial: Partial<DecryptedEntry> & { id?: string }
  ) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  touchActivity: () => void;

  categories: VaultCategory[];
  setCategories: (next: VaultCategory[]) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  /** Cloud billing: one-time license removes the free entry cap. */
  licensed: boolean;
  /** Stripe checkout session id when licensed (for display in Settings). */
  licenseKey: string | null;
  entitlementLoaded: boolean;
  atEntryLimit: boolean;
  freeEntryLimit: number;
  refreshEntitlements: (opts?: { keepLoaded?: boolean }) => Promise<boolean>;
  /** After Stripe payment — confirms session, applies PRO immediately, refreshes entitlements. */
  finalizePaidCheckout: (sessionId?: string | null) => Promise<boolean>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

// In-memory only — never persisted.
interface Session {
  key: CryptoKey;
  totpSecret: string;
}

export function VaultProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<VaultStatus>("loading");
  const [meta, setMeta] = useState<VaultMeta | null>(null);
  const [entries, setEntries] = useState<DecryptedEntry[]>([]);
  const sessionRef = useRef<Session | null>(null);
  // During setup we may have a derived key but no committed meta yet.
  const pendingSetupRef = useRef<{
    passwordKey: CryptoKey;
    dataKey: CryptoKey;
    dataKeyBytes: Uint8Array;
    salt: Uint8Array;
    pbkdf2Iterations: number;
    passwordWrap: string;
    totpSecret: string;
    autoLockMinutes: number;
    passkeys: StoredPasskey[];
    prfSalt: string;
    passkeyDataKeyWrap?: string;
    recoveryCodeHashes: string[];
  } | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const localeRef = useRef<Locale>("en");
  const pushDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [locale, setLocaleState] = useState<Locale>(
    () => readStoredLocale() ?? detectBrowserLocale()
  );
  const [licensed, setLicensed] = useState(!isSupabaseConfigured);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [entitlementLoaded, setEntitlementLoaded] = useState(
    !isSupabaseConfigured,
  );
  const entitlementRef = useRef({
    licensed: !isSupabaseConfigured,
    loaded: !isSupabaseConfigured,
  });

  useEffect(() => {
    entitlementRef.current = { licensed, loaded: entitlementLoaded };
  }, [licensed, entitlementLoaded]);

  const applyLicensedOptimistic = useCallback((sessionId?: string | null) => {
    setLicensed(true);
    setEntitlementLoaded(true);
    if (sessionId?.startsWith("cs_")) {
      setLicenseKey(sessionId);
    }
  }, []);

  const refreshEntitlements = useCallback(async (opts?: { keepLoaded?: boolean }): Promise<boolean> => {
    if (!userId || !isSupabaseConfigured) {
      setLicensed(true);
      setLicenseKey(null);
      setEntitlementLoaded(true);
      return true;
    }
    if (!opts?.keepLoaded) setEntitlementLoaded(false);
    let licensedNow = false;
    try {
      let ent = await fetchUserEntitlement(userId);
      if (!ent.licensed && isCheckoutPending()) {
        const sid = takeRememberedCheckoutSessionId();
        if (sid && (await confirmCheckoutSession(sid))) {
          ent = await fetchUserEntitlement(userId);
          clearCheckoutPending();
        }
      }
      licensedNow = ent.licensed;
      setLicensed(ent.licensed);
      setLicenseKey(ent.stripeCheckoutSessionId);
    } catch (e) {
      console.error("refreshEntitlements", e);
      setLicensed(false);
      setLicenseKey(null);
    } finally {
      setEntitlementLoaded(true);
    }
    return licensedNow;
  }, [userId]);

  const finalizePaidCheckout = useCallback(
    (sessionId?: string | null) =>
      finalizeCheckoutAfterPayment(
        refreshEntitlements,
        confirmCheckoutSession,
        sessionId,
        () => applyLicensedOptimistic(sessionId),
      ),
    [refreshEntitlements, applyLicensedOptimistic],
  );

  useEffect(() => {
    void refreshEntitlements();
  }, [refreshEntitlements]);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  const flushCloudPush = useCallback(async () => {
    if (!userId) return;
    const m = await getMeta();
    if (!m) return;
    try {
      const json = buildVaultBackupJson(m, await listEntries());
      await upsertRemoteVaultBackup(userId, json);
    } catch (e) {
      console.error("Cloud vault push failed", e);
    }
  }, [userId]);

  const scheduleCloudPush = useCallback(() => {
    if (!userId) return;
    if (pushDebounceRef.current) clearTimeout(pushDebounceRef.current);
    pushDebounceRef.current = setTimeout(() => {
      pushDebounceRef.current = null;
      void flushCloudPush();
    }, 700);
  }, [userId, flushCloudPush]);

  useEffect(() => {
    return () => {
      if (pushDebounceRef.current) clearTimeout(pushDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (userId) await reconcileCloudAtStartup(userId);
      } catch (e) {
        console.error("Cloud vault reconcile failed", e);
      }
      if (cancelled) return;
      const m = await getMeta();
      if (!m) {
        setStatus("fresh");
        setMeta(null);
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
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const lockInternal = useCallback(() => {
    sessionRef.current = null;
    setEntries([]);
    setStatus("locked");
  }, []);

  const lock = useCallback(() => {
    lockInternal();
  }, [lockInternal]);

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
  }, [status, meta?.autoLockMinutes, lockInternal]);

  // bfcache / tab restore can revive the old React tree while beforeunload cleared the
  // in-memory crypto session — force lock so the grid is never shown without a key.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) lastActivityRef.current = Date.now();
    };
    const onBeforeUnload = () => {
      try {
        if (sessionStorage.getItem("mpw_checkout_pending") === "1") return;
      } catch {
        /* ignore */
      }
      lockInternal();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) lockInternal();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [lockInternal]);

  // Returning from Stripe in another tab: refresh license while vault stays unlocked.
  useEffect(() => {
    if (!userId || status !== "unlocked") return;
    const syncAfterCheckout = () => {
      try {
        if (sessionStorage.getItem("mpw_checkout_pending") !== "1") return;
      } catch {
        return;
      }
      void refreshEntitlements().then((lic) => {
        if (lic) {
          try {
            sessionStorage.removeItem("mpw_checkout_pending");
          } catch {
            /* ignore */
          }
        }
      });
    };
    window.addEventListener("focus", syncAfterCheckout);
    const onVis = () => {
      if (!document.hidden) syncAfterCheckout();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", syncAfterCheckout);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [userId, status, refreshEntitlements]);

  // Payment completed in Stripe popup — stay on vault list, apply PRO on opener tab.
  useEffect(() => {
    if (!userId) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; sessionId?: string | null };
      if (data?.type !== CHECKOUT_COMPLETE_MESSAGE) return;
      const sid =
        typeof data.sessionId === "string" && data.sessionId.startsWith("cs_")
          ? data.sessionId
          : null;
      void finalizePaidCheckout(sid);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [userId, finalizePaidCheckout]);

  useLayoutEffect(() => {
    if (status === "unlocked" && !sessionRef.current) {
      lockInternal();
    }
  }, [status, lockInternal]);

  const touchActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    const L = normalizeLocale(next);
    setLocaleState(L);
    persistStoredLocale(L);
    notifyLocaleChanged(L);
    const m = await getMeta();
    if (m) {
      const updated: VaultMeta = { ...m, locale: L, updatedAt: Date.now() };
      await putMeta(updated);
      setMeta(updated);
      await flushCloudPush();
    }
  }, [flushCloudPush]);

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
        categoryId: typeof e.categoryId === "string" ? e.categoryId : "",
        site: e.site,
        url: e.url,
        username: e.username,
        password,
        notes: e.notes,
        memo: typeof e.memo === "string" ? e.memo : "",
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
      const {
        salt,
        passwordKey,
        dataKey,
        dataKeyBytes,
        passwordWrap,
        iterations,
      } = await createAuthV2Material(masterPassword);
      pendingSetupRef.current = {
        passwordKey,
        dataKey,
        dataKeyBytes,
        salt,
        pbkdf2Iterations: iterations,
        passwordWrap,
        totpSecret: "",
        autoLockMinutes,
        passkeys: [],
        prfSalt: newPrfSalt(),
        recoveryCodeHashes: [],
      };
    },
    []
  );

  const registerPasskeyInSetup = useCallback(
    async (opts: {
      hints?: ("client-device" | "security-key" | "hybrid")[];
      label: string;
    }) => {
    const pending = pendingSetupRef.current;
    if (!pending) throw new AppError("errors.noPendingSetup");
    if (!userId) throw new AppError("errors.passkeyNeedsSignIn");
    const label =
      userId.length > 0 ? `user-${userId.slice(0, 8)}` : "vault-user";
    const { passkey, prfBytes: regPrf } = await registerVaultPasskey({
      userId,
      userName: label,
      excludeCredentialIds: pending.passkeys.map((p) => p.id),
      prfSaltB64: pending.prfSalt,
      hints: opts.hints,
      label: opts.label,
    });
    pending.passkeys.push(passkey);
    let prfBytes = regPrf;
    if (!prfBytes) {
      prfBytes = await derivePrfAfterRegistration(passkey, pending.prfSalt);
    }
    if (prfBytes) {
      pending.passkeyDataKeyWrap = await wrapDataKeyWithPrf(
        prfBytes,
        pending.dataKeyBytes,
      );
    } else {
      pending.passkeys.pop();
      throw new AppError("errors.passkeySetupPrf");
    }
  },
    [userId]
  );

  const beginBackupTotpEnrollment = useCallback(async () => {
    const pending = pendingSetupRef.current;
    if (!pending) throw new AppError("errors.noPendingSetup");
    if (!pending.passkeys.length) {
      throw new AppError("errors.passkeyRequired");
    }
    const totpSecret = generateTotpSecretBase32();
    pending.totpSecret = totpSecret;
    return { totpSecretBase32: totpSecret };
  }, []);

  const confirmBackupTotpEnrollment = useCallback(async (code: string) => {
    const pending = pendingSetupRef.current;
    if (!pending) throw new AppError("errors.noPendingSetup");
    if (!verifyTotp(pending.totpSecret, code)) {
      throw new AppError("errors.invalidOtp");
    }
    const recoveryCodes = generateRecoveryCodes();
    pending.recoveryCodeHashes = await hashRecoveryCodes(recoveryCodes);
    return { recoveryCodes };
  }, []);

  const skipBackupTotpEnrollment = useCallback(async () => {
    const pending = pendingSetupRef.current;
    if (!pending) throw new AppError("errors.noPendingSetup");
    pending.totpSecret = "";
    const recoveryCodes = generateRecoveryCodes();
    pending.recoveryCodeHashes = await hashRecoveryCodes(recoveryCodes);
    return { recoveryCodes };
  }, []);

  const finalizeEnrollment = useCallback(async () => {
    const pending = pendingSetupRef.current;
    if (!pending) throw new AppError("errors.noPendingSetup");
    if (!pending.recoveryCodeHashes.length) {
      throw new AppError("errors.noPendingSetup");
    }
    const verifierEnc = await encryptString(pending.dataKey, VERIFIER_PLAINTEXT);
    const totpEnc = await encryptString(pending.dataKey, pending.totpSecret);
    const now = Date.now();
    const m: VaultMeta = {
      id: "vault",
      authVersion: 2,
      salt: toBase64(pending.salt),
      pbkdf2Iterations: pending.pbkdf2Iterations,
      passwordWrap: pending.passwordWrap,
      passkeyDataKeyWrap: pending.passkeyDataKeyWrap,
      prfSalt: pending.prfSalt,
      passkeys: pending.passkeys,
      passkeyRpId: currentPasskeyRpId(),
      recoveryCodeHashes: pending.recoveryCodeHashes,
      verifier: verifierEnc,
      totpSecret: totpEnc,
      totpLabel: TOTP_BACKUP_ACCOUNT,
      autoLockMinutes: pending.autoLockMinutes,
      locale: localeRef.current,
      categories: [],
      createdAt: now,
      updatedAt: now,
    };
    await putMeta(m);
    sessionRef.current = {
      key: pending.dataKey,
      totpSecret: pending.totpSecret,
    };
    pendingSetupRef.current = null;
    setMeta(m);
    setEntries([]);
    lastActivityRef.current = Date.now();
    setStatus("unlocked");
    await flushCloudPush();
    void refreshEntitlements();
  }, [flushCloudPush, refreshEntitlements]);

  const abortSetup = useCallback(async () => {
    pendingSetupRef.current = null;
  }, []);

  const finishUnlock = useCallback(
    async (m: VaultMeta, dataKey: CryptoKey, totpSecret: string) => {
      sessionRef.current = { key: dataKey, totpSecret };
      setMeta(m);
      lastActivityRef.current = Date.now();
      await loadEntries(dataKey);
      setStatus("unlocked");
      void refreshEntitlements();
    },
    [loadEntries, refreshEntitlements]
  );

  const unlockWithPasskey = useCallback(async () => {
    const m = await getMeta();
    if (!m || !isAuthV2(m)) throw new AppError("errors.passkeyNoPasswordless");
    if (!m.passkeys?.length || !m.prfSalt) {
      throw new AppError("errors.noPasskeyRegistered");
    }
    if (!passkeyRegisteredForCurrentSite(m)) {
      throw new AppError("errors.passkeyWrongDomain");
    }
    if (!m.passkeyDataKeyWrap) {
      throw new AppError("errors.passkeyNoPasswordless");
    }
    const { authentication, passkey } = await authenticateVaultPasskey(
      m.passkeys,
      m.prfSalt
    );
    const prfBytes = readPrfFirst(
      authentication.clientExtensionResults as Record<string, unknown>
    );
    if (!prfBytes) throw new AppError("errors.passkeyNoPasswordless");
    const dataKey = await dataKeyFromPrfWrap(prfBytes, m.passkeyDataKeyWrap);
    let verified: string;
    try {
      verified = await decryptString(dataKey, m.verifier);
    } catch {
      throw new AppError("errors.passkeyFailed");
    }
    if (verified !== VERIFIER_PLAINTEXT) {
      throw new AppError("errors.passkeyFailed");
    }
    const totpSecret = await decryptString(dataKey, m.totpSecret);
    const updated: VaultMeta = {
      ...m,
      passkeys: m.passkeys.map((p) =>
        p.id === passkey.id ? { ...passkey } : p
      ),
      updatedAt: Date.now(),
    };
    await putMeta(updated);
    await finishUnlock(updated, dataKey, totpSecret);
    await flushCloudPush();
  }, [finishUnlock, flushCloudPush]);

  const unlock = useCallback(
    async (
      masterPassword: string,
      secondFactor: string,
      mode: "totp" | "recovery"
    ) => {
      const m = await getMeta();
      if (!m) throw new AppError("errors.notInitialized");
      const dataKey = await assertMasterPassword(m, masterPassword);
      const totpSecret = await decryptString(dataKey, m.totpSecret);
      if (mode === "totp") {
        if (!verifyTotp(totpSecret, secondFactor)) {
          throw new AppError("errors.wrongTotp");
        }
      } else {
        const hashes = m.recoveryCodeHashes ?? [];
        if (!hashes.length) throw new AppError("errors.invalidRecoveryCode");
        const idx = await matchRecoveryCode(secondFactor, hashes);
        if (idx < 0) throw new AppError("errors.invalidRecoveryCode");
        const nextHashes = hashes.filter((_, i) => i !== idx);
        const updated: VaultMeta = {
          ...m,
          recoveryCodeHashes: nextHashes,
          updatedAt: Date.now(),
        };
        await putMeta(updated);
        await finishUnlock(updated, dataKey, totpSecret);
        await flushCloudPush();
        return;
      }
      await finishUnlock(m, dataKey, totpSecret);
    },
    [finishUnlock, flushCloudPush]
  );

  const resetVault = useCallback(async () => {
    if (userId) {
      try {
        await deleteRemoteVaultBackup(userId);
      } catch (e) {
        console.error("Cloud vault delete failed", e);
      }
    }
    await wipeAll();
    sessionRef.current = null;
    pendingSetupRef.current = null;
    setMeta(null);
    setEntries([]);
    setStatus("fresh");
  }, [userId]);

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
      await flushCloudPush();
    },
    [meta, flushCloudPush]
  );

  const upsertEntry = useCallback(
    async (partial: Partial<DecryptedEntry> & { id?: string }) => {
      const session = sessionRef.current;
      if (!session) throw new AppError("errors.locked");
      const id = partial.id ?? newId();
      const existing = entries.find((e) => e.id === id);
      const isNew = !existing;
      if (
        isNew &&
        isSupabaseConfigured &&
        entitlementLoaded &&
        !licensed &&
        entries.length >= FREE_ENTRY_LIMIT
      ) {
        throw new AppError("errors.entryLimitReached");
      }
      const merged: DecryptedEntry = {
        id,
        categoryId: partial.categoryId ?? existing?.categoryId ?? "",
        site: partial.site ?? existing?.site ?? "",
        url: partial.url ?? existing?.url ?? "",
        username: partial.username ?? existing?.username ?? "",
        password: partial.password ?? existing?.password ?? "",
        notes: partial.notes ?? existing?.notes ?? "",
        memo: partial.memo ?? existing?.memo ?? "",
        updatedAt: Date.now(),
      };
      const passwordEnc = merged.password
        ? await encryptString(session.key, merged.password)
        : "";
      const persisted: VaultEntry = {
        id: merged.id,
        categoryId: merged.categoryId,
        site: merged.site,
        url: merged.url,
        username: merged.username,
        passwordEnc,
        notes: merged.notes,
        memo: merged.memo,
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
      scheduleCloudPush();
    },
    [entries, scheduleCloudPush, licensed, entitlementLoaded]
  );

  const removeEntry = useCallback(async (id: string) => {
    await deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    lastActivityRef.current = Date.now();
    await flushCloudPush();
  }, [flushCloudPush]);

  const setCategories = useCallback(
    async (next: VaultCategory[]) => {
      const m = await getMeta();
      if (!m) return;
      const updated: VaultMeta = {
        ...m,
        categories: next,
        updatedAt: Date.now(),
      };
      await putMeta(updated);
      setMeta(updated);
      scheduleCloudPush();
    },
    [scheduleCloudPush]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const session = sessionRef.current;
      const m = await getMeta();
      if (!m || !session) return;
      const cats = m.categories ?? [];
      const updated: VaultMeta = {
        ...m,
        categories: cats.filter((c) => c.id !== id),
        updatedAt: Date.now(),
      };
      await putMeta(updated);
      setMeta(updated);
      const raw = await listEntries();
      for (const e of raw) {
        if (e.categoryId === id) {
          await putEntry({
            ...e,
            categoryId: "",
            updatedAt: Date.now(),
          });
        }
      }
      await loadEntries(session.key);
      lastActivityRef.current = Date.now();
      scheduleCloudPush();
    },
    [loadEntries, scheduleCloudPush]
  );

  const exportBackup = useCallback(async () => {
    const m = await getMeta();
    if (!m) throw new AppError("errors.notInitialized");
    const raw = await listEntries();
    return buildVaultBackupJson(m, raw);
  }, []);

  const importBackup = useCallback(async (jsonText: string) => {
    const { meta, entries: parsedEntries } = parseVaultBackup(jsonText);
    if (isSupabaseConfigured) {
      const { loaded, licensed: lic } = entitlementRef.current;
      const treatAsUnlicensed = loaded ? !lic : true;
      if (treatAsUnlicensed && parsedEntries.length > FREE_ENTRY_LIMIT) {
        throw new AppError("errors.importExceedsEntryLimit");
      }
    }
    sessionRef.current = null;
    pendingSetupRef.current = null;
    await wipeAll();
    const metaNorm: VaultMeta = {
      ...meta,
      categories: meta.categories ?? [],
    };
    await putMeta(metaNorm);
    for (const e of parsedEntries) {
      const row: VaultEntry = {
        ...e,
        categoryId: typeof e.categoryId === "string" ? e.categoryId : "",
        memo: typeof e.memo === "string" ? e.memo : "",
      };
      await putEntry(row);
    }
    setMeta(metaNorm);
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
    await flushCloudPush();
  }, [flushCloudPush]);

  const atEntryLimit = useMemo(
    () =>
      isSupabaseConfigured &&
      entitlementLoaded &&
      !licensed &&
      entries.length >= FREE_ENTRY_LIMIT,
    [entitlementLoaded, licensed, entries.length],
  );

  const value = useMemo<VaultContextValue>(
    () => ({
      status,
      meta,
      entries,
      autoLockMinutes: meta?.autoLockMinutes ?? 5,
      setup,
      registerPasskeyInSetup,
      beginBackupTotpEnrollment,
      confirmBackupTotpEnrollment,
      skipBackupTotpEnrollment,
      finalizeEnrollment,
      abortSetup,
      isPasskeySupported: isPasskeySupported(),
      unlockWithPasskey,
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
      categories: meta?.categories ?? [],
      setCategories,
      deleteCategory,
      licensed,
      licenseKey,
      entitlementLoaded,
      atEntryLimit,
      freeEntryLimit: FREE_ENTRY_LIMIT,
      refreshEntitlements,
      finalizePaidCheckout,
    }),
    [
      status,
      meta,
      entries,
      locale,
      licensed,
      licenseKey,
      entitlementLoaded,
      atEntryLimit,
      setup,
      registerPasskeyInSetup,
      beginBackupTotpEnrollment,
      confirmBackupTotpEnrollment,
      skipBackupTotpEnrollment,
      finalizeEnrollment,
      abortSetup,
      unlockWithPasskey,
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
      setCategories,
      deleteCategory,
      refreshEntitlements,
      finalizePaidCheckout,
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
