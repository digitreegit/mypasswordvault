import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

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

/** HMAC-SHA256(pepper, proof) → hex. Pepper from env or service role key. */
export async function hashContinuityProof(proof: string): Promise<string> {
  const pepper =
    Deno.env.get("VAULT_CONTINUITY_PEPPER")?.trim() ||
    getAdminApiKey() ||
    "mpv-continuity-dev-pepper";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(proof.trim()),
  );
  return Array.from(new Uint8Array(sig), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export function isValidContinuityProof(proof: unknown): proof is string {
  return (
    typeof proof === "string" &&
    /^[A-Za-z0-9_-]{40,128}$/.test(proof.trim())
  );
}
