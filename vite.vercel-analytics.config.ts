import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** Builds public/vercel-analytics-init.js for static marketing pages. */
export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, "src/landing-vercel-analytics.ts"),
      name: "MpvVercelAnalytics",
      formats: ["iife"],
      fileName: () => "vercel-analytics-init.js",
    },
    outDir: resolve(__dirname, "public"),
    emptyOutDir: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
