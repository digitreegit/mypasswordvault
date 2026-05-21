import { EMAIL_LOGO_BASE64, EMAIL_LOGO_CID } from "./brandEmailLogo.ts";

export function brandedEmailAttachments(): {
  filename: string;
  content: string;
  content_id: string;
}[] {
  return [
    {
      filename: "vault-icon.png",
      content: EMAIL_LOGO_BASE64,
      content_id: EMAIL_LOGO_CID,
    },
  ];
}

/** Sends HTML via Resend with vault logo embedded (CID). */
export async function sendBrandedResend(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      attachments: brandedEmailAttachments(),
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Resend ${res.status}: ${t}`);
  }
}
