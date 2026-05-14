/**
 * Password reset only: generates recovery link via Admin API and sends with Resend.
 * Bypasses Supabase built-in mail (rate limits) when Auth Hook / SMTP are not used.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

/** New projects use SUPABASE_SECRET_KEYS JSON; legacy uses SUPABASE_SERVICE_ROLE_KEY. */
function getAdminApiKey(): string | undefined {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, string>;
      for (const name of ["default", "service_role"]) {
        const v = keys[name];
        if (typeof v === "string" && v.length > 10) return v;
      }
      const first = Object.values(keys).find(
        (v) => typeof v === "string" && v.length > 10
      );
      if (first) return first;
    } catch {
      /* fall through */
    }
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  return legacy || undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const adminKey = getAdminApiKey();
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const resendFrom = Deno.env.get("RESEND_FROM");

  if (!supabaseUrl || !adminKey || !resendKey || !resendFrom) {
    console.error("send-password-reset: missing env", {
      hasUrl: Boolean(supabaseUrl),
      hasAdminKey: Boolean(adminKey),
      hasResendKey: Boolean(resendKey),
      hasResendFrom: Boolean(resendFrom),
    });
    return json({ error: "server_misconfigured" }, 500);
  }

  let body: { email?: unknown; redirectTo?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const redirectTo =
    typeof body.redirectTo === "string" &&
    (body.redirectTo.startsWith("http://") || body.redirectTo.startsWith("https://"))
      ? body.redirectTo
      : undefined;

  if (!email || !email.includes("@")) {
    return json({ ok: true });
  }

  const admin = createClient(supabaseUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error: genErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: redirectTo ? { redirectTo } : undefined,
  });

  if (genErr || !data?.properties?.action_link) {
    console.warn(
      "send-password-reset: generateLink skipped or failed:",
      genErr?.message ?? "no action_link"
    );
    return json({ ok: true });
  }

  const actionLink = String(data.properties.action_link);
  const subject =
    Deno.env.get("RESET_EMAIL_SUBJECT") ?? "Reset your My Password Vault password";

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [email],
      subject,
      html: `<p>You asked to reset the password for your account.</p>
<p><a href="${escapeAttr(actionLink)}">Set a new password</a></p>
<p>If the button does not work, copy this link into your browser:</p>
<p style="word-break:break-all">${escapeAttr(actionLink)}</p>
<p>If you did not request this, you can ignore this email.</p>`,
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text();
    console.error("send-password-reset: Resend HTTP", resendRes.status, detail);
    return json({ error: "email_send_failed" }, 502);
  }

  return json({ ok: true });
});
