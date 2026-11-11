/**
 * Vite emits app/index.html under dist-capacitor/app/; Capacitor expects index.html at webDir root.
 */
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist-capacitor");
const nestedHtml = join(dist, "app", "index.html");
const rootHtml = join(dist, "index.html");

if (!existsSync(nestedHtml)) {
  console.log("capacitor-postbuild: no dist-capacitor/app/index.html — skip");
  process.exit(0);
}

copyFileSync(nestedHtml, rootHtml);
rmSync(join(dist, "app"), { recursive: true, force: true });

let html = readFileSync(rootHtml, "utf8");
// Capacitor loads index at webDir root — rewrite /app/-style parent paths.
html = html.replace(/\.\.\/assets\//g, "./assets/");
html = html.replace(/\.\.\/favicon\.png/g, "./favicon.png");
html = html.replace(/\.\.\/manifest\.webmanifest/g, "./manifest.webmanifest");
html = html.replace(/\.\.\/pwa-register\.js/g, "./pwa-register.js");
// Native shell is not a PWA; drop SW registration (1.0.8 archive had none).
html = html.replace(/<link[^>]+rel=["']manifest["'][^>]*>\s*/gi, "");
html = html.replace(/<script[^>]+pwa-register\.js["'][^>]*>\s*<\/script>\s*/gi, "");
writeFileSync(rootHtml, html);

console.log("capacitor-postbuild: dist-capacitor/index.html ready");
