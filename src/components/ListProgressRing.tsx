import React, { useCallback, useEffect, useRef, useState } from "react";
import { isNativeApp } from "../lib/platform";

/** Same as Iris ID `ResourceInfiniteList` ring. */
const RING_SIZE = 40;
const RING_STROKE = 2;

export function ListProgressRing({
  progress,
  seen,
  total,
  onClick,
  ariaLabel,
  title,
}: {
  progress: number;
  seen: number;
  total: number;
  onClick: () => void;
  ariaLabel: string;
  title: string;
}) {
  const size = RING_SIZE;
  const stroke = RING_STROKE;
  const radius = (size - stroke) / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = circumference * (1 - clamped);
  const label = Math.min(total, Math.max(0, seen));

  return (
    <button
      type="button"
      onClick={onClick}
      className="vault-list-progress-ring relative flex cursor-pointer items-center justify-center overflow-visible rounded-full bg-transparent p-0 transition hover:opacity-80"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={label}
      aria-label={ariaLabel}
      title={title}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 overflow-visible shrink-0"
        aria-hidden
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="#ffffff" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-ink-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-ink-800"
        />
      </svg>
      <span className="pointer-events-none absolute text-[8px] font-medium tabular-nums tracking-tight text-ink-500 leading-none">
        {label}
      </span>
    </button>
  );
}

function getVaultScrollRoot(): HTMLElement | Window {
  if (typeof document === "undefined") return window;
  if (isNativeApp()) {
    const el = document.querySelector(".native-screen__scroll");
    if (el instanceof HTMLElement) return el;
  }
  return window;
}

function scrollRootToTop(root: HTMLElement | Window) {
  if (root === window) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  root.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Iris ID news-media pattern: 40px ring, sticky at list column right edge,
 * hidden until the list scrolls under the header.
 */
export function VaultListProgressAnchor({
  listRef,
  total,
  itemCount,
  ariaLabel,
  title,
}: {
  listRef: React.RefObject<HTMLElement | null>;
  total: number;
  itemCount: number;
  ariaLabel: (seen: number, total: number) => string;
  title: (seen: number, total: number) => string;
}) {
  const [progress, setProgress] = useState(0);
  const [seen, setSeen] = useState(1);
  const [ringVisible, setRingVisible] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const updateProgress = () => {
      const list = listRef.current;
      if (!list || total <= 0) {
        setProgress(0);
        setSeen(0);
        setRingVisible(false);
        return;
      }

      const rect = list.getBoundingClientRect();
      const viewport = window.innerHeight;
      const headerOffset = 96;
      const scrolledIntoList = rect.top < headerOffset + 24;
      const stillInList = rect.bottom > headerOffset + 80;
      setRingVisible(scrolledIntoList && stillInList);
      if (!scrolledIntoList || !stillInList) return;

      const readingLine = Math.min(viewport * 0.35, headerOffset + 64);
      const nodes = Array.from(
        list.querySelectorAll<HTMLElement>("[data-vault-entry-index]"),
      ).filter((node) => node.getBoundingClientRect().height > 0);

      if (nodes.length === 0) {
        setSeen(1);
        setProgress(0);
        return;
      }

      let currentIndex = 0;
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i]!;
        if (node.getBoundingClientRect().top <= readingLine) {
          currentIndex = Number(node.dataset.vaultEntryIndex ?? i);
        } else {
          break;
        }
      }

      const active =
        nodes.find(
          (n) => Number(n.dataset.vaultEntryIndex ?? -1) === currentIndex,
        ) ?? nodes[Math.min(currentIndex, nodes.length - 1)];
      let fraction = 0;
      if (active) {
        const r = active.getBoundingClientRect();
        const h = Math.max(r.height, 1);
        fraction = Math.min(1, Math.max(0, (readingLine - r.top) / h));
      }

      const continuous = Math.min(
        1,
        Math.max(0, (currentIndex + fraction) / Math.max(total, 1)),
      );
      const displaySeen = Math.min(
        total,
        Math.max(0, Math.round(continuous * total)),
      );

      setSeen(Math.max(displaySeen, 1));
      setProgress(continuous);
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    const root = getVaultScrollRoot();
    root.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      root.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [listRef, itemCount, total]);

  const scrollToTop = useCallback(() => {
    scrollRootToTop(getVaultScrollRoot());
  }, []);

  if (total <= 0) return null;

  return (
    <div className="pointer-events-none absolute right-0 top-0 z-20 hidden h-full md:block">
      <div
        className={[
          "sticky top-24 flex justify-end pt-2 transition-opacity duration-150 ease-out",
          ringVisible ? "pointer-events-auto opacity-100" : "opacity-0",
        ].join(" ")}
      >
        {/* Flush to list/table right edge — same as Iris ID content column. */}
        <ListProgressRing
          progress={progress}
          seen={seen}
          total={total}
          onClick={scrollToTop}
          ariaLabel={ariaLabel(seen, total)}
          title={title(seen, total)}
        />
      </div>
    </div>
  );
}
