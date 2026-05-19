import {
  decryptBytes,
  decryptString,
  deriveKey,
  encryptBytes,
  encryptString,
  fromBase64,
  importAesGcmKey,
  newSalt,
  randomBytes,
  VERIFIER_PLAINTEXT,
} from "./crypto";
import { AppError } from "./errors";
import type { VaultMeta } from "./storage";

export function isAuthV2(meta: VaultMeta): boolean {
  return meta.authVersion === 2 && typeof meta.passwordWrap === "string";
}

export async function createAuthV2Material(masterPassword: string) {
  const salt = newSalt();
  const passwordKey = await deriveKey(masterPassword, salt);
  const dataKeyBytes = randomBytes(32);
  const dataKey = await importAesGcmKey(dataKeyBytes);
  const passwordWrap = await encryptBytes(passwordKey, dataKeyBytes);
  return { salt, passwordKey, dataKey, dataKeyBytes, passwordWrap };
}

export async function dataKeyFromMasterPassword(
  meta: VaultMeta,
  masterPassword: string
): Promise<CryptoKey> {
  const salt = fromBase64(meta.salt);
  const passwordKey = await deriveKey(masterPassword, salt);
  if (isAuthV2(meta)) {
    const bytes = await decryptBytes(passwordKey, meta.passwordWrap!);
    return importAesGcmKey(bytes);
  }
  return passwordKey;
}

export async function assertMasterPassword(
  meta: VaultMeta,
  masterPassword: string
): Promise<CryptoKey> {
  const dataKey = await dataKeyFromMasterPassword(meta, masterPassword);
  let verified: string;
  try {
    verified = await decryptString(dataKey, meta.verifier);
  } catch {
    throw new AppError("errors.wrongMaster");
  }
  if (verified !== VERIFIER_PLAINTEXT) {
    throw new AppError("errors.wrongMaster");
  }
  return dataKey;
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
): Promise<CryptoKey> {
  const prfKey = await importAesGcmKey(prfBytes);
  const raw = await decryptBytes(prfKey, passkeyDataKeyWrap);
  return importAesGcmKey(raw);
}
