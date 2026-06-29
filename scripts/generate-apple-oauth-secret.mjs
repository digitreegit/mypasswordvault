/**
 * Generate Apple OAuth client secret (JWT) for Supabase Auth → Apple provider.
 *
 * Usage (from repo root; never commit .p8 or output JWT):
 *   node scripts/generate-apple-oauth-secret.mjs ~/Downloads/AuthKey_KWBH5GD5AS.p8
 *
 * Optional env overrides:
 *   APPLE_TEAM_ID=T42D4PX35G
 *   APPLE_KEY_ID=KWBH5GD5AS
 *   APPLE_CLIENT_ID=com.skyface.mypasswordvault.auth
 */
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

const p8Path = process.argv[2];
if (!p8Path) {
  console.error(
    "Usage: node scripts/generate-apple-oauth-secret.mjs /path/to/AuthKey_XXXXX.p8"
  );
  process.exit(1);
}

const teamId = process.env.APPLE_TEAM_ID ?? "T42D4PX35G";
const keyId = process.env.APPLE_KEY_ID ?? "KWBH5GD5AS";
const clientId =
  process.env.APPLE_CLIENT_ID ?? "com.skyface.mypasswordvault.auth";

const privateKey = readFileSync(p8Path, "utf8");

const now = Math.floor(Date.now() / 1000);
// Apple allows max ~6 months; regenerate before expiry (Supabase warns every 6 months).
const exp = now + 60 * 60 * 24 * 180;

const header = { alg: "ES256", kid: keyId, typ: "JWT" };
const payload = {
  iss: teamId,
  iat: now,
  exp,
  aud: "https://appleid.apple.com",
  sub: clientId,
};

function b64url(value) {
  return Buffer.from(value).toString("base64url");
}

const encodedHeader = b64url(JSON.stringify(header));
const encodedPayload = b64url(JSON.stringify(payload));
const signingInput = `${encodedHeader}.${encodedPayload}`;

const sign = createSign("SHA256");
sign.update(signingInput);
sign.end();

const signature = sign.sign({
  key: privateKey,
  format: "pem",
  dsaEncoding: "ieee-p1363",
});

const jwt = `${signingInput}.${signature.toString("base64url")}`;

console.log(jwt);
console.error(
  `\nPaste the line above into Supabase → Auth → Apple → Secret Key (for OAuth).\n` +
    `Valid ~180 days. Team=${teamId} Key=${keyId} Client=${clientId}\n`
);
