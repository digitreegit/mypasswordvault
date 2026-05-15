/**
 * Vite MPA build emits hashed files under dist/assets/ but app/index.html
 * references /app/assets/*. Move them so static hosts (Vercel, Apache) resolve correctly.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const dist = new URL("../dist", import.meta.url).pathname;
const srcAssets = join(dist, "assets");
const destAssets = join(dist, "app", "assets");

if (!existsSync(srcAssets)) {
  console.log("postbuild: no dist/assets — skip");
  process.exit(0);
}

mkdirSync(destAssets, { recursive: true });
for (const name of readdirSync(srcAssets)) {
  cpSync(join(srcAssets, name), join(destAssets, name), { recursive: true });
}
rmSync(srcAssets, { recursive: true, force: true });
console.log("postbuild: moved dist/assets → dist/app/assets");
