# Google Play (Capacitor Android)

My Password Vault runs inside a native shell via [Capacitor](https://capacitorjs.com/). The React app is built to `dist-capacitor/` and embedded in the Gradle project under `android/`. **Release builds have no marketing landing page** — the WebView loads the vault app entry directly.

The Android app follows the **same flow as iOS**: splash → Getting Started (4 slides) → sign-up → setup → vault. **PRO** is sold via **Google Play Billing** (not Stripe in the app).

## Prerequisites

- **Android Studio** (latest stable) with SDK 35
- **Google Play Console** developer account ($25 one-time)
- Node.js 18+ and npm
- Supabase project with Google OAuth enabled

## One-time setup

```bash
npm install
npm run app:icons          # regenerate launcher icons from resources/app-icon-1024.png
npm run cap:sync           # build web assets + sync android/ + patch OAuth + shell
npm run cap:android        # open Android Studio
```

In **Supabase → Authentication → URL configuration**, add:

```text
com.skyface.mypasswordvault://auth/callback
```

## Configure in Android Studio

1. Open the **`android/`** folder (Gradle sync runs automatically).
2. Confirm **applicationId** is `com.skyface.mypasswordvault` (`android/app/build.gradle`).
3. Choose a device or emulator (API 23+), then **Run** (▶).

For release builds you need an upload keystore and Play App Signing — see [Play Console help](https://support.google.com/googleplay/android-developer/answer/9842756).

## In-app purchase (PRO) — Google Play Billing

Product ID (one-time / non-consumable): `com.skyface.mypasswordvault.pro_lifetime`

1. **Play Console** → your app → **Monetize → Products → One-time products** → create product ID `com.skyface.mypasswordvault.pro_lifetime`.
2. Activate the product and add **License testers** (Play Console → Settings → License testing).
3. Upload at least one build to **Internal testing** before real purchases work.
4. On a test device, sign in with a license tester Google account.

The app uses **capacitor-plugin-cdv-purchase** (`initNativeStoreBridge.ts`). After purchase, the client calls the **`verify-store-purchase`** edge function with the purchase token.

### Server verification secrets

```bash
supabase secrets set GOOGLE_PLAY_PACKAGE_NAME=com.skyface.mypasswordvault
supabase secrets set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
npm run mobile:deploy
```

Create a **service account** in Google Cloud, enable **Google Play Android Developer API**, and grant it access in Play Console → **Users and permissions** (View financial data + Manage orders).

**Dev only** (never production): `STORE_VERIFY_DEV_BYPASS=1` — see `docs/mobile.md`.

## Environment variables for release builds

Capacitor bundles the Vite build; env vars are baked in at build time:

```bash
# .env must contain production Supabase keys before:
npm run cap:sync
```

Do not commit `.env`. Build a signed **AAB** only after sync with production values.

## Play Store upload

1. Android Studio → **Build → Generate Signed Bundle / APK** → **Android App Bundle**.
2. Play Console → create app → **Internal testing** → upload AAB.
3. Fill store listing, privacy policy, Data safety, content rating, screenshots (phone + tablet if supported).
4. **Encryption**: vault data is encrypted on-device; cloud sync stores ciphertext only.

## UI

Native Android uses the same mobile UI tokens as iOS (`html.native-app` in `src/index.css`): Inter / Noto Sans KR, shared typography scale, button radii, input heights, and icon sizes.

Patch script `scripts/patch-android-shell.mjs` runs on every `cap:sync` (transparent system bars, NoActionBar theme, Play Billing permission).

## Passkeys (setup step 2)

Android passkeys use the same `rpId` as iOS: `mypasswordvault.app` (Capacitor `server.hostname`). Google requires **Digital Asset Links** on the live site:

1. Generate `public/.well-known/assetlinks.json` with your signing certificate SHA-256:
   ```bash
   npm run android:assetlinks
   # Release / Play App Signing key (optional, comma-separated):
   ANDROID_EXTRA_SHA256_FINGERPRINTS=AA:BB:... npm run android:assetlinks
   ```
2. Deploy the web app so this URL returns JSON (not HTML):
   `https://mypasswordvault.app/.well-known/assetlinks.json`
3. Rebuild the Android app: `npm run cap:sync` → Run in Android Studio.

**Debug builds** use `~/.android/debug.keystore` — the script picks up that fingerprint automatically. **Play Store builds** need the Play App Signing SHA-256 added via `ANDROID_EXTRA_SHA256_FINGERPRINTS`.

Use a **physical device or emulator with Google Play** and a screen lock / fingerprint enrolled. After asset links propagate (can take a few minutes), tap **Continue** on the passkey step and approve the system prompt.

## Useful commands

| Command | Purpose |
|--------|---------|
| `npm run build:capacitor` | Web build only → `dist-capacitor/` |
| `npm run android:assetlinks` | Generate `assetlinks.json` for Android passkeys |
| `npm run cap:sync` | Build + sync + iOS/Android patch scripts |
| `npm run cap:android` | Sync and open Android Studio |
| `npm run cap:run:android` | Sync and run on device/emulator (CLI) |

## Live reload (optional dev)

```bash
npm run dev
CAPACITOR_DEV_SERVER=http://YOUR_LAN_IP:5173 npm run cap:sync
```

Use your machine’s LAN IP. Unset `CAPACITOR_DEV_SERVER` for release builds.

## iOS

See [ios-app-store.md](./ios-app-store.md) and [mobile.md](./mobile.md).
