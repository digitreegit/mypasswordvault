/** Shared keyboard inset + accessory bar geometry for native iOS and mobile web. */

export const KEYBOARD_ACCESSORY_GAP_PX = 8;
export const KEYBOARD_ACCESSORY_HEIGHT_PX = 44;
export const KEYBOARD_INSET_THRESHOLD_PX = 40;

export function readKeyboardInset(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--native-keyboard-inset",
  );
  const parsed = Number.parseFloat(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;

  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
}

export function keyboardAccessoryClearance(inset: number): number {
  if (inset < KEYBOARD_INSET_THRESHOLD_PX) return 0;
  return KEYBOARD_ACCESSORY_HEIGHT_PX + KEYBOARD_ACCESSORY_GAP_PX;
}

export function setKeyboardInsetPx(height: number): void {
  if (height > 0) {
    document.documentElement.style.setProperty(
      "--native-keyboard-inset",
      `${height}px`,
    );
  } else {
    document.documentElement.style.removeProperty("--native-keyboard-inset");
  }
}

/** Visible content band while the software keyboard (and pill bar) is open. */
export function getKeyboardAwareVisibleBand(padding = 20): {
  top: number;
  bottom: number;
} {
  const vv = window.visualViewport;
  const keyboardInset = readKeyboardInset();
  const vvKeyboard = vv
    ? Math.max(0, window.innerHeight - vv.offsetTop - vv.height)
    : 0;
  const accessory = keyboardAccessoryClearance(keyboardInset);
  const extraKeyboard = Math.max(0, keyboardInset - vvKeyboard);

  if (vv) {
    return {
      top: vv.offsetTop + padding,
      bottom: vv.offsetTop + vv.height - padding - accessory - extraKeyboard,
    };
  }

  const bottom =
    window.innerHeight - padding - accessory - Math.max(keyboardInset, vvKeyboard);
  return { top: padding, bottom };
}
