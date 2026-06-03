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

if (pbx.includes("com.apple.InAppPurchase")) {
  console.log("patch-ios-iap: already enabled");
  process.exit(0);
}

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
writeFileSync(pbxPath, pbx);
console.log("patch-ios-iap: enabled In-App Purchase capability");
