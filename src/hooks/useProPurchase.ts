import { useCallback, useEffect, useState } from "react";
import { isAppError } from "../lib/errors";
import {
  getStoreBridgeFailureDetail,
  getStoreBridgeStatus,
  initNativeStoreBridge,
  subscribeStoreBridgeStatus,
  subscribeStoreProDisplayPrice,
  type StoreBridgeStatus,
} from "../lib/initNativeStoreBridge";
import { usesStoreBilling } from "../lib/platform";
import {
  devGrantStoreLicense,
  isStoreBridgeAvailable,
  purchaseProViaStore,
  restoreStorePurchases,
} from "../lib/storePurchase";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

export function useProPurchase(t: TFn) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const storeBilling = usesStoreBilling();
  const [bridgeStatus, setBridgeStatus] = useState<StoreBridgeStatus>(() =>
    getStoreBridgeStatus(),
  );
  const [storeProPrice, setStoreProPrice] = useState<string | null>(null);

  useEffect(() => {
    if (!storeBilling) return;
    void initNativeStoreBridge();
    const unsubBridge = subscribeStoreBridgeStatus(setBridgeStatus);
    const unsubPrice = subscribeStoreProDisplayPrice(setStoreProPrice);
    return () => {
      unsubBridge();
      unsubPrice();
    };
  }, [storeBilling]);

  const storeReady =
    storeBilling &&
    (bridgeStatus === "ready" || isStoreBridgeAvailable());

  const formatErr = useCallback(
    (e: unknown) => {
      if (isAppError(e)) return t(e.code);
      return (e as Error)?.message ?? t("pricing.errCheckout");
    },
    [t],
  );

  const purchaseStore = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const needsForce = getStoreBridgeStatus() === "failed";
      await initNativeStoreBridge(needsForce ? { force: true } : undefined);
      if (import.meta.env.DEV && !isStoreBridgeAvailable()) {
        await devGrantStoreLicense();
        return { ok: true as const, via: "dev" as const };
      }
      if (!isStoreBridgeAvailable()) {
        const detail = getStoreBridgeFailureDetail();
        setErr(
          detail
            ? `${t("pricing.storeBridgeFailed")} (${detail})`
            : t("pricing.storeBridgeFailed"),
        );
        return { ok: false as const };
      }
      await purchaseProViaStore();
      return { ok: true as const, via: "store" as const };
    } catch (e: unknown) {
      if (isAppError(e) && e.code === "errors.storePurchaseCancelled") {
        return { ok: false as const };
      }
      if (isAppError(e)) {
        const detail = e.detail ? String(e.detail) : "";
        setErr(detail ? `${t(e.code)} (${detail})` : t(e.code));
      } else {
        setErr(formatErr(e));
      }
      return { ok: false as const };
    } finally {
      setBusy(false);
    }
  }, [formatErr, t]);

  const restoreStore = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const restored = await restoreStorePurchases();
      if (!restored) {
        setErr(t("pricing.storeRestoreEmpty"));
        return { ok: false as const };
      }
      return { ok: true as const };
    } catch (e: unknown) {
      if (isAppError(e) && e.code === "errors.storePurchaseCancelled") {
        return { ok: false as const };
      }
      setErr(formatErr(e));
      return { ok: false as const };
    } finally {
      setBusy(false);
    }
  }, [formatErr, t]);

  return {
    storeBilling,
    storeReady,
    bridgeStatus,
    storeProPrice,
    busy,
    err,
    setErr,
    purchaseStore,
    restoreStore,
  };
}
