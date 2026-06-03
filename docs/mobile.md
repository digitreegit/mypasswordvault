# Mobile apps (iOS & Android)

Capacitor wraps the same React vault app. **Account identity** is Supabase Auth (`user.id` + email). **Vault data** is `user_vaults` (encrypted backup JSON). **PRO license** is `user_entitlements.licensed` — same row whether the user pays on **web (Stripe)** or **App Store / Play (IAP)**.

## Git workflow (solo)

You do **not** need separate PRs or branches. Commit phases on `main` (or one long-lived `mobile` branch if you prefer). This doc tracks Phase 1–4 checklist.

## Phase 1 — Store shells (iOS + Android)

| Task | Status |
|------|--------|
| Capacitor iOS (`ios/`) | Done |
| Capacitor Android (`android/`) | `npx cap add android` |
| OAuth deep link `com.skyface.mypasswordvault://auth/callback` | iOS patch script; Android `patch-android-oauth.mjs` |
| `npm run cap:sync` / `cap:ios` / `cap:android` | package.json |
| Native: no Stripe card UI (`usesStoreBilling()`) | `src/lib/platform.ts` |
| Docs | `docs/ios-app-store.md`, this file |

### Commands

```bash
npm install
npm run cap:sync          # build dist-capacitor + sync both platforms
npm run cap:ios           # open Xcode
npm run cap:android       # open Android Studio
```

Supabase → Authentication → URL configuration → add:

```text
com.skyface.mypasswordvault://auth/callback
```

Production build: set `.env` with `VITE_SUPABASE_*`, then `npm run cap:sync` before Archive / AAB.

## Phase 2 — IAP + server verify

| Task | Status |
|------|--------|
| DB `store_transaction_id`, `store_product_id` | migration `20260605120000_store_purchase_ids.sql` |
| Edge `verify-store-purchase` (JWT) | `supabase/functions/verify-store-purchase/` |
| Client `src/lib/storePurchase.ts` | Bridge + invoke |
| Pricing UI (App Store / Play buttons, Restore) | `PricingTiers`, `useProPurchase` |
| Apple / Google real verification | TODO in edge function |
| Native billing plugin | Wire `window.__mpwStoreBridge` (below) |

### Product ID (both stores)

```text
com.skyface.mypasswordvault.pro_lifetime
```

Create a **non-consumable** (one-time) product in App Store Connect and Google Play Console with this SKU.

### Deploy edge function

```bash
supabase functions deploy verify-store-purchase
```

Secrets (production):

| Secret | Purpose |
|--------|---------|
| `APPLE_BUNDLE_ID` | e.g. `com.skyface.mypasswordvault` |
| `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | App Store Server API |
| `GOOGLE_PLAY_PACKAGE_NAME` | Same as applicationId |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Play Developer API service account |

**Dev only** (never in production): `STORE_VERIFY_DEV_BYPASS=1` — client sends `verification_data: "dev_ok"` from `devGrantStoreLicense()` when the native bridge is missing.

### Native bridge (plugin wiring)

Before React boots (or in `main.tsx`), assign:

```ts
import type { StorePurchasePayload } from "./lib/storePurchase";

window.__mpwStoreBridge = {
  async purchase(productId) {
    // Call StoreKit 2 / Play Billing; return receipt/token
    return {
      platform: "ios", // or "android"
      productId,
      verificationData: "<jws or purchase token>",
      transactionId: "<optional>",
    };
  },
  async restore() {
    // Return latest owned transaction or null
    return null;
  },
};
```

Recommended plugins (pick one path):

- **RevenueCat** — `@revenuecat/purchases-capacitor` (fastest cross-store)
- **cordova-plugin-purchase** — works with Capacitor
- Custom thin native module

Until the bridge exists, the app shows **storeBridgePending** and allows **dev grant** in `import.meta.env.DEV` only.

## Phase 3 — Mobile UX

| Task | Notes |
|------|--------|
| Safe area insets | `index.html` viewport + Tailwind `env(safe-area-inset-*)` on drawers/headers |
| Passkeys in WebView | Test on device; fallback master + TOTP prominent |
| `@capacitor/preferences` / Keychain | Session prefs |
| Universal Links / App Links | Optional Stripe/OAuth https returns |

## Phase 4 — Polish

| Task | Notes |
|------|--------|
| Push (optional) | New device sign-in alerts |
| Biometric app lock | Before vault unlock |
| Widgets | Platform-specific |
| App Store / Play metadata | Privacy, encryption export |

## Billing matrix

| Surface | Payment | `purchase_platform` |
|---------|---------|---------------------|
| Web | Stripe Checkout | `web` |
| iOS app | App Store IAP | `ios` |
| Android app | Google Play | `android` |

Same email → same `user_id` → same vault + license on all devices after sync.

## Related files

- `capacitor.config.ts`
- `src/lib/platform.ts`, `src/lib/storePurchase.ts`, `src/hooks/useProPurchase.ts`
- `docs/billing-stripe.md` (web)
- `docs/ios-app-store.md` (TestFlight)
