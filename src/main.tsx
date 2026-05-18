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
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App";
import "./index.css";
import { setupNativeAuthListener } from "./lib/nativeAuth";
import { ensureOAuthSessionFromUrl } from "./lib/supabaseAuthRedirect";

setupNativeAuthListener();

void ensureOAuthSessionFromUrl()
  .catch((e) => console.error("ensureOAuthSessionFromUrl", e))
  .finally(() => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
        <SpeedInsights />
      </React.StrictMode>
    );
  });
