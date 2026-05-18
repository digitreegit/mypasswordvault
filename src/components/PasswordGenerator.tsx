import React, { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_GEN,
  generatePassword,
  passwordStrengthScore,
  type GenOptions,
} from "../lib/passwordGenerator";
import { useVault } from "../lib/vault";
import { Refresh, Check, Copy } from "./Icons";

interface Props {
  initial?: Partial<GenOptions>;
  onUse: (password: string) => void;
  onClose: () => void;
}

export function PasswordGenerator({ initial, onUse, onClose }: Props) {
  const { t } = useVault();
  const [opts, setOpts] = useState<GenOptions>({ ...DEFAULT_GEN, ...initial });
  const [value, setValue] = useState<string>(() => generatePassword(opts));
  const [copied, setCopied] = useState(false);
  const strengthScore = useMemo(() => passwordStrengthScore(value), [value]);

  useEffect(() => {
    setValue(generatePassword(opts));
  }, [opts]);

  function regen() {
    setValue(generatePassword(opts));
    setCopied(false);
  }

  async function copyNow() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const classLabels = (
    [
      ["lower", "pwdGen.cLower"],
      ["upper", "pwdGen.cUpper"],
      ["digits", "pwdGen.cDigits"],
      ["symbols", "pwdGen.cSymbols"],
      ["avoidAmbiguous", "pwdGen.cAmbiguous"],
    ] as const
  ).map(([k, msg]) => ({ key: k, msg }));

  const lengthMin = 8;
  const lengthMax = 64;
  const lengthFillPct =
    ((opts.length - lengthMin) / (lengthMax - lengthMin)) * 100;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md max-h-[min(90dvh,90vh)] overflow-y-auto p-4 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 pb-1">
          <h1 className="font-sans text-xl font-semibold text-ink-900 tracking-tight">
            {t("pwdGen.title")}
          </h1>
          <button type="button" className="btn-ghost text-sm shrink-0" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>

        <div className="rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm break-all min-h-[64px] flex items-center">
          {value}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex-1 h-1.5 rounded bg-ink-100 overflow-hidden">
            <div
              className={[
                "h-full transition-all",
                strengthScore <= 1
                  ? "bg-red-400"
                  : strengthScore === 2
                    ? "bg-yellow-400"
                    : strengthScore === 3
                      ? "bg-green-400"
                      : "bg-emerald-500",
              ].join(" ")}
              style={{ width: `${(strengthScore / 4) * 100}%` }}
            />
          </div>
          <span className="text-ink-500 w-24 text-right shrink-0">
            {t(`strength.${strengthScore}`)}
          </span>
        </div>

        <div>
          <label className="label flex items-center justify-between">
            <span>{t("pwdGen.length")}</span>
            <span className="text-ink-500 font-mono">{opts.length}</span>
          </label>
          <input
            type="range"
            min={lengthMin}
            max={lengthMax}
            value={opts.length}
            onChange={(e) =>
              setOpts((o) => ({ ...o, length: Number(e.target.value) }))
            }
            className="range-thin w-full"
            style={
              { "--range-pct": `${lengthFillPct}%` } as React.CSSProperties
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {classLabels.map(({ key: k, msg }) => (
            <label
              key={k}
              className="flex items-center gap-2 rounded-md border border-ink-200 px-2 py-1.5 cursor-pointer hover:bg-ink-50"
            >
              <input
                type="checkbox"
                checked={opts[k]}
                onChange={(e) =>
                  setOpts((o) => ({ ...o, [k]: e.target.checked }))
                }
              />
              <span>{t(msg)}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={regen}>
            <Refresh /> {t("pwdGen.regen")}
          </button>
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={copyNow}>
            {copied ? <Check /> : <Copy />}
            {copied ? t("pwdGen.copied") : t("pwdGen.copy")}
          </button>
          <button
            type="button"
            className="btn-primary w-full sm:w-auto sm:min-w-[7rem]"
            onClick={() => onUse(value)}
          >
            {t("pwdGen.use")}
          </button>
        </div>
      </div>
    </div>
  );
}
