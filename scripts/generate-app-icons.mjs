#!/usr/bin/env node
/**
 * Generate iOS + Android app icons from resources/app-icon-1024.png.
 * Run: npm run app:icons
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const masterPath = join(root, "resources/app-icon-1024.png");

const ANDROID_LAUNCHER = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const ANDROID_FOREGROUND = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

function loadPng(path) {
  if (!existsSync(path)) {
    console.error(`Missing ${path}`);
    process.exit(1);
  }
  return PNG.sync.read(readFileSync(path));
}

function sampleBilinear(src, sx, sy) {
  const x = Math.max(0, Math.min(src.width - 1, sx));
  const y = Math.max(0, Math.min(src.height - 1, sy));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(src.width - 1, x0 + 1);
  const y1 = Math.min(src.height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;

  const idx = (xx, yy) => (yy * src.width + xx) << 2;
  const out = { r: 0, g: 0, b: 0, a: 255 };
  for (const [px, py, w] of [
    [x0, y0, (1 - tx) * (1 - ty)],
    [x1, y0, tx * (1 - ty)],
    [x0, y1, (1 - tx) * ty],
    [x1, y1, tx * ty],
  ]) {
    const i = idx(px, py);
    out.r += src.data[i] * w;
    out.g += src.data[i + 1] * w;
    out.b += src.data[i + 2] * w;
    if (src.data[i + 3] !== undefined) {
      out.a += src.data[i + 3] * w;
    }
  }
  return out;
}

function resizeIcon(src, size) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = ((x + 0.5) / size) * src.width - 0.5;
      const sy = ((y + 0.5) / size) * src.height - 0.5;
      const sample = sampleBilinear(src, sx, sy);
      const di = (y * size + x) << 2;
      png.data[di] = Math.round(sample.r);
      png.data[di + 1] = Math.round(sample.g);
      png.data[di + 2] = Math.round(sample.b);
      png.data[di + 3] = 255;
    }
  }
  return png;
}

function writePng(path, png) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, PNG.sync.write(png));
  console.log(`wrote ${path}`);
}

const master = loadPng(masterPath);

writePng(
  join(root, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"),
  master.width === 1024 && master.height === 1024 ? master : resizeIcon(master, 1024),
);

for (const [folder, size] of Object.entries(ANDROID_LAUNCHER)) {
  const png = resizeIcon(master, size);
  const dir = join(root, "android/app/src/main/res", folder);
  writePng(join(dir, "ic_launcher.png"), png);
  writePng(join(dir, "ic_launcher_round.png"), png);
}

for (const [folder, size] of Object.entries(ANDROID_FOREGROUND)) {
  writePng(
    join(root, "android/app/src/main/res", folder, "ic_launcher_foreground.png"),
    resizeIcon(master, size),
  );
}
