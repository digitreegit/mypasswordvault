import { isNativeApp } from "./platform";

const SCROLL_SELECTOR =
  ".app-shell__panel, .native-screen__scroll, .native-scroll, .pricing-drawer-body, .setup-shell-scroll";

function isScrollable(el: Element): boolean {
  const node = el as HTMLElement;
  return node.scrollHeight > node.clientHeight + 1;
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

      const scrollHost = (e.target as Element | null)?.closest(SCROLL_SELECTOR);
      if (scrollHost && isScrollable(scrollHost)) {
        return;
      }

      // Block horizontal pan everywhere on native (no sideways page drift).
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
    },
    { passive: false }
  );
}
