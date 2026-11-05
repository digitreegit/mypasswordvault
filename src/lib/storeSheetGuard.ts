// Module-level so a StoreKit / Play Billing sheet or the embedded Stripe checkout cannot
// lock the vault mid-purchase, even if the React tree remounts while the payment UI is up.
let storeSheetDepth = 0;

/** Window event fired after the server granted PRO for a store transaction. */
export const STORE_PRO_GRANTED_EVENT = "mpw:store-pro-granted";

export function isStoreSheetActive(): boolean {
  return storeSheetDepth > 0;
}

/** Returns a release function; safe to call more than once. */
export function beginStoreSheet(): () => void {
  storeSheetDepth += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    storeSheetDepth = Math.max(0, storeSheetDepth - 1);
  };
}

export async function withStoreSheet<T>(task: () => Promise<T>): Promise<T> {
  const release = beginStoreSheet();
  try {
    return await task();
  } finally {
    release();
  }
}
