import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { server } from "https://esm.sh/@passwordless-id/webauthn@2.4.0";

export const AUTH_PASSKEY_RP_ID = "mypasswordvault.app";

export const AUTH_PASSKEY_ORIGINS = new Set([
  "https://mypasswordvault.app",
  "https://www.mypasswordvault.app",
  "https://mypasswordvault.pages.dev",
]);

export function isAllowedAuthPasskeyOrigin(origin: string): boolean {
  if (AUTH_PASSKEY_ORIGINS.has(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    if (u.hostname.endsWith(".mypasswordvault.pages.dev")) return true;
  } catch {
    return false;
  }
  return false;
}

export function getAdminApiKey(): string | undefined {
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

export function adminClient(supabaseUrl: string, adminKey: string): SupabaseClient {
  return createClient(supabaseUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function userClient(
  supabaseUrl: string,
  anonKey: string,
  authz: string,
): SupabaseClient {
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authz } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createChallenge(
  admin: SupabaseClient,
  purpose: "register" | "login",
  userId: string | null,
): Promise<{ challengeId: string; challenge: string }> {
  const challenge = server.randomChallenge();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("auth_passkey_challenges")
    .insert({
      challenge,
      purpose,
      user_id: userId,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error(error?.message || "challenge_create_failed");
  }
  return { challengeId: data.id as string, challenge };
}

export async function consumeChallenge(
  admin: SupabaseClient,
  challengeId: string,
  purpose: "register" | "login",
): Promise<{ challenge: string; userId: string | null }> {
  const { data, error } = await admin
    .from("auth_passkey_challenges")
    .select("id, challenge, user_id, purpose, expires_at")
    .eq("id", challengeId)
    .maybeSingle();
  if (error || !data) throw new Error("challenge_not_found");
  if (data.purpose !== purpose) throw new Error("challenge_purpose_mismatch");
  if (new Date(data.expires_at as string).getTime() < Date.now()) {
    await admin.from("auth_passkey_challenges").delete().eq("id", challengeId);
    throw new Error("challenge_expired");
  }
  await admin.from("auth_passkey_challenges").delete().eq("id", challengeId);
  return {
    challenge: data.challenge as string,
    userId: (data.user_id as string | null) ?? null,
  };
}

export { server };
