import React, { useEffect, useMemo, useState } from "react";
import { CheckIcon, KeyIcon } from "@heroicons/react/24/outline";
import {
  getPasskeyMethodOptions,
  getSelectableMethods,
  planPasskeyRegistrations,
  type PasskeyMethodId,
  type PasskeyMethodOption,
} from "../lib/passkeyMethods";
import { getNativePlatform } from "../lib/platform";
import { isIpLiteralHost } from "../lib/siteOrigin";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

interface PasskeySetupPickerProps {
  t: TFn;
  busy: boolean;
  error: string | null;
  registeredIds: ReadonlySet<PasskeyMethodId>;
  onContinue: (registrations: PasskeyMethodOption[]) => Promise<void>;
  onBack: () => void;
  unsupported: boolean;
}

export function PasskeySetupPicker({
  t,
  busy,
  error,
  registeredIds,
  onContinue,
  onBack,
  unsupported,
}: PasskeySetupPickerProps) {
  const [methods, setMethods] = useState<PasskeyMethodOption[]>([]);
  const [selected, setSelected] = useState<Set<PasskeyMethodId>>(new Set());
  const [loadingMethods, setLoadingMethods] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getPasskeyMethodOptions()
      .then((opts) => {
        if (cancelled) return;
        setMethods(opts);
        const selectable = getSelectableMethods(opts);
        if (selectable.length > 0) {
          setSelected(new Set([selectable[0].id]));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMethods(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingRegistrations = useMemo(
    () => planPasskeyRegistrations(methods, selected, registeredIds),
    [methods, selected, registeredIds],
  );

  const hasRegistered = registeredIds.size > 0;
  const isAndroidNative = getNativePlatform() === "android";
  const canContinue =
    !unsupported &&
    !busy &&
    methods.length > 0 &&
    (hasRegistered || pendingRegistrations.length > 0);

  const devIpBlocked =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    isIpLiteralHost(window.location.hostname);
  const localhostAppUrl =
    typeof window !== "undefined"
      ? `http://localhost:${window.location.port || "5173"}/app/`
      : "http://localhost:5173/app/";

  return (
    <div className="space-y-4">
      {devIpBlocked ? (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-3 leading-snug">
          {t("errors.passkeyUseLocalhost")}{" "}
          <a
            href={localhostAppUrl}
            className="font-medium text-accent-700 underline underline-offset-2"
          >
            {localhostAppUrl}
          </a>
        </p>
      ) : null}

      <div className="rounded-xl border border-ink-200 bg-white px-4 py-4 sm:px-5 sm:py-5">
        {loadingMethods ? (
          <p className="text-sm text-ink-500 text-center py-2">
            {t("setup.passkeyMethodsLoading")}
          </p>
        ) : methods.length === 0 ? (
          <p className="text-sm text-ink-500 text-center py-2">
            {t("setup.passkeyUnsupported")}
          </p>
        ) : (
          <div className="flex items-start gap-3">
            <span className="passkey-device-key__badge inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600">
              <KeyIcon
                className="passkey-device-key__icon h-6 w-6"
                aria-hidden
                strokeWidth={1.5}
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-ink-900">
                  {t("setup.passkeyDeviceTitle")}
                </p>
                {hasRegistered ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent-700">
                    <CheckIcon className="h-4 w-4" aria-hidden />
                    {t("setup.passkeyMethodAdded")}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-ink-600 leading-snug">
                {t("setup.passkeyDeviceBody")}
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-ink-500 leading-snug">{t("setup.passkeyMethodsHint")}</p>
      <p className="text-xs text-ink-500 leading-snug">{t("setup.passkeyPrfHint")}</p>
      {isAndroidNative ? (
        <p className="text-xs text-ink-500 leading-snug">
          {t("setup.passkeyAndroidGooglePinHint")}
        </p>
      ) : null}

      {unsupported && !devIpBlocked ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2.5">
          {t("setup.passkeyUnsupported")}
        </p>
      ) : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <button
        type="button"
        className="btn-primary w-full"
        onClick={() => void onContinue(pendingRegistrations)}
        disabled={!canContinue}
      >
        {busy ? t("setup.passkeyRegistering") : t("setup.passkeyContinue")}
      </button>
      <button
        type="button"
        className="btn-secondary w-full"
        onClick={onBack}
        disabled={busy}
      >
        {t("setup.back")}
      </button>
    </div>
  );
}
