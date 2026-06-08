import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type ModalCloseButtonProps = {
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
};

export function ModalCloseButton({
  onClick,
  ariaLabel,
  disabled = false,
  className = "",
}: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      className={[
        "modal-close-btn btn-ghost p-1.5 -mr-1 text-ink-500 shrink-0 disabled:opacity-50 disabled:pointer-events-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <XMarkIcon className="modal-close-btn__icon h-5 w-5" aria-hidden />
    </button>
  );
}
