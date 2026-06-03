import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth";
import { useVault } from "../lib/vault";
import { User } from "./Icons";

const MENU_ITEM =
  "block w-full text-left px-3 py-2 text-sm font-normal text-ink-800 hover:bg-ink-50 transition-colors no-underline";
const MENU_ITEM_SIGN_OUT =
  "block w-full text-left px-3 py-2 text-sm font-normal text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors";
const MENU_DIVIDER = "border-t border-ink-200";

export function UserMenuDropdown({ className = "" }: { className?: string }) {
  const { user, signOut } = useAuth();
  const { t } = useVault();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const email = user?.email ?? "";

  function go(hash: string) {
    setOpen(false);
    window.location.hash = hash;
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 transition-colors shrink-0"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.userMenu")}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <User className="w-[1.125rem] h-[1.125rem]" />
      </button>
      {!open ? null : (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-[13.75rem] rounded-lg border border-ink-200 bg-white py-1.5 shadow-[0_8px_24px_rgba(18,18,22,0.12)]"
        >
          <div className="px-3 pt-2 pb-1.5" role="presentation">
            <p className="m-0 text-xs text-ink-400 leading-snug">
              {t("settings.signedInAsLabel")}
            </p>
            <p className="m-0 mt-0.5 text-[13px] text-ink-700 leading-snug break-all">
              {email}
            </p>
          </div>
          <div className={MENU_DIVIDER} role="separator" />
          <a
            role="menuitem"
            href="#/settings"
            className={`${MENU_ITEM} mt-1`}
            onClick={(e) => {
              e.preventDefault();
              go("#/settings");
            }}
          >
            {t("settings.title")}
          </a>
          <div className={`${MENU_DIVIDER} mt-1`} role="separator" />
          <button
            type="button"
            role="menuitem"
            className={`${MENU_ITEM_SIGN_OUT} cursor-pointer border-0 bg-transparent font-[inherit]`}
            onClick={() => {
              void signOut().finally(() => setOpen(false));
            }}
          >
            {t("settings.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
