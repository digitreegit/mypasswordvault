import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

type CautionNoticeProps = {
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
};

export function CautionNotice({
  children,
  className = "",
  showIcon = false,
}: CautionNoticeProps) {
  return (
    <p
      className={[
        "caution-notice",
        showIcon ? "caution-notice--with-icon" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showIcon ? (
        <ExclamationTriangleIcon className="caution-notice__icon" aria-hidden />
      ) : null}
      <span>{children}</span>
    </p>
  );
}
