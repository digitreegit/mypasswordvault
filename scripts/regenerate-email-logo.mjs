#!/usr/bin/env node
/**
 * Build public/email/vault-icon.png from symbol-mypasswordvault.png (80×80 for CID), then embed.
 * Run: npm run email:logo
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const symbol = join(root, "public/email/symbol-mypasswordvault.png");
const out = join(root, "public/email/vault-icon.png");

if (!existsSync(symbol)) {
  console.error(`Missing ${symbol}`);
  process.exit(1);
}

const sips = spawnSync("sips", ["-Z", "80", symbol, "--out", out], {
  stdio: "inherit",
});
if (sips.status !== 0) process.exit(sips.status ?? 1);

const embed = spawnSync("node", ["scripts/embed-email-logo.mjs"], {
  cwd: root,
  stdio: "inherit",
});
if (embed.status !== 0) process.exit(embed.status ?? 1);
