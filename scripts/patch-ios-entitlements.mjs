/**
 * Ensures Associated Domains entitlements are linked for passkeys (webcredentials).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const pbxPath = join(process.cwd(), "ios/App/App.xcodeproj/project.pbxproj");
const entitlementsPath = join(process.cwd(), "ios/App/App/App.entitlements");

if (!existsSync(pbxPath) || !existsSync(entitlementsPath)) {
  console.log("patch-ios-entitlements: skip (project or entitlements missing)");
  process.exit(0);
}

let pbx = readFileSync(pbxPath, "utf8");
const needle = "CODE_SIGN_ENTITLEMENTS = App/App.entitlements;";

if (pbx.includes(needle)) {
  console.log("patch-ios-entitlements: already linked");
  process.exit(0);
}

const replaced = pbx.replace(
  /(504EC3171FED79650016851F \/\* Debug \*\/[\s\S]*?buildSettings = \{[\s\S]*?)(CODE_SIGN_STYLE = Automatic;)/,
  "$1CODE_SIGN_ENTITLEMENTS = App/App.entitlements;\n\t\t\t\t$2"
);

if (replaced === pbx) {
  console.log("patch-ios-entitlements: could not patch Debug target — edit Xcode manually");
  process.exit(1);
}

let next = replaced.replace(
  /(504EC3181FED79650016851F \/\* Release \*\/[\s\S]*?buildSettings = \{[\s\S]*?)(CODE_SIGN_STYLE = Automatic;)/,
  "$1CODE_SIGN_ENTITLEMENTS = App/App.entitlements;\n\t\t\t\t$2"
);

writeFileSync(pbxPath, next);
console.log("patch-ios-entitlements: linked App/App.entitlements");
