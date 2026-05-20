import { getOAuthRedirectUrl } from "./platform";

function functionsBaseUrl(): string {
  const url = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
  if (!url) throw new Error("Supabase not configured");
  return `${url}/functions/v1`;
}

/** Sends recovery link via Edge Function (Resend + Admin generateLink). */
export async function requestPasswordResetEmail(email: string): Promise<void> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
  if (!anonKey) throw new Error("Supabase not configured");

  let res: Response;
  try {
    res = await fetch(`${functionsBaseUrl()}/send-password-reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        email: email.trim(),
        redirectTo: getOAuthRedirectUrl(),
      }),
    });
  } catch {
    throw new Error("function_unreachable");
  }

  if (!res.ok) {
    let code = "unknown";
    try {
      const body = (await res.json()) as { error?: string; code?: string; message?: string };
      if (body?.error) code = body.error;
      else if (body?.code === "NOT_FOUND") code = "function_not_deployed";
    } catch {
      if (res.status === 404) code = "function_not_deployed";
    }
    throw new Error(code);
  }
}
