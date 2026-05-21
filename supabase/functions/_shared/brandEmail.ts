/** Shared HTML + defaults for transactional mail (Resend). */

import { EMAIL_LOGO_CID } from "./brandEmailLogo.ts";

export const BRAND_NAME = "My Password Vault";

/** Recommended secret: `My Password Vault <noreply@mypasswordvault.app>` */
export const DEFAULT_RESEND_FROM = `${BRAND_NAME} <noreply@mypasswordvault.app>`;

const BRAND_ACCENT = "#6366f1";
const BRAND_TEXT = "#1f1f24";
const BODY_PADDING_X = "32px";
/** symbol-mypasswordvault.png → vault-icon.png 80×80; display 40×40 in mail */
const LOGO_WIDTH = 40;
const LOGO_HEIGHT = 40;

function emailBrandHeaderHtml(): string {
  const name = escapeHtml(BRAND_NAME);
  return `<table role="presentation" cellspacing="0" cellpadding="0" align="left">
  <tr>
    <td width="${LOGO_WIDTH}" style="width:${LOGO_WIDTH}px;padding-right:10px;vertical-align:middle;line-height:0;font-size:0;">
      <img src="cid:${EMAIL_LOGO_CID}" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" alt="" style="display:block;border:0;outline:none;text-decoration:none;width:${LOGO_WIDTH}px;height:${LOGO_HEIGHT}px;max-width:100%;" />
    </td>
    <td style="vertical-align:middle;font-family:'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:17px;font-weight:600;letter-spacing:-0.02em;color:${BRAND_TEXT};">${name}</td>
  </tr>
</table>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type BrandedEmailOptions = {
  title: string;
  intro: string;
  buttonLabel: string;
  url: string;
  /** Optional 6-digit OTP shown under the button */
  otp?: string;
  footnote?: string;
};

/**
 * Responsive, client-safe layout for sign-up, recovery-via-hook, magic link, etc.
 */
export function buildBrandedEmailHtml(opts: BrandedEmailOptions): string {
  const title = escapeHtml(opts.title);
  const intro = escapeHtml(opts.intro);
  const buttonLabel = escapeHtml(opts.buttonLabel);
  const url = escapeHtml(opts.url);
  const footnote = escapeHtml(
    opts.footnote ??
      "If you did not request this email, you can safely ignore it."
  );
  const otpBlock =
    opts.otp && opts.otp.length >= 4
      ? `<tr>
            <td style="padding:16px ${BODY_PADDING_X} 0;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#42424a;text-align:left;">
                Or enter this code: <strong style="font-size:18px;letter-spacing:0.08em;color:${BRAND_TEXT};">${escapeHtml(opts.otp)}</strong>
              </p>
            </td>
          </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600&amp;display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f7f7f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #eeeef1;border-radius:12px;">
          <tr>
            <td style="padding:36px ${BODY_PADDING_X} 14px;text-align:left;">
              ${emailBrandHeaderHtml()}
            </td>
          </tr>
          <tr>
            <td style="padding:8px ${BODY_PADDING_X} 0;">
              <h1 style="margin:0;font-size:22px;font-weight:700;line-height:1.3;color:${BRAND_TEXT};text-align:left;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:16px ${BODY_PADDING_X} 0;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#42424a;text-align:left;">${intro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px ${BODY_PADDING_X} 0;" align="left">
              <a href="${url}" style="display:inline-block;padding:14px 28px;background-color:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">${buttonLabel}</a>
            </td>
          </tr>
          ${otpBlock}
          <tr>
            <td style="padding:24px ${BODY_PADDING_X} 0;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#86868f;text-align:left;">If the button does not work, copy and paste this link into your browser:</p>
              <p style="margin:8px 0 0;font-size:12px;line-height:1.5;word-break:break-all;text-align:left;"><a href="${url}" style="color:#4f46e5;">${url}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px ${BODY_PADDING_X} 32px;border-top:1px solid #eeeef1;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#86868f;text-align:left;">${footnote}</p>
              <p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#b5b5c0;text-align:left;">&copy; ${new Date().getFullYear()} ${escapeHtml(BRAND_NAME)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
