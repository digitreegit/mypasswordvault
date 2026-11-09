import { DEFAULT_PBKDF2_ITERATIONS, toBase64 } from "./crypto";
import { getSupabase } from "./supabaseClient";

/** Fixed salt — must be identical on every device (not the vault salt). */
const CONTINUITY_SALT = new TextEncoder().encode(
  "mypasswordvault.app::vault-continuity::v1",
);

/**
 * Derive a continuity proof from the master password.
 * Same password → same proof on iPhone and web. Never sent as the raw password.
 */
export async function deriveVaultContinuityProof(
  masterPassword: string,
): Promise<string> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: CONTINUITY_SALT,
      iterations: DEFAULT_PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    256,
  );
  return toBase64(new Uint8Array(bits))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function invokeContinuity(
  action: "register" | "absorb",
  proof: string,
): Promise<Record<string, unknown>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "not_configured" };
  const { data, error } = await supabase.functions.invoke("vault-continuity", {
    body: { action, proof },
  });
  if (error) {
    console.warn("vault-continuity", action, error);
    return { ok: false, error: error.message };
  }
  return (data ?? {}) as Record<string, unknown>;
}

/** After vault exists + cloud backup: bind this master password to user_id. */
export async function registerVaultContinuity(
  masterPassword: string,
): Promise<boolean> {
  try {
    const proof = await deriveVaultContinuityProof(masterPassword);
    const res = await invokeContinuity("register", proof);
    return res.ok === true;
  } catch (e) {
    console.warn("registerVaultContinuity", e);
    return false;
  }
}

export type AbsorbContinuityResult =
  | { absorbed: false }
  | { absorbed: true; canonicalUserId: string };

/**
 * If this Auth user is empty and the master password matches an existing vault,
 * move Google/email identities onto that vault owner and switch the session.
 */
export async function absorbVaultContinuityIfMatch(
  masterPassword: string,
): Promise<AbsorbContinuityResult> {
  const supabase = getSupabase();
  if (!supabase) return { absorbed: false };

  const proof = await deriveVaultContinuityProof(masterPassword);
  const res = await invokeContinuity("absorb", proof);
  if (res.ok !== true || res.absorbed !== true || !res.tokenHash) {
    return { absorbed: false };
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: String(res.tokenHash),
    type: "email",
  });
  if (error) {
    console.warn("absorbVaultContinuity session", error);
    return { absorbed: false };
  }

  return {
    absorbed: true,
    canonicalUserId: String(res.canonicalUserId ?? ""),
  };
}
