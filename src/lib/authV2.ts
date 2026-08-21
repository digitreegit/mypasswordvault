import {
  decryptBytes,
  decryptString,
  DEFAULT_PBKDF2_ITERATIONS,
  deriveKey,
  encryptBytes,
  encryptString,
  fromBase64,
  importAesGcmKey,
  LEGACY_PBKDF2_ITERATIONS,
  newSalt,
  randomBytes,
  VERIFIER_PLAINTEXT,
} from "./crypto";
import { AppError } from "./errors";
import type { VaultMeta } from "./storage";

export function isAuthV2(meta: VaultMeta): boolean {
  return meta.authVersion === 2 && typeof meta.passwordWrap === "string";
}

/** Iteration count to use when decrypting a vault: stored value, or legacy default. */
export function metaPbkdf2Iterations(meta: VaultMeta): number {
  const stored = meta.pbkdf2Iterations;
  return typeof stored === "number" && Number.isFinite(stored) && stored > 0
    ? stored
    : LEGACY_PBKDF2_ITERATIONS;
}

export async function createAuthV2Material(masterPassword: string) {
  const salt = newSalt();
  const iterations = DEFAULT_PBKDF2_ITERATIONS;
  const passwordKey = await deriveKey(masterPassword, salt, iterations);
  const dataKeyBytes = randomBytes(32);
  const dataKey = await importAesGcmKey(dataKeyBytes);
  const passwordWrap = await encryptBytes(passwordKey, dataKeyBytes);
  return { salt, passwordKey, dataKey, dataKeyBytes, passwordWrap, iterations };
}

export async function dataKeyFromMasterPassword(
  meta: VaultMeta,
  masterPassword: string
): Promise<{ dataKey: CryptoKey; dataKeyBytes: Uint8Array | null }> {
  const salt = fromBase64(meta.salt);
  const passwordKey = await deriveKey(
    masterPassword,
    salt,
    metaPbkdf2Iterations(meta)
  );
  if (isAuthV2(meta)) {
    const dataKeyBytes = await decryptBytes(passwordKey, meta.passwordWrap!);
    const dataKey = await importAesGcmKey(dataKeyBytes);
    return { dataKey, dataKeyBytes };
  }
  // Legacy vaults: password-derived key is the data key (non-extractable).
  return { dataKey: passwordKey, dataKeyBytes: null };
}

export async function assertMasterPassword(
  meta: VaultMeta,
  masterPassword: string
): Promise<{ dataKey: CryptoKey; dataKeyBytes: Uint8Array | null }> {
  const { dataKey, dataKeyBytes } = await dataKeyFromMasterPassword(
    meta,
    masterPassword,
  );
  let verified: string;
  try {
    verified = await decryptString(dataKey, meta.verifier);
  } catch {
    throw new AppError("errors.wrongMaster");
  }
  if (verified !== VERIFIER_PLAINTEXT) {
    throw new AppError("errors.wrongMaster");
  }
  return { dataKey, dataKeyBytes };
}

export async function wrapDataKeyWithPrf(
  prfBytes: Uint8Array,
  dataKeyRaw: Uint8Array
): Promise<string> {
  const prfKey = await importAesGcmKey(prfBytes);
  return encryptBytes(prfKey, dataKeyRaw);
}

export async function dataKeyFromPrfWrap(
  prfBytes: Uint8Array,
  passkeyDataKeyWrap: string
): Promise<{ dataKey: CryptoKey; dataKeyBytes: Uint8Array }> {
  const prfKey = await importAesGcmKey(prfBytes);
  const dataKeyBytes = await decryptBytes(prfKey, passkeyDataKeyWrap);
  const dataKey = await importAesGcmKey(dataKeyBytes);
  return { dataKey, dataKeyBytes };
}
