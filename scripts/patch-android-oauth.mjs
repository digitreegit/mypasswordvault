/**
 * Ensures Supabase OAuth deep link intent filter exists in AndroidManifest.xml.
 * Run after `npx cap add android` or `npx cap sync`.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const manifestPath = join(
  process.cwd(),
  "android/app/src/main/AndroidManifest.xml",
);
const scheme = "com.skyface.mypasswordvault";

if (!existsSync(manifestPath)) {
  console.log("patch-android-oauth: AndroidManifest.xml not found — skip");
  process.exit(0);
}

let xml = readFileSync(manifestPath, "utf8");
if (xml.includes(`android:scheme="${scheme}"`)) {
  console.log("patch-android-oauth: scheme already present");
  process.exit(0);
}

const intentFilter = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="${scheme}" android:host="auth" android:pathPrefix="/callback" />
            </intent-filter>`;

if (!xml.includes("<activity")) {
  console.log("patch-android-oauth: unexpected manifest — edit manually");
  process.exit(1);
}

xml = xml.replace(
  /(<activity[^>]*android:name="[^"]*MainActivity"[^>]*>)/,
  `$1${intentFilter}`,
);
writeFileSync(manifestPath, xml);
console.log("patch-android-oauth: added", scheme);
