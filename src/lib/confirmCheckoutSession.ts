import { getSupabase } from "./supabaseClient";

/** Grants license from a paid Stripe Checkout session (server verifies with Stripe API). */
export async function confirmCheckoutSession(sessionId: string): Promise<boolean> {
  const sb = getSupabase();
  const id = sessionId.trim();
  if (!sb || !id.startsWith("cs_")) return false;
  try {
    const { data, error } = await sb.functions.invoke<{ licensed?: boolean }>(
      "confirm-checkout-session",
      { body: { session_id: id } },
    );
    if (error) {
      console.warn("confirmCheckoutSession", error.message);
      return false;
    }
    return data?.licensed === true;
  } catch (e) {
    console.warn("confirmCheckoutSession", e);
    return false;
  }
}
