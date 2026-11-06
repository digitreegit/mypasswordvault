import React, { useState } from "react";
import { useVault } from "../lib/vault";
import { isAppError } from "../lib/errors";
import { isNativeApp } from "../lib/platform";

const DISMISS_KEY = "mpv_passkey_offer_dismiss_v1";

/**
 * Phase A: after master-password-only setup, offer Face ID / passkey once unlocked.
 */
export function PasskeyOfferBanner() {
  const {
    meta,
    isPasskeySupported,
    addPasskey,
    t,
  } = useVault();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const hasPasskey =
    !!meta?.passkeyDataKeyWrap &&
    (meta.passkeys ?? []).some((p) => p.prfVerified !== false);

  if (dismissed || !isPasskeySupported || hasPasskey || !meta) return null;

  async function onEnable() {
    setBusy(true);
    setError(null);
    try {
      await addPasskey({
        hints: ["client-device"],
        label: t("setup.passkeyMethodBiometric"),
      });
      setDismissed(true);
    } catch (e: unknown) {
      setError(
        isAppError(e) ? t(e.code) : (e as Error)?.message ?? t("auth.errGeneric"),
      );
    } finally {
      setBusy(false);
    }
  }

  function onLater() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <div
      className="rounded-lg border border-sky-300 bg-sky-50 text-sky-950 px-4 py-3 space-y-3 text-sm leading-snug"
      role="status"
    >
      <p className="font-semibold">{t("continuity.passkeyOfferTitle")}</p>
      <p>
        {isNativeApp()
          ? t("continuity.passkeyOfferBodyNative")
          : t("continuity.passkeyOfferBodyWeb")}
      </p>
      {error ? <p className="text-red-700">{error}</p> : null}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          className="btn-primary text-sm"
          disabled={busy}
          onClick={() => void onEnable()}
        >
          {t("continuity.passkeyOfferEnable")}
        </button>
        <button
          type="button"
          className="btn-secondary text-sm"
          disabled={busy}
          onClick={onLater}
        >
          {t("continuity.later")}
        </button>
      </div>
    </div>
  );
}
