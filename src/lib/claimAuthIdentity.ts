import { getSupabase } from "./supabaseClient";

export type ClaimAuthProvider = "apple" | "google" | "email";

export type ClaimAuthIdentityResult =
  | {
      ok: true;
      deletedUserId: string;
      provider: ClaimAuthProvider;
      emailAttached?: boolean;
    }
  | { ok: false; error: string; status: number };

/**
 * Delete an empty duplicate Auth user so the caller can attach that login.
 * For email, also attaches email+password to the caller via admin.
 */
export async function claimAuthIdentity(opts: {
  provider: ClaimAuthProvider;
  emptyUserId: string;
  email?: string;
  password?: string;
}): Promise<ClaimAuthIdentityResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: "not_configured", status: 500 };
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return { ok: false, error: "unauthorized", status: 401 };
  }

  const body: Record<string, string> = {
    provider: opts.provider,
    emptyUserId: opts.emptyUserId,
  };
  if (opts.provider === "email") {
    if (!opts.email || !opts.password) {
      return { ok: false, error: "invalid_email", status: 400 };
    }
    body.email = opts.email;
    body.password = opts.password;
  }

  const { data, error } = await supabase.functions.invoke("claim-auth-identity", {
    body,
  });

  if (error) {
    const msg = error.message || "claim_failed";
    return { ok: false, error: msg, status: 500 };
  }

  const res = data as {
    ok?: boolean;
    error?: string;
    deletedUserId?: string;
    provider?: ClaimAuthProvider;
    emailAttached?: boolean;
  } | null;

  if (res?.ok && res.deletedUserId) {
    return {
      ok: true,
      deletedUserId: res.deletedUserId,
      provider: res.provider ?? opts.provider,
      emailAttached: Boolean(res.emailAttached),
    };
  }

  return {
    ok: false,
    error: res?.error || "claim_failed",
    status: 409,
  };
}

export function isIdentityAlreadyLinkedError(e: unknown): boolean {
  const msg = String((e as Error)?.message ?? e ?? "").toLowerCase();
  return (
    msg.includes("identity") &&
    (msg.includes("already") ||
      msg.includes("linked") ||
      msg.includes("exists") ||
      msg.includes("registered"))
  );
}
