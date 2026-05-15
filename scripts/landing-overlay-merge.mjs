/**
 * Appends locales from landing-overlay-bundles.mjs to public/landing-overlays.js
 * Run from repo root: node scripts/landing-overlay-merge.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bundleMap from "./landing-overlay-bundles.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const target = join(root, "..", "public", "landing-overlays.js");
let txt = readFileSync(target, "utf8");

const injected = txt.search(/\n  "[a-z]{2}": \{/);
if (injected >= 0) {
  txt = txt.slice(0, injected).trimEnd();
} else {
  txt = txt.replace(/\n\};\s*$/, "").trimEnd();
}

function formatLocaleEntry(code, obj) {
  const lines = JSON.stringify(obj, null, 2).split("\n");
  lines[0] = `  ${JSON.stringify(code)}: ${lines[0]}`;
  for (let i = 1; i < lines.length; i++) {
    lines[i] = `  ${lines[i]}`;
  }
  return lines.join("\n");
}

const extras = [];
for (const [code, data] of Object.entries(bundleMap)) {
  extras.push(formatLocaleEntry(code, data));
}

writeFileSync(target, `${txt.trimEnd()}\n${extras.join(",\n")}\n};\n`);
