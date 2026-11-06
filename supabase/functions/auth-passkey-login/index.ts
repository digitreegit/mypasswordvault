/**
 * Public WebAuthn login → Supabase session via magiclink token_hash.
 *
 * Body:
 *  { action: "challenge" }
 *  { action: "complete", challengeId, authentication }
 */
import {
  adminClient,
  AUTH_PASSKEY_RP_ID,
  consumeChallenge,
  createChallenge,
  getAdminApiKey,
  isAllowedAuthPasskeyOrigin,
  server,
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
  const adminKey = getAdminApiKey();
  if (!supabaseUrl || !adminKey) {
    return json({ error: "server_misconfigured" }, 500);
  }
  const admin = adminClient(supabaseUrl, adminKey);

  let body: {
    action?: string;
    challengeId?: string;
    authentication?: { id?: string };
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (body.action === "challenge") {
    try {
      const { challengeId, challenge } = await createChallenge(
        admin,
        "login",
        null,
      );
      return json({
        ok: true,
        challengeId,
        challenge,
        rpId: AUTH_PASSKEY_RP_ID,
      });
    } catch (e) {
      console.error("auth-passkey-login challenge", e);
      return json({ error: "challenge_failed" }, 500);
    }
  }

  if (body.action === "complete") {
    if (!body.challengeId || !body.authentication?.id) {
      return json({ error: "invalid_body" }, 400);
    }
    try {
      const { challenge } = await consumeChallenge(
        admin,
        body.challengeId,
        "login",
      );

      const credentialId = body.authentication.id;
      const { data: row, error: rowErr } = await admin
        .from("auth_passkeys")
        .select(
          "id, user_id, credential_id, public_key, algorithm, counter, transports, rp_id",
        )
        .eq("credential_id", credentialId)
        .maybeSingle();
      if (rowErr || !row) {
        return json({ error: "unknown_credential" }, 404);
      }

      const info = await server.verifyAuthentication(
        body.authentication as never,
        {
          id: row.credential_id as string,
          publicKey: row.public_key as string,
          algorithm: row.algorithm as "RS256" | "ES256",
          transports: (row.transports as string[] | null) ?? undefined,
        },
        {
          challenge,
          origin: (origin: string) => isAllowedAuthPasskeyOrigin(origin),
          domain: AUTH_PASSKEY_RP_ID,
          userVerified: true,
          counter: Number(row.counter ?? 0),
        },
      );

      await admin
        .from("auth_passkeys")
        .update({
          counter: info.authenticator.counter ?? Number(row.counter ?? 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      const { data: userData, error: getUserErr } =
        await admin.auth.admin.getUserById(row.user_id as string);
      if (getUserErr || !userData.user?.email) {
        return json({ error: "user_email_missing" }, 500);
      }

      const { data: linkData, error: linkErr } =
        await admin.auth.admin.generateLink({
          type: "magiclink",
          email: userData.user.email,
        });
      if (linkErr || !linkData?.properties?.hashed_token) {
        console.error("auth-passkey-login generateLink", linkErr);
        return json({ error: "session_mint_failed" }, 500);
      }

      return json({
        ok: true,
        tokenHash: linkData.properties.hashed_token,
        email: userData.user.email,
      });
    } catch (e) {
      console.error("auth-passkey-login complete", e);
      return json(
        { error: "verify_failed", detail: String((e as Error)?.message ?? e) },
        400,
      );
    }
  }

  return json({ error: "unknown_action" }, 400);
});
