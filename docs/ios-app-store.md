# iOS App Store (Capacitor)

My Password Vault runs inside a native shell via [Capacitor](https://capacitorjs.com/). The React app is built to `dist-capacitor/` and embedded in the Xcode project under `ios/`. **Release builds have no marketing landing page** — the WebView loads the vault app entry (`index.html`) directly. For **live reload**, `capacitor.config.ts` appends `/app/` to your dev server URL when you only pass the Vite origin (so you do not open the static landing at `/`).

## Prerequisites

- macOS with **Xcode 15+** (from the Mac App Store)
- **Apple Developer Program** membership ($99/year) for TestFlight and App Store
- Node.js 18+ and npm
- Supabase project with Google OAuth enabled

## One-time setup

```bash
npm install
npm run cap:sync          # build web assets + create/update ios/ + OAuth URL scheme
npx cap open ios          # opens Xcode
```

In **Supabase → Authentication → URL configuration**, add:

```text
com.skyface.mypasswordvault://auth/callback
```

Keep your existing web redirect URLs (`https://vault.skyface.com/app/**`, local dev, etc.).

## Configure signing in Xcode

1. Open `ios/App/App.xcworkspace` (not `.xcodeproj`).
2. Select the **App** target → **Signing & Capabilities**.
3. Set your **Team** and ensure **Bundle Identifier** is `com.skyface.mypasswordvault` (or change it in `capacitor.config.ts` and re-sync).
4. Confirm **In-App Purchase** capability is enabled (`npm run cap:sync` runs `patch-ios-iap.mjs`).
5. Connect an iPhone or choose a simulator, then **Run** (▶).

## In-app purchase (PRO)

Product ID (non-consumable): `com.skyface.mypasswordvault.pro_lifetime`

1. **App Store Connect** → your app → **In-App Purchases** → create the product with that ID (Ready to Submit / Approved for sandbox).
2. On a **physical device**, sign into **Settings → App Store → Sandbox Account** with a sandbox tester.
3. For **local Xcode testing** without Connect: **Product → Scheme → Edit Scheme → Run → Options → StoreKit Configuration** → select `ios/App/Products.storekit`.
4. Rebuild after changes: `npm run cap:sync`, then Xcode **Clean Build Folder** → **Run**.

If pricing shows “Could not connect to the App Store”, check the Xcode console for `store.initialize failed` or `product_missing` — usually the SKU is missing in Connect or StoreKit config is not assigned to the scheme.

## Environment variables for release builds

Capacitor bundles the Vite build; env vars are baked in at build time:

```bash
# .env must contain production Supabase keys before:
npm run cap:sync
```

Do not commit `.env`. Use Xcode **Archive** only after a sync with production values.

## TestFlight / App Store upload

1. In Xcode: **Product → Archive**.
2. **Distribute App** → App Store Connect → Upload.
3. In [App Store Connect](https://appstoreconnect.apple.com): create the app record, fill metadata, privacy questionnaire, screenshots.
4. **Encryption**: this app uses AES for the vault. On the export compliance question, answer that the app uses standard encryption (and qualifies for exemption in most cases; confirm with your legal counsel).

## Privacy & review notes

- Describe that passwords are encrypted on-device; cloud sync stores **ciphertext only**.
- Provide a privacy policy URL (required).
- Sign in uses **Google** via Supabase; no password collection on your servers.

## Useful commands

| Command | Purpose |
|--------|---------|
| `npm run build:capacitor` | Web build only → `dist-capacitor/` |
| `npm run cap:sync` | Build + copy into `ios/` + patch OAuth URL scheme |
| `npm run cap:ios` | Sync and open Xcode |
| `npm run cap:run:ios` | Sync and run on device/simulator (CLI) |

## Live reload (optional dev)

```bash
npm run dev
CAPACITOR_DEV_SERVER=http://YOUR_LAN_IP:5173 npm run cap:sync
```

The config rewrites that to `http://YOUR_LAN_IP:5173/app/` so the WebView loads the React app, not the root marketing page. You can also set `CAPACITOR_DEV_SERVER` to the full `/app/` URL yourself. If your dev server serves the SPA at `/` only, set `CAPACITOR_DEV_SERVER_USE_ROOT=1`. Use your machine’s LAN IP so the simulator/device can reach Vite. Unset `CAPACITOR_DEV_SERVER` for production archives.

## Android

```bash
npm run cap:android
```

Play Console, signing, and IAP: see [mobile.md](./mobile.md).
