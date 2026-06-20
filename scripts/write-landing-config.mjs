#!/usr/bin/env node
/** Writes public/landing-config.js from .env (VITE_SUPABASE_*). Run before dev/build. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
let url = process.env.VITE_SUPABASE_URL ?? "";
let anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? "";
let playStoreUrl = process.env.VITE_PLAY_STORE_URL ?? "";
let appStoreUrl = process.env.VITE_APP_STORE_URL ?? "";

if (existsSync(envPath)) {
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (key === "VITE_SUPABASE_URL" && !url) url = val;
    if (key === "VITE_SUPABASE_ANON_KEY" && !anonKey) anonKey = val;
    if (key === "VITE_PLAY_STORE_URL" && !playStoreUrl) playStoreUrl = val;
    if (key === "VITE_APP_STORE_URL" && !appStoreUrl) appStoreUrl = val;
  }
}

if (!playStoreUrl) {
  playStoreUrl =
    "https://play.google.com/store/apps/details?id=com.skyface.mypasswordvault";
}

const out = join(root, "public/landing-config.js");
writeFileSync(
  out,
  `window.__MPV_LANDING_CONFIG__=${JSON.stringify({ url, anonKey, playStoreUrl, appStoreUrl })};\n`
);
console.log(`Wrote ${out} (${url ? "configured" : "empty — set .env"})`);
