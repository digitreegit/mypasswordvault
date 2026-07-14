#!/usr/bin/env node
/**
 * Generate public/images/og-image.png (1200×630) for Open Graph / Twitter cards.
 * Run: npm run seo:og
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/images");
const outPath = join(outDir, "og-image.png");
const iconPath = join(root, "resources/app-icon-1024.png");

const WIDTH = 1200;
const HEIGHT = 630;
const GRAD_TOP = { r: 0x4c, g: 0x85, b: 0xff };
const GRAD_BOTTOM = { r: 0x32, g: 0x27, b: 0x93 };

function loadPng(path) {
  if (!existsSync(path)) {
    console.error(`Missing ${path}`);
    process.exit(1);
  }
  return PNG.sync.read(readFileSync(path));
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

function resizeRgba(src, width, height) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = ((x + 0.5) / width) * src.width - 0.5;
      const sy = ((y + 0.5) / height) * src.height - 0.5;
      const sample = sampleBilinearRgba(src, sx, sy);
      const di = (y * width + x) << 2;
      png.data[di] = Math.round(sample.r);
      png.data[di + 1] = Math.round(sample.g);
      png.data[di + 2] = Math.round(sample.b);
      png.data[di + 3] = Math.round(sample.a);
    }
  }
  return png;
}

function fillLinearGradient(width, height) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    const t = height <= 1 ? 0 : y / (height - 1);
    const r = Math.round(GRAD_TOP.r + (GRAD_BOTTOM.r - GRAD_TOP.r) * t);
    const g = Math.round(GRAD_TOP.g + (GRAD_BOTTOM.g - GRAD_TOP.g) * t);
    const b = Math.round(GRAD_TOP.b + (GRAD_BOTTOM.b - GRAD_TOP.b) * t);
    for (let x = 0; x < width; x++) {
      const di = (y * width + x) << 2;
      png.data[di] = r;
      png.data[di + 1] = g;
      png.data[di + 2] = b;
      png.data[di + 3] = 255;
    }
  }
  return png;
}

function compositeAt(base, overlay, left, top) {
  const png = new PNG({ width: base.width, height: base.height });
  png.data.set(base.data);
  for (let y = 0; y < overlay.height; y++) {
    for (let x = 0; x < overlay.width; x++) {
      const si = (y * overlay.width + x) << 2;
      const alpha = overlay.data[si + 3] / 255;
      if (alpha <= 0) continue;
      const dx = x + left;
      const dy = y + top;
      if (dx < 0 || dy < 0 || dx >= base.width || dy >= base.height) continue;
      const di = (dy * base.width + dx) << 2;
      png.data[di] = Math.round(
        overlay.data[si] * alpha + png.data[di] * (1 - alpha),
      );
      png.data[di + 1] = Math.round(
        overlay.data[si + 1] * alpha + png.data[di + 1] * (1 - alpha),
      );
      png.data[di + 2] = Math.round(
        overlay.data[si + 2] * alpha + png.data[di + 2] * (1 - alpha),
      );
      png.data[di + 3] = 255;
    }
  }
  return png;
}

/** Minimal 5×7 bitmap font for uppercase, digits, and a few symbols. */
const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00100", "00100"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ",": ["00000", "00000", "00000", "00000", "00100", "00100", "01000"],
  "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10110", "10010", "01101"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
};

function drawText(base, text, left, top, scale, color) {
  let cursorX = left;
  const upper = text.toUpperCase();
  for (const ch of upper) {
    const glyph = GLYPHS[ch];
    if (!glyph) {
      cursorX += 4 * scale;
      continue;
    }
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col] !== "1") continue;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const x = cursorX + col * scale + sx;
            const y = top + row * scale + sy;
            if (x < 0 || y < 0 || x >= base.width || y >= base.height) continue;
            const di = (y * base.width + x) << 2;
            base.data[di] = color.r;
            base.data[di + 1] = color.g;
            base.data[di + 2] = color.b;
            base.data[di + 3] = 255;
          }
        }
      }
    }
    cursorX += (glyph[0].length + 1) * scale;
  }
}

const icon = loadPng(iconPath);
const iconSize = 300;
const scaledIcon = resizeRgba(icon, iconSize, iconSize);

let canvas = fillLinearGradient(WIDTH, HEIGHT);
canvas = compositeAt(canvas, scaledIcon, 96, Math.round((HEIGHT - iconSize) / 2));

const white = { r: 255, g: 255, b: 255 };
const muted = { r: 220, g: 228, b: 255 };

drawText(canvas, "MY PASSWORD VAULT", 440, 210, 5, white);
drawText(canvas, "LOCAL-FIRST ENCRYPTED", 440, 300, 3, muted);
drawText(canvas, "PASSWORD MANAGER", 440, 345, 3, muted);
drawText(canvas, "WEB / IOS / ANDROID", 440, 430, 3, muted);
drawText(canvas, "$4.99 LIFETIME - NO SUBSCRIPTION", 440, 500, 3, muted);

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, PNG.sync.write(canvas));
console.log(`Wrote ${outPath} (${WIDTH}x${HEIGHT})`);
