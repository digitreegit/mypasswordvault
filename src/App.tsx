import React, { useEffect } from "react";
import { VaultProvider, useVault } from "./lib/vault";
import { localeToHtmlLang } from "./lib/i18n/locale";
import { SetupScreen } from "./components/SetupScreen";
import { LockScreen } from "./components/LockScreen";
import { VaultScreen } from "./components/VaultScreen";

function HtmlLang() {
  const { locale } = useVault();
  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(locale);
  }, [locale]);
  return null;
}

function Router() {
  const { status, t } = useVault();
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-500">
        {t("app.loading")}
      </div>
    );
  }
  if (status === "fresh") return <SetupScreen />;
  if (status === "locked") return <LockScreen />;
  return <VaultScreen />;
}

export default function App() {
  return (
    <VaultProvider>
      <HtmlLang />
      <Router />
    </VaultProvider>
  );
}
