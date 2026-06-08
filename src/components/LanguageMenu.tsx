import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  /** Override trigger button classes (e.g. vault header icon row). */
  triggerClassName?: string;
}

export function LanguageMenu({
  value,
  onChange,
  ariaLabel,
  align = "right",
  className,
  appearance = "globe",
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const gap = 4;
      const base: React.CSSProperties = {
        position: "fixed",
        top: rect.bottom + gap,
        zIndex: 9999,
        minWidth: "12rem",
        width: "max-content",
        maxHeight: "min(24rem, 75vh)",
      };
      if (align === "right") {
        base.right = Math.max(8, window.innerWidth - rect.right);
        base.left = "auto";
      } else {
        base.left = Math.max(8, rect.left);
        base.right = "auto";
      }
      setPanelStyle(base);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
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

  const panel =
    open &&
    createPortal(
      <div
        ref={panelRef}
        role="listbox"
        aria-label={ariaLabel}
        style={panelStyle}
        className="overflow-y-auto rounded-lg border border-ink-200 bg-white py-1 pb-1.5 shadow-lg"
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
      </div>,
      document.body
    );

  return (
    <div
      className={["relative inline-block language-menu", className].filter(Boolean).join(" ")}
      ref={rootRef}
    >
      <button
        ref={buttonRef}
        type="button"
        className={
          appearance === "compact"
            ? "input text-sm py-1.5 pl-3 pr-9 max-w-[12rem] w-full min-w-0 text-left relative flex items-center text-ink-800 hover:bg-ink-50/80"
            : triggerClassName ??
              "btn-ghost p-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-ink-100"
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
          <Globe className="shrink-0" aria-hidden />
        )}
      </button>
      {panel}
    </div>
  );
}
