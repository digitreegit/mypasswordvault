# Stripe 결제 (영구 라이선스 $4.99)

로그인 계정당 **비밀번호 항목 25개 무료** → **일회성 $4.99** 결제 시 무제한.  
결제는 **Stripe Checkout**으로 처리하고, 완료 후 **Supabase `user_entitlements`** 에 라이선스가 기록됩니다. 서버는 평문 비밀번호를 받지 않습니다.

## 아키텍처

```
앱 (로그인) ──POST──► create-checkout-session (Edge, JWT)
                           │
                           ▼
                    Stripe Checkout (hosted)
                           │
              checkout.session.completed
                           ▼
                    stripe-webhook (Edge, 서명 검증)
                           │
                           ▼
              user_entitlements.licensed = true
                           │
앱 ◄──SELECT── user_entitlements (RLS: 본인만 읽기)
```

| 구성 요소 | 경로 |
|-----------|------|
| DB | `supabase/migrations/20260515180000_user_entitlements.sql` |
| Data API grants | `supabase/migrations/20260526160000_data_api_grants.sql` |
| Checkout 생성 | `supabase/functions/create-checkout-session/` |
| Webhook | `supabase/functions/stripe-webhook/` |
| 클라이언트 | `PricingDrawer`, `PricingPage`, `src/lib/entitlements.ts` |

## 1. Stripe 계정

1. [Stripe Dashboard](https://dashboard.stripe.com)에서 **테스트 모드**로 시작합니다.
2. **Developers → API keys**에서 **Secret key** (`sk_test_…`)를 복사합니다. (운영 시 `sk_live_…`)
3. 제품/가격은 Checkout Session에서 `price_data`로 생성하므로 Stripe Catalog에 미리 만들 필요는 없습니다.

## 2. Supabase 마이그레이션

SQL Editor에서 **순서대로** 실행:

1. `20260513120000_user_vaults.sql`
2. `20260515180000_user_entitlements.sql`
3. `20260526160000_data_api_grants.sql` (Data API `GRANT` — 2026년 이후 프로젝트에 필요)
4. `20260602120000_admin_billing.sql` (관리자 대시보드: 구매 금액, 환불, 컴플레인)

신규 가입 사용자는 `user_entitlements` 행이 트리거로 자동 생성됩니다.

## 3. Edge Functions 배포

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

npm run stripe:deploy
```

또는 개별 배포:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy admin-api
```

### Secrets (필수)

Dashboard → **Edge Functions** → **Secrets** 또는:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set PUBLIC_APP_URL=https://mypasswordvault.app/app
```

| Secret | 설명 |
|--------|------|
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) |
| `PUBLIC_APP_URL` | 결제 후 돌아올 앱 URL. **프로덕션은 `/app` 포함** (예: `https://mypasswordvault.app/app`) |
| `STRIPE_LICENSE_AMOUNT_CENTS` | (선택) 기본 `499` = $4.99 USD |
| `ADMIN_EMAILS` | (선택) 관리자 대시보드 허용 이메일, 쉼표 구분 (예: `you@skyface.com`) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 는 Supabase가 함수 배포 시 주입하는 경우가 많습니다. 웹훅은 **service role**로 `user_entitlements`를 upsert합니다.

## 4. Stripe Webhook

1. **Developers → Webhooks → Add endpoint**
2. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
3. 이벤트: **`checkout.session.completed`**, **`checkout.session.async_payment_succeeded`**, **`charge.refunded`** (환불 시 PRO 해제)
4. Signing secret을 복사해 `STRIPE_WEBHOOK_SECRET`에 설정

### 로컬 테스트 (선택)

```bash
stripe listen --forward-to https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

CLI가 출력하는 `whsec_…`를 로컬/스테이징 secret으로 사용합니다.

## 5. 앱 환경 변수

프로젝트 루트 `.env` (`.env.example` 참고):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...   # Stripe Dashboard → Developers → API keys
```

로컬에서는 **`http://localhost:5173/app/`** 를 사용하세요 (`127.0.0.1`은 패스키/WebAuthn에서 문제가 날 수 있어 자동으로 `localhost`로 리다이렉트됩니다).

`npm run dev` 후 Google 로그인 → **Upgrade** → **Continue to secure checkout**. 결제 UI는 **앱 안 모달**(Stripe Embedded Checkout)에 표시됩니다.

로컬 return URL은 Edge Function이 `return_base_url: http://localhost:5173/app` 을 받아 Stripe 세션에 반영합니다. Supabase secrets의 `STRIPE_SECRET_KEY`와 `STRIPE_PUBLISHABLE_KEY`는 **둘 다 test** 또는 **둘 다 live** 여야 합니다.

`.env` 수정 후에는 dev 서버를 **재시작**하세요.

## 6. 테스트 카드 (Stripe 테스트 모드)

| 번호 | 결과 |
|------|------|
| `4242 4242 4242 4242` | 성공 |
| `4000 0000 0000 0002` | 카드 거절 |

만료일·CVC·우편번호는 임의 유효 값.

## 7. 운영 체크리스트

- [ ] 마이그레이션 3개 적용
- [ ] `create-checkout-session`, `stripe-webhook` 배포
- [ ] Edge secrets 설정 (`STRIPE_*`, `PUBLIC_APP_URL`)
- [ ] Stripe webhook URL + `checkout.session.completed`
- [ ] Vercel(또는 호스트)에 `VITE_SUPABASE_*` 설정
- [ ] 테스트 결제 후 Settings → Plan 에 **PRO** / 무제한 항목 확인
- [ ] 라이브 전환: Stripe **라이브** 키·webhook·`sk_live_` secret 교체

## 8. 문제 해결

| 증상 | 확인 |
|------|------|
| Checkout 시작 실패 | Edge Function 로그, `STRIPE_SECRET_KEY`, 사용자 JWT(로그인 여부) |
| 모달에 “Could not start checkout” | dev 콘솔에 `(reason)` 표시 — `no_publishable_key`면 `.env`에 `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` 추가 후 dev 서버 재시작 |
| Embedded checkout 빈 화면 | `STRIPE_SECRET_KEY`와 `STRIPE_PUBLISHABLE_KEY` 모드(test/live) 일치 여부 |
| 결제했는데 FREE 유지 | Webhook delivery 로그, `STRIPE_WEBHOOK_SECRET`, `user_entitlements` RLS/grants |
| 결제 후 404 | `PUBLIC_APP_URL`이 실제 앱 URL과 일치하는지 (`/app` 경로) |
| `fetchUserEntitlement` 오류 | `20260526160000_data_api_grants.sql` 실행 여부 |

관련: [new-supabase-project.md](./new-supabase-project.md) §6

## 9. 관리자 대시보드 (`/app/#/admin`)

라이선스 키(`cs_…` Checkout Session ID)로 **문의 대응·환불**을 처리하는 내부 페이지입니다.

1. SQL Editor에서 `20260602120000_admin_billing.sql` 실행
2. `supabase functions deploy admin-api`
3. Secret: `ADMIN_EMAILS=your@email.com` (Google/이메일 로그인과 동일 주소)
4. 로그인 후 **`http://localhost:5173/app/#/admin`** (프로덕션: `https://…/app/#/admin`)

기능: 오늘 판매·가입·PRO 회원·열린 컴플레인 통계, 이메일/라이선스 키 검색, Stripe 환불(라이선스 해제), 컴플레인 등록/해결.
