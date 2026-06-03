import {
  ErrorCode,
  Platform,
  ProductType,
  store,
  type Transaction,
} from "capacitor-plugin-cdv-purchase";
import { AppError } from "./errors";
import {
  getNativePlatform,
  isNativeApp,
  STORE_PRO_PRODUCT_ID,
} from "./platform";
import type { StorePurchasePayload } from "./storePurchase";

let initPromise: Promise<void> | null = null;

type PendingPurchase = {
  productId: string;
  resolve: (payload: StorePurchasePayload) => void;
  reject: (reason: unknown) => void;
};

let pendingPurchase: PendingPurchase | null = null;

function storePlatform() {
  const native = getNativePlatform();
  if (native === "ios") return Platform.APPLE_APPSTORE;
  if (native === "android") return Platform.GOOGLE_PLAY;
  return null;
}

function payloadFromTransaction(
  transaction: Transaction,
  productId: string,
): StorePurchasePayload {
  const platform = getNativePlatform();
  if (!platform) throw new AppError("errors.storeUnsupported");

  const jws = (transaction as { jwsRepresentation?: string }).jwsRepresentation;
  const verificationData =
    jws?.trim() || transaction.transactionId?.trim() || "";
  if (!verificationData) {
    throw new AppError("errors.storeVerifyFailed", "missing_verification_data");
  }

  return {
    platform,
    productId,
    verificationData,
    transactionId: transaction.transactionId,
    completePurchase: () => transaction.finish(),
  };
}

function transactionMatchesProduct(
  transaction: Transaction,
  productId: string,
): boolean {
  return transaction.products?.some((p) => p.id === productId) === true;
}

function findOwnedTransaction(productId: string): Transaction | undefined {
  const owned = store.localTransactions.filter((tx) =>
    transactionMatchesProduct(tx, productId),
  );
  return owned[owned.length - 1];
}

async function orderProduct(productId: string): Promise<StorePurchasePayload> {
  const product = store.get(productId);
  const offer = product?.getOffer();
  if (!product || !offer) {
    throw new AppError("errors.storeBridgeMissing", "product_unavailable");
  }

  if (pendingPurchase) {
    throw new AppError("errors.storeVerifyFailed", "purchase_in_progress");
  }

  return new Promise((resolve, reject) => {
    pendingPurchase = { productId, resolve, reject };

    void offer.order().then((err) => {
      if (!err || pendingPurchase?.productId !== productId) return;
      pendingPurchase = null;
      if (err.code === ErrorCode.PAYMENT_CANCELLED) {
        reject(new AppError("errors.storePurchaseCancelled"));
        return;
      }
      reject(
        new AppError(
          "errors.storeVerifyFailed",
          `${err.code}:${err.message ?? "order_failed"}`,
        ),
      );
    });
  });
}

async function restoreProduct(
  productId: string,
): Promise<StorePurchasePayload | null> {
  const restoreError = await store.restorePurchases();
  if (restoreError && restoreError.code !== ErrorCode.PAYMENT_CANCELLED) {
    throw new AppError(
      "errors.storeVerifyFailed",
      `${restoreError.code}:${restoreError.message ?? "restore_failed"}`,
    );
  }

  if (!store.owned(productId)) return null;

  const transaction = findOwnedTransaction(productId);
  if (!transaction) {
    throw new AppError("errors.storeVerifyFailed", "owned_without_transaction");
  }

  return payloadFromTransaction(transaction, productId);
}

/**
 * Registers `window.__mpwStoreBridge` for StoreKit / Play Billing via cdv-purchase.
 * Call once on native startup before React mounts pricing UI.
 */
export async function initNativeStoreBridge(): Promise<void> {
  if (!isNativeApp() || typeof window === "undefined") return;
  if (window.__mpwStoreBridge) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const platform = storePlatform();
    if (!platform) return;

    store.register([
      {
        id: STORE_PRO_PRODUCT_ID,
        type: ProductType.NON_CONSUMABLE,
        platform,
      },
    ]);

    store.when().approved((transaction) => {
      const pending = pendingPurchase;
      if (!pending || !transactionMatchesProduct(transaction, pending.productId)) {
        return;
      }
      pendingPurchase = null;
      try {
        pending.resolve(payloadFromTransaction(transaction, pending.productId));
      } catch (e: unknown) {
        pending.reject(e);
      }
    });

    const initError = await store.initialize([platform]);
    if (initError) {
      console.error("store.initialize failed", initError);
      return;
    }

    window.__mpwStoreBridge = {
      purchase: (productId: string) => orderProduct(productId),
      restore: () => restoreProduct(STORE_PRO_PRODUCT_ID),
    };
  })();

  return initPromise;
}
