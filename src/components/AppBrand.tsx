import React from "react";
import { Shield } from "./Icons";

type AppBrandProps = {
  name: string;
  href?: string;
  homeAriaLabel?: string;
  className?: string;
  /** Vault/settings top chrome uses darker title color. */
  variant?: "default" | "topbar";
};

export function AppBrand({
  name,
  href,
  homeAriaLabel,
  className,
  variant = "default",
}: AppBrandProps) {
  const rootClass = [
    "app-brand",
    href ? "app-brand--link" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const nameClass = [
    "app-brand__name",
    variant === "topbar" ? "app-brand__name--topbar" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <Shield className="app-brand__shield text-accent-500" aria-hidden />
      <span className={nameClass} translate="no">
        {name}
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={rootClass} aria-label={homeAriaLabel}>
        {content}
      </a>
    );
  }

  return <div className={rootClass}>{content}</div>;
}
