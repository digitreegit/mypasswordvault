import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabaseClient";
import { getNativePlatform, getOAuthRedirectUrl } from "./platform";
import {
  isNativeApp,
  signInWithAppleNative,
  signInWithGoogleNative,
} from "./nativeAuth";
import {
  AuthEmailTakenError,
  isAuthEmailTakenError,
  isDuplicateSignUpResponse,
} from "./authErrors";
import {
  clearAuthLastEmail,
  clearPendingAuthMethod,
  clearSignInAttempt,
  markSignInAttempt,
} from "./authLastUsed";
import {
  clearPasswordRecoveryPending,
  isPasswordRecoveryPending,
  setPasswordRecoveryPending,
} from "./passwordRecoveryPending";
import {
  clearAllLocalAppData,
  requestAccountDeletion,
} from "./accountDeletion";
import { stripAuthParamsFromUrl } from "./supabaseAuthRedirect";
import { finalizeSignIn } from "./signInRecord";
import { recordSignupPlatform } from "./recordSignupPlatform";
import { getUserSignInMethod, userSupportsEmailPassword } from "./signInMethod";

export { getUserSignInMethod, userSupportsEmailPassword };

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  passwordRecoveryPending: boolean;
  session: Session | null;
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function resolveSessionAfterPasswordSignIn(
  sessionFromResponse: Session | null
): Promise<Session | null> {
  if (sessionFromResponse) return sessionFromResponse;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [passwordRecoveryPending, setPasswordRecoveryPendingState] = useState(
    () => isPasswordRecoveryPending()
  );

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      setSession(null);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        if (data.session?.user?.id) {
          void recordSignupPlatform(data.session.user.id);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error("getSession failed", e);
        if (!mounted) return;
        setSession(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, next) => {
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecoveryPending();
        setPasswordRecoveryPendingState(true);
      }
      setSession(next);
      if (next?.user?.id && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        void recordSignupPlatform(next.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    markSignInAttempt("google");
    if (isNativeApp()) {
      await signInWithGoogleNative();
      return;
    }
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const redirectTo = getOAuthRedirectUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      clearSignInAttempt();
      throw error;
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    if (getNativePlatform() !== "ios") {
      throw new Error("Sign in with Apple is only available on iOS");
    }
    markSignInAttempt("apple");
    try {
      await signInWithAppleNative();
    } catch (e) {
      clearSignInAttempt();
      throw e;
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const trimmed = email.trim();
    markSignInAttempt("email");
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    if (error) {
      clearSignInAttempt();
      throw error;
    }
    const session = await resolveSessionAfterPasswordSignIn(data.session);
    if (session) {
      finalizeSignIn(session, "email", "SIGNED_IN", trimmed);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const trimmed = email.trim();
    markSignInAttempt("email");
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.signUp({
      email: trimmed,
      password,
      options: { emailRedirectTo: getOAuthRedirectUrl() },
    });
    if (error) {
      clearSignInAttempt();
      if (isAuthEmailTakenError(error)) throw new AuthEmailTakenError();
      throw error;
    }
    if (isDuplicateSignUpResponse(data)) {
      clearSignInAttempt();
      throw new AuthEmailTakenError();
    }
    const session = await resolveSessionAfterPasswordSignIn(data.session);
    if (session) {
      finalizeSignIn(session, "email", "SIGNED_IN", trimmed);
    } else {
      clearSignInAttempt();
    }
  }, []);

  const updateEmail = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const trimmed = email.trim();
    if (!trimmed) throw new Error("Email required");
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) {
      throw new Error("Auth session missing!");
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    clearPasswordRecoveryPending();
    setPasswordRecoveryPendingState(false);
    const { data: after } = await supabase.auth.getSession();
    const session = after.session ?? sessionData.session;
    finalizeSignIn(session, "email", "PASSWORD_RECOVERY", session.user.email);
    stripAuthParamsFromUrl();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    clearSignInAttempt();
    clearPendingAuthMethod();
    clearAuthLastEmail();
    clearPasswordRecoveryPending();
    setPasswordRecoveryPendingState(false);
    stripAuthParamsFromUrl();
    await supabase.auth.signOut();
  }, []);

  const deleteAccount = useCallback(async () => {
    await requestAccountDeletion();
    await clearAllLocalAppData();
    clearSignInAttempt();
    clearPendingAuthMethod();
    clearPasswordRecoveryPending();
    setPasswordRecoveryPendingState(false);
    stripAuthParamsFromUrl();
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      passwordRecoveryPending,
      session,
      user: session?.user ?? null,
      signInWithGoogle,
      signInWithApple,
      signInWithEmail,
      signUpWithEmail,
      updateEmail,
      updatePassword,
      signOut,
      deleteAccount,
    }),
    [
      loading,
      passwordRecoveryPending,
      session,
      signInWithGoogle,
      signInWithApple,
      signInWithEmail,
      signUpWithEmail,
      updateEmail,
      updatePassword,
      signOut,
      deleteAccount,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
