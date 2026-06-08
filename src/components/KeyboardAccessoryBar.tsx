import React, { useCallback, useEffect, useState } from "react";
import { Keyboard } from "@capacitor/keyboard";
import { Check, ChevronDown, ChevronUp } from "./Icons";
import { detectBrowserLocale } from "../lib/i18n/locale";
import { translate } from "../lib/i18n/bundles";
import {
  focusAdjacentFieldWithLock,
  getActiveScrollRoot,
  getFocusableFields,
  getLastKeyboardField,
  isKeyboardFocusableTarget,
  isKeyboardNavLocked,
  setLastKeyboardField,
} from "../lib/keyboardFocusNavigation";
import { readKeyboardInset, setKeyboardInsetPx } from "../lib/keyboardInset";
import {
  getKeyboardSession,
  notifyKeyboardHide,
  subscribeKeyboardSession,
  syncKeyboardSessionFromViewport,
} from "../lib/keyboardSession";
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

function fieldNavState(from: HTMLElement | null): {
  hasPrev: boolean;
  hasNext: boolean;
} {
  if (!from || !isKeyboardFocusableTarget(from)) {
    return { hasPrev: false, hasNext: false };
  }
  const scrollRoot = getActiveScrollRoot(from);
  const fields = getFocusableFields(scrollRoot);
  const index = fields.indexOf(from);
  return {
    hasPrev: index > 0,
    hasNext: index >= 0 && index < fields.length - 1,
  };
}

function resolveActiveField(): HTMLElement | null {
  const active = document.activeElement;
  if (active instanceof HTMLElement && isKeyboardFocusableTarget(active)) {
    return active;
  }
  return getLastKeyboardField();
}

/** iOS-style floating toolbar above the software keyboard (mobile + native). */
export function KeyboardAccessoryBar() {
  const enabled = useKeyboardAccessoryEnabled();
  const locale = detectBrowserLocale();
  const t = (key: string) => translate(locale, key);
  const [keyboardOpen, setKeyboardOpen] = useState(
    () => getKeyboardSession().open,
  );
  const [navState, setNavState] = useState(() => {
    const field = resolveActiveField();
    return { ...fieldNavState(field), field };
  });
  const [editingField, setEditingField] = useState(() => {
    const active = document.activeElement;
    return (
      active instanceof HTMLElement && isKeyboardFocusableTarget(active)
    );
  });

  const refreshNavState = useCallback(() => {
    const field = resolveActiveField();
    if (field) setLastKeyboardField(field);
    setNavState({ ...fieldNavState(field), field });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const unsubSession = subscribeKeyboardSession(({ open }) => {
      setKeyboardOpen(open);
    });

    if (!isNativeApp()) {
      const sync = () => {
        syncKeyboardSessionFromViewport();
        setKeyboardInsetPx(readKeyboardInset());
      };
      sync();
      const vv = window.visualViewport;
      vv?.addEventListener("resize", sync);
      vv?.addEventListener("scroll", sync);
      window.addEventListener("focusin", sync);
      return () => {
        vv?.removeEventListener("resize", sync);
        vv?.removeEventListener("scroll", sync);
        window.removeEventListener("focusin", sync);
        unsubSession();
        setKeyboardInsetPx(0);
      };
    }

    return unsubSession;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const refreshEditingField = () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        setEditingField(
          active instanceof HTMLElement && isKeyboardFocusableTarget(active),
        );
      }, 0);
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (target instanceof HTMLElement && isKeyboardFocusableTarget(target)) {
        setLastKeyboardField(target);
        setEditingField(true);
      }
      refreshNavState();
      if (!isNativeApp()) syncKeyboardSessionFromViewport();
    };

    const onFocusOut = () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        const stillEditing =
          active instanceof HTMLElement && isKeyboardFocusableTarget(active);
        setEditingField(stillEditing);
        refreshNavState();
        if (!stillEditing && !isNativeApp() && !isKeyboardNavLocked()) {
          notifyKeyboardHide();
        }
      }, 120);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    refreshNavState();
    refreshEditingField();
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [enabled, refreshNavState]);

  const visible =
    enabled &&
    keyboardOpen &&
    (editingField || isKeyboardNavLocked());

  const runNav = (direction: "prev" | "next") => {
    const from = getLastKeyboardField() ?? navState.field;
    if (!from) return;
    focusAdjacentFieldWithLock(direction, from);
    window.setTimeout(refreshNavState, 0);
    window.setTimeout(refreshNavState, 120);
    window.setTimeout(refreshNavState, 320);
  };

  const stopToolbarFocus = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDone = async () => {
    setLastKeyboardField(null);
    setEditingField(false);
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    if (isNativeApp()) {
      try {
        await Keyboard.hide();
      } catch {
        /* plugin missing */
      }
    } else {
      notifyKeyboardHide();
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
        <div
          role="button"
          tabIndex={-1}
          aria-disabled={!navState.hasPrev}
          aria-label={t("keyboard.previousField")}
          className={`keyboard-accessory-bar__nav-btn${navState.hasPrev ? "" : " keyboard-accessory-bar__nav-btn--disabled"}`}
          onTouchStart={(e) => {
            stopToolbarFocus(e);
            if (navState.hasPrev) runNav("prev");
          }}
          onMouseDown={(e) => {
            stopToolbarFocus(e);
            if (navState.hasPrev) runNav("prev");
          }}
        >
          <ChevronUp aria-hidden />
        </div>
        <div
          role="button"
          tabIndex={-1}
          aria-disabled={!navState.hasNext}
          aria-label={t("keyboard.nextField")}
          className={`keyboard-accessory-bar__nav-btn${navState.hasNext ? "" : " keyboard-accessory-bar__nav-btn--disabled"}`}
          onTouchStart={(e) => {
            stopToolbarFocus(e);
            if (navState.hasNext) runNav("next");
          }}
          onMouseDown={(e) => {
            stopToolbarFocus(e);
            if (navState.hasNext) runNav("next");
          }}
        >
          <ChevronDown aria-hidden />
        </div>
      </div>
      <div
        role="button"
        tabIndex={-1}
        aria-label={t("keyboard.done")}
        className="keyboard-accessory-bar__done"
        onTouchStart={stopToolbarFocus}
        onMouseDown={stopToolbarFocus}
        onClick={() => void onDone()}
      >
        <Check aria-hidden strokeWidth={2.5} />
      </div>
    </div>
  );
}
