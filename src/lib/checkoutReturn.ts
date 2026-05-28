/** Parsed from `/#/...?checkout=success|cancel` after Stripe Checkout redirect. */
export type CheckoutReturn = "success" | "cancel";

export const CHECKOUT_COMPLETE_MESSAGE = "mpw_checkout_complete";

export function isCheckoutPopupReturn(): boolean {
  if (typeof window === "undefined") return false;
  if (parseCheckoutReturn() !== "success") return false;
  const opener = window.opener;
  return !!opener && !opener.closed;
}

function hashQuery(): URLSearchParams | null {
  if (typeof window === "undefined") return null;
  const q = window.location.hash.split("?")[1];
  if (!q) return null;
  return new URLSearchParams(q);
}

export function parseCheckoutReturn(): CheckoutReturn | null {
  const params = hashQuery();
  if (!params) return null;
  const v = params.get("checkout");
  if (v === "success") return "success";
  if (v === "cancel") return "cancel";
  return null;
}

export function getCheckoutSessionId(): string | null {
  const params = hashQuery();
  if (!params) return null;
  const id = params.get("session_id")?.trim();
  return id && id.startsWith("cs_") ? id : null;
}

/** Removes `?checkout=…` from the hash while keeping the route (e.g. `#/` or `#/settings/plan`). */
export function clearCheckoutReturn() {
  if (typeof window === "undefined") return;
  const base = window.location.hash.split("?")[0] || "#/";
  window.history.replaceState(null, "", base);
}

const CHECKOUT_PENDING_KEY = "mpw_checkout_pending";
const CHECKOUT_SESSION_KEY = "mpw_checkout_session_id";

/** Persist session id before hash is cleared (same-tab Stripe return). */
export function rememberCheckoutSessionId(sessionId: string) {
  if (!sessionId.startsWith("cs_")) return;
  try {
    sessionStorage.setItem(CHECKOUT_SESSION_KEY, sessionId);
  } catch {
    /* ignore */
  }
}

export function takeRememberedCheckoutSessionId(): string | null {
  try {
    const id = sessionStorage.getItem(CHECKOUT_SESSION_KEY)?.trim();
    sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
    return id && id.startsWith("cs_") ? id : null;
  } catch {
    return null;
  }
}

/** Call on boot before redirects so Stripe `session_id` survives navigation. */
export function captureCheckoutReturnFromUrl() {
  const sessionId = getCheckoutSessionId();
  if (sessionId) rememberCheckoutSessionId(sessionId);
}

/** Set before opening Stripe so we can refresh license when the user returns to this tab. */
export function markCheckoutPending() {
  try {
    sessionStorage.setItem(CHECKOUT_PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearCheckoutPending() {
  try {
    sessionStorage.removeItem(CHECKOUT_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function isCheckoutPending(): boolean {
  try {
    return sessionStorage.getItem(CHECKOUT_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

/** Stripe webhook can lag; optional confirm calls Stripe + upserts license immediately. */
export async function pollLicensedAfterCheckout(
  refresh: () => Promise<boolean>,
): Promise<boolean> {
  for (let i = 0; i < 15; i++) {
    if (await refresh()) {
      clearCheckoutPending();
      return true;
    }
    await new Promise((r) => setTimeout(r, i < 4 ? 800 : 2000));
  }
  return false;
}

export async function finalizeCheckoutAfterPayment(
  refresh: () => Promise<boolean>,
  confirmSession?: (sessionId: string) => Promise<boolean>,
  sessionIdFromReturn?: string | null,
): Promise<boolean> {
  const sessionId =
    sessionIdFromReturn?.trim() ||
    getCheckoutSessionId() ||
    takeRememberedCheckoutSessionId();
  if (sessionId && confirmSession) {
    try {
      await confirmSession(sessionId);
    } catch (e) {
      console.warn("finalizeCheckoutAfterPayment confirm", e);
    }
    if (await refresh()) {
      clearCheckoutPending();
      clearCheckoutReturn();
      return true;
    }
  }
  const polled = await pollLicensedAfterCheckout(refresh);
  if (polled) clearCheckoutReturn();
  return polled;
}
