# Autofill (Phase C)

Goal: stop copy-paste. System password bars / Autofill should offer My Password Vault entries.

## Status

| Platform | Scaffold | Production fill |
|----------|----------|-----------------|
| iOS Credential Provider Extension | Sources under `ios/AutofillExtension/` | Needs App Group + unlock bridge + Xcode target |
| Android Autofill Service | `PasswordAutofillService` + manifest | Needs vault decrypt bridge from WebView/Capacitor |
| Browser extension | Not started | Separate Chromium/WebExt package later |

## iOS

1. Apple Developer → App ID → enable **AutoFill Credential Provider**.
2. Xcode → File → New → Target → **Credential Provider Extension** (bundle id e.g. `com.skyface.mypasswordvault.autofill`).
3. Replace generated sources with files in `ios/AutofillExtension/` (or add those files to the target).
4. App Group `group.com.skyface.mypasswordvault` on app + extension (encrypted credential cache written after unlock).
5. Settings → Passwords → Autofill → enable **My Password Vault**.

Until the shared vault bridge ships, the extension shows a placeholder and opens the main app.

## Android

1. `PasswordAutofillService` is declared in `AndroidManifest.xml`.
2. User: Settings → Passwords & accounts → Autofill service → My Password Vault.
3. Real fills require a native module that can read unlocked (or biometric-gated) ciphertext from the same store as the Capacitor app.

## Security notes

- Never store master password in the extension process longer than a fill.
- Prefer biometric gate + short-lived unwrapped data key in the App Group / Android Keystore.
- Server never sees plaintext; Autofill must use on-device crypto only.
