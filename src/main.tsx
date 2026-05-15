import React from "react";
import ReactDOM from "react-dom/client";
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
      </React.StrictMode>
    );
  });
