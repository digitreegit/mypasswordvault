import React, { useState } from "react";
import { useVault } from "../lib/vault";

const DISMISS_KEY = "mpv_backup_security_banner_dismiss_v1";

/**
 * Phase A: nudge TOTP / recovery setup in Settings — not during onboarding.
 */
export function BackupSecurityBanner() {
  const { meta, backupTotpEnabled, t } = useVault();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const hasPasskey =
    !!meta?.passkeyDataKeyWrap &&
    (meta.passkeys ?? []).some((p) => p.prfVerified !== false);
  const hasTotp = backupTotpEnabled || meta?.requireSecondFactorAtUnlock === true;

  if (dismissed || !meta) return null;
  // Soft nudge only when something useful is still missing.
  if (hasPasskey && hasTotp) return null;

  function goSecurity() {
    window.location.hash = "#/settings/security";
  }

  function onDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <div
      className="rounded-lg border border-ink-200 bg-ink-50 text-ink-800 px-4 py-3 space-y-3 text-sm leading-snug"
      role="status"
    >
      <p className="font-semibold">{t("continuity.backupBannerTitle")}</p>
      <p>{t("continuity.backupBannerBody")}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button type="button" className="btn-primary text-sm" onClick={goSecurity}>
          {t("continuity.backupBannerCta")}
        </button>
        <button type="button" className="btn-secondary text-sm" onClick={onDismiss}>
          {t("continuity.later")}
        </button>
      </div>
    </div>
  );
}
