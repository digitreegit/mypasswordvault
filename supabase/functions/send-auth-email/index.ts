/**
 * Supabase "Send Email" Auth Hook handler: sends all auth emails via Resend.
 * @see https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
 */
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function buildVerifyLink(
  supabaseUrl: string,
  tokenHash: string,
  actionType: string,
  redirectTo: string
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const u = new URL(`${base}/auth/v1/verify`);
  u.searchParams.set("token", tokenHash);
  u.searchParams.set("type", actionType);
  if (redirectTo) u.searchParams.set("redirect_to", redirectTo);
  return u.toString();
}

function linkEmailHtml(title: string, intro: string, url: string, otp?: string) {
  const otpBlock =
    otp && otp.length >= 4
      ? `<p>Or enter this code: <strong>${escapeAttr(otp)}</strong></p>`
      : "";
  return `<p><strong>${escapeAttr(title)}</strong></p>
<p>${escapeAttr(intro)}</p>
<p><a href="${escapeAttr(url)}">Continue</a></p>
<p style="word-break:break-all;font-size:12px;color:#555">${escapeAttr(url)}</p>
${otpBlock}
<p style="font-size:12px;color:#777">If you did not request this, you can ignore this email.</p>`;
}

const SUBJECTS: Record<string, string> = {
  signup: "Confirm your email",
  invite: "You are invited",
  magiclink: "Your magic link",
  recovery: "Reset your password",
  email_change: "Confirm email change",
  email: "Confirm sign-in",
  reauthentication: "Confirm it is you",
  password_changed_notification: "Your password was changed",
  email_changed_notification: "Your email was changed",
  phone_changed_notification: "Your phone was changed",
  identity_linked_notification: "A sign-in method was linked",
  identity_unlinked_notification: "A sign-in method was removed",
  mfa_factor_enrolled_notification: "Two-step verification was enabled",
  mfa_factor_unenrolled_notification: "Two-step verification was updated",
};

async function sendViaResend(
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
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Resend ${res.status}: ${t}`);
  }
}

type UserRow = {
  id: string;
  email?: string;
  new_email?: string;
  user_metadata?: Record<string, unknown>;
  identities?: Array<{
    identity_data?: { email?: string; sub?: string };
  }>;
};

/** Hook payload sometimes omits `user.email`; fall back to identities / metadata. */
function resolveRecipientEmail(user: UserRow): string | undefined {
  const e = user.email?.trim();
  if (e && e.includes("@")) return e;
  for (const row of user.identities ?? []) {
    const id = row.identity_data?.email?.trim();
    if (id && id.includes("@")) return id;
  }
  const meta = user.user_metadata?.email;
  if (typeof meta === "string" && meta.includes("@")) return meta.trim();
  return undefined;
}

type EmailData = {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  token_new: string;
  token_hash_new: string;
  old_email?: string;
  old_phone?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const resendFrom = Deno.env.get("RESEND_FROM");
  const hookSecretRaw = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!resendKey || !resendFrom || !hookSecretRaw || !supabaseUrl) {
    console.error(
      "send-auth-email: missing RESEND_API_KEY, RESEND_FROM, SEND_EMAIL_HOOK_SECRET, or SUPABASE_URL"
    );
    return json({ error: "server_misconfigured" }, 500);
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  let user: UserRow;
  let email_data: EmailData;
  try {
    const secret = hookSecretRaw.replace(/^v1,whsec_/, "");
    const wh = new Webhook(secret);
    const verified = wh.verify(payload, headers) as {
      user: UserRow;
      email_data: EmailData;
    };
    user = verified.user;
    email_data = verified.email_data;
  } catch (e) {
    console.error("send-auth-email: webhook verify failed", e);
    return new Response(JSON.stringify({ error: "invalid_signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const action = email_data.email_action_type;
  const subject = SUBJECTS[action] ?? "Account notification";
  const redirectTo = email_data.redirect_to ?? "";
  const meta = user.user_metadata ?? {};
  const newEmail =
    user.new_email ??
    (typeof meta.new_email === "string" ? meta.new_email : undefined);

  try {
    // Secure email change: two messages (Supabase docs — token/hash mapping is intentional).
    if (action === "email_change") {
      const th = email_data.token_hash ?? "";
      const thn = email_data.token_hash_new ?? "";
      const currentEmail = resolveRecipientEmail(user);
      const dual =
        currentEmail &&
        newEmail &&
        th.length >= 16 &&
        thn.length >= 16 &&
        email_data.token &&
        email_data.token_new;

      if (dual) {
        const urlCurrent = buildVerifyLink(supabaseUrl, thn, "email_change", redirectTo);
        await sendViaResend(
          resendKey,
          resendFrom,
          currentEmail,
          "Confirm email change (current address)",
          linkEmailHtml(
            "Confirm change",
            "Confirm updating your email using the link below.",
            urlCurrent,
            email_data.token
          )
        );
        const urlNew = buildVerifyLink(supabaseUrl, th, "email_change", redirectTo);
        await sendViaResend(
          resendKey,
          resendFrom,
          newEmail,
          "Confirm your new email address",
          linkEmailHtml(
            "Confirm new email",
            "Confirm this address using the link below.",
            urlNew,
            email_data.token_new
          )
        );
        return json({});
      }

      const dest = newEmail || resolveRecipientEmail(user);
      if (!dest) return json({});
      const hash =
        th.length >= 16 ? th : thn.length >= 16 ? thn : "";
      if (!hash) {
        await sendViaResend(
          resendKey,
          resendFrom,
          dest,
          subject,
          `<p>${escapeAttr(subject)}</p><p>Use the code: <strong>${escapeAttr(
            email_data.token || email_data.token_new
          )}</strong></p>`
        );
        return json({});
      }
      const url = buildVerifyLink(supabaseUrl, hash, "email_change", redirectTo);
      await sendViaResend(
        resendKey,
        resendFrom,
        dest,
        subject,
        linkEmailHtml(
          "Confirm email change",
          "Use the link below to confirm your email change.",
          url,
          email_data.token || email_data.token_new
        )
      );
      return json({});
    }

    const recipient = resolveRecipientEmail(user);
    if (!recipient) {
      console.warn(
        "send-auth-email: no recipient email (user.email / identities / metadata empty), action=",
        action
      );
      return json({});
    }

    const linkTypes = new Set([
      "signup",
      "invite",
      "magiclink",
      "recovery",
      "email",
      "reauthentication",
    ]);
    const th = email_data.token_hash ?? "";
    // Supabase hashes vary in length; require a non-trivial token for link-based mail.
    const hasVerifyToken = th.length >= 8;

    if (linkTypes.has(action) && hasVerifyToken) {
      const url = buildVerifyLink(supabaseUrl, th, action, redirectTo);
      const intros: Record<string, string> = {
        signup: "Confirm your email address for your account.",
        invite: "You have been invited — use the link below to accept.",
        magiclink: "Use the link below to sign in.",
        recovery: "Use the link below to set a new password.",
        email: "Use the link below to continue signing in.",
        reauthentication: "Use the link below to confirm it is you.",
      };
      await sendViaResend(
        resendKey,
        resendFrom,
        recipient,
        subject,
        linkEmailHtml(subject, intros[action] ?? "Use the link below.", url, email_data.token)
      );
      return json({});
    }

    // Notifications and other types: no verify link required.
    const body =
      email_data.token && email_data.token.length >= 4
        ? `<p>${escapeAttr(subject)}</p><p>Code: <strong>${escapeAttr(
            email_data.token
          )}</strong></p>`
        : `<p>${escapeAttr(subject)}</p><p>This is an automated message about your account.</p>`;
    await sendViaResend(resendKey, resendFrom, recipient, subject, body);
    return json({});
  } catch (e) {
    console.error("send-auth-email: send failed", e);
    return new Response(
      JSON.stringify({ error: (e as Error)?.message ?? "send_failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
