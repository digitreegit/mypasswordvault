import { randomBytes } from "./crypto";

export interface GenOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean;
  /** Minimum digit count when `digits` is enabled. */
  minDigits: number;
  /** Minimum symbol count when `symbols` is enabled. */
  minSymbols: number;
}

export const DEFAULT_GEN: GenOptions = {
  length: 20,
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
  avoidAmbiguous: true,
  minDigits: 1,
  minSymbols: 1,
};

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/~";
const AMBIG = new Set("Il1O0o`'\"".split(""));

function buildAlphabet(opts: GenOptions): string {
  let pool = "";
  if (opts.lower) pool += LOWER;
  if (opts.upper) pool += UPPER;
  if (opts.digits) pool += DIGITS;
  if (opts.symbols) pool += SYMBOLS;
  if (opts.avoidAmbiguous) {
    pool = pool
      .split("")
      .filter((c) => !AMBIG.has(c))
      .join("");
  }
  return pool;
}

function filterCharset(set: string, avoidAmbiguous: boolean): string {
  if (!avoidAmbiguous) return set;
  return set
    .split("")
    .filter((c) => !AMBIG.has(c))
    .join("");
}

function effectiveMinimums(
  opts: GenOptions,
  len: number
): { minDigits: number; minSymbols: number } {
  let minDigits = opts.digits ? Math.max(0, Math.floor(opts.minDigits)) : 0;
  let minSymbols = opts.symbols ? Math.max(0, Math.floor(opts.minSymbols)) : 0;
  const base = (opts.lower ? 1 : 0) + (opts.upper ? 1 : 0);
  let total = base + minDigits + minSymbols;
  while (total > len && (minDigits > 0 || minSymbols > 0)) {
    if (minSymbols >= minDigits && minSymbols > 0) minSymbols--;
    else if (minDigits > 0) minDigits--;
    total--;
  }
  return { minDigits, minSymbols };
}

function pickFrom(set: string, avoidAmbiguous: boolean): string {
  const filtered = filterCharset(set, avoidAmbiguous);
  if (!filtered) throw new Error("empty charset");
  return filtered[pickIndex(filtered.length)];
}

// Rejection sampling to remove modulo bias.
function pickIndex(max: number): number {
  if (max <= 0) throw new Error("empty alphabet");
  const limit = Math.floor(0x100000000 / max) * max;
  while (true) {
    const buf = randomBytes(4);
    const n =
      (buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | (buf[3] & 0xff);
    const unsigned = n >>> 0;
    if (unsigned < limit) return unsigned % max;
  }
}

export function generatePassword(opts: GenOptions = DEFAULT_GEN): string {
  const pool = buildAlphabet(opts);
  if (!pool) return "";
  const len = Math.max(4, Math.min(opts.length, 128));
  const { minDigits, minSymbols } = effectiveMinimums(opts, len);

  const required: string[] = [];
  const addMany = (set: string, count: number) => {
    if (count <= 0) return;
    for (let i = 0; i < count; i++) {
      required.push(pickFrom(set, opts.avoidAmbiguous));
    }
  };
  if (opts.lower) addMany(LOWER, 1);
  if (opts.upper) addMany(UPPER, 1);
  if (opts.digits) addMany(DIGITS, minDigits);
  if (opts.symbols) addMany(SYMBOLS, minSymbols);

  const out: string[] = [...required];
  while (out.length < len) out.push(pool[pickIndex(pool.length)]);

  // Fisher–Yates shuffle so required chars aren't always at the start.
  for (let i = out.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, len).join("");
}

/** Entropy heuristic → 0 (empty) … 4 (very strong). UI maps via i18n `strength.N`. */
export function passwordStrengthScore(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  let classes = 0;
  if (/[a-z]/.test(password)) classes++;
  if (/[A-Z]/.test(password)) classes++;
  if (/[0-9]/.test(password)) classes++;
  if (/[^A-Za-z0-9]/.test(password)) classes++;
  const entropyBits =
    password.length * Math.log2(Math.max(26 * classes, 26));
  if (entropyBits < 40) return 1;
  if (entropyBits < 60) return 2;
  if (entropyBits < 90) return 3;
  return 4;
}
