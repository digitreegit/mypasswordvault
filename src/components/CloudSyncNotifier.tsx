import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useVault } from "../lib/vault";
import { hasCloudSyncPending } from "../lib/cloudSyncPending";
import { isNativeApp } from "../lib/platform";
import { isSupabaseConfigured } from "../lib/supabaseClient";

type SyncPhase = "idle" | "syncing" | "complete";

function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export function CloudSyncNotifier({ accountUserId }: { accountUserId: string | null }) {
  const { syncCloudNow, t } = useVault();
  const [phase, setPhase] = useState<SyncPhase>("idle");
  const syncInFlightRef = useRef(false);

  const trySyncPending = useCallback(async () => {
    if (!accountUserId || !isSupabaseConfigured) return;
    if (!isOnline()) return;
    if (!hasCloudSyncPending(accountUserId)) return;
    if (syncInFlightRef.current) return;

    syncInFlightRef.current = true;
    setPhase("syncing");
    const ok = await syncCloudNow();
    syncInFlightRef.current = false;
    if (ok) {
      setPhase("complete");
    } else {
      setPhase("idle");
    }
  }, [accountUserId, syncCloudNow]);

  useEffect(() => {
    const onOnline = () => {
      void trySyncPending();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [trySyncPending]);

  useEffect(() => {
    if (!accountUserId || !isOnline()) return;
    void trySyncPending();
  }, [accountUserId, trySyncPending]);

  useEffect(() => {
    if (!isNativeApp() || !accountUserId) return;
    let remove: (() => void) | undefined;
    void import("@capacitor/app").then(({ App }) => {
      void App.addListener("appStateChange", ({ isActive }) => {
        if (isActive && isOnline()) void trySyncPending();
      }).then((h) => {
        remove = () => void h.remove();
      });
    });
    return () => remove?.();
  }, [accountUserId, trySyncPending]);

  const dismissComplete = useCallback(() => {
    setPhase("idle");
  }, []);

  if (!accountUserId || !isSupabaseConfigured) return null;

  return createPortal(
    <>
      {phase === "syncing" ? (
        <div
          role="status"
          aria-live="polite"
          className="cloud-sync-toast fixed left-1/2 z-[70] flex max-w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 items-center gap-2.5 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 shadow-lg bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]"
        >
          <ArrowPathIcon
            className="h-5 w-5 shrink-0 animate-spin text-accent-700"
            aria-hidden
          />
          <p className="text-sm font-medium leading-snug text-accent-900">
            {t("vault.cloudSyncInProgress")}
          </p>
        </div>
      ) : null}

      {phase === "complete" ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={dismissComplete}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cloud-sync-complete-title"
            className="card w-full max-w-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="action-modal__header border-b border-ink-200 px-5 py-3">
              <h2
                id="cloud-sync-complete-title"
                className="font-sans text-lg font-semibold leading-tight tracking-tight text-ink-900"
              >
                {t("vault.cloudSyncCompleteTitle")}
              </h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm leading-snug text-ink-700">
                {t("vault.cloudSyncCompleteBody")}
              </p>
            </div>
            <div className="action-modal__footer flex justify-end border-t border-ink-100 px-5 py-3">
              <button
                type="button"
                className="btn-primary text-sm w-full sm:w-auto"
                onClick={dismissComplete}
              >
                {t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}
