# 새 Supabase 프로젝트로 전환

현재 프로덕션 프로젝트 예시:

- **Project URL:** `https://fzwkemfytbaymkjrygpb.supabase.co`
- **Reference ID:** `fzwkemfytbaymkjrygpb`

## 1. API 키 (로컬 + Vercel)

Supabase Dashboard → **Project Settings** → **API**:

| 변수 | 값 |
|------|-----|
| `VITE_SUPABASE_URL` | `https://fzwkemfytbaymkjrygpb.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | **anon** / **publishable** 공개 키 (새 프로젝트 것) |

로컬: 프로젝트 루트 `.env` 수정 후 `npm run dev` 재시작.

Vercel: **Settings → Environment Variables** 에 동일하게 설정 후 **Redeploy**.

## 2. 데이터베이스 (SQL Editor)

Dashboard → **SQL** → New query. 아래 순서로 실행:

1. `supabase/migrations/20260513120000_user_vaults.sql`
2. `supabase/migrations/20260515180000_user_entitlements.sql`

## 3. Google OAuth

**Authentication → Providers → Google** 활성화 (Client ID/Secret).

**Authentication → URL configuration**:

| 항목 | 값 |
|------|-----|
| Site URL | `https://mypasswordvault.app/app` |
| Redirect URLs | `https://mypasswordvault.app/app/**` |
| | `http://127.0.0.1:5173/app/**` |
| | `http://localhost:5173/app/**` |
| | `com.skyface.mypasswordvault://auth/callback` (Capacitor) |

Google Cloud Console **Authorized redirect URI** 에 추가:

`https://fzwkemfytbaymkjrygpb.supabase.co/auth/v1/callback`

## 4. Edge Functions (Stripe 라이선스)

새 프로젝트에 함수 배포 및 시크릿 설정:

```bash
supabase login
supabase link --project-ref fzwkemfytbaymkjrygpb
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

Dashboard → **Edge Functions** → Secrets (또는 CLI `supabase secrets set`):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PUBLIC_APP_URL` = `https://mypasswordvault.app/app`

`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 는 배포 시 자동 주입되는 경우가 많습니다. 웹훅 URL은 Stripe에  
`https://fzwkemfytbaymkjrygpb.supabase.co/functions/v1/stripe-webhook` 로 등록합니다.

## 5. 앱에서 확인

1. `.env` 반영 후 로그인 → 새 vault 설정 또는 클라우드에서 복원
2. 이전 프로젝트(`xdzodkjjoqkadyicxerd`) 데이터는 **자동 이전되지 않음** (암호화 백업·마스터 비밀번호로만 복구 가능)
