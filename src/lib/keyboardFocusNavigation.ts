import { scrollFocusedFieldAboveKeyboard } from "./nativeScrollFocus";

export const KEYBOARD_SCROLL_ROOT_SELECTOR =
  ".native-screen__scroll, .setup-screen__body--fixed, .app-shell__panel, .setup-shell-scroll, .native-scroll, .keyboard-scroll-root, .mobile-entry-detail__scroll, .pricing-drawer-body, .native-launch__scroll";

function isOverflowScrollContainer(el: HTMLElement): boolean {
  const { overflowY } = window.getComputedStyle(el);
  return (
    overflowY === "auto" ||
    overflowY === "scroll" ||
    overflowY === "overlay"
  );
}

/** Nearest scroll root for keyboard avoidance (explicit class, then overflow-y container). */
export function findKeyboardScrollRoot(
  target: HTMLElement,
): HTMLElement | null {
  const explicit = target.closest(
    KEYBOARD_SCROLL_ROOT_SELECTOR,
  ) as HTMLElement | null;
  if (explicit) return explicit;

  let el: HTMLElement | null = target.parentElement;
  let fallback: HTMLElement | null = null;
  while (el && el !== document.documentElement) {
    if (el.classList.contains("keyboard-scroll-root")) return el;
    if (isOverflowScrollContainer(el)) fallback = el;
    el = el.parentElement;
  }
  return fallback;
}

/** All interactive fields within a scroll root (inputs, selects, buttons, etc.). */
export const KEYBOARD_FOCUSABLE_SELECTOR =
  "input:not([disabled]):not([type='hidden']), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [contenteditable='true']";

let lastKeyboardField: HTMLElement | null = null;
let keyboardNavLock = false;
let keyboardNavLockTimer: number | undefined;

export function isKeyboardNavLocked(): boolean {
  return keyboardNavLock;
}

export function withKeyboardNavLock(run: () => void): void {
  window.clearTimeout(keyboardNavLockTimer);
  keyboardNavLock = true;
  run();
  window.requestAnimationFrame(() => {
    keyboardNavLock = false;
  });
  keyboardNavLockTimer = window.setTimeout(() => {
    keyboardNavLock = false;
  }, 400);
}

function focusFieldKeepingKeyboard(target: HTMLElement): void {
  target.focus({ preventScroll: true });
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    try {
      const len = target.value.length;
      if (target.type !== "number" && typeof target.setSelectionRange === "function") {
        target.setSelectionRange(len, len);
      }
    } catch {
      /* read-only or unsupported type */
    }
  }
}

export function getLastKeyboardField(): HTMLElement | null {
  return lastKeyboardField;
}

export function setLastKeyboardField(el: HTMLElement | null): void {
  lastKeyboardField = el;
}

function isVisibleFocusable(el: HTMLElement): boolean {
  if (!el.matches(KEYBOARD_FOCUSABLE_SELECTOR)) return false;
  if (el.closest(".keyboard-accessory-bar")) return false;
  if (el.tabIndex < 0) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
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
  return findKeyboardScrollRoot(anchor);
}

export function getFocusableFields(
  root?: HTMLElement | null,
): HTMLElement[] {
  const scope = root ?? document.body;
  const fields = Array.from(
    scope.querySelectorAll<HTMLElement>(KEYBOARD_FOCUSABLE_SELECTOR),
  ).filter(isVisibleFocusable);

  return fields.sort((a, b) => {
    const aTab = a.tabIndex > 0 ? a.tabIndex : 0;
    const bTab = b.tabIndex > 0 ? b.tabIndex : 0;
    if (aTab !== bTab) return aTab - bTab;
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

export function isKeyboardFocusableTarget(
  el: EventTarget | null,
): el is HTMLElement {
  return el instanceof HTMLElement && isVisibleFocusable(el);
}

export function focusAdjacentField(
  direction: "prev" | "next",
  from?: HTMLElement | null,
): boolean {
  return focusAdjacentFieldInternal(direction, from);
}

function focusAdjacentFieldInternal(
  direction: "prev" | "next",
  from?: HTMLElement | null,
): boolean {
  const active =
    from ??
    (document.activeElement instanceof HTMLElement &&
    isVisibleFocusable(document.activeElement)
      ? document.activeElement
      : lastKeyboardField);
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

  lastKeyboardField = target;
  focusFieldKeepingKeyboard(target);

  if (document.activeElement !== target) {
    focusFieldKeepingKeyboard(target);
  }

  scrollFocusedFieldAboveKeyboard(target, scrollRoot);
  window.requestAnimationFrame(() => {
    focusFieldKeepingKeyboard(target);
    scrollFocusedFieldAboveKeyboard(target, scrollRoot);
  });
  window.setTimeout(() => {
    scrollFocusedFieldAboveKeyboard(target, scrollRoot);
  }, 80);
  return true;
}

export function focusAdjacentFieldWithLock(
  direction: "prev" | "next",
  from?: HTMLElement | null,
): boolean {
  let moved = false;
  withKeyboardNavLock(() => {
    moved = focusAdjacentFieldInternal(direction, from);
  });
  return moved;
}
