/**
 * Register a discoverable WebAuthn credential for account login.
 * Authenticated. Separate from vault-unlock PRF passkeys.
 *
 * Body:
 *  { action: "challenge" }
 *  { action: "complete", challengeId, registration }
 */
import {
  adminClient,
  AUTH_PASSKEY_RP_ID,
  consumeChallenge,
  createChallenge,
  getAdminApiKey,
  isAllowedAuthPasskeyOrigin,
  server,
  userClient,
} from "../_shared/authPasskey.ts";

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
    return json({ error: "server_misconfigured" }, 500);
  }

  const authz = req.headers.get("Authorization") ?? "";
  if (!authz.toLowerCase().startsWith("bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: {
    action?: string;
    challengeId?: string;
    registration?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const userSb = userClient(supabaseUrl, anonKey, authz);
  const { data: userData, error: userErr } = await userSb.auth.getUser();
  if (userErr || !userData.user) {
    return json({ error: "unauthorized" }, 401);
  }
  const user = userData.user;
  const admin = adminClient(supabaseUrl, adminKey);

  if (body.action === "challenge") {
    try {
      const { challengeId, challenge } = await createChallenge(
        admin,
        "register",
        user.id,
      );
      return json({
        ok: true,
        challengeId,
        challenge,
        rpId: AUTH_PASSKEY_RP_ID,
        userId: user.id,
        userName: user.email || user.id,
        userDisplayName:
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          user.email ||
          "My Password Vault",
      });
    } catch (e) {
      console.error("auth-passkey-register challenge", e);
      return json({ error: "challenge_failed" }, 500);
    }
  }

  if (body.action === "complete") {
    if (!body.challengeId || !body.registration) {
      return json({ error: "invalid_body" }, 400);
    }
    try {
      const { challenge, userId } = await consumeChallenge(
        admin,
        body.challengeId,
        "register",
      );
      if (userId && userId !== user.id) {
        return json({ error: "challenge_user_mismatch" }, 403);
      }

      const registration = body.registration as {
        id: string;
        response?: { clientDataJSON?: string };
      };
      const info = await server.verifyRegistration(registration as never, {
        challenge,
        origin: (origin: string) => isAllowedAuthPasskeyOrigin(origin),
        domain: AUTH_PASSKEY_RP_ID,
        userVerified: true,
      });

      const { error: upsertErr } = await admin.from("auth_passkeys").upsert(
        {
          user_id: user.id,
          credential_id: info.credential.id,
          public_key: info.credential.publicKey,
          algorithm: info.credential.algorithm,
          counter: info.authenticator.counter ?? 0,
          transports: info.credential.transports ?? null,
          rp_id: AUTH_PASSKEY_RP_ID,
        },
        { onConflict: "credential_id" },
      );
      if (upsertErr) {
        console.error("auth-passkey-register upsert", upsertErr);
        return json({ error: "store_failed" }, 500);
      }
      return json({ ok: true, credentialId: info.credential.id });
    } catch (e) {
      console.error("auth-passkey-register complete", e);
      return json(
        { error: "verify_failed", detail: String((e as Error)?.message ?? e) },
        400,
      );
    }
  }

  return json({ error: "unknown_action" }, 400);
});
