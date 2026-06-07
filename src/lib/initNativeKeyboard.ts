import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { isKeyboardNavLocked } from "./keyboardFocusNavigation";
import {
  cancelPendingKeyboardHide,
  notifyKeyboardHide,
  notifyKeyboardShow,
} from "./keyboardSession";
import { setKeyboardInsetPx } from "./keyboardInset";
import { reflowFocusedFieldScroll } from "./nativeScrollFocus";
import { isNativeApp } from "./platform";

let initialized = false;
let pluginKeyboardHeight = 0;

/** Pin the document — iOS WKWebView shifts scroll offset when the keyboard opens. */
function pinDocumentScroll(): void {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function syncVisualViewportVars(): void {
  const vv = window.visualViewport;
  if (!vv) return;
  document.documentElement.style.setProperty(
    "--native-vv-offset-top",
    `${vv.offsetTop}px`,
  );
  document.documentElement.style.setProperty(
    "--native-vv-height",
    `${vv.height}px`,
  );
  const vvKeyboardInset = Math.max(
    0,
    window.innerHeight - vv.offsetTop - vv.height,
  );
  setKeyboardInsetPx(Math.max(vvKeyboardInset, pluginKeyboardHeight));
  if (Math.max(vvKeyboardInset, pluginKeyboardHeight) >= 40) {
    notifyKeyboardShow(Math.max(vvKeyboardInset, pluginKeyboardHeight));
  }
  pinDocumentScroll();
  reflowFocusedFieldScroll();
}

/**
 * Disable WebView resize/scroll on keyboard and compensate visualViewport pan.
 * Requires `@capacitor/keyboard` in the iOS Podfile (`npm run cap:sync`).
 */
export async function initNativeKeyboard(): Promise<void> {
  if (!isNativeApp() || initialized) return;
  initialized = true;

  syncVisualViewportVars();

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.None });
    await Keyboard.setScroll({ isDisabled: true });
  } catch (e) {
    console.error(
      "Keyboard plugin unavailable — run npm run cap:sync so CapacitorKeyboard is linked in Xcode",
      e,
    );
  }

  pinDocumentScroll();

  const vv = window.visualViewport;
  vv?.addEventListener("resize", syncVisualViewportVars);
  vv?.addEventListener("scroll", syncVisualViewportVars);

  try {
    await Keyboard.addListener("keyboardWillShow", (info) => {
      pluginKeyboardHeight = info.keyboardHeight;
      notifyKeyboardShow(info.keyboardHeight);
      syncVisualViewportVars();
      pinDocumentScroll();
    });
    await Keyboard.addListener("keyboardDidShow", (info) => {
      pluginKeyboardHeight = info.keyboardHeight;
      notifyKeyboardShow(info.keyboardHeight);
      syncVisualViewportVars();
      pinDocumentScroll();
    });
    await Keyboard.addListener("keyboardWillHide", () => {
      if (isKeyboardNavLocked()) {
        cancelPendingKeyboardHide();
        return;
      }
      pluginKeyboardHeight = 0;
      document.documentElement.style.removeProperty("--native-vv-offset-top");
      document.documentElement.style.removeProperty("--native-vv-height");
      notifyKeyboardHide();
      pinDocumentScroll();
    });
  } catch {
    /* plugin missing */
  }
}

export function subscribeNativeKeyboardInsets(
  onChange: (keyboardHeight: number) => void,
): () => void {
  if (!isNativeApp()) return () => undefined;

  const removers: Array<() => void> = [];

  const vv = window.visualViewport;
  if (vv) {
    const onVv = () => {
      syncVisualViewportVars();
      onChange(readKeyboardInsetFromDom());
    };
    vv.addEventListener("resize", onVv);
    vv.addEventListener("scroll", onVv);
    removers.push(() => {
      vv.removeEventListener("resize", onVv);
      vv.removeEventListener("scroll", onVv);
    });
  }

  void Keyboard.addListener("keyboardWillShow", (info) => {
    pluginKeyboardHeight = info.keyboardHeight;
    notifyKeyboardShow(info.keyboardHeight);
    syncVisualViewportVars();
    pinDocumentScroll();
  }).then((h) => {
    removers.push(() => void h.remove());
  });

  void Keyboard.addListener("keyboardDidShow", (info) => {
    pluginKeyboardHeight = info.keyboardHeight;
    notifyKeyboardShow(info.keyboardHeight);
    syncVisualViewportVars();
    pinDocumentScroll();
  }).then((h) => {
    removers.push(() => void h.remove());
  });

  void Keyboard.addListener("keyboardWillHide", () => {
    if (isKeyboardNavLocked()) {
      cancelPendingKeyboardHide();
      return;
    }
    pluginKeyboardHeight = 0;
    notifyKeyboardHide();
    syncVisualViewportVars();
    pinDocumentScroll();
  }).then((h) => {
    removers.push(() => void h.remove());
  });

  return () => {
    removers.forEach((remove) => remove());
  };
}

function readKeyboardInsetFromDom(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--native-keyboard-inset",
  );
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
