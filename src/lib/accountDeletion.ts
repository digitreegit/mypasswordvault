import { clearAuthLastMethod, clearPendingAuthMethod } from "./authLastUsed";
import { clearPasswordRecoveryPending } from "./passwordRecoveryPending";
import { getSupabase, isSupabaseConfigured } from "./supabaseClient";
import { wipeAll } from "./storage";
import { clearVaultOwnerUserId } from "./vaultOwner";

function functionsBaseUrl(): string {
  const url = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
  if (!url) throw new Error("Supabase not configured");
  return `${url}/functions/v1`;
}

/** Permanently delete the signed-in Auth user and server-side data. */
export async function requestAccountDeletion(): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("not_configured");
  }
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (sessionErr || !token) {
    throw new Error("not_signed_in");
  }

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
  if (!anonKey) throw new Error("Supabase not configured");

  let res: Response;
  try {
    res = await fetch(`${functionsBaseUrl()}/delete-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      body: "{}",
    });
  } catch {
    throw new Error("function_unreachable");
  }

  if (!res.ok) {
    let code = "delete_failed";
    try {
      const body = (await res.json()) as { error?: string; code?: string };
      if (body?.error) code = body.error;
      else if (body?.code === "NOT_FOUND") code = "function_not_deployed";
    } catch {
      if (res.status === 404) code = "function_not_deployed";
    }
    throw new Error(code);
  }
}

/** Remove vault and auth-related data stored on this device. */
export async function clearAllLocalAppData(): Promise<void> {
  await wipeAll();
  clearVaultOwnerUserId();
  clearPendingAuthMethod();
  clearAuthLastMethod();
  clearPasswordRecoveryPending();
}
