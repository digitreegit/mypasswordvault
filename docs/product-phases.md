# Product phases (A–D)

Fundamental product work. Autofill (C) is the long lever; A/B/D make the funnel and accounts usable first.

## Phase A — Stop drop-off (가입 → 첫 항목)

- Onboarding = **master password only** → empty vault
- Passkey offered on unlocked vault (“faster unlock?”)
- TOTP / recovery nudged in Settings banner
- Web: signed-in home → `/app/`; PWA install (`manifest` + `sw.js`)

## Phase B — Make the paywall real

- Chrome / Safari / Bitwarden / 1Password CSV column aliases
- After import: “N saved · free slots left”
- PRO prompts stay quiet until the free entry limit

## Phase C — Become a password manager

- iOS Credential Provider scaffold (`ios/AutofillExtension/`)
- Android Autofill Service scaffold (`PasswordAutofillService`)
- Browser extension later
- Details: `docs/autofill.md`

## Phase D — Hide My Email / cross-login vault split

- Canonical `user_id` with vault data; `linkIdentity` + `claim-auth-identity` (empty duplicates only)
- **Silent bridges (no instructional “do X then Y”):**
  - iOS after Apple: one-shot system Google link sheet (`silentGoogleLink`)
  - Account passkey (`auth_passkeys` + `auth-passkey-register` / `auth-passkey-login`) for web reopen without knowing Hide My Email
- Web never starts Apple OAuth; web Auth = Google + Continue with passkey / Conditional UI
- Native iOS keeps Continue with Apple; Settings “Add Apple” is iOS-only

## Do not (for now)

- Extra features (notes, shared vaults, teams)
- Ads-only growth without loop change
- Longer “more secure” onboarding
- Price/copy changes without Autofill
- Auto-merge of two non-empty vaults
