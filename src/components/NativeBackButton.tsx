import React from "react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

/** Icon-only back button (entry detail, etc.). */
export const NATIVE_BACK_BTN_CLASS = "ui-icon-btn text-ink-600 shrink-0";

/** Inline back chevron for links (settings → vault). */
export const NATIVE_BACK_CHEVRON_CLASS = "native-back-chevron";

type NativeBackIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function NativeBackIconButton({
  className,
  children,
  ...props
}: NativeBackIconButtonProps) {
  return (
    <button
      type="button"
      className={[NATIVE_BACK_BTN_CLASS, className].filter(Boolean).join(" ")}
      {...props}
    >
      <ChevronLeftIcon aria-hidden />
      {children}
    </button>
  );
}

/** Back chevron mark for native back links (e.g. settings → vault). */
export function NativeBackChevronMark({ className }: { className?: string }) {
  return (
    <ChevronLeftIcon
      className={[NATIVE_BACK_CHEVRON_CLASS, className].filter(Boolean).join(" ")}
      aria-hidden
    />
  );
}
