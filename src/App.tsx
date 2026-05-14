import React, { useState } from "react";
import { VaultProvider, useVault } from "./lib/vault";
import { AuthProvider, useAuth } from "./lib/auth";
import { translate } from "./lib/i18n/bundles";
import { localeToHtmlLang, detectBrowserLocale } from "./lib/i18n/locale";
import { SetupScreen } from "./components/SetupScreen";
import { LockScreen } from "./components/LockScreen";
import { VaultScreen } from "./components/VaultScreen";
import { AuthScreen } from "./components/AuthScreen";

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
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center text-ink-500 px-4">
        {t("app.loading")}
      </div>
    );
  }
  if (status === "fresh") return <SetupScreen />;
  if (status === "locked") return <LockScreen />;
  return <VaultScreen />;
}

function VaultShell() {
  return (
    <>
      <HtmlLang />
      <Router />
    </>
  );
}

function AuthenticatedApp() {
  const { configured, loading, session } = useAuth();
  const [bootLocale] = useState(() => detectBrowserLocale());

  if (configured && loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center text-ink-500 px-4">
        {translate(bootLocale, "app.authLoading")}
      </div>
    );
  }

  if (!session?.user?.id) {
    return <AuthScreen />;
  }

  return (
    <VaultProvider userId={session.user.id}>
      <VaultShell />
    </VaultProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
