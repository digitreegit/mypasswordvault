/**
 * Android shell polish: Material theme, Play Billing permission, edge-to-edge safe areas.
 * Run after `npx cap sync` (via npm run cap:sync).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const manifestPath = join(root, "android/app/src/main/AndroidManifest.xml");
const stylesPath = join(root, "android/app/src/main/res/values/styles.xml");
const colorsPath = join(root, "android/app/src/main/res/values/colors.xml");
const launcherBgPath = join(
  root,
  "android/app/src/main/res/values/ic_launcher_background.xml",
);

const BRAND_LAUNCHER_BG = "#3B5BDB";

const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#42424A</color>
    <color name="colorPrimaryDark">#121216</color>
    <color name="colorAccent">#42424A</color>
    <color name="splashBackground">#FFFFFF</color>
</resources>
`;

const stylesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>

    <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@android:color/transparent</item>
        <item name="android:windowLightStatusBar">true</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="AppTheme">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
    </style>

    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/splash</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    </style>
</resources>
`;

function ensureColors() {
  mkdirSync(join(root, "android/app/src/main/res/values"), { recursive: true });
  writeFileSync(colorsPath, colorsXml);
  console.log("patch-android-shell: wrote colors.xml");
}

function ensureStyles() {
  writeFileSync(stylesPath, stylesXml);
  console.log("patch-android-shell: wrote styles.xml (Material / NoActionBar)");
}

function patchLauncherBackground() {
  if (!existsSync(launcherBgPath)) return;
  let xml = readFileSync(launcherBgPath, "utf8");
  const next = xml.replace(
    /<color name="ic_launcher_background">[^<]+<\/color>/,
    `<color name="ic_launcher_background">${BRAND_LAUNCHER_BG}</color>`,
  );
  if (next !== xml) {
    writeFileSync(launcherBgPath, next);
    console.log("patch-android-shell: updated ic_launcher_background");
  }
}

function patchManifest() {
  if (!existsSync(manifestPath)) {
    console.log("patch-android-shell: AndroidManifest.xml not found — skip");
    return;
  }

  let xml = readFileSync(manifestPath, "utf8");
  let changed = false;

  if (!xml.includes("com.android.vending.BILLING")) {
    xml = xml.replace(
      /(<uses-permission android:name="android.permission.INTERNET" \/>)/,
      `$1\n    <uses-permission android:name="com.android.vending.BILLING" />`,
    );
    changed = true;
    console.log("patch-android-shell: added BILLING permission");
  }

  if (xml.includes('android:theme="@style/AppTheme"')) {
    xml = xml.replace(
      /android:theme="@style\/AppTheme"/,
      'android:theme="@style/AppTheme.NoActionBar"',
    );
    changed = true;
    console.log("patch-android-shell: application theme → NoActionBar");
  }

  if (changed) writeFileSync(manifestPath, xml);
}

if (!existsSync(join(root, "android"))) {
  console.log("patch-android-shell: android/ not found — skip");
  process.exit(0);
}

ensureColors();
ensureStyles();
patchLauncherBackground();
patchManifest();
