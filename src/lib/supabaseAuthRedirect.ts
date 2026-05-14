import { getSupabase, isSupabaseConfigured } from "./supabaseClient";

/**
 * OAuth (PKCE) returns to e.g. http://127.0.0.1:5173/?code=...
 * Exchange once before React mounts so session exists when AuthProvider runs.
 */
export async function ensureOAuthSessionFromUrl(): Promise<void> {
  if (!isSupabaseConfigured || typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return;

  try {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth code exchange failed", error);
      return;
    }

    const path = window.location.pathname || "/";
    const hash = window.location.hash || "";
    window.history.replaceState(null, "", path + hash);
  } catch (e) {
    console.error("OAuth redirect handling failed", e);
  }
}
