# Cross-platform account linking (Apple ↔ Google)

Vault data is keyed by Supabase **`user_id`**, not email. Apple **Hide My Email** never reveals the real address, so email auto-merge cannot unify Apple and Google. This project keeps **one canonical user** (the one with the vault) and **links** other providers with `linkIdentity`. Empty duplicate Auth users can be deleted by the `claim-auth-identity` Edge Function so linking can succeed.

## Product rules

1. The `user_id` that already has vault data is canonical. Login methods are only added to that user.
2. Two non-empty vaults are **never** auto-merged (E2E / ownership). Export/import is the escape hatch.
3. A given Apple or Google identity belongs to at most one user. If it sits on an **empty** other user, claim deletes that user and linking retries. If the other user has data, linking is refused — sign in with that method instead.
4. GoTrue must allow manual linking: `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED=true` on the VPS Auth service.

## App surfaces

| Surface | Behavior |
|--------|----------|
| Auth (iOS + web) | Google and **Continue with Apple** (not Android). Apple opens a short confirm sheet (Hide My Email risk / prefer Google if web vault exists). Web copy nudges iPhone-first users to use Apple. |
| Setup / Lock | `AccountContinuityBanner` — empty relay orphan, “already have a vault?”, missing Google/Apple nudge. |
| Settings → Account | Linked methods + **Add Google** / **Add Apple** (`linkGoogleIdentity` / `linkAppleIdentity`, with claim-then-retry). |

## Client code

- OAuth / link: `src/lib/auth.tsx`, `src/lib/nativeAuth.ts`
- Empty-orphan helpers: `src/lib/appleRelayAccount.ts`, `src/lib/abandonedAuthUser.ts`
- Claim API client: `src/lib/claimAuthIdentity.ts`
- Edge Function: `supabase/functions/claim-auth-identity/` (+ `_shared/emptyAccount.ts`)

## Flows

### S1 — Web Google vault first → later iOS Apple (Hide My Email)

1. Prefer Google on iOS when a web vault already exists.
2. If a empty Hide My Email account was created by mistake: banner → sign out → sign in with Google → Settings **Add Apple** (claim deletes the empty relay user if needed).
3. Later Apple sign-in (including Hide My Email) hits the same `user_id`.

### S2 — iOS Apple relay vault first → later web

1. After Apple (especially relay): banner nudges **Add Google** before using the web.
2. On web Auth, use **Continue with Apple** to open the same vault (do not create a fresh Google-only empty account first).
3. Settings **Add Google** so web Google opens the same vault. An abandoned empty Google user can be claimed when linking.

## One-time setup (dashboards)

### 1. Apple Developer

1. **Identifiers → App IDs → `com.skyface.mypasswordvault`** → enable **Sign In with Apple**.
2. **Identifiers → Services IDs** → e.g. `com.skyface.mypasswordvault.auth`.
3. Configure the Services ID **Sign In with Apple**:
   - **Domains**: `auth.mypasswordvault.app`
   - **Return URLs**: `https://auth.mypasswordvault.app/auth/v1/callback`
4. **Keys** → Sign in with Apple key (.p8). Note **Key ID** and **Team ID**.

### 2. Auth / GoTrue (self-hosted)

1. Enable Apple provider (Client ID = Services ID; Secret = JWT from `.p8`):

```bash
node scripts/generate-apple-oauth-secret.mjs ~/Downloads/AuthKey_KWBH5GD5AS.p8
```

2. Redirect allow list includes:
   - Web app callback(s)
   - `com.skyface.mypasswordvault://auth/callback`
3. **Manual linking:** `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED=true` (Auth container env), then recreate Auth.

### 3. Deploy `claim-auth-identity`

Self-hosted Edge Functions live under `/opt/mpv/volumes/functions/`. Sync the repo `supabase/functions/` tree (including `_shared` and `claim-auth-identity`) and recreate the `functions` service:

```bash
# From project root, on a machine with SSH to mpv-vps:
tar -C supabase -czf /tmp/mpv-functions.tgz functions
scp -i ~/.ssh/inmotion_vps /tmp/mpv-functions.tgz deploy@23.235.194.180:/tmp/
ssh mpv-vps 'sudo tar -C /opt/mpv/volumes -xzf /tmp/mpv-functions.tgz && cd /opt/mpv && sudo docker compose up -d --force-recreate --no-deps functions'
```

Empty-account deletion requires the function’s service-role key (already provided to the `functions` service via `functions.env`).

### 4. Rebuild native apps when Auth UI changes

```bash
npm run cap:sync
```

## Manual verification matrix

- **S1:** Web Google with entries → iOS Apple Hide My Email (empty) → claim + link → Apple again = same entries.
- **S2:** iOS Apple relay with entries → web Apple = same → Add Google → web Google = same.
- **S2 trap:** iOS Apple with entries → web Google empty signup → interstitial → Apple → Add Google → empty Google user claimed.
- **Regression:** Google-only iOS/web; Share My Email Apple (email match when Apple returns real email); PRO / complimentary never deleted by claim.
- **Negative:** Two users both with vault data → claim refuses deletion.

## Out of scope

- Server-side merge of two non-empty vaults.
- Showing the real email behind Hide My Email (Apple does not provide it).
- Removing the Apple button (Guideline 4.8 when Google is offered on iOS).
