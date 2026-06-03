/**
 * Xcode 15+ defaults break Capacitor iOS builds:
 * - ENABLE_USER_SCRIPT_SANDBOXING blocks CocoaPods/Capacitor shell scripts
 * - CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER fails on CapacitorCordova headers
 *
 * Must be NO on both the *project* and *App target* build settings.
 * Run after `npx cap sync` (cap:sync already invokes this).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const pbxPath = join(process.cwd(), "ios/App/App.xcodeproj/project.pbxproj");

if (!existsSync(pbxPath)) {
  console.log("patch-ios-xcode-build: project.pbxproj not found — skip");
  process.exit(0);
}

let pbx = readFileSync(pbxPath, "utf8");
const before = pbx;

pbx = pbx.replace(
  /ENABLE_USER_SCRIPT_SANDBOXING = YES;/g,
  "ENABLE_USER_SCRIPT_SANDBOXING = NO;"
);
pbx = pbx.replace(
  /CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = YES;/g,
  "CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = NO;"
);

// App target Debug/Release: ensure sandboxing stays off (Xcode UI often only shows target level).
for (const marker of [
  "504EC3171FED79650016851F /* Debug */",
  "504EC3181FED79650016851F /* Release */",
]) {
  const idx = pbx.indexOf(marker);
  if (idx === -1) continue;
  const settingsStart = pbx.indexOf("buildSettings = {", idx);
  const settingsEnd = pbx.indexOf("\n\t\t\t};", settingsStart);
  if (settingsStart === -1 || settingsEnd === -1) continue;
  const block = pbx.slice(settingsStart, settingsEnd);
  let next = block;
  if (!block.includes("ENABLE_USER_SCRIPT_SANDBOXING")) {
    next = next.replace(
      "buildSettings = {",
      "buildSettings = {\n\t\t\t\tENABLE_USER_SCRIPT_SANDBOXING = NO;"
    );
  }
  if (!block.includes("CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER")) {
    next = next.replace(
      "buildSettings = {",
      "buildSettings = {\n\t\t\t\tCLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = NO;"
    );
  }
  if (next !== block) {
    pbx = pbx.slice(0, settingsStart) + next + pbx.slice(settingsEnd);
  }
}

// [CP] Embed Pods Frameworks: declare script path so sandboxed builds can read it.
if (
  pbx.includes('name = "[CP] Embed Pods Frameworks";') &&
  !pbx.includes("Pods-App-frameworks.sh")
) {
  pbx = pbx.replace(
    /(name = "\[CP\] Embed Pods Frameworks";[\s\S]*?)inputPaths = \(\s*\);/,
    '$1inputPaths = (\n\t\t\t\t"${PODS_ROOT}/Target Support Files/Pods-App/Pods-App-frameworks.sh",\n\t\t\t);'
  );
}

if (pbx === before) {
  console.log("patch-ios-xcode-build: build settings already patched");
} else {
  writeFileSync(pbxPath, pbx);
  console.log("patch-ios-xcode-build: patched project + target build settings");
}
