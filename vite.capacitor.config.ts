import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** Capacitor: single-page app bundle with relative asset paths (no /app/ MPA). */
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist-capacitor",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "app/index.html"),
    },
  },
});
