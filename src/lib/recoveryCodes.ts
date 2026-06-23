import { fromBase64, randomBytes, toBase64 } from "./crypto";

const CODE_COUNT = 10;
const CODE_SEGMENT_LEN = 4;

/**
 * Salted PBKDF2 parameters for recovery-code hashes. Recovery codes are a
 * second factor (the master password is always required to derive the data
 * key), but a salted slow hash makes the stored hashes useless to an attacker
 * who steals the synced snapshot.
 */
const RECOVERY_PBKDF2_ITERATIONS = 100_000;
const RECOVERY_SALT_LEN = 16;
const RECOVERY_HASH_LEN = 32;
const PBKDF2_PREFIX = "pbkdf2";

/** Human-readable codes like `ABCD-EFGH` (8 chars + hyphen). */
export function generateRecoveryCodes(): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const codes: string[] = [];
  for (let i = 0; i < CODE_COUNT; i++) {
    const raw = randomBytes(CODE_SEGMENT_LEN * 2);
    let s = "";
    for (let j = 0; j < raw.length; j++) {
      s += alphabet[raw[j]! % alphabet.length];
    }
    codes.push(`${s.slice(0, CODE_SEGMENT_LEN)}-${s.slice(CODE_SEGMENT_LEN)}`);
  }
  return codes;
}

export function normalizeRecoveryCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

async function pbkdf2Bits(
  normalized: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(normalized),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    RECOVERY_HASH_LEN * 8
  );
  return new Uint8Array(bits);
}

/** New format: `pbkdf2$<iterations>$<saltB64>$<hashB64>` (per-code random salt). */
async function hashRecoveryCode(normalized: string): Promise<string> {
  const salt = randomBytes(RECOVERY_SALT_LEN);
  const hash = await pbkdf2Bits(normalized, salt, RECOVERY_PBKDF2_ITERATIONS);
  return `${PBKDF2_PREFIX}$${RECOVERY_PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/** Legacy unsalted SHA-256 (base64) — verified for vaults created before salting. */
async function legacySha256(normalized: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized)
  );
  return toBase64(new Uint8Array(digest));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** True when `input` matches the stored hash (either new pbkdf2 or legacy sha256). */
async function recoveryCodeMatchesHash(
  normalized: string,
  stored: string
): Promise<boolean> {
  if (stored.startsWith(`${PBKDF2_PREFIX}$`)) {
    const parts = stored.split("$");
    if (parts.length !== 4) return false;
    const iterations = Number.parseInt(parts[1]!, 10);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;
    let salt: Uint8Array;
    try {
      salt = fromBase64(parts[2]!);
    } catch {
      return false;
    }
    const hash = await pbkdf2Bits(normalized, salt, iterations);
    return timingSafeEqual(toBase64(hash), parts[3]!);
  }
  return timingSafeEqual(await legacySha256(normalized), stored);
}

export async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const c of codes) {
    out.push(await hashRecoveryCode(normalizeRecoveryCode(c)));
  }
  return out;
}

/** Returns index of matched hash, or -1. */
export async function matchRecoveryCode(
  input: string,
  hashes: string[]
): Promise<number> {
  const normalized = normalizeRecoveryCode(input);
  for (let i = 0; i < hashes.length; i++) {
    if (await recoveryCodeMatchesHash(normalized, hashes[i]!)) return i;
  }
  return -1;
}
