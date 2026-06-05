import React, { useCallback, useEffect, useState } from "react";
import { Keyboard } from "@capacitor/keyboard";
import { Check, ChevronDown, ChevronUp } from "./Icons";
import { detectBrowserLocale } from "../lib/i18n/locale";
import { translate } from "../lib/i18n/bundles";
import {
  focusAdjacentField,
  getActiveScrollRoot,
  getFocusableFields,
  isKeyboardFocusableTarget,
} from "../lib/keyboardFocusNavigation";
import {
  KEYBOARD_INSET_THRESHOLD_PX,
  readKeyboardInset,
  setKeyboardInsetPx,
} from "../lib/keyboardInset";
import { subscribeNativeKeyboardInsets } from "../lib/initNativeKeyboard";
import { isNativeApp } from "../lib/platform";

function useKeyboardAccessoryEnabled(): boolean {
  const [enabled, setEnabled] = useState(
    () => isNativeApp() || window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    if (isNativeApp()) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setEnabled(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return enabled;
}

function useKeyboardInset(enabled: boolean): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setInset(0);
      return;
    }

    const sync = () => setInset(readKeyboardInset());

    sync();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("focusin", sync);
    window.addEventListener("focusout", sync);

    const removeNative = isNativeApp()
      ? subscribeNativeKeyboardInsets((height) => {
          setInset(height > 0 ? height : readKeyboardInset());
        })
      : undefined;

    if (!isNativeApp()) {
      const syncVar = () => {
        const height = readKeyboardInset();
        setKeyboardInsetPx(height);
        sync();
      };
      vv?.addEventListener("resize", syncVar);
      vv?.addEventListener("scroll", syncVar);
      syncVar();
      return () => {
        vv?.removeEventListener("resize", sync);
        vv?.removeEventListener("scroll", sync);
        vv?.removeEventListener("resize", syncVar);
        vv?.removeEventListener("scroll", syncVar);
        window.removeEventListener("focusin", sync);
        window.removeEventListener("focusout", sync);
        removeNative?.();
        setKeyboardInsetPx(0);
      };
    }

    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("focusin", sync);
      window.removeEventListener("focusout", sync);
      removeNative?.();
    };
  }, [enabled]);

  return inset;
}

function useFocusedFieldState(enabled: boolean): {
  focused: boolean;
  hasPrev: boolean;
  hasNext: boolean;
} {
  const [state, setState] = useState({
    focused: false,
    hasPrev: false,
    hasNext: false,
  });

  const refresh = useCallback(() => {
    if (!enabled) {
      setState({ focused: false, hasPrev: false, hasNext: false });
      return;
    }

    const active = document.activeElement;
    if (!isKeyboardFocusableTarget(active)) {
      setState({ focused: false, hasPrev: false, hasNext: false });
      return;
    }

    const scrollRoot = getActiveScrollRoot(active);
    const fields = getFocusableFields(scrollRoot);
    const index = fields.indexOf(active);
    setState({
      focused: true,
      hasPrev: index > 0,
      hasNext: index >= 0 && index < fields.length - 1,
    });
  }, [enabled]);

  useEffect(() => {
    refresh();
    document.addEventListener("focusin", refresh);
    document.addEventListener("focusout", refresh);
    return () => {
      document.removeEventListener("focusin", refresh);
      document.removeEventListener("focusout", refresh);
    };
  }, [refresh]);

  return state;
}

/** iOS-style floating toolbar above the software keyboard (mobile + native). */
export function KeyboardAccessoryBar() {
  const enabled = useKeyboardAccessoryEnabled();
  const keyboardInset = useKeyboardInset(enabled);
  const { focused, hasPrev, hasNext } = useFocusedFieldState(enabled);
  const locale = detectBrowserLocale();
  const t = (key: string) => translate(locale, key);

  const visible =
    enabled &&
    keyboardInset >= KEYBOARD_INSET_THRESHOLD_PX &&
    focused;

  const keepFocus = (e: React.PointerEvent) => {
    e.preventDefault();
  };

  const onPrevious = () => {
    focusAdjacentField("prev");
  };

  const onNext = () => {
    focusAdjacentField("next");
  };

  const onDone = async () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    if (isNativeApp()) {
      try {
        await Keyboard.hide();
      } catch {
        /* plugin missing */
      }
    }
  };

  if (!visible) return null;

  return (
    <div
      className="keyboard-accessory-bar"
      role="toolbar"
      aria-label={t("keyboard.toolbarAria")}
    >
      <div className="keyboard-accessory-bar__nav">
        <button
          type="button"
          className="keyboard-accessory-bar__nav-btn"
          aria-label={t("keyboard.previousField")}
          disabled={!hasPrev}
          onPointerDown={keepFocus}
          onClick={onPrevious}
        >
          <ChevronUp width={18} height={18} aria-hidden />
        </button>
        <button
          type="button"
          className="keyboard-accessory-bar__nav-btn"
          aria-label={t("keyboard.nextField")}
          disabled={!hasNext}
          onPointerDown={keepFocus}
          onClick={onNext}
        >
          <ChevronDown width={18} height={18} aria-hidden />
        </button>
      </div>
      <button
        type="button"
        className="keyboard-accessory-bar__done"
        aria-label={t("keyboard.done")}
        onPointerDown={keepFocus}
        onClick={() => void onDone()}
      >
        <Check width={18} height={18} aria-hidden strokeWidth={2.5} />
      </button>
    </div>
  );
}
