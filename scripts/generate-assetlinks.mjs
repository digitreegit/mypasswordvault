#!/usr/bin/env node
/**
 * Write public/.well-known/assetlinks.json for Android passkeys (Digital Asset Links).
 * Run: npm run android:assetlinks
 * Optional: ANDROID_EXTRA_SHA256_FINGERPRINTS=AA:BB:... npm run android:assetlinks
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PACKAGE = "com.skyface.mypasswordvault";
const outDir = join(process.cwd(), "public/.well-known");
const outPath = join(outDir, "assetlinks.json");

function readDebugFingerprint() {
  const keystore = join(homedir(), ".android/debug.keystore");
  if (!existsSync(keystore)) return null;
  try {
    const out = execSync(
      `keytool -list -v -keystore "${keystore}" -alias androiddebugkey -storepass android -keypass android`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
    );
    const match = out.match(/SHA256:\s*([0-9A-F:]+)/i);
    return match?.[1]?.trim().toUpperCase() ?? null;
  } catch {
    return null;
  }
}

const fingerprints = new Set();
const debug = readDebugFingerprint();
if (debug) fingerprints.add(debug);

const extra = process.env.ANDROID_EXTRA_SHA256_FINGERPRINTS?.trim();
if (extra) {
  for (const fp of extra.split(/[,\s]+/)) {
    const normalized = fp.trim().toUpperCase();
    if (normalized) fingerprints.add(normalized);
  }
}

if (fingerprints.size === 0) {
  console.error(
    "No SHA-256 fingerprints found. Install Android SDK debug keystore or set ANDROID_EXTRA_SHA256_FINGERPRINTS.",
  );
  process.exit(1);
}

const payload = [
  {
    relation: [
      "delegate_permission/common.handle_all_urls",
      "delegate_permission/common.get_login_creds",
    ],
    target: {
      namespace: "android_app",
      package_name: PACKAGE,
      sha256_cert_fingerprints: [...fingerprints],
    },
  },
];

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`wrote ${outPath}`);
for (const fp of fingerprints) {
  console.log(`  SHA-256: ${fp}`);
}
console.log(
  "\nDeploy the site so https://mypasswordvault.app/.well-known/assetlinks.json is live.",
);
console.log(
  "For Play release builds, add the Play App Signing SHA-256 via ANDROID_EXTRA_SHA256_FINGERPRINTS.",
);
