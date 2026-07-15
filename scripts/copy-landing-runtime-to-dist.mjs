#!/usr/bin/env node
/** Copy landing runtime files from public/ into dist/ after postbuild config refresh. */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
if (!existsSync(dist)) {
  console.log("copy-landing-runtime: dist/ missing — skip");
  process.exit(0);
}

for (const name of [
  "vercel-analytics-init.js",
  "landing-config.js",
  "landing-analytics.js",
  "sitemap.xml",
  "robots.txt",
]) {
  const src = join(root, "public", name);
  if (!existsSync(src)) continue;
  cpSync(src, join(dist, name));
}

const ogSrc = join(root, "public/images/og-image.png");
if (existsSync(ogSrc)) {
  mkdirSync(join(dist, "images"), { recursive: true });
  cpSync(ogSrc, join(dist, "images/og-image.png"));
}

console.log("copy-landing-runtime: synced public landing runtime → dist/");
