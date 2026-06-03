import React from "react";

/**
 * Full-viewport auth/setup/lock layout.
 * Mobile: header pinned to top, panel full width (no vertical centering).
 * sm+: centered card (desktop).
 */
export function AppShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="app-shell">
      <div
        className={[
          "app-shell__panel",
          wide ? "app-shell__panel--wide" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
