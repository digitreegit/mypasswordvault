import React, { useEffect, useMemo, useState } from "react";
import {
  CheckIcon,
  ComputerDesktopIcon,
  FaceSmileIcon,
  FingerPrintIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import {
  getPasskeyMethodOptions,
  getSelectableMethods,
  isPasskeyMethodRegistered,
  planPasskeyRegistrations,
  type PasskeyMethodId,
  type PasskeyMethodOption,
} from "../lib/passkeyMethods";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

function MethodIcon({ id }: { id: PasskeyMethodId }) {
  const className = "h-5 w-5 shrink-0 text-ink-500";
  switch (id) {
    case "touch-id":
    case "fingerprint":
      return <FingerPrintIcon className={className} aria-hidden />;
    case "face-id":
      return <FaceSmileIcon className={className} aria-hidden />;
    case "windows-hello":
      return <ComputerDesktopIcon className={className} aria-hidden />;
    case "device-pin":
      return <LockClosedIcon className={className} aria-hidden />;
  }
}

function SetupToggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-2",
        disabled ? "cursor-default opacity-70" : "cursor-pointer",
        checked ? "bg-accent-600" : "bg-ink-200",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

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

  useEffect(() => {
    let cancelled = false;
    void getPasskeyMethodOptions().then((opts) => {
      if (!cancelled) setMethods(opts);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingRegistrations = useMemo(
    () => planPasskeyRegistrations(methods, selected, registeredIds),
    [methods, selected, registeredIds]
  );

  const hasRegistered = registeredIds.size > 0;
  const canContinue =
    !unsupported &&
    !busy &&
    methods.length > 0 &&
    (hasRegistered || pendingRegistrations.length > 0);

  function toggleMethod(method: PasskeyMethodOption, next: boolean) {
    if (method.rowKind !== "selectable") return;
    if (isPasskeyMethodRegistered(method, registeredIds)) return;
    setSelected((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(method.id);
      else copy.delete(method.id);
      return copy;
    });
  }

  const selectableCount = getSelectableMethods(methods).length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-ink-200 bg-white overflow-hidden divide-y divide-ink-100">
        {methods.length === 0 ? (
          <div className="px-4 py-6 text-sm text-ink-500 text-center">
            {selectableCount === 0 && methods.length === 0
              ? t("setup.passkeyMethodsLoading")
              : t("setup.passkeyUnsupported")}
          </div>
        ) : (
          methods.map((method) => {
            if (method.rowKind === "included") {
              return (
                <div
                  key={method.id}
                  className="flex items-start gap-3 px-4 py-3.5 min-h-[3.25rem] bg-ink-50/40"
                >
                  <MethodIcon id={method.id} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-700">
                      {t(method.labelKey)}
                    </p>
                    {method.subtitleKey && (
                      <p className="text-xs text-ink-500 mt-0.5 leading-snug">
                        {t(method.subtitleKey)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-ink-400 shrink-0 pt-0.5">
                    {t("setup.passkeyPinIncludedBadge")}
                  </span>
                </div>
              );
            }

            const registered = isPasskeyMethodRegistered(method, registeredIds);
            const checked = registered || selected.has(method.id);
            return (
              <div
                key={method.id}
                className="flex items-center gap-3 px-4 py-3.5 min-h-[3.25rem]"
              >
                <MethodIcon id={method.id} />
                <span className="flex-1 text-sm font-medium text-ink-800">
                  {t(method.labelKey)}
                </span>
                {registered ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-700">
                    <CheckIcon className="h-4 w-4" aria-hidden />
                    {t("setup.passkeyMethodAdded")}
                  </span>
                ) : (
                  <SetupToggle
                    checked={checked}
                    disabled={busy || unsupported}
                    onChange={(next) => toggleMethod(method, next)}
                    label={t(method.labelKey)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-ink-500 leading-snug">{t("setup.passkeyMethodsHint")}</p>

      {unsupported && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2.5">
          {t("setup.passkeyUnsupported")}
        </p>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}

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
