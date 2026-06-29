# Sign in with Apple (iOS only)

App Store Guideline **4.8** requires an equivalent login option when Google OAuth is offered in the iOS app. This project shows **Sign in with Apple** only on native iOS (`Capacitor.getPlatform() === "ios"`). Web and Android are unchanged.

## App code

- Login button: `src/components/AuthScreen.tsx`
- OAuth flow: `src/lib/nativeAuth.ts` → `signInWithAppleNative()` (same deep-link return as Google)
- Entitlement: `ios/App/App/App.entitlements` (`com.apple.developer.applesignin`)

## One-time setup (you must do in dashboards)

### 1. Apple Developer

1. **Identifiers → App IDs → `com.skyface.mypasswordvault`** → enable **Sign In with Apple**.
2. **Identifiers → Services IDs** → create e.g. `com.skyface.mypasswordvault.auth` (or reuse your web Services ID).
3. Configure the Services ID **Sign In with Apple**:
   - **Domains**: your Supabase auth host (e.g. `auth.mypasswordvault.app` or `xxxx.supabase.co`)
   - **Return URLs**: `https://<auth-host>/auth/v1/callback`
4. **Keys** → create a **Sign in with Apple** key (.p8). Note **Key ID** and **Team ID**.

### 2. Supabase

1. **Authentication → Providers → Apple** → Enable.
2. **Client IDs**: Services ID (e.g. `com.skyface.mypasswordvault.auth`).
3. **Secret**: generate a **JWT client secret** from the `.p8` key (Supabase expects a JWT, not raw `.p8` text):

```bash
node scripts/generate-apple-oauth-secret.mjs ~/Downloads/AuthKey_KWBH5GD5AS.p8
```

Copy the single long `eyJ...` line into **Secret Key (for OAuth)**. Regenerate every ~6 months (Apple limit).
4. **Authentication → URL configuration → Redirect URLs** — ensure this is listed:
   - `com.skyface.mypasswordvault://auth/callback`

### 3. Rebuild iOS

```bash
npm run cap:sync
```

Then archive a new build (increment build number) and resubmit to App Store Connect. Update **screenshots** if the login screen changed.

## Test on device

1. Install the new iOS build on a physical device or TestFlight.
2. Open **Get started** → tap **Sign in with Apple** (above Google).
3. Complete Apple ID flow → app should return via `com.skyface.mypasswordvault://auth/callback` and land signed in.

If OAuth fails, check Supabase **Auth logs** and confirm Apple Services ID return URL matches your Supabase callback exactly.
