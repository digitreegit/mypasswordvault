import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ISSUER = "My Password Vault";

/** Backup TOTP account — separate from passkey (Apple Passwords cannot add TOTP to passkeys). */
export const TOTP_BACKUP_ACCOUNT = "backup@mypasswordvault.app";

export function generateTotpSecretBase32(): string {
  // 160-bit secret, base32 encoded — standard for TOTP
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function buildTotp(
  secretBase32: string,
  account: string = "vault"
): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: account,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function otpauthUri(secretBase32: string, account: string): string {
  return buildTotp(secretBase32, account).toString();
}

export async function otpauthQrDataUrl(
  secretBase32: string,
  account: string
): Promise<string> {
  const uri = otpauthUri(secretBase32, account);
  return QRCode.toDataURL(uri, {
    margin: 1,
    width: 220,
    color: { dark: "#1f1f24", light: "#ffffff" },
  });
}

// Validate a 6-digit user-supplied code; allow ±1 step window for clock drift.
export async function copyTextForClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function verifyTotp(secretBase32: string, code: string): boolean {
  const cleaned = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const totp = buildTotp(secretBase32);
  const delta = totp.validate({ token: cleaned, window: 1 });
  return delta !== null;
}
