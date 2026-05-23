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
import { getOAuthRedirectUrl } from "./platform";
import { isNativeApp, signInWithGoogleNative } from "./nativeAuth";
import {
  AuthEmailTakenError,
  isAuthEmailTakenError,
  isDuplicateSignUpResponse,
} from "./authErrors";
import {
  applyPendingAuthMethod,
  clearPendingAuthMethod,
  getAuthLastMethod,
  markPendingAuthMethod,
  recordEmailSignIn,
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
import {
  appendSignInLog,
  clearSignInLogsForUser,
  type SignInLogMethod,
} from "./signInLogs";

function signInMethodForAuthEvent(
  event: AuthChangeEvent,
  session: Session
): SignInLogMethod {
  if (event === "PASSWORD_RECOVERY") return "email";

  const stored = getAuthLastMethod();
  if (stored === "google" || stored === "email") return stored;

  const provider = session.user.app_metadata?.provider;
  if (provider === "google") return "google";
  if (provider === "email") return "email";

  const identities = session.user.identities ?? [];
  if (identities.some((i) => i.provider === "email")) return "email";
  if (identities.some((i) => i.provider === "google")) return "google";
  return "unknown";
}

function recordSignInMethodFromAuthEvent(event: AuthChangeEvent): void {
  if (event === "PASSWORD_RECOVERY" || isPasswordRecoveryPending()) {
    recordEmailSignIn();
    return;
  }
  if (!applyPendingAuthMethod()) {
    /* Session refresh / token renewal — keep existing LAST USED. */
  }
}

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  /** True after recovery email link until account password is updated. */
  passwordRecoveryPending: boolean;
  session: Session | null;
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);


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
        markPendingAuthMethod("email");
      }
      if (
        (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") &&
        next?.user?.id
      ) {
        recordSignInMethodFromAuthEvent(event);
        appendSignInLog(next.user.id, {
          method: signInMethodForAuthEvent(event, next),
          event,
        });
      }
      setSession(next);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    markPendingAuthMethod("google");
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
      clearPendingAuthMethod();
      throw error;
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    markPendingAuthMethod("email");
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      clearPendingAuthMethod();
      throw error;
    }
    recordEmailSignIn();
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    markPendingAuthMethod("email");
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: getOAuthRedirectUrl() },
    });
    if (error) {
      clearPendingAuthMethod();
      if (isAuthEmailTakenError(error)) throw new AuthEmailTakenError();
      throw error;
    }
    if (isDuplicateSignUpResponse(data)) {
      clearPendingAuthMethod();
      throw new AuthEmailTakenError();
    }
    if (data.session) {
      recordEmailSignIn();
    } else {
      clearPendingAuthMethod();
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
    recordEmailSignIn();
    stripAuthParamsFromUrl();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    clearPendingAuthMethod();
    clearPasswordRecoveryPending();
    setPasswordRecoveryPendingState(false);
    stripAuthParamsFromUrl();
    await supabase.auth.signOut();
  }, []);

  const deleteAccount = useCallback(async () => {
    const uid = session?.user?.id;
    await requestAccountDeletion();
    if (uid) clearSignInLogsForUser(uid);
    await clearAllLocalAppData();
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
