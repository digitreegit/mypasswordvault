import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BarsArrowDownIcon } from "@heroicons/react/24/outline";
import { Check } from "./Icons";

export type VaultSortKey = "category" | "site" | "username" | "updatedAt";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

const SORT_OPTIONS: VaultSortKey[] = ["updatedAt", "category", "site"];

function sortOptionLabel(key: VaultSortKey, t: TFn): string {
  switch (key) {
    case "updatedAt":
      return t("vault.sortRecent");
    case "category":
      return t("vault.colCategory");
    case "site":
      return t("vault.colSite");
    default:
      return key;
  }
}

type VaultMobileSortMenuProps = {
  sortKey: VaultSortKey;
  sortDir: "asc" | "desc";
  onSortKeyChange: (key: VaultSortKey) => void;
  onSortDirToggle: () => void;
  triggerClassName?: string;
  t: TFn;
};

export function VaultMobileSortMenu({
  sortKey,
  sortDir,
  onSortKeyChange,
  onSortDirToggle,
  triggerClassName = "ui-icon-btn ui-icon-btn--compact ui-icon-btn--bordered text-ink-600 shadow-sm shrink-0",
  t,
}: VaultMobileSortMenuProps) {
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
      const minWidth = 11.5 * 16;
      let left = rect.left;
      if (left + minWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - 8 - minWidth);
      }
      setPanelStyle({
        position: "fixed",
        top: rect.bottom + gap,
        left,
        minWidth,
        width: "max-content",
        maxWidth: Math.min(280, window.innerWidth - 16),
        zIndex: 9999,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

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
        aria-label={t("vault.sortBy")}
        style={panelStyle}
        className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg"
      >
        <p className="vault-sort-menu-label m-0 px-3 pt-2.5 pb-1 text-xs font-medium text-ink-400">
          {t("vault.sortBy")}
        </p>
        <div className="pb-1">
          {SORT_OPTIONS.map((key) => {
            const selected = sortKey === key;
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={selected}
                className={[
                  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm touch-manipulation",
                  selected
                    ? "bg-accent-50 text-accent-900 font-medium"
                    : "text-ink-800 hover:bg-ink-50",
                ].join(" ")}
                onClick={() => {
                  onSortKeyChange(key);
                  setOpen(false);
                }}
              >
                <span>{sortOptionLabel(key, t)}</span>
                {selected ? (
                  <Check width={14} height={14} className="shrink-0 text-accent-600" />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="border-t border-ink-100 px-3 py-2">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm text-ink-700 hover:bg-ink-50 touch-manipulation"
            onClick={() => {
              onSortDirToggle();
            }}
            aria-label={
              sortDir === "asc" ? t("vault.sortAscending") : t("vault.sortDescending")
            }
          >
            <span className="text-ink-500">{t("vault.sortDirection")}</span>
            <span className="font-medium text-ink-800">
              {sortDir === "asc" ? t("vault.sortAscending") : t("vault.sortDescending")}
            </span>
          </button>
        </div>
      </div>,
      document.body,
    );

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("vault.sortBy")}
        title={t("vault.sortBy")}
        onClick={() => setOpen((o) => !o)}
      >
        <BarsArrowDownIcon className="h-5 w-5" aria-hidden />
      </button>
      {panel}
    </div>
  );
}
