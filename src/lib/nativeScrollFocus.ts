import { getKeyboardAwareVisibleBand } from "./keyboardInset";
import { KEYBOARD_SCROLL_ROOT_SELECTOR } from "./keyboardFocusNavigation";
import { isNativeApp } from "./platform";

const FOCUSABLE_SELECTOR = "input, textarea, select, [contenteditable='true']";

let focusedField: HTMLElement | null = null;

function isKeyboardScrollEnabled(): boolean {
  return isNativeApp() || window.matchMedia("(max-width: 767px)").matches;
}

/** Keep the focused field visible above the iOS keyboard (visualViewport-aware). */
export function scrollFocusedFieldAboveKeyboard(
  target: HTMLElement,
  scrollRoot?: HTMLElement | null,
): void {
  const root =
    scrollRoot ??
    (target.closest(KEYBOARD_SCROLL_ROOT_SELECTOR) as HTMLElement | null);

  const align = () => {
    const { top: visibleTop, bottom: visibleBottom } =
      getKeyboardAwareVisibleBand(20);
    const rect = target.getBoundingClientRect();

    if (root) {
      if (rect.bottom > visibleBottom) {
        root.scrollTop += rect.bottom - visibleBottom;
      } else if (rect.top < visibleTop) {
        root.scrollTop += rect.top - visibleTop;
      }
      return;
    }

    if (rect.bottom > visibleBottom || rect.top < visibleTop) {
      target.scrollIntoView({ block: "nearest", behavior: "auto" });
    }
  };

  align();
  window.requestAnimationFrame(align);
  window.setTimeout(align, 50);
  window.setTimeout(align, 150);
  window.setTimeout(align, 360);
}

export function reflowFocusedFieldScroll(): void {
  if (focusedField) {
    scrollFocusedFieldAboveKeyboard(focusedField);
  }
}

/** Scroll focused inputs into view after the native keyboard opens. */
export function initNativeScrollFocus(): void {
  document.addEventListener("focusin", (e) => {
    if (!isKeyboardScrollEnabled()) return;

    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches(FOCUSABLE_SELECTOR)) return;

    const scrollRoot = target.closest(
      KEYBOARD_SCROLL_ROOT_SELECTOR,
    ) as HTMLElement | null;

    focusedField = target;
    scrollFocusedFieldAboveKeyboard(target, scrollRoot);
  });

  document.addEventListener("focusout", (e) => {
    const target = e.target;
    if (target === focusedField) {
      focusedField = null;
    }
  });

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener("resize", reflowFocusedFieldScroll);
    vv.addEventListener("scroll", reflowFocusedFieldScroll);
  }
}
