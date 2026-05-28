import { useCallback, useEffect, useState } from "react";
import {
  clearCheckoutReturn,
  parseCheckoutReturn,
  type CheckoutReturn,
} from "../lib/checkoutReturn";

/**
 * On mount, reads Stripe Checkout return query (`?checkout=success|cancel`), clears it from the URL,
 * and calls `onReturn` so the app can refresh license state.
 */
export function useCheckoutReturn(onReturn: (result: CheckoutReturn) => void) {
  const [checkoutFlash, setCheckoutFlash] = useState<CheckoutReturn | null>(null);

  useEffect(() => {
    const result = parseCheckoutReturn();
    if (!result) return;
    clearCheckoutReturn();
    setCheckoutFlash(result);
    onReturn(result);
  }, [onReturn]);

  const dismissCheckoutFlash = useCallback(() => setCheckoutFlash(null), []);

  return { checkoutFlash, dismissCheckoutFlash };
}
