/**
 * Supabase "Send Email" Auth Hook handler: sends all auth emails via Resend.
 * @see https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
 *
 * Requires RESEND_FROM e.g. `My Password Vault <noreply@mypasswordvault.app>`
 * and Send Email Hook enabled in Supabase Dashboard (otherwise built-in Supabase mail is used).
 */
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import {
  BRAND_NAME,
  buildBrandedEmailHtml,
  DEFAULT_RESEND_FROM,
  escapeHtml,
} from "../_shared/brandEmail.ts";
import { sendBrandedResend } from "../_shared/sendBrandedResend.ts";

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

const SUBJECTS: Record<string, string> = {
  signup: `Confirm your ${BRAND_NAME} account`,
  invite: `You're invited to ${BRAND_NAME}`,
  magiclink: `Sign in to ${BRAND_NAME}`,
  recovery: `Reset your ${BRAND_NAME} password`,
  email_change: `Confirm your ${BRAND_NAME} email change`,
  email: `Confirm sign-in to ${BRAND_NAME}`,
  reauthentication: `Confirm it's you — ${BRAND_NAME}`,
  password_changed_notification: `Your ${BRAND_NAME} password was changed`,
  email_changed_notification: `Your ${BRAND_NAME} email was changed`,
  phone_changed_notification: `Your ${BRAND_NAME} phone number was changed`,
  identity_linked_notification: `A sign-in method was linked to ${BRAND_NAME}`,
  identity_unlinked_notification: `A sign-in method was removed from ${BRAND_NAME}`,
  mfa_factor_enrolled_notification: `Two-step verification enabled on ${BRAND_NAME}`,
  mfa_factor_unenrolled_notification: `Two-step verification updated on ${BRAND_NAME}`,
};

const LINK_COPY: Record<
  string,
  { title: string; intro: string; button: string }
> = {
  signup: {
    title: "Confirm your email address",
    intro:
      `Thanks for signing up for ${BRAND_NAME}. Click the button below to verify this email address and finish creating your account.`,
    button: "Confirm email address",
  },
  invite: {
    title: "You're invited",
    intro: `You've been invited to join ${BRAND_NAME}. Accept the invitation using the button below.`,
    button: "Accept invitation",
  },
  magiclink: {
    title: "Sign in",
    intro: `Use the button below to sign in to ${BRAND_NAME}. This link expires soon.`,
    button: "Sign in",
  },
  recovery: {
    title: "Reset your password",
    intro: `We received a request to reset the password for your ${BRAND_NAME} account.`,
    button: "Set a new password",
  },
  email: {
    title: "Confirm sign-in",
    intro: `Use the button below to continue signing in to ${BRAND_NAME}.`,
    button: "Continue",
  },
  reauthentication: {
    title: "Confirm it's you",
    intro: `For your security, confirm this action on your ${BRAND_NAME} account.`,
    button: "Confirm",
  },
};

function brandedLinkEmail(
  action: string,
  url: string,
  otp?: string
): string {
  const copy = LINK_COPY[action] ?? {
    title: "Account notification",
    intro: `You have a notification from ${BRAND_NAME}.`,
    button: "Continue",
  };
  return buildBrandedEmailHtml({
    title: copy.title,
    intro: copy.intro,
    buttonLabel: copy.button,
    url,
    otp,
  });
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
  const resendFrom = Deno.env.get("RESEND_FROM")?.trim() || DEFAULT_RESEND_FROM;
  const hookSecretRaw = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!resendKey || !hookSecretRaw || !supabaseUrl) {
    console.error(
      "send-auth-email: missing RESEND_API_KEY, SEND_EMAIL_HOOK_SECRET, or SUPABASE_URL"
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
  const subject = SUBJECTS[action] ?? `${BRAND_NAME} account notification`;
  const redirectTo = email_data.redirect_to ?? "";
  const meta = user.user_metadata ?? {};
  const newEmail =
    user.new_email ??
    (typeof meta.new_email === "string" ? meta.new_email : undefined);

  try {
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
        await sendBrandedResend(
          resendKey,
          resendFrom,
          currentEmail,
          `Confirm email change on your ${BRAND_NAME} account`,
          buildBrandedEmailHtml({
            title: "Confirm email change",
            intro: `Confirm updating the email on your ${BRAND_NAME} account using the button below.`,
            buttonLabel: "Confirm change",
            url: urlCurrent,
            otp: email_data.token,
          })
        );
        const urlNew = buildVerifyLink(supabaseUrl, th, "email_change", redirectTo);
        await sendBrandedResend(
          resendKey,
          resendFrom,
          newEmail,
          `Confirm your new ${BRAND_NAME} email`,
          buildBrandedEmailHtml({
            title: "Confirm new email",
            intro: `Confirm this new email address for your ${BRAND_NAME} account.`,
            buttonLabel: "Confirm new email",
            url: urlNew,
            otp: email_data.token_new,
          })
        );
        return json({});
      }

      const dest = newEmail || resolveRecipientEmail(user);
      if (!dest) return json({});
      const hash =
        th.length >= 16 ? th : thn.length >= 16 ? thn : "";
      if (!hash) {
        await sendBrandedResend(
          resendKey,
          resendFrom,
          dest,
          subject,
          buildBrandedEmailHtml({
            title: "Confirm email change",
            intro: `Use the verification code below for your ${BRAND_NAME} account.`,
            buttonLabel: "Open app",
            url: email_data.site_url || "https://mypasswordvault.app/app/",
            otp: email_data.token || email_data.token_new,
          })
        );
        return json({});
      }
      const url = buildVerifyLink(supabaseUrl, hash, "email_change", redirectTo);
      await sendBrandedResend(
        resendKey,
        resendFrom,
        dest,
        subject,
        brandedLinkEmail("email_change", url, email_data.token || email_data.token_new)
      );
      return json({});
    }

    const recipient = resolveRecipientEmail(user);
    if (!recipient) {
      console.warn(
        "send-auth-email: no recipient email, action=",
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
    const hasVerifyToken = th.length >= 8;

    if (linkTypes.has(action) && hasVerifyToken) {
      const url = buildVerifyLink(supabaseUrl, th, action, redirectTo);
      await sendBrandedResend(
        resendKey,
        resendFrom,
        recipient,
        subject,
        brandedLinkEmail(action, url, email_data.token)
      );
      return json({});
    }

    const body =
      email_data.token && email_data.token.length >= 4
        ? buildBrandedEmailHtml({
            title: subject,
            intro: `Use this verification code for your ${BRAND_NAME} account.`,
            buttonLabel: "Open app",
            url: email_data.site_url || "https://mypasswordvault.app/app/",
            otp: email_data.token,
          })
        : `<p style="font-family:sans-serif;color:#42424a;">${escapeHtml(subject)}</p><p style="font-family:sans-serif;color:#42424a;">This is an automated message about your ${escapeHtml(BRAND_NAME)} account.</p>`;
    await sendBrandedResend(resendKey, resendFrom, recipient, subject, body);
    return json({});
  } catch (e) {
    console.error("send-auth-email: send failed", e);
    return new Response(
      JSON.stringify({ error: (e as Error)?.message ?? "send_failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
