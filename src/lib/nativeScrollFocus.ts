import { getKeyboardAwareVisibleBand } from "./keyboardInset";
import {
  findKeyboardScrollRoot,
  isKeyboardFocusableTarget,
  isKeyboardNavLocked,
  setLastKeyboardField,
} from "./keyboardFocusNavigation";
import { subscribeKeyboardSession } from "./keyboardSession";
import { isNativeApp } from "./platform";

let focusedField: HTMLElement | null = null;

function isKeyboardScrollEnabled(): boolean {
  return isNativeApp() || window.matchMedia("(max-width: 767px)").matches;
}

/** Keep the focused field visible above the iOS keyboard (visualViewport-aware). */
export function scrollFocusedFieldAboveKeyboard(
  target: HTMLElement,
  scrollRoot?: HTMLElement | null,
): void {
  const root = scrollRoot ?? findKeyboardScrollRoot(target);

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
    if (!isKeyboardFocusableTarget(target)) return;

    focusedField = target;
    setLastKeyboardField(target);
    scrollFocusedFieldAboveKeyboard(target, findKeyboardScrollRoot(target));
  });

  document.addEventListener("focusout", (e) => {
    if (isKeyboardNavLocked()) return;
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

  subscribeKeyboardSession(({ open }) => {
    if (!open) return;
    reflowFocusedFieldScroll();
    window.requestAnimationFrame(reflowFocusedFieldScroll);
    window.setTimeout(reflowFocusedFieldScroll, 100);
    window.setTimeout(reflowFocusedFieldScroll, 350);
  });
}
