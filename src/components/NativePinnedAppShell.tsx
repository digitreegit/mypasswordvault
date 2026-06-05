import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  nativeFixedHeaderClass,
  nativeMainScrollClass,
  nativeScreenRootClass,
} from "../lib/nativeLayout";
import { scrollFocusedFieldAboveKeyboard } from "../lib/nativeScrollFocus";

type NativePinnedAppShellProps = {
  header: React.ReactNode;
  children: React.ReactNode;
  headerClassName?: string;
  scrollClassName?: string;
  rootClassName?: string;
  /** Bumps header remeasure when layout-affecting deps change (e.g. wizard step). */
  remeasureKey?: unknown;
};

/** Fixed chrome + keyboard-aware scroll body for Capacitor (SetupScreen pattern). */
export function NativePinnedAppShell({
  header,
  children,
  headerClassName = "",
  scrollClassName = "",
  rootClassName = "bg-white",
  remeasureKey,
}: NativePinnedAppShellProps) {
  const headerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const measure = () => {
      setHeaderHeight(el.getBoundingClientRect().height);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [remeasureKey]);

  useEffect(() => {
    const scrollRoot = scrollRef.current;
    if (!scrollRoot) return;
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!scrollRoot.contains(target)) return;
      scrollFocusedFieldAboveKeyboard(target, scrollRoot);
    };
    scrollRoot.addEventListener("focusin", onFocusIn);
    return () => scrollRoot.removeEventListener("focusin", onFocusIn);
  }, [remeasureKey, headerHeight]);

  return (
    <div
      className={nativeScreenRootClass(
        `${rootClassName} setup-screen setup-screen--fixed`.trim(),
      )}
      style={
        headerHeight > 0
          ? ({ ["--setup-header-height" as string]: `${headerHeight}px` } as React.CSSProperties)
          : undefined
      }
    >
      <header
        ref={headerRef}
        className={`${nativeFixedHeaderClass()} setup-screen__header setup-screen__header--fixed border-b border-ink-200 bg-white px-5 pt-1 ${headerClassName}`.trim()}
      >
        {header}
      </header>
      <main
        ref={scrollRef}
        className={nativeMainScrollClass(
          `setup-screen__body setup-screen__body--fixed px-5 py-5 ${scrollClassName}`.trim(),
        )}
      >
        {children}
      </main>
    </div>
  );
}
