// Web Crypto API based encryption layer.
// Master password -> PBKDF2(SHA-256, 310k iterations, 32-byte random salt) -> 256-bit AES-GCM key.
// Each secret (entry password, TOTP secret) is encrypted with AES-GCM using a fresh 12-byte IV.
// Output of encryption is base64(iv ‖ ciphertext+tag).

const PBKDF2_ITERATIONS = 310_000;
const KEY_LENGTH_BITS = 256;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;

const enc = new TextEncoder();
const dec = new TextDecoder();

export function randomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return buf;
}

export function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function deriveKey(
  masterPassword: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptString(
  key: CryptoKey,
  plaintext: string
): Promise<string> {
  const iv = randomBytes(IV_LENGTH);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      enc.encode(plaintext)
    )
  );
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return toBase64(combined);
}

export async function decryptString(
  key: CryptoKey,
  payload: string
): Promise<string> {
  const combined = fromBase64(payload);
  const iv = combined.slice(0, IV_LENGTH);
  const ct = combined.slice(IV_LENGTH);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ct as BufferSource
  );
  return dec.decode(pt);
}

export function newSalt(): Uint8Array {
  return randomBytes(SALT_LENGTH);
}

export async function importAesGcmKey(bytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    bytes as BufferSource,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function exportAesGcmKey(key: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return new Uint8Array(raw);
}

export async function encryptBytes(
  key: CryptoKey,
  plaintext: Uint8Array
): Promise<string> {
  const iv = randomBytes(IV_LENGTH);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      plaintext as BufferSource
    )
  );
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return toBase64(combined);
}

export async function decryptBytes(
  key: CryptoKey,
  payload: string
): Promise<Uint8Array> {
  const combined = fromBase64(payload);
  const iv = combined.slice(0, IV_LENGTH);
  const ct = combined.slice(IV_LENGTH);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ct as BufferSource
  );
  return new Uint8Array(pt);
}

// Constant-time-ish check used only for verifier round-trip
export const VERIFIER_PLAINTEXT = "mypasswordapp::verifier::v1";
