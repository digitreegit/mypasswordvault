import { isNativeApp } from "./platform";

const SCROLL_SELECTOR =
  ".app-shell__panel, .native-screen__scroll, .native-scroll, .keyboard-scroll-root, .mobile-entry-detail__scroll, .setup-screen__body--fixed, .pricing-drawer-body, .setup-shell-scroll";

const HORIZONTAL_SCROLL_SELECTOR = ".native-onboard__scroller";
const SWIPE_ROW_SELECTOR = ".mobile-swipe-row";
const TOUCH_REORDER_HANDLE_SELECTOR = ".touch-reorder-handle";
const TOUCH_REORDER_ACTIVE_CLASS = "touch-reorder-active";

function isScrollable(el: Element): boolean {
  const node = el as HTMLElement;
  return node.scrollHeight > node.clientHeight + 1;
}

function isHorizontallyScrollable(el: Element): boolean {
  const node = el as HTMLElement;
  return node.scrollWidth > node.clientWidth + 1;
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

      const target = e.target as Element | null;

      if (document.documentElement.classList.contains(TOUCH_REORDER_ACTIVE_CLASS)) {
        return;
      }

      if (target?.closest(TOUCH_REORDER_HANDLE_SELECTOR)) {
        return;
      }

      const horizontalHost = target?.closest(HORIZONTAL_SCROLL_SELECTOR);
      if (
        horizontalHost &&
        isHorizontallyScrollable(horizontalHost) &&
        Math.abs(dx) > Math.abs(dy)
      ) {
        return;
      }

      if (target?.closest(SWIPE_ROW_SELECTOR) && Math.abs(dx) > Math.abs(dy)) {
        return;
      }

      const scrollHost = target?.closest(SCROLL_SELECTOR);
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
