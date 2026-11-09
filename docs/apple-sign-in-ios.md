# Cross-platform account linking (Apple ↔ Google)

Vault data is keyed by Supabase **`user_id`**, not email. Apple **Hide My Email** never reveals the real address, so email auto-merge cannot unify Apple and Google. This project keeps **one canonical user** (the one with the vault) and **links** other providers with `linkIdentity`. Empty duplicate Auth users can be deleted by the `claim-auth-identity` Edge Function so linking can succeed.

Users must not be taught “type your Apple Account on the web” or “add Google after Apple.” Continuity is silent:

1. **Master-password continuity** — after the vault exists, a PBKDF2 proof of the master password is registered (`vault_continuity`). On web, an empty Google/email account that sets up with the **same** master password is asked to confirm, then absorbed into that vault owner (identities moved, empty Auth user deleted, session switched; Apple Hide My Email unchanged).
2. **Claim** — empty mistaken Auth users can still be deleted when linking.
3. **Account passkey** (optional) — web Continue with passkey when registered.

## Product rules

1. The `user_id` that already has vault data is canonical. Login methods are only added to that user.
2. Two non-empty vaults are **never** auto-merged (E2E / ownership). Export/import is the escape hatch.
3. A given Apple or Google identity belongs to at most one user. If it sits on an **empty** other user, claim deletes that user and linking retries. If the other user has data, linking is refused — sign in with that method instead.
4. GoTrue must allow manual linking: `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED=true` on the VPS Auth service.

## App surfaces

| Surface | Behavior |
|--------|----------|
| Auth (iOS) | Google + Continue with Apple (confirm sheet prefers Google if a web vault already exists). |
| Auth (web) | Google + Continue with passkey (Conditional UI when available). **No** Apple OAuth. |
| Setup | Master password → register continuity proof (or absorb if same PW as existing vault). No Google sheet after Apple. |
| Settings → Account | Linked methods + **Add Google**; **Add Apple** is iOS-only. |

## Client / server code

- OAuth / link: `src/lib/auth.tsx`, `src/lib/nativeAuth.ts`
- Continuity: `src/lib/vaultContinuity.ts` → `supabase/functions/vault-continuity/` + `vault_continuity` migration
- Empty-orphan helpers: `src/lib/appleRelayAccount.ts`, `src/lib/abandonedAuthUser.ts`
- Claim API: `src/lib/claimAuthIdentity.ts` → `supabase/functions/claim-auth-identity/`
- Account passkey (optional): `src/lib/authPasskey.ts`, `auth-passkey-register` / `auth-passkey-login`

## Flows

### S1 — Web Google vault first → later iOS Apple (Hide My Email)

1. Prefer Google on iOS when a web vault already exists (Apple confirm sheet).
2. If an empty Hide My Email account was created by mistake: sign in with Google → **Add Apple** on iOS (claim deletes the empty relay user if needed).
3. Later Apple sign-in hits the same `user_id`.

### S2 — iOS Apple relay vault first → later web (primary)

1. Apple Sign-In → master password → vault (continuity proof registered on finalize / unlock).
2. Web: Continue with Google/email (new empty Auth user) → enter **the same master password** at setup → confirm “Already use the iPhone app?” → **Yes** absorbs: Google/email identity maps onto the iPhone vault owner (Hide My Email string unchanged). Session switches; same vault items appear.
3. Afterward: Apple still opens the vault on iPhone; Google/email also opens the same vault with the same master password.
4. If the user declines and starts fresh with a password already bound elsewhere, setup blocks with “choose a different master password.” Different passwords keep separate vaults.

## One-time setup (dashboards)

### 1. Apple Developer

1. **Identifiers → App IDs → `com.skyface.mypasswordvault`** → enable **Sign In with Apple**.
2. **Identifiers → Services IDs** → e.g. `com.skyface.mypasswordvault.auth`.
3. Configure the Services ID **Sign In with Apple**:
   - **Domains**: `auth.mypasswordvault.app`
   - **Return URLs**: `https://auth.mypasswordvault.app/auth/v1/callback`
4. **Keys** → Sign in with Apple key (.p8). Note **Key ID** and **Team ID**.

### 2. Auth / GoTrue (self-hosted)

1. Enable Apple provider (Client ID = Services ID; Secret = JWT from `.p8`).
2. Redirect allow list includes web callbacks and `com.skyface.mypasswordvault://auth/callback`.
3. **Manual linking:** `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED=true`.

### 3. Deploy functions + migration

Apply `supabase/migrations/20261107130000_vault_continuity.sql` on the VPS Postgres, then sync Edge Functions (`vault-continuity`, `claim-auth-identity`, `_shared`).

```bash
tar -C supabase -czf /tmp/mpv-functions.tgz functions
scp -i ~/.ssh/inmotion_vps /tmp/mpv-functions.tgz deploy@23.235.194.180:/tmp/
ssh mpv-vps 'sudo tar -C /opt/mpv/volumes -xzf /tmp/mpv-functions.tgz && cd /opt/mpv && sudo docker compose up -d --force-recreate --no-deps functions'
```

### 4. Rebuild native apps when Auth UI changes

```bash
npm run cap:sync
```

## Manual verification matrix

- **S2 happy:** iOS Apple Hide My Email → web Google/email + same master password → confirm → same vault.
- **S2 decline:** same password but “start fresh” → blocked with choose another master password.
- **S1:** Web Google with entries → iOS Apple empty → claim + link → Apple again = same entries.
- **Negative:** Two users both with vault data → claim refuses deletion.
- **Regression:** Web must not show Apple OAuth / Apple ID email field.

## Out of scope

- Server-side merge of two non-empty vaults.
- Showing the real email behind Hide My Email (Apple does not provide it).
- Removing the Apple button on iOS (Guideline 4.8 when Google is offered).
- Restoring web Apple OAuth.
