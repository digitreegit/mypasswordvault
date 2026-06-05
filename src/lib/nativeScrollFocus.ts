import { isNativeApp } from "./platform";

const SCROLL_ROOT_SELECTOR =
  ".native-screen__scroll, .setup-screen__body--fixed, .app-shell__panel";

const FOCUSABLE_SELECTOR = "input, textarea, select, [contenteditable='true']";

/** Scroll focused inputs into view after the native keyboard opens. */
export function initNativeScrollFocus(): void {
  if (!isNativeApp()) return;

  document.addEventListener("focusin", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches(FOCUSABLE_SELECTOR)) return;

    const scrollRoot = target.closest(SCROLL_ROOT_SELECTOR);
    if (!scrollRoot) return;

    window.setTimeout(() => {
      target.scrollIntoView({ block: "center", behavior: "auto" });
    }, 360);
  });
}
