import { getSupabase, isSupabaseConfigured } from "./supabaseClient";

function parseOAuthCode(url: string): string | null {
  try {
    const parsed = new URL(url);
    const fromQuery = parsed.searchParams.get("code");
    if (fromQuery) return fromQuery;
    const hash = parsed.hash?.startsWith("#")
      ? parsed.hash.slice(1)
      : parsed.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      return hashParams.get("code");
    }
  } catch {
    /* fall through */
  }
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    return params.get("code");
  }
  return null;
}

/**
 * Exchange PKCE `code` from OAuth redirect (web URL or native deep link).
 */
export async function completeOAuthFromUrl(url?: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const code = url ? parseOAuthCode(url) : parseOAuthCode(window.location.href);
  if (!code) return false;

  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth code exchange failed", error);
      return false;
    }

    if (typeof window !== "undefined" && !url?.includes("://")) {
      const path = window.location.pathname || "/";
      const hash = window.location.hash || "";
      window.history.replaceState(null, "", path + hash);
    }
    return true;
  } catch (e) {
    console.error("OAuth redirect handling failed", e);
    return false;
  }
}

/**
 * OAuth (PKCE) returns to e.g. http://127.0.0.1:5173/?code=...
 * Exchange once before React mounts so session exists when AuthProvider runs.
 */
export async function ensureOAuthSessionFromUrl(): Promise<void> {
  if (!isSupabaseConfigured || typeof window === "undefined") return;
  await completeOAuthFromUrl();
}
