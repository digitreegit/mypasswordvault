import { Capacitor } from "@capacitor/core";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/** Treat example placeholders as "not configured" so the setup screen stays accurate. */
export const isSupabaseConfigured = Boolean(
  url &&
    anonKey &&
    !url.includes("YOUR_PROJECT_REF") &&
    !anonKey.includes("YOUR_ANON_PUBLIC_KEY")
);

/** Host baked into this build (Vite env at build time). */
export function getSupabaseAuthHostname(): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function isDefaultSupabaseProjectHost(): boolean {
  return getSupabaseAuthHostname().endsWith(".supabase.co");
}

let _client: SupabaseClient | null = null;
let _clientKey = "";

/** Browser client; null when env vars are missing (local-only mode). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  const key = `${url}\0${anonKey}`;
  if (!_client || _clientKey !== key) {
    _clientKey = key;
    _client = createClient(url, anonKey, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: !Capacitor.isNativePlatform(),
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    });
  }
  return _client;
}
