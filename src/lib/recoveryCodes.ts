import { randomBytes, toBase64 } from "./crypto";

const CODE_COUNT = 10;
const CODE_SEGMENT_LEN = 4;

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

async function hashRecoveryCode(normalized: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized)
  );
  return toBase64(new Uint8Array(digest));
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
  const h = await hashRecoveryCode(normalizeRecoveryCode(input));
  return hashes.findIndex((x) => x === h);
}
