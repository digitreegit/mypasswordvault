import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { isNativeApp } from "./platform";

let initialized = false;

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
  pinDocumentScroll();
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
    await Keyboard.addListener("keyboardWillShow", () => {
      syncVisualViewportVars();
      pinDocumentScroll();
    });
    await Keyboard.addListener("keyboardDidShow", () => {
      syncVisualViewportVars();
      pinDocumentScroll();
    });
    await Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.removeProperty("--native-vv-offset-top");
      document.documentElement.style.removeProperty("--native-vv-height");
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

  let removeShow: (() => void) | undefined;
  let removeHide: (() => void) | undefined;
  let removeVv = () => undefined;

  const vv = window.visualViewport;
  if (vv) {
    const onVv = () => syncVisualViewportVars();
    vv.addEventListener("resize", onVv);
    vv.addEventListener("scroll", onVv);
    removeVv = () => {
      vv.removeEventListener("resize", onVv);
      vv.removeEventListener("scroll", onVv);
    };
  }

  void Keyboard.addListener("keyboardWillShow", (info) => {
    onChange(info.keyboardHeight);
    syncVisualViewportVars();
    pinDocumentScroll();
  }).then((h) => {
    removeShow = () => void h.remove();
  });

  void Keyboard.addListener("keyboardWillHide", () => {
    onChange(0);
    syncVisualViewportVars();
    pinDocumentScroll();
  }).then((h) => {
    removeHide = () => void h.remove();
  });

  return () => {
    removeShow?.();
    removeHide?.();
    removeVv();
  };
}
