import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { getSupabase } from "./supabaseClient";
import { NATIVE_AUTH_REDIRECT, isNativeApp } from "./platform";
import { completeOAuthFromUrl } from "./supabaseAuthRedirect";

let listenerRegistered = false;

function isAuthCallbackUrl(url: string): boolean {
  return (
    url.startsWith(NATIVE_AUTH_REDIRECT) ||
    url.includes("://auth/callback")
  );
}

async function onAuthCallback(url: string): Promise<void> {
  if (!isAuthCallbackUrl(url)) return;
  try {
    await Browser.close();
  } catch {
    /* already closed */
  }
  await completeOAuthFromUrl(url);
}

/** Register deep-link handler for Supabase OAuth on iOS/Android (call once at startup). */
export function setupNativeAuthListener(): void {
  if (!Capacitor.isNativePlatform() || listenerRegistered) return;
  listenerRegistered = true;

  void App.addListener("appUrlOpen", ({ url }) => {
    void onAuthCallback(url);
  });

  void App.getLaunchUrl().then((result) => {
    if (result?.url) void onAuthCallback(result.url);
  });
}

export async function signInWithGoogleNative(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: NATIVE_AUTH_REDIRECT,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("No OAuth URL returned");
  await Browser.open({ url: data.url });
}

export async function signInWithAppleNative(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: NATIVE_AUTH_REDIRECT,
      skipBrowserRedirect: true,
      scopes: "name email",
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("No OAuth URL returned");
  await Browser.open({ url: data.url });
}

export { isNativeApp };
