import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/600.css";
import "@fontsource/noto-sans-kr/700.css";
import App from "./App";
import "./index.css";
import { setupNativeAuthListener } from "./lib/nativeAuth";
import { captureCheckoutReturnFromUrl } from "./lib/checkoutReturn";
import {
  redirectCheckoutReturnToApp,
  redirectDevIpToLocalhost,
  redirectVercelPreviewToCanonical,
} from "./lib/siteOrigin";
import { ensureOAuthSessionFromUrl } from "./lib/supabaseAuthRedirect";
import { isNativeApp } from "./lib/platform";
import { initNativeViewportLock } from "./lib/nativeViewportLock";
import { initNativeStoreBridge } from "./lib/initNativeStoreBridge";

if (isNativeApp()) {
  document.documentElement.classList.add("native-app");
  initNativeViewportLock();
  void initNativeStoreBridge().catch((e) => {
    console.error("initNativeStoreBridge", e);
  });
}

setupNativeAuthListener();
captureCheckoutReturnFromUrl();

if (redirectVercelPreviewToCanonical()) {
  // Navigating to mypasswordvault.app — do not mount the app on *.vercel.app.
} else if (redirectDevIpToLocalhost()) {
  // WebAuthn rejects IP rpIds — use localhost in dev.
} else if (redirectCheckoutReturnToApp()) {
  // Stripe return landed on marketing root — move to /app/ before mounting.
} else void ensureOAuthSessionFromUrl()
  .catch((e) => console.error("ensureOAuthSessionFromUrl", e))
  .finally(() => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
