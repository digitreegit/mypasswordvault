#!/usr/bin/env node
/** Embed public/email/vault-icon.png (from symbol-mypasswordvault.png via npm run email:logo) */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const png = readFileSync(join(root, "public/email/vault-icon.png"));
const b64 = png.toString("base64");
const out = join(root, "supabase/functions/_shared/brandEmailLogo.ts");
writeFileSync(
  out,
  `/** PNG for Resend CID inline attach (from public/email/vault-icon.png). Regenerate: node scripts/embed-email-logo.mjs */
export const EMAIL_LOGO_CID = "vault-logo";
export const EMAIL_LOGO_BASE64 = "${b64}";
`
);
console.log(`Wrote ${out} (${b64.length} base64 chars)`);
