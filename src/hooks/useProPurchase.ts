import { useCallback, useState } from "react";
import { isAppError } from "../lib/errors";
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
  const storeReady = storeBilling && isStoreBridgeAvailable();

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
      if (import.meta.env.DEV && !isStoreBridgeAvailable()) {
        await devGrantStoreLicense();
        return { ok: true as const, via: "dev" as const };
      }
      await purchaseProViaStore();
      return { ok: true as const, via: "store" as const };
    } catch (e: unknown) {
      setErr(formatErr(e));
      return { ok: false as const };
    } finally {
      setBusy(false);
    }
  }, [formatErr]);

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
      setErr(formatErr(e));
      return { ok: false as const };
    } finally {
      setBusy(false);
    }
  }, [formatErr, t]);

  return {
    storeBilling,
    storeReady,
    busy,
    err,
    setErr,
    purchaseStore,
    restoreStore,
  };
}
