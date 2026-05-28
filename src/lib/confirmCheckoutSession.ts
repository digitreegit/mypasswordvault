import { getSupabase } from "./supabaseClient";

export type ConfirmCheckoutResult =
  | { ok: true; licensed: true }
  | { ok: false; reason: string };

/** Grants license from a paid Stripe Checkout session (server verifies with Stripe API). */
export async function confirmCheckoutSession(
  sessionId: string,
): Promise<boolean> {
  const r = await confirmCheckoutSessionDetailed(sessionId);
  return r.ok && r.licensed;
}

export async function confirmCheckoutSessionDetailed(
  sessionId: string,
): Promise<ConfirmCheckoutResult> {
  const sb = getSupabase();
  const id = sessionId.trim();
  if (!sb || !id.startsWith("cs_")) {
    return { ok: false, reason: "invalid_session" };
  }
  try {
    const { data, error } = await sb.functions.invoke<{
      licensed?: boolean;
      error?: string;
    }>("confirm-checkout-session", { body: { session_id: id } });
    if (error) {
      console.warn("confirmCheckoutSession", error.message);
      return { ok: false, reason: error.message || "invoke_failed" };
    }
    if (data?.error) {
      console.warn("confirmCheckoutSession", data.error);
      return { ok: false, reason: data.error };
    }
    if (data?.licensed === true) {
      return { ok: true, licensed: true };
    }
    return { ok: false, reason: "not_licensed_yet" };
  } catch (e) {
    console.warn("confirmCheckoutSession", e);
    return { ok: false, reason: "network_error" };
  }
}
