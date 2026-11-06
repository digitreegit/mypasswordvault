import { getSupabase } from "./supabaseClient";
import { AppError } from "./errors";
import { STORE_PRO_GRANTED_EVENT, withStoreSheet } from "./storeSheetGuard";
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

  await withStoreSheet(async () => {
    const payload = await bridge.purchase(STORE_PRO_PRODUCT_ID);
    try {
      await verifyStorePurchaseOnServer({ ...payload, restore: false });
    } catch (e: unknown) {
      // Leave the store transaction unfinished so launch / Restore can reclaim it.
      if (e instanceof AppError && e.code === "errors.storeVerifyFailed") {
        throw new AppError("errors.storeVerifyFailedRetryRestore", e.detail);
      }
      throw e;
    }
    await finishTransaction(payload);
  });
  notifyProGranted();
}

export async function restoreStorePurchases(): Promise<boolean> {
  if (!isNativeApp()) return false;
  const bridge = storeBridge();
  if (!bridge?.restore) {
    throw new AppError(storeBridgeMissingErrorCode());
  }
  const restored = await withStoreSheet(async () => {
    const payload = await bridge.restore();
    if (!payload) return false;
    await verifyStorePurchaseOnServer({ ...payload, restore: true });
    await finishTransaction(payload);
    return true;
  });
  if (restored) notifyProGranted();
  return restored;
}

const backgroundVerifications = new Set<string>();

/**
 * Transactions the store delivers outside an active purchase: unfinished ones replayed at
 * launch (app killed mid-purchase, earlier verify failed) and Ask to Buy / pending payments
 * approved later. Left unfinished on failure so the store replays them next launch.
 */
export async function verifyDeliveredStoreTransaction(
  payload: StorePurchasePayload,
): Promise<void> {
  const key = payload.transactionId || payload.verificationData;
  if (backgroundVerifications.has(key)) return;
  backgroundVerifications.add(key);
  try {
    await verifyStorePurchaseOnServer({ ...payload, restore: false });
    await finishTransaction(payload);
    notifyProGranted();
  } catch (e) {
    console.warn("Deferred store transaction not verified yet", e);
  } finally {
    backgroundVerifications.delete(key);
  }
}

/**
 * Finish (iOS) / acknowledge (Play) only after the server granted PRO. An unfinished
 * transaction is replayed by the store on next launch, and Play refunds an unacknowledged
 * purchase after three days, so a failed verification must never finish it.
 */
async function finishTransaction(payload: StorePurchasePayload): Promise<void> {
  try {
    await payload.completePurchase?.();
  } catch (e) {
    console.warn("Store transaction finish failed; the store will replay it", e);
  }
}

function notifyProGranted(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STORE_PRO_GRANTED_EVENT));
}

const VERIFY_ATTEMPTS = 3;
const VERIFY_RETRY_MS = [800, 2000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isRetryableVerifyDetail(detail: string): boolean {
  const d = detail.toLowerCase();
  return (
    d.includes("failed to fetch") ||
    d.includes("network") ||
    d.includes("timeout") ||
    d.includes("503") ||
    d.includes("502") ||
    d.includes("504") ||
    d.includes("429") ||
    d.includes("functions_relay_error") ||
    d.includes("edge_function")
  );
}

async function verifyStorePurchaseOnServer(
  payload: StorePurchasePayload & { restore?: boolean },
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new AppError("errors.supabaseNotConfigured");

  let lastError: unknown;
  for (let attempt = 0; attempt < VERIFY_ATTEMPTS; attempt++) {
    try {
      await invokeVerifyStorePurchase(sb, payload);
      return;
    } catch (e: unknown) {
      lastError = e;
      const detail =
        e instanceof AppError && e.detail
          ? String(e.detail)
          : e instanceof Error
            ? e.message
            : String(e ?? "");
      const fatal =
        e instanceof AppError &&
        (e.code === "errors.storePurchaseOtherAccount" ||
          e.code === "errors.storePurchaseRefunded");
      if (fatal || attempt === VERIFY_ATTEMPTS - 1 || !isRetryableVerifyDetail(detail)) {
        throw e;
      }
      await sleep(VERIFY_RETRY_MS[attempt] ?? 2000);
    }
  }
  throw lastError;
}

async function invokeVerifyStorePurchase(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  payload: StorePurchasePayload & { restore?: boolean },
): Promise<void> {
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
    if (detail.startsWith("transaction_owned_by_other_user")) {
      throw new AppError("errors.storePurchaseOtherAccount", detail);
    }
    if (detail.startsWith("transaction_refunded")) {
      throw new AppError("errors.storePurchaseRefunded", detail);
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
