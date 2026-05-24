import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** Dev-only proxy: ipwho.is blocks browser CORS on the free plan. */
function signInGeoDevApi(): Plugin {
  return {
    name: "sign-in-geo-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/sign-in-geo", async (_req, res) => {
        try {
          const upstream = await fetch("https://ipwho.is/", {
            headers: { Accept: "application/json" },
          });
          const body = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "private, no-store");
          res.end(body);
        } catch {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: false, message: "Geo lookup failed" }));
        }
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  /**
   * Production: bundles live under `/app/` beside the static landing at `/`.
   * Development: `base` must be `/` so `/` serves the root landing and `/app/` serves
   * `app/index.html`. With `base: "/app/"`, Vite serves the root `index.html` at `/app/`,
   * so the React shell never loads and the login screen never appears.
   */
  base: command === "build" ? "/app/" : "/",
  plugins: [react(), ...(command === "serve" ? [signInGeoDevApi()] : [])],
  server: {
    port: 5173,
    /** 0.0.0.0 = IPv4 모든 인터페이스; localhost·127.0.0.1·LAN IP 모두에서 접속 가능 */
    host: "0.0.0.0",
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        landing: resolve(__dirname, "index.html"),
        app: resolve(__dirname, "app/index.html"),
      },
    },
  },
}));
