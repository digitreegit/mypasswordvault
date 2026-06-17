import React, { useCallback, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { useVault } from "../lib/vault";
import { NATIVE_HEADER_ICON_BTN } from "./NativeTopHeader";

type CloudSyncButtonProps = {
  className?: string;
};

export function CloudSyncButton({
  className = NATIVE_HEADER_ICON_BTN,
}: CloudSyncButtonProps) {
  const { user } = useAuth();
  const { syncVaultNow, t } = useVault();
  const [syncing, setSyncing] = useState(false);

  const onSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await syncVaultNow();
    } finally {
      setSyncing(false);
    }
  }, [syncing, syncVaultNow]);

  if (!isSupabaseConfigured || !user?.id) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={() => void onSync()}
      disabled={syncing}
      aria-label={t("vault.syncNow")}
      title={t("vault.syncNowHint")}
    >
      <ArrowPathIcon
        className={`h-5 w-5 ${syncing ? "animate-spin" : ""}`}
        aria-hidden
      />
    </button>
  );
}
