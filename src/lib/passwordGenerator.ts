import { randomBytes } from "./crypto";

export interface GenOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean;
}

export const DEFAULT_GEN: GenOptions = {
  length: 20,
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
  avoidAmbiguous: true,
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

  // Ensure at least one character from each enabled class for entropy diversity.
  const required: string[] = [];
  const addOne = (set: string) => {
    const filtered = opts.avoidAmbiguous
      ? set.split("").filter((c) => !AMBIG.has(c)).join("")
      : set;
    if (filtered) required.push(filtered[pickIndex(filtered.length)]);
  };
  if (opts.lower) addOne(LOWER);
  if (opts.upper) addOne(UPPER);
  if (opts.digits) addOne(DIGITS);
  if (opts.symbols) addOne(SYMBOLS);

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
