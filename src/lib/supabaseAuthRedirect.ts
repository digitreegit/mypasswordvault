import type { EmailOtpType } from "@supabase/supabase-js";
import {
  setPasswordRecoveryPending,
  urlIndicatesPasswordRecovery,
} from "./passwordRecoveryPending";
import {
  applyPendingAuthMethod,
  recordGoogleSignIn,
} from "./authLastUsed";
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
  if (typeof window === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get("code");
}

function hashHasAuthTokens(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash || hash.startsWith("/")) return false;
  const p = new URLSearchParams(hash);
  return Boolean(p.get("access_token") || p.get("refresh_token"));
}

/** Remove Supabase auth tokens from the URL; keep in-app hash routes like #/pricing. */
export function stripAuthParamsFromUrl(): void {
  if (typeof window === "undefined") return;
  const hash = window.location.hash.replace(/^#/, "");
  if (hash.startsWith("/")) return;
  if (hashHasAuthTokens() || window.location.search.includes("code=")) {
    const path = window.location.pathname || "/";
    window.history.replaceState(null, "", path);
  }
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth code exchange failed", error);
      return false;
    }
    if (data.session) {
      if (!applyPendingAuthMethod()) recordGoogleSignIn();
    }

    if (typeof window !== "undefined" && !url?.includes("://")) {
      stripAuthParamsFromUrl();
    }
    return true;
  } catch (e) {
    console.error("OAuth redirect handling failed", e);
    return false;
  }
}

/**
 * Password-reset / magic-link emails redirect with tokens in the hash, or token_hash in query.
 * Must run before React mounts so AuthProvider sees a recovery session.
 */
async function completeAuthTokensFromUrl(): Promise<boolean> {
  if (!isSupabaseConfigured || typeof window === "undefined") return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  const search = new URLSearchParams(window.location.search);
  const token_hash = search.get("token_hash");
  const type = search.get("type");

  if (token_hash && type) {
    if (type === "recovery") setPasswordRecoveryPending();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });
    if (error) {
      console.error("verifyOtp from URL failed", error);
      return false;
    }
    stripAuthParamsFromUrl();
    return true;
  }

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash || hash.startsWith("/")) return false;

  const hashParams = new URLSearchParams(hash);
  const access_token = hashParams.get("access_token");
  const refresh_token = hashParams.get("refresh_token");

  if (access_token && refresh_token) {
    if (urlIndicatesPasswordRecovery() || hashParams.get("type") === "recovery") {
      setPasswordRecoveryPending();
    }
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) {
      console.error("setSession from recovery hash failed", error);
      return false;
    }
    stripAuthParamsFromUrl();
    return true;
  }

  const code = hashParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("exchangeCodeForSession from hash failed", error);
      return false;
    }
    if (hashParams.get("type") === "recovery") setPasswordRecoveryPending();
    stripAuthParamsFromUrl();
    return true;
  }

  return false;
}

/**
 * OAuth (PKCE) code exchange + recovery/magic-link hash tokens before React mounts.
 */
export async function ensureOAuthSessionFromUrl(): Promise<void> {
  if (!isSupabaseConfigured || typeof window === "undefined") return;
  const hadOAuthCode = Boolean(parseOAuthCode(window.location.href));
  const completedOAuth = await completeOAuthFromUrl();
  if (!completedOAuth) await completeAuthTokensFromUrl();

  const supabase = getSupabase();
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;

  if (applyPendingAuthMethod()) return;
  if (completedOAuth || hadOAuthCode) recordGoogleSignIn();
}
