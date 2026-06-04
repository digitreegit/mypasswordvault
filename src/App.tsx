import React, { useEffect, useState } from "react";
import { VaultProvider, useVault } from "./lib/vault";
import { AuthProvider, useAuth } from "./lib/auth";
import { translate } from "./lib/i18n/bundles";
import { localeToHtmlLang, detectBrowserLocale } from "./lib/i18n/locale";
import { SetupScreen } from "./components/SetupScreen";
import { LockScreen } from "./components/LockScreen";
import { VaultScreen } from "./components/VaultScreen";
import { AuthScreen } from "./components/AuthScreen";
import { PricingPage } from "./components/PricingPage";
import {
  SettingsPage,
  settingsSectionFromPath,
} from "./components/SettingsPage";
import { CheckoutCancelRelay } from "./components/CheckoutCancelRelay";
import { CheckoutPopupRelay } from "./components/CheckoutPopupRelay";
import { AdminDashboard } from "./components/AdminDashboard";
import {
  isCheckoutPopupCancelReturn,
  isCheckoutPopupReturn,
  parseCheckoutReturn,
} from "./lib/checkoutReturn";
import { nativeScreenRootClass } from "./lib/nativeLayout";
import { isNativeApp } from "./lib/platform";

function parseHashPath(): string {
  if (typeof window === "undefined") return "";
  const raw = window.location.hash.replace(/^#/, "");
  return raw.split("?")[0].replace(/^\//, "").toLowerCase();
}

function useHashPath(): string {
  const [path, setPath] = useState(parseHashPath);
  useEffect(() => {
    const onHash = () => setPath(parseHashPath());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return path;
}

function HtmlLang() {
  const { locale } = useVault();
  React.useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(locale);
  }, [locale]);
  return null;
}

function Router() {
  const { status, t } = useVault();
  if (status === "loading") {
    return (
      <div className={nativeScreenRootClass("items-center justify-center text-ink-500 px-4")}>
        {t("app.loading")}
      </div>
    );
  }
  if (status === "fresh") return <SetupScreen />;
  if (status === "locked") return <LockScreen />;
  return <VaultScreen />;
}

function VaultShell() {
  return <Router />;
}

function normalizeHashPath(path: string): string {
  if (path === "account/logs" || path === "settings/logs") return "settings";
  if (path === "account") return "settings/account";
  return path;
}

function AuthenticatedVaultRoutes({ hashPath }: { hashPath: string }) {
  const route = normalizeHashPath(hashPath);

  useEffect(() => {
    if (route !== hashPath) {
      window.location.hash = `#/${route}`;
    }
  }, [hashPath, route]);

  const isSettingsRoute =
    route === "settings" ||
    route === "settings/plan" ||
    route === "settings/security" ||
    route === "settings/backup" ||
    route === "settings/account";

  if (isSettingsRoute) {
    return <SettingsPage section={settingsSectionFromPath(route)} />;
  }

  return <VaultShell />;
}

function AuthenticatedApp() {
  const { configured, loading, session, passwordRecoveryPending } = useAuth();
  const [bootLocale] = useState(() => detectBrowserLocale());
  const hashPath = useHashPath();
  const checkoutSuccessReturn = parseCheckoutReturn() === "success";

  if (isCheckoutPopupReturn()) {
    return <CheckoutPopupRelay />;
  }

  if (isCheckoutPopupCancelReturn()) {
    return <CheckoutCancelRelay />;
  }

  if (hashPath === "pricing") {
    return <PricingPage />;
  }

  if (hashPath === "admin") {
    if (passwordRecoveryPending || !session?.user?.id) {
      return <AuthScreen />;
    }
    return <AdminDashboard />;
  }

  if (configured && (loading || (checkoutSuccessReturn && !session))) {
    return (
      <div className={nativeScreenRootClass("items-center justify-center text-ink-500 px-4")}>
        {translate(bootLocale, "app.authLoading")}
      </div>
    );
  }

  if (passwordRecoveryPending || !session?.user?.id) {
    return <AuthScreen />;
  }

  const passkeyDisplayName =
    (typeof session.user.user_metadata?.full_name === "string"
      ? session.user.user_metadata.full_name
      : null) ??
    (typeof session.user.user_metadata?.name === "string"
      ? session.user.user_metadata.name
      : null);

  return (
    <VaultProvider
      userId={session.user.id}
      userEmail={session.user.email}
      userDisplayName={passkeyDisplayName}
    >
      <HtmlLang />
      <AuthenticatedVaultRoutes hashPath={hashPath} />
    </VaultProvider>
  );
}

export default function App() {
  const tree = (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
  if (isNativeApp()) {
    return <div className="native-app-root">{tree}</div>;
  }
  return tree;
}
