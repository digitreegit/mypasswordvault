#!/usr/bin/env node
/**
 * Generate iOS + Android icons and splash assets.
 * - Foreground: resources/appicon.png (white shield, black keyed to alpha)
 * - Splash mark: resources/splash-mark.png (lavender shield, black keyed to alpha)
 * - Background: linear gradient #4C85FF → #322793
 *
 * Run: npm run app:icons
 */
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iosIconPath = join(root, "resources/app-icon-1024.png");
const appIconPath = join(root, "resources/appicon.png");
const splashMarkPath = join(root, "resources/splash-mark.png");

const GRAD_TOP = { r: 0x4c, g: 0x85, b: 0xff };
const GRAD_BOTTOM = { r: 0x32, g: 0x27, b: 0x93 };

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

/** Adaptive icon safe zone (~66% diameter in 108dp canvas). */
const ANDROID_FOREGROUND_SAFE_SCALE = 0.62;
const ANDROID_LAUNCHER_MARK_SCALE = 0.56;
const SPLASH_MARK_SCALE = 0.22;
const IOS_SPLASH_SIZE = 2732;

function loadPng(path) {
  if (!existsSync(path)) {
    console.error(`Missing ${path}`);
    process.exit(1);
  }
  return PNG.sync.read(readFileSync(path));
}

function keyedFromDarkBackground(src, threshold = 40) {
  const png = new PNG({ width: src.width, height: src.height });
  for (let i = 0; i < src.data.length; i += 4) {
    const r = src.data[i];
    const g = src.data[i + 1];
    const b = src.data[i + 2];
    if (r <= threshold && g <= threshold && b <= threshold) {
      png.data[i] = 0;
      png.data[i + 1] = 0;
      png.data[i + 2] = 0;
      png.data[i + 3] = 0;
    } else {
      png.data[i] = r;
      png.data[i + 1] = g;
      png.data[i + 2] = b;
      png.data[i + 3] = 255;
    }
  }
  return png;
}

function sampleBilinearRgba(src, sx, sy) {
  const x = Math.max(0, Math.min(src.width - 1, sx));
  const y = Math.max(0, Math.min(src.height - 1, sy));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(src.width - 1, x0 + 1);
  const y1 = Math.min(src.height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;

  const idx = (xx, yy) => (yy * src.width + xx) << 2;
  const out = { r: 0, g: 0, b: 0, a: 0 };
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
    out.a += src.data[i + 3] * w;
  }
  return out;
}

function resizeRgba(src, size) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = ((x + 0.5) / size) * src.width - 0.5;
      const sy = ((y + 0.5) / size) * src.height - 0.5;
      const sample = sampleBilinearRgba(src, sx, sy);
      const di = (y * size + x) << 2;
      png.data[di] = Math.round(sample.r);
      png.data[di + 1] = Math.round(sample.g);
      png.data[di + 2] = Math.round(sample.b);
      png.data[di + 3] = Math.round(sample.a);
    }
  }
  return png;
}

function fillLinearGradient(size) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    const t = size <= 1 ? 0 : y / (size - 1);
    const r = Math.round(GRAD_TOP.r + (GRAD_BOTTOM.r - GRAD_TOP.r) * t);
    const g = Math.round(GRAD_TOP.g + (GRAD_BOTTOM.g - GRAD_TOP.g) * t);
    const b = Math.round(GRAD_TOP.b + (GRAD_BOTTOM.b - GRAD_TOP.b) * t);
    for (let x = 0; x < size; x++) {
      const di = (y * size + x) << 2;
      png.data[di] = r;
      png.data[di + 1] = g;
      png.data[di + 2] = b;
      png.data[di + 3] = 255;
    }
  }
  return png;
}

function compositeCentered(base, overlay, contentScale) {
  const contentSize = Math.max(1, Math.round(base.width * contentScale));
  const scaled = resizeRgba(overlay, contentSize);
  const png = new PNG({ width: base.width, height: base.height });
  png.data.set(base.data);

  const offset = Math.floor((base.width - contentSize) / 2);
  for (let y = 0; y < contentSize; y++) {
    for (let x = 0; x < contentSize; x++) {
      const si = (y * contentSize + x) << 2;
      const alpha = scaled.data[si + 3] / 255;
      if (alpha <= 0) continue;
      const di = ((y + offset) * base.width + (x + offset)) << 2;
      png.data[di] = Math.round(
        scaled.data[si] * alpha + png.data[di] * (1 - alpha),
      );
      png.data[di + 1] = Math.round(
        scaled.data[si + 1] * alpha + png.data[di + 1] * (1 - alpha),
      );
      png.data[di + 2] = Math.round(
        scaled.data[si + 2] * alpha + png.data[di + 2] * (1 - alpha),
      );
      png.data[di + 3] = 255;
    }
  }
  return png;
}

function resizeRgbaCentered(src, canvasSize, contentScale) {
  const contentSize = Math.max(1, Math.round(canvasSize * contentScale));
  const scaled = resizeRgba(src, contentSize);
  const png = new PNG({ width: canvasSize, height: canvasSize });
  png.data.fill(0);

  const offset = Math.floor((canvasSize - contentSize) / 2);
  for (let y = 0; y < contentSize; y++) {
    for (let x = 0; x < contentSize; x++) {
      const si = (y * contentSize + x) << 2;
      const di = ((y + offset) * canvasSize + (x + offset)) << 2;
      png.data[di] = scaled.data[si];
      png.data[di + 1] = scaled.data[si + 1];
      png.data[di + 2] = scaled.data[si + 2];
      png.data[di + 3] = scaled.data[si + 3];
    }
  }
  return png;
}

function writePng(path, png) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, PNG.sync.write(png));
  console.log(`wrote ${path}`);
}

function removeLegacySplashPngs() {
  const resRoot = join(root, "android/app/src/main/res");
  const legacy = join(resRoot, "drawable/splash.png");
  if (existsSync(legacy)) {
    unlinkSync(legacy);
    console.log(`removed ${legacy} (using drawable/splash.xml)`);
  }
}

const appIconRaw = loadPng(appIconPath);
const splashMarkRaw = loadPng(splashMarkPath);
const appIconFg = keyedFromDarkBackground(appIconRaw);
const splashMarkFg = keyedFromDarkBackground(splashMarkRaw);

if (existsSync(iosIconPath)) {
  const iosMaster = loadPng(iosIconPath);
  writePng(
    join(root, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"),
    iosMaster.width === 1024 && iosMaster.height === 1024
      ? iosMaster
      : resizeRgba(iosMaster, 1024),
  );
}

for (const [folder, size] of Object.entries(ANDROID_LAUNCHER)) {
  const gradient = fillLinearGradient(size);
  const png = compositeCentered(gradient, appIconFg, ANDROID_LAUNCHER_MARK_SCALE);
  const dir = join(root, "android/app/src/main/res", folder);
  writePng(join(dir, "ic_launcher.png"), png);
  writePng(join(dir, "ic_launcher_round.png"), png);
}

for (const [folder, size] of Object.entries(ANDROID_FOREGROUND)) {
  writePng(
    join(root, "android/app/src/main/res", folder, "ic_launcher_foreground.png"),
    resizeRgbaCentered(appIconFg, size, ANDROID_FOREGROUND_SAFE_SCALE),
  );
}

writePng(
  join(root, "android/app/src/main/res/drawable/splash_mark.png"),
  resizeRgba(splashMarkFg, 512),
);

const iosSplash = compositeCentered(
  fillLinearGradient(IOS_SPLASH_SIZE),
  splashMarkFg,
  SPLASH_MARK_SCALE,
);
for (const name of [
  "splash-2732x2732.png",
  "splash-2732x2732-1.png",
  "splash-2732x2732-2.png",
]) {
  writePng(join(root, "ios/App/App/Assets.xcassets/Splash.imageset", name), iosSplash);
}

removeLegacySplashPngs();
