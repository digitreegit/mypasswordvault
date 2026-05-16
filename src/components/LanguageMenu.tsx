import React, { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { LOCALES, LOCALE_LABELS, type Locale } from "../lib/i18n/locale";
import { Globe, Check } from "./Icons";

interface Props {
  value: Locale;
  onChange: (l: Locale) => void;
  /** Screen-reader label for the globe button */
  ariaLabel: string;
  /** Dropdown panel alignment under the button */
  align?: "left" | "right";
  className?: string;
  /**
   * `globe` — icon-only trigger (default).
   * `compact` — current language label + Heroicons chevron (e.g. pricing bar).
   */
  appearance?: "globe" | "compact";
}

export function LanguageMenu({
  value,
  onChange,
  ariaLabel,
  align = "right",
  className,
  appearance = "globe",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={["relative inline-block", className].filter(Boolean).join(" ")} ref={rootRef}>
      <button
        type="button"
        className={
          appearance === "compact"
            ? "input text-sm py-1.5 pl-3 pr-9 max-w-[12rem] w-full min-w-0 text-left relative flex items-center text-ink-800 hover:bg-ink-50/80"
            : "btn-ghost p-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-100"
        }
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        {appearance === "compact" ? (
          <>
            <span className="truncate min-w-0 pr-1">{LOCALE_LABELS[value]}</span>
            <ChevronDownIcon
              className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 shrink-0"
              aria-hidden
            />
          </>
        ) : (
          <Globe width={20} height={20} className="shrink-0" />
        )}
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={[
            "absolute z-[60] mt-1 w-max min-w-[12rem] max-h-[min(20rem,70vh)] overflow-y-auto rounded-lg border border-ink-200 bg-white py-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              role="option"
              aria-selected={value === loc}
              className={[
                "w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3",
                value === loc
                  ? "bg-accent-50 text-accent-900"
                  : "text-ink-800 hover:bg-ink-50",
              ].join(" ")}
              onClick={() => {
                onChange(loc);
                setOpen(false);
              }}
            >
              <span>{LOCALE_LABELS[loc]}</span>
              {value === loc && (
                <Check width={14} height={14} className="text-accent-600 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
