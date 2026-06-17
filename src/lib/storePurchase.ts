import { getSupabase } from "./supabaseClient";
import { AppError } from "./errors";
import {
  getNativePlatform,
  isNativeApp,
  STORE_PRO_PRODUCT_ID,
  storeBridgeMissingErrorCode,
  type NativePlatform,
} from "./platform";

export type StorePurchasePayload = {
  platform: NativePlatform;
  productId: string;
  verificationData: string;
  transactionId?: string;
  /** Call after server verification so the store can finalize the transaction. */
  completePurchase?: () => void | Promise<void>;
};

/**
 * Native shell can register a bridge (StoreKit / Play Billing plugin) before React mounts.
 * See docs/mobile.md — Phase 2 native plugin wiring.
 */
declare global {
  interface Window {
    __mpwStoreBridge?: {
      purchase: (productId: string) => Promise<StorePurchasePayload>;
      restore: () => Promise<StorePurchasePayload | null>;
    };
  }
}

function storeBridge() {
  if (typeof window === "undefined") return undefined;
  return window.__mpwStoreBridge;
}

export function isStoreBridgeAvailable(): boolean {
  return Boolean(storeBridge()?.purchase);
}

export async function purchaseProViaStore(): Promise<void> {
  if (!isNativeApp()) {
    throw new AppError("errors.storeWebOnly");
  }
  const platform = getNativePlatform();
  if (!platform) throw new AppError("errors.storeUnsupported");

  const bridge = storeBridge();
  if (!bridge?.purchase) {
    throw new AppError(storeBridgeMissingErrorCode());
  }

  const payload = await bridge.purchase(STORE_PRO_PRODUCT_ID);
  try {
    await verifyStorePurchaseOnServer({ ...payload, restore: false });
  } finally {
    await payload.completePurchase?.();
  }
}

export async function restoreStorePurchases(): Promise<boolean> {
  if (!isNativeApp()) return false;
  const bridge = storeBridge();
  if (!bridge?.restore) {
    throw new AppError(storeBridgeMissingErrorCode());
  }
  const payload = await bridge.restore();
  if (!payload) return false;
  try {
    await verifyStorePurchaseOnServer({ ...payload, restore: true });
  } finally {
    await payload.completePurchase?.();
  }
  return true;
}

async function verifyStorePurchaseOnServer(
  payload: StorePurchasePayload & { restore?: boolean },
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new AppError("errors.supabaseNotConfigured");

  const { data, error } = await sb.functions.invoke("verify-store-purchase", {
    body: {
      platform: payload.platform,
      product_id: payload.productId,
      verification_data: payload.verificationData,
      transaction_id: payload.transactionId,
      restore: payload.restore ?? false,
    },
  });

  if (error) {
    let detail = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const body = (await ctx.json()) as { error?: string; detail?: string };
        if (body?.error) detail = body.detail ? `${body.error}: ${body.detail}` : body.error;
      } catch {
        /* keep error.message */
      }
    }
    throw new AppError("errors.storeVerifyFailed", detail);
  }
  const errCode =
    data && typeof data === "object" && "error" in data
      ? String((data as { error: string }).error)
      : null;
  if (errCode) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail: string }).detail)
        : undefined;
    throw new AppError(
      "errors.storeVerifyFailed",
      detail ? `${errCode}: ${detail}` : errCode,
    );
  }
}

/** Dev-only: grant license via edge when STORE_VERIFY_DEV_BYPASS=1 on project. */
export async function devGrantStoreLicense(): Promise<void> {
  if (!import.meta.env.DEV) {
    throw new AppError("errors.storeDevOnly");
  }
  const platform = getNativePlatform();
  if (!platform) throw new AppError("errors.storeUnsupported");
  await verifyStorePurchaseOnServer({
    platform,
    productId: STORE_PRO_PRODUCT_ID,
    verificationData: "dev_ok",
    transactionId: `dev_${Date.now()}`,
    restore: false,
  });
}
