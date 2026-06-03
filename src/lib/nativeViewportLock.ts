import { isNativeApp } from "./platform";

const SCROLL_SELECTOR =
  ".app-shell__panel, .native-screen__scroll, .native-scroll";

function isScrollable(el: Element): boolean {
  const node = el as HTMLElement;
  return node.scrollHeight > node.clientHeight + 1;
}

function canScrollVertically(el: Element, deltaY: number): boolean {
  const node = el as HTMLElement;
  if (!isScrollable(node)) return false;
  if (deltaY < 0) return node.scrollTop > 0;
  return node.scrollTop + node.clientHeight < node.scrollHeight - 1;
}

/** Stop WKWebView rubber-band when the gesture is not inside a scrollable panel. */
export function initNativeViewportLock(): void {
  if (!isNativeApp()) return;

  let startX = 0;
  let startY = 0;

  document.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      // Block horizontal pan everywhere on native (no sideways page drift).
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        return;
      }

      const scrollHost = (e.target as Element | null)?.closest(SCROLL_SELECTOR);
      if (!scrollHost) {
        e.preventDefault();
        return;
      }

      if (!canScrollVertically(scrollHost, dy)) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}
