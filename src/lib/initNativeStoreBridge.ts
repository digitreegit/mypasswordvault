import { Capacitor } from "@capacitor/core";
import {
  ErrorCode,
  LogLevel,
  Platform,
  ProductType,
  store,
  type IError,
  type Product,
  type Transaction,
} from "capacitor-plugin-cdv-purchase";
import { AppError } from "./errors";
import {
  getNativePlatform,
  isNativeApp,
  STORE_PRO_PRODUCT_ID,
  storeBridgeMissingErrorCode,
} from "./platform";
import type { StorePurchasePayload } from "./storePurchase";

let initPromise: Promise<void> | null = null;

export type StoreBridgeStatus = "idle" | "loading" | "ready" | "failed";

let bridgeStatus: StoreBridgeStatus = "idle";
let bridgeFailureDetail: string | null = null;
let proDisplayPrice: string | null = null;
const statusListeners = new Set<(status: StoreBridgeStatus) => void>();
const priceListeners = new Set<(price: string | null) => void>();

function syncProDisplayPrice(): void {
  const product = store.get(STORE_PRO_PRODUCT_ID);
  const price = readProductDisplayPrice(product);
  if (price === proDisplayPrice) return;
  proDisplayPrice = price;
  priceListeners.forEach((fn) => fn(price));
}

function readProductDisplayPrice(product: Product | undefined): string | null {
  if (!product) return null;
  const direct = product.pricing?.price?.trim();
  if (direct) return direct;
  const offer = product.getOffer?.();
  const phasePrice = offer?.pricingPhases?.[0]?.price?.trim();
  if (phasePrice) return phasePrice;
  return null;
}

export function getStoreProDisplayPrice(): string | null {
  if (isNativeApp()) syncProDisplayPrice();
  return proDisplayPrice;
}

export function subscribeStoreProDisplayPrice(
  fn: (price: string | null) => void,
): () => void {
  priceListeners.add(fn);
  fn(proDisplayPrice);
  return () => priceListeners.delete(fn);
}

function setBridgeStatus(status: StoreBridgeStatus) {
  bridgeStatus = status;
  statusListeners.forEach((fn) => fn(status));
}

export function getStoreBridgeStatus(): StoreBridgeStatus {
  return bridgeStatus;
}

export function getStoreBridgeFailureDetail(): string | null {
  return bridgeFailureDetail;
}

export function subscribeStoreBridgeStatus(
  fn: (status: StoreBridgeStatus) => void,
): () => void {
  statusListeners.add(fn);
  fn(bridgeStatus);
  return () => statusListeners.delete(fn);
}

type PendingPurchase = {
  productId: string;
  resolve: (payload: StorePurchasePayload) => void;
  reject: (reason: unknown) => void;
};

let pendingPurchase: PendingPurchase | null = null;
let handlersRegistered = false;

function storePlatform() {
  const native = getNativePlatform();
  if (native === "ios") return Platform.APPLE_APPSTORE;
  if (native === "android") return Platform.GOOGLE_PLAY;
  return null;
}

function formatStoreError(error: IError | undefined): string {
  if (!error) return "unknown";
  return `${error.code}${error.message ? `:${error.message}` : ""}`;
}

function isProProductReady(): boolean {
  const product = store.get(STORE_PRO_PRODUCT_ID);
  if (!product?.id) return false;
  if (store.owned(STORE_PRO_PRODUCT_ID)) return true;
  if (findOwnedTransaction(STORE_PRO_PRODUCT_ID)) return true;
  if (readProductDisplayPrice(product)) return true;
  if (product.canPurchase && product.getOffer()) return true;
  return Boolean(product.title);
}

function attachBridge() {
  if (window.__mpwStoreBridge) return;
  window.__mpwStoreBridge = {
    purchase: (productId: string) => orderProduct(productId),
    restore: () => restoreProduct(STORE_PRO_PRODUCT_ID),
  };
  bridgeFailureDetail = null;
  setBridgeStatus("ready");
  syncProDisplayPrice();
}

function tryMarkReady(): void {
  if (!isProProductReady()) return;
  attachBridge();
}

function registerStoreHandlers(
  platform: NonNullable<ReturnType<typeof storePlatform>>,
) {
  if (handlersRegistered) return;
  handlersRegistered = true;

  store.error((error) => {
    console.error("store.error", error.code, error.message);
    if (error.code === ErrorCode.LOAD || error.code === ErrorCode.SETUP) {
      bridgeFailureDetail = formatStoreError(error);
      setBridgeStatus("failed");
      initPromise = null;
    }
  });

  store.register([
    {
      id: STORE_PRO_PRODUCT_ID,
      type: ProductType.NON_CONSUMABLE,
      platform,
    },
  ]);

  store.when().productUpdated((product: Product) => {
    if (product.id !== STORE_PRO_PRODUCT_ID) return;
    console.info(
      "store.productUpdated",
      product.id,
      product.canPurchase,
      product.owned,
      product.title,
    );
    syncProDisplayPrice();
    tryMarkReady();
  });

  store.when().approved((transaction) => {
    const pending = pendingPurchase;
    if (
      !pending ||
      !transactionMatchesProduct(transaction, pending.productId)
    ) {
      return;
    }
    pendingPurchase = null;
    try {
      pending.resolve(payloadFromTransaction(transaction, pending.productId));
    } catch (e: unknown) {
      pending.reject(e);
    }
  });

  store.ready(() => {
    tryMarkReady();
    syncProDisplayPrice();
  });
}

function googlePlayPurchaseToken(transaction: Transaction): string | null {
  const gp = transaction as {
    nativePurchase?: { purchaseToken?: string };
    parentReceipt?: { purchaseToken?: string };
  };
  const fromNative = gp.nativePurchase?.purchaseToken?.trim();
  if (fromNative) return fromNative;

  try {
    const receipt = transaction.parentReceipt as { purchaseToken?: string } | undefined;
    const fromReceipt = receipt?.purchaseToken?.trim();
    if (fromReceipt) return fromReceipt;
  } catch {
    /* parentReceipt unavailable */
  }

  return null;
}

function appleVerificationData(transaction: Transaction): string | null {
  const jws = (transaction as { jwsRepresentation?: string }).jwsRepresentation?.trim();
  if (jws) return jws;
  return transaction.transactionId?.trim() || null;
}

function payloadFromTransaction(
  transaction: Transaction,
  productId: string,
): StorePurchasePayload {
  const platform = getNativePlatform();
  if (!platform) throw new AppError("errors.storeUnsupported");

  const verificationData =
    platform === "android"
      ? googlePlayPurchaseToken(transaction) ?? ""
      : appleVerificationData(transaction) ?? "";

  if (!verificationData) {
    throw new AppError("errors.storeVerifyFailed", "missing_verification_data");
  }

  const transactionId =
    platform === "android"
      ? transaction.transactionId?.trim() ||
        (transaction.parentReceipt as { orderId?: string } | undefined)?.orderId?.trim() ||
        verificationData
      : transaction.transactionId;

  return {
    platform,
    productId,
    verificationData,
    transactionId,
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
  if (store.owned(productId)) {
    const owned = await restoreProduct(productId);
    if (owned) return owned;
  }

  const product = store.get(productId);
  const offer = product?.getOffer();
  if (!product || !offer) {
    throw new AppError(storeBridgeMissingErrorCode(), "product_unavailable");
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

async function waitForCapacitorBridge(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (document.readyState === "complete") return;
  await new Promise<void>((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

/**
 * Registers `window.__mpwStoreBridge` for StoreKit / Play Billing via cdv-purchase.
 * Marks ready only after the PRO product is loaded from the store.
 */
export async function initNativeStoreBridge(options?: {
  force?: boolean;
}): Promise<void> {
  if (!isNativeApp() || typeof window === "undefined") return;
  if (bridgeStatus === "ready" && window.__mpwStoreBridge && !options?.force) {
    return;
  }
  if (options?.force) {
    initPromise = null;
    if (bridgeStatus !== "ready") {
      setBridgeStatus("idle");
    }
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    setBridgeStatus("loading");
    bridgeFailureDetail = null;
    await waitForCapacitorBridge();

    const platform = storePlatform();
    if (!platform) {
      bridgeFailureDetail = "unsupported_platform";
      setBridgeStatus("failed");
      return;
    }

    if (import.meta.env.DEV) {
      store.verbosity = LogLevel.DEBUG;
    }

    registerStoreHandlers(platform);

    const initResult = await store.initialize([platform]);
    const initError = Array.isArray(initResult) ? initResult[0] : initResult;
    if (initError) {
      bridgeFailureDetail = formatStoreError(initError);
      console.error("store.initialize failed", initError);
      setBridgeStatus("failed");
      initPromise = null;
      return;
    }

    await store.restorePurchases();
    await store.update();
    tryMarkReady();

    if (window.__mpwStoreBridge) return;

    await new Promise<void>((resolve) => {
      const deadline = window.setTimeout(() => {
        if (!window.__mpwStoreBridge) {
          if (isProProductReady()) {
            attachBridge();
            resolve();
            return;
          }
          const product = store.get(STORE_PRO_PRODUCT_ID);
          bridgeFailureDetail = product
            ? `product_not_ready:canPurchase=${product.canPurchase}:owned=${store.owned(STORE_PRO_PRODUCT_ID)}`
            : `product_missing:${STORE_PRO_PRODUCT_ID}`;
          console.error("store bridge timeout", bridgeFailureDetail);
          setBridgeStatus("failed");
          initPromise = null;
        }
        resolve();
      }, 12_000);

      const check = () => {
        if (window.__mpwStoreBridge) {
          window.clearTimeout(deadline);
          resolve();
        }
      };
      const interval = window.setInterval(check, 250);
      check();
      window.setTimeout(() => window.clearInterval(interval), 12_500);
    });
  })().catch((e) => {
    console.error("initNativeStoreBridge", e);
    bridgeFailureDetail =
      e instanceof Error ? e.message : String(e ?? "init_failed");
    setBridgeStatus("failed");
    initPromise = null;
  });

  return initPromise;
}
