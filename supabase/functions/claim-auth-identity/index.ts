/**
 * Delete an empty duplicate Auth user so the caller can attach that login.
 * For email: also set email+password on the caller (admin, email_confirm).
 * Never deletes accounts that have vault data, PRO, or complimentary grants.
 *
 * Body:
 *  { provider: "apple"|"google", emptyUserId }
 *  { provider: "email", emptyUserId, email, password }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { permanentlyDeleteUserAccount } from "../_shared/deleteUserAccount.ts";
import {
  isEmptyClaimableAccount,
  userHasProvider,
  type AuthProvider,
} from "../_shared/emptyAccount.ts";

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
        (v) => typeof v === "string" && v.length > 10,
      );
      if (first) return first;
    } catch {
      /* fall through */
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() || undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const adminKey = getAdminApiKey();
  if (!supabaseUrl || !anonKey || !adminKey) {
    console.error("claim-auth-identity: missing env");
    return json({ error: "server_misconfigured" }, 500);
  }

  const authz = req.headers.get("Authorization") ?? "";
  if (!authz.toLowerCase().startsWith("bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: {
    provider?: string;
    emptyUserId?: string;
    email?: string;
    password?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const provider = body.provider?.trim() as AuthProvider | undefined;
  const emptyUserId = body.emptyUserId?.trim() ?? "";
  if (provider !== "apple" && provider !== "google" && provider !== "email") {
    return json({ error: "invalid_provider" }, 400);
  }
  if (!emptyUserId || emptyUserId.length < 10) {
    return json({ error: "invalid_empty_user_id" }, 400);
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (provider === "email") {
    if (!email || !email.includes("@")) {
      return json({ error: "invalid_email" }, 400);
    }
    if (password.length < 6) {
      return json({ error: "invalid_password" }, 400);
    }
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authz } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user?.id) {
    return json({ error: "unauthorized" }, 401);
  }
  const callerId = userData.user.id;
  if (callerId === emptyUserId) {
    return json({ error: "cannot_claim_self" }, 400);
  }

  // OAuth: caller must not already own that provider.
  // Email: Apple/Google-only users usually have no email identity yet (relay is not email provider).
  if (provider !== "email" && userHasProvider(userData.user, provider)) {
    return json({ error: "caller_already_has_provider", provider }, 409);
  }
  if (provider === "email" && userHasProvider(userData.user, "email")) {
    return json({ error: "caller_already_has_provider", provider }, 409);
  }

  const admin = createClient(supabaseUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: otherPack, error: otherErr } = await admin.auth.admin.getUserById(
    emptyUserId,
  );
  if (otherErr || !otherPack?.user) {
    return json({ error: "empty_user_not_found" }, 404);
  }
  const other = otherPack.user;
  if (!userHasProvider(other, provider)) {
    return json({ error: "empty_user_missing_provider", provider }, 409);
  }
  if (provider === "email") {
    const otherEmail = (other.email ?? "").trim().toLowerCase();
    if (otherEmail !== email) {
      return json({ error: "email_mismatch" }, 409);
    }
  }

  const emptyOk = await isEmptyClaimableAccount(admin, emptyUserId);
  if (!emptyOk) {
    return json(
      {
        error: "other_account_has_data",
        message:
          "That sign-in already belongs to another vault. Sign in with it instead of linking.",
      },
      409,
    );
  }

  const result = await permanentlyDeleteUserAccount(admin, emptyUserId);
  if ("error" in result) {
    return json({ error: result.error }, 500);
  }

  if (provider === "email") {
    const { error: updErr } = await admin.auth.admin.updateUserById(callerId, {
      email,
      password,
      email_confirm: true,
    });
    if (updErr) {
      console.error("claim-auth-identity: attach email", updErr);
      return json(
        {
          error: "attach_email_failed",
          message: updErr.message,
          deletedUserId: emptyUserId,
        },
        500,
      );
    }
  }

  return json({
    ok: true,
    deletedUserId: emptyUserId,
    provider,
    retryLink: provider !== "email",
    emailAttached: provider === "email",
  });
});
