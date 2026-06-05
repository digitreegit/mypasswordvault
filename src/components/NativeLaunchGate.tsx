import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { Globe, Lock, Shield } from "./Icons";

type LaunchPhase = "splash" | "intro" | "done";

const SPLASH_AUTO_MS = 1800;
const ONBOARDING_PAGE_COUNT = 4;

type OnboardingGraphicVariant = "spreadsheet" | "secure" | "sync" | "vault";

const ONBOARDING_PAGES: {
  titleKey: string;
  bodyKey: string;
  graphic: OnboardingGraphicVariant;
}[] = [
  {
    titleKey: "launch.onboard1Title",
    bodyKey: "launch.onboard1Body",
    graphic: "spreadsheet",
  },
  {
    titleKey: "launch.onboard2Title",
    bodyKey: "launch.onboard2Body",
    graphic: "secure",
  },
  {
    titleKey: "launch.onboard3Title",
    bodyKey: "launch.onboard3Body",
    graphic: "sync",
  },
  {
    titleKey: "launch.onboard4Title",
    bodyKey: "launch.onboard4Body",
    graphic: "vault",
  },
];

function SpreadsheetPlaceholderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M3 14h18M9 4v16M15 4v16" />
    </svg>
  );
}

function useLaunchLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(
    () => readStoredLocale() ?? normalizeLocale(detectBrowserLocale()),
  );
  useEffect(() => subscribeLocaleChanged(setLocale), []);
  return locale;
}

function OnboardingGraphic({
  variant,
  label,
}: {
  variant: OnboardingGraphicVariant;
  label: string;
}) {
  const graphicClass: Record<OnboardingGraphicVariant, string> = {
    spreadsheet: "from-amber-400 to-orange-600",
    secure: "from-violet-500 to-indigo-700",
    sync: "from-sky-500 to-blue-700",
    vault: "from-accent-500 to-accent-700",
  };

  return (
    <div
      className={`native-onboard__art relative mx-auto flex aspect-[4/3] w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br shadow-md ${graphicClass[variant]}`}
      role="img"
      aria-label={label}
    >
      <div
        className="absolute inset-0 opacity-20"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #fff 0%, transparent 45%), radial-gradient(circle at 80% 80%, #fff 0%, transparent 40%)",
        }}
      />
      <span className="absolute left-3 top-3 rounded-md bg-white/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white/90">
        Placeholder
      </span>
      {variant === "vault" ? (
        <BrandSplashSymbol className="relative h-24 w-[6.5rem]" />
      ) : variant === "spreadsheet" ? (
        <SpreadsheetPlaceholderIcon className="relative h-16 w-16 text-white/95" />
      ) : variant === "secure" ? (
        <Shield className="relative h-16 w-16 text-white/95" />
      ) : (
        <Globe className="relative h-16 w-16 text-white/95" strokeWidth={1.5} />
      )}
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
      <BrandSplashSymbol
        className="h-[7.875rem] w-[8.5rem]"
        aria-label="My Password Vault"
      />
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
      className="flex h-2 w-6 items-center justify-center"
      onClick={() => onSelect(index)}
    >
      <span
        className={[
          "block h-2 rounded-full transition-all duration-200",
          active ? "w-6 bg-accent-600" : "w-2 bg-ink-300",
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
  const isLastPage = activePage === ONBOARDING_PAGE_COUNT - 1;

  const syncActivePageFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth <= 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActivePage(Math.min(Math.max(index, 0), ONBOARDING_PAGE_COUNT - 1));
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", syncActivePageFromScroll, { passive: true });
    return () => el.removeEventListener("scroll", syncActivePageFromScroll);
  }, [syncActivePageFromScroll]);

  function scrollToPage(index: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActivePage(index);
  }

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
        >
          {ONBOARDING_PAGES.map((page, index) => (
            <section
              key={page.titleKey}
              className="native-onboard__slide flex shrink-0 snap-center flex-col px-6 pt-6 pb-4"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${ONBOARDING_PAGE_COUNT}`}
            >
              <OnboardingGraphic
                variant={page.graphic}
                label={t(`launch.onboard${index + 1}ArtLabel`)}
              />
              <h2 className="native-onboard__title mt-8 text-center">
                {t(page.titleKey)}
              </h2>
              <p className="native-onboard__body mt-4 text-center max-w-md mx-auto">
                {t(page.bodyKey)}
              </p>
            </section>
          ))}
        </div>

        <footer className="native-onboard__footer shrink-0 px-6 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div
            className="flex items-center justify-center gap-0"
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
                className="btn-primary w-full justify-center"
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
