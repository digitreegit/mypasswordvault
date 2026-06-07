import {
  KEYBOARD_INSET_THRESHOLD_PX,
  readKeyboardInset,
  setKeyboardInsetPx,
} from "./keyboardInset";

export type KeyboardSessionState = {
  open: boolean;
  inset: number;
};

const listeners = new Set<(state: KeyboardSessionState) => void>();
let state: KeyboardSessionState = { open: false, inset: 0 };
let hideTimer: number | undefined;

function emit(): void {
  for (const listener of listeners) {
    listener(state);
  }
}

function patchState(next: Partial<KeyboardSessionState>): void {
  state = { ...state, ...next };
  emit();
}

export function getKeyboardSession(): KeyboardSessionState {
  return state;
}

export function subscribeKeyboardSession(
  listener: (state: KeyboardSessionState) => void,
): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

/** Keyboard opened (Capacitor or visualViewport). */
export function notifyKeyboardShow(height: number): void {
  window.clearTimeout(hideTimer);
  const inset =
    height > 0 ? height : Math.max(readKeyboardInset(), state.inset);
  if (inset > 0) setKeyboardInsetPx(inset);
  patchState({ open: true, inset: Math.max(inset, KEYBOARD_INSET_THRESHOLD_PX) });
}

/** Keyboard closed — only call from explicit hide events. */
export function notifyKeyboardHide(): void {
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    setKeyboardInsetPx(0);
    patchState({ open: false, inset: 0 });
  }, 80);
}

export function cancelPendingKeyboardHide(): void {
  window.clearTimeout(hideTimer);
}

/** Mobile web: derive open state from visualViewport without flicker. */
export function syncKeyboardSessionFromViewport(): void {
  const inset = readKeyboardInset();
  if (inset >= KEYBOARD_INSET_THRESHOLD_PX) {
    window.clearTimeout(hideTimer);
    setKeyboardInsetPx(inset);
    patchState({ open: true, inset });
    return;
  }
  if (!state.open) return;
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    const again = readKeyboardInset();
    if (again < KEYBOARD_INSET_THRESHOLD_PX) {
      setKeyboardInsetPx(0);
      patchState({ open: false, inset: 0 });
    }
  }, 280);
}
