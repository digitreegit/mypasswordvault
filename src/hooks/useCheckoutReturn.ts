import { useCallback, useEffect, useState } from "react";
import {
  clearCheckoutReturn,
  getCheckoutSessionId,
  parseCheckoutReturn,
  rememberCheckoutSessionId,
  type CheckoutReturn,
} from "../lib/checkoutReturn";

export type CheckoutReturnPayload = {
  result: CheckoutReturn;
  sessionId: string | null;
};

/**
 * On mount, reads Stripe Checkout return query (`?checkout=success|cancel`),
 * preserves `session_id` for confirm, then clears it from the URL.
 */
export function useCheckoutReturn(
  onReturn: (payload: CheckoutReturnPayload) => void,
) {
  const [checkoutFlash, setCheckoutFlash] = useState<CheckoutReturn | null>(null);

  useEffect(() => {
    const result = parseCheckoutReturn();
    if (!result) return;
    const sessionId = getCheckoutSessionId();
    if (sessionId) rememberCheckoutSessionId(sessionId);
    clearCheckoutReturn();
    setCheckoutFlash(result);
    onReturn({ result, sessionId });
  }, [onReturn]);

  const dismissCheckoutFlash = useCallback(() => setCheckoutFlash(null), []);

  return { checkoutFlash, dismissCheckoutFlash };
}
