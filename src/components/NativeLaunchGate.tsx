import React, { useCallback, useEffect, useRef, useState } from "react";
import gs01 from "../assets/onboarding/gs01.png";
import gs02 from "../assets/onboarding/gs02.png";
import gs03 from "../assets/onboarding/gs03.png";
import gs04 from "../assets/onboarding/gs04.png";
import { translate } from "../lib/i18n/bundles";
import {
  detectBrowserLocale,
  normalizeLocale,
  readStoredLocale,
  type Locale,
} from "../lib/i18n/locale";
import { subscribeLocaleChanged } from "../lib/appLocale";
import { nativeScreenRootClass } from "../lib/nativeLayout";
import { isNativeApp } from "../lib/platform";
import { BrandSplashSymbol } from "./BrandSplashSymbol";

type LaunchPhase = "splash" | "intro" | "done";

const SPLASH_AUTO_MS = 1800;
const ONBOARDING_PAGE_COUNT = 4;

const ONBOARDING_ART = [gs01, gs02, gs03, gs04] as const;

/** Top illustration band background per slide (bottom stays white). */
const ONBOARDING_ART_BG = ["#fdf7e9", "#f7fae5", "#eef5fd", "#eee3fb"] as const;

const ONBOARDING_PAGES: {
  titleKey: string;
  bodyKey: string;
}[] = [
  {
    titleKey: "launch.onboard1Title",
    bodyKey: "launch.onboard1Body",
  },
  {
    titleKey: "launch.onboard2Title",
    bodyKey: "launch.onboard2Body",
  },
  {
    titleKey: "launch.onboard3Title",
    bodyKey: "launch.onboard3Body",
  },
  {
    titleKey: "launch.onboard4Title",
    bodyKey: "launch.onboard4Body",
  },
];

function useLaunchLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(
    () => readStoredLocale() ?? normalizeLocale(detectBrowserLocale()),
  );
  useEffect(() => subscribeLocaleChanged(setLocale), []);
  return locale;
}

function OnboardingArt({ src, label }: { src: string; label: string }) {
  return (
    <div className="native-onboard__art w-full" role="img" aria-label={label}>
      <img
        src={src}
        alt=""
        className="block h-auto w-full select-none"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

function NativeSplashScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div
      className={nativeScreenRootClass(
        "native-launch native-launch--splash items-center justify-center bg-white",
      )}
      role="presentation"
      onClick={onContinue}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onContinue();
      }}
    >
      <BrandSplashSymbol aria-label="My Password Vault" />
    </div>
  );
}

function OnboardingDot({
  active,
  index,
  onSelect,
}: {
  active: boolean;
  index: number;
  onSelect: (index: number) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={`${index + 1} / ${ONBOARDING_PAGE_COUNT}`}
      className={[
        "flex h-2 items-center justify-center",
        active ? "w-6" : "w-2",
      ].join(" ")}
      onClick={() => onSelect(index)}
    >
      <span
        className={[
          "block h-2 rounded-full transition-all duration-200",
          active ? "w-6 bg-ink-500" : "w-2 bg-ink-200",
        ].join(" ")}
      />
    </button>
  );
}

function NativeGettingStartedScreen({
  onContinue,
  t,
}: {
  onContinue: () => void;
  t: (key: string) => string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const activePageRef = useRef(0);
  const touchStartXRef = useRef(0);
  const isLastPage = activePage === ONBOARDING_PAGE_COUNT - 1;

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  const scrollToPage = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth <= 0) return;
    const clamped = Math.min(Math.max(index, 0), ONBOARDING_PAGE_COUNT - 1);
    el.scrollTo({ left: clamped * el.clientWidth, behavior });
    setActivePage(clamped);
  }, []);

  const syncActivePageFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth <= 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActivePage(Math.min(Math.max(index, 0), ONBOARDING_PAGE_COUNT - 1));
  }, []);

  const snapToNearestPage = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth <= 0) return;
    scrollToPage(Math.round(el.scrollLeft / el.clientWidth));
  }, [scrollToPage]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      syncActivePageFromScroll();
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(snapToNearestPage, 80);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", snapToNearestPage);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", snapToNearestPage);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [syncActivePageFromScroll, snapToNearestPage]);

  const onScrollerTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    scrollToPage(activePageRef.current, "auto");
  };

  const onScrollerTouchEnd = (e: React.TouchEvent) => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth <= 0) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartXRef.current;
    const threshold = Math.max(36, el.clientWidth * 0.12);
    let page = activePageRef.current;
    if (dx <= -threshold) {
      page = Math.min(page + 1, ONBOARDING_PAGE_COUNT - 1);
    } else if (dx >= threshold) {
      page = Math.max(page - 1, 0);
    }
    scrollToPage(page);
  };

  return (
    <div
      className={nativeScreenRootClass(
        "native-launch native-launch--intro bg-white text-ink-900 font-sans",
      )}
    >
      <div className="native-onboard flex flex-1 flex-col min-h-0">
        <div
          ref={scrollerRef}
          className="native-onboard__scroller flex flex-1 min-h-0 min-w-0 overflow-x-auto overflow-y-hidden snap-x snap-mandatory"
          aria-roledescription="carousel"
          aria-label={t("launch.onboardCarouselAria")}
          onTouchStart={onScrollerTouchStart}
          onTouchEnd={onScrollerTouchEnd}
          onTouchCancel={onScrollerTouchEnd}
        >
          {ONBOARDING_PAGES.map((page, index) => (
            <section
              key={page.titleKey}
              className="native-onboard__slide flex shrink-0 snap-start snap-always flex-col bg-white min-h-full"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${ONBOARDING_PAGE_COUNT}`}
            >
              <div
                className="native-onboard__art-band w-full shrink-0 px-6"
                style={{ backgroundColor: ONBOARDING_ART_BG[index] }}
              >
                <OnboardingArt
                  src={ONBOARDING_ART[index]}
                  label={t(`launch.onboard${index + 1}ArtLabel`)}
                />
              </div>
              <div className="native-onboard__copy flex flex-1 flex-col bg-white px-6 pt-8 pb-4">
                <h2 className="native-onboard__title text-center">
                  {t(page.titleKey)}
                </h2>
                <p className="native-onboard__body mt-4 text-center max-w-md mx-auto">
                  {t(page.bodyKey)}
                </p>
              </div>
            </section>
          ))}
        </div>

        <footer className="native-onboard__footer shrink-0 bg-white px-6 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div
            className="native-onboard__dots flex items-center justify-center"
            role="tablist"
            aria-label={t("launch.onboardDotsAria")}
          >
            {ONBOARDING_PAGES.map((page, index) => (
              <OnboardingDot
                key={page.titleKey}
                active={activePage === index}
                index={index}
                onSelect={scrollToPage}
              />
            ))}
          </div>

          <div className="mt-4 w-full min-h-[3rem] flex flex-col items-stretch justify-start">
            {isLastPage ? (
              <button
                type="button"
                className="btn-primary w-full"
                onClick={onContinue}
              >
                {t("launch.getStarted")}
              </button>
            ) : (
              <button
                type="button"
                className="text-sm font-medium text-ink-500 hover:text-ink-800 transition-colors px-3 py-1 self-center"
                onClick={onContinue}
              >
                {t("launch.skip")}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function withSignUpAuthView(children: React.ReactNode): React.ReactNode {
  if (!React.isValidElement(children)) return children;
  return React.cloneElement(children, {
    initialAuthView: "signup",
  } as { initialAuthView: "signup" });
}

/**
 * Native-only splash → getting started flow before sign-in / sign-up.
 */
export function NativeLaunchGate({
  children,
  skip = false,
}: {
  children: React.ReactNode;
  skip?: boolean;
}) {
  const locale = useLaunchLocale();
  const t = useCallback(
    (key: string) => translate(locale, key),
    [locale],
  );

  const [phase, setPhase] = useState<LaunchPhase>(() =>
    isNativeApp() && !skip ? "splash" : "done",
  );

  useEffect(() => {
    if (phase !== "splash") return;
    const timer = window.setTimeout(() => setPhase("intro"), SPLASH_AUTO_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (!isNativeApp() || skip || phase === "done") {
    if (isNativeApp() && !skip && phase === "done") {
      return <>{withSignUpAuthView(children)}</>;
    }
    return <>{children}</>;
  }

  if (phase === "splash") {
    return <NativeSplashScreen onContinue={() => setPhase("intro")} />;
  }

  return (
    <NativeGettingStartedScreen onContinue={() => setPhase("done")} t={t} />
  );
}
