import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ command }) => ({
  /**
   * Production: bundles live under `/app/` beside the static landing at `/`.
   * Development: `base` must be `/` so `/` serves the root landing and `/app/` serves
   * `app/index.html`. With `base: "/app/"`, Vite serves the root `index.html` at `/app/`,
   * so the React shell never loads and the login screen never appears.
   */
  base: command === "build" ? "/app/" : "/",
  plugins: [react()],
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
