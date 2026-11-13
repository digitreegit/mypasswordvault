import type { EmailOtpType, Session } from "@supabase/supabase-js";
import {
  setPasswordRecoveryPending,
  urlIndicatesPasswordRecovery,
} from "./passwordRecoveryPending";
import { takeSignInAttempt } from "./authLastUsed";
import { getSupabase, isSupabaseConfigured } from "./supabaseClient";
import { finalizeSignIn } from "./signInRecord";

function parseOAuthCodeFromLocation(): string | null {
  if (typeof window === "undefined") return null;

  const fromSearch = new URLSearchParams(window.location.search).get("code");
  if (fromSearch) return fromSearch;

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;

  if (hash.startsWith("/")) {
    const q = hash.indexOf("?");
    if (q >= 0) {
      const fromRoute = new URLSearchParams(hash.slice(q + 1)).get("code");
      if (fromRoute) return fromRoute;
    }
    return null;
  }

  return new URLSearchParams(hash).get("code");
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

async function sessionAfterAuth(
  sessionFromExchange: Session | null
): Promise<Session | null> {
  if (sessionFromExchange) return sessionFromExchange;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function completeOAuthFromUrl(url?: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  let code: string | null = null;
  if (url) {
    try {
      const parsed = new URL(url);
      code = parsed.searchParams.get("code");
      if (!code && parsed.hash) {
        const hash = parsed.hash.replace(/^#/, "");
        code = new URLSearchParams(hash).get("code");
      }
    } catch {
      code = null;
    }
  } else {
    code = parseOAuthCodeFromLocation();
  }
  if (!code) return false;

  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth code exchange failed", error);
      return false;
    }

    const session = await sessionAfterAuth(data.session);
    if (session) {
      const method = takeSignInAttempt() ?? "google";
      finalizeSignIn(session, method, "SIGNED_IN");
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

async function completeAuthTokensFromUrl(): Promise<boolean> {
  if (!isSupabaseConfigured || typeof window === "undefined") return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  const search = new URLSearchParams(window.location.search);
  const token_hash = search.get("token_hash");
  const type = search.get("type");

  if (token_hash && type) {
    const isRecovery = type === "recovery";
    if (isRecovery) setPasswordRecoveryPending();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });
    if (error) {
      console.error("verifyOtp from URL failed", error);
      return false;
    }
    stripAuthParamsFromUrl();
    const session = await sessionAfterAuth(null);
    if (session) {
      finalizeSignIn(
        session,
        "email",
        isRecovery ? "PASSWORD_RECOVERY" : "SIGNED_IN"
      );
    }
    return true;
  }

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash || hash.startsWith("/")) return false;

  const hashParams = new URLSearchParams(hash);
  const access_token = hashParams.get("access_token");
  const refresh_token = hashParams.get("refresh_token");

  if (access_token && refresh_token) {
    const isRecovery =
      urlIndicatesPasswordRecovery() || hashParams.get("type") === "recovery";
    if (isRecovery) setPasswordRecoveryPending();
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) {
      console.error("setSession from recovery hash failed", error);
      return false;
    }
    stripAuthParamsFromUrl();
    const session = await sessionAfterAuth(null);
    if (session) {
      finalizeSignIn(
        session,
        "email",
        isRecovery ? "PASSWORD_RECOVERY" : "SIGNED_IN"
      );
    }
    return true;
  }

  const code = hashParams.get("code");
  if (code) {
    const isRecovery = hashParams.get("type") === "recovery";
    if (isRecovery) setPasswordRecoveryPending();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("exchangeCodeForSession from hash failed", error);
      return false;
    }
    stripAuthParamsFromUrl();
    const session = await sessionAfterAuth(null);
    if (session) {
      finalizeSignIn(
        session,
        isRecovery ? "email" : takeSignInAttempt() ?? "google",
        isRecovery ? "PASSWORD_RECOVERY" : "SIGNED_IN"
      );
    }
    return true;
  }

  return false;
}

export async function ensureOAuthSessionFromUrl(): Promise<void> {
  if (!isSupabaseConfigured || typeof window === "undefined") return;
  const completedOAuth = await completeOAuthFromUrl();
  if (!completedOAuth) await completeAuthTokensFromUrl();
}
