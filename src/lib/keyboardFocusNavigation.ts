import { scrollFocusedFieldAboveKeyboard } from "./nativeScrollFocus";

export const KEYBOARD_SCROLL_ROOT_SELECTOR =
  ".native-screen__scroll, .setup-screen__body--fixed, .app-shell__panel, .setup-shell-scroll, .native-scroll, .mobile-entry-detail__scroll, .pricing-drawer-body, .native-launch__scroll";

export const KEYBOARD_FOCUSABLE_SELECTOR =
  "input:not([disabled]):not([type='hidden']), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [contenteditable='true']";

function isVisibleFocusable(el: HTMLElement): boolean {
  if (!el.matches(KEYBOARD_FOCUSABLE_SELECTOR)) return false;
  if (el.tabIndex < 0) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (el.getClientRects().length === 0) return false;
  return true;
}

export function getActiveScrollRoot(
  from?: HTMLElement | null,
): HTMLElement | null {
  const anchor =
    from ?? (document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null);
  if (!anchor) return null;
  return anchor.closest(KEYBOARD_SCROLL_ROOT_SELECTOR) as HTMLElement | null;
}

export function getFocusableFields(
  root?: HTMLElement | null,
): HTMLElement[] {
  const scope = root ?? document.body;
  return Array.from(
    scope.querySelectorAll<HTMLElement>(KEYBOARD_FOCUSABLE_SELECTOR),
  ).filter(isVisibleFocusable);
}

export function isKeyboardFocusableTarget(
  el: EventTarget | null,
): el is HTMLElement {
  return el instanceof HTMLElement && isVisibleFocusable(el);
}

export function focusAdjacentField(direction: "prev" | "next"): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !isVisibleFocusable(active)) {
    return false;
  }

  const scrollRoot = getActiveScrollRoot(active);
  const fields = getFocusableFields(scrollRoot);
  const index = fields.indexOf(active);
  if (index < 0) return false;

  const nextIndex = direction === "next" ? index + 1 : index - 1;
  const target = fields[nextIndex];
  if (!target) return false;

  target.focus();
  scrollFocusedFieldAboveKeyboard(target, scrollRoot);
  return true;
}
