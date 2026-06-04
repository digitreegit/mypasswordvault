/**
 * Enables In-App Purchase capability on the iOS App target (StoreKit).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const pbxPath = join(process.cwd(), "ios/App/App.xcodeproj/project.pbxproj");

if (!existsSync(pbxPath)) {
  console.log("patch-ios-iap: skip (project missing)");
  process.exit(0);
}

let pbx = readFileSync(pbxPath, "utf8");

let changed = false;

if (!pbx.includes("com.apple.InAppPurchase")) {

const needle = "ProvisioningStyle = Automatic;";
const insert = `${needle}
\t\t\t\t\tSystemCapabilities = {
\t\t\t\t\t\tcom.apple.InAppPurchase = {
\t\t\t\t\t\t\tenabled = 1;
\t\t\t\t\t\t};
\t\t\t\t\t};`;

if (!pbx.includes(needle)) {
  console.log("patch-ios-iap: could not find App target — enable In-App Purchase in Xcode manually");
  process.exit(1);
}

  pbx = pbx.replace(needle, insert);
  changed = true;
  console.log("patch-ios-iap: enabled In-App Purchase capability");
} else {
  console.log("patch-ios-iap: In-App Purchase capability already enabled");
}

// StoreKit 2 plugin requires iOS 15+.
const beforeTarget = pbx;
pbx = pbx.replace(/IPHONEOS_DEPLOYMENT_TARGET = 14\.0;/g, "IPHONEOS_DEPLOYMENT_TARGET = 15.0;");
if (pbx !== beforeTarget) {
  changed = true;
  console.log("patch-ios-iap: raised IPHONEOS_DEPLOYMENT_TARGET to 15.0");
}

if (changed) {
  writeFileSync(pbxPath, pbx);
}
