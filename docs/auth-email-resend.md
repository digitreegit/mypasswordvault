# Auth 이메일 (Resend + Supabase Edge Functions)

로그인 화면에서:

| 동작 | 메일 발송 경로 |
|------|----------------|
| **Sign up** (이메일 확인) | Supabase Auth → **Send Email Hook** → `send-auth-email` → Resend |
| **Forgot password** | 브라우저 → **`send-password-reset`** Edge Function → Resend |

`Failed to fetch` / 메일이 안 오는 경우, 아래를 **순서대로** 확인하세요.

---

## 0. 지금 상태 점검 (가장 흔한 원인)

프로젝트 `fzwkemfytbaymkjrygpb`에 함수가 **아직 없으면** 비밀번호 찾기가 실패합니다.

```bash
curl -s -X POST "https://fzwkemfytbaymkjrygpb.supabase.co/functions/v1/send-password-reset" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email":"you@example.com"}'
```

- `{"code":"NOT_FOUND","message":"Requested function was not found"}` → **§2 배포** 필요
- `{"ok":true}` → 함수는 동작 중 (Resend·도메인만 확인)

앱의 `VITE_SUPABASE_URL`이 `https://auth.mypasswordvault.app` 이면 같은 경로로 호출합니다:

`https://auth.mypasswordvault.app/functions/v1/send-password-reset`

---

## 1. Resend 준비

1. [Resend](https://resend.com) → API Keys → `re_...` 키 생성
2. **Domains** → `mypasswordvault.app` (또는 발신에 쓸 도메인) DNS 인증 완료
3. 발신 주소 예: `My Password Vault <noreply@mypasswordvault.app>`

---

## 2. Edge Functions 배포 + Secrets

로컬에서 Supabase CLI:

```bash
cd /path/to/MyPasswordVault
supabase login
supabase link --project-ref fzwkemfytbaymkjrygpb

# Resend (두 함수 공통)
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set RESEND_FROM="My Password Vault <noreply@mypasswordvault.app>"

# 비밀번호 재설정 (Forgot password)
supabase functions deploy send-password-reset

# 가입·이메일 확인 등 (Send Email Hook)
supabase functions deploy send-auth-email
```

`SUPABASE_URL` / service role 키는 배포 시 프로젝트에 자동 주입되는 경우가 많습니다.  
Dashboard → **Edge Functions** → 각 함수 **Logs**에서 `server_misconfigured` 가 없는지 확인하세요.

선택:

```bash
supabase secrets set RESET_EMAIL_SUBJECT="Reset your My Password Vault password"
```

---

## 3. Sign up 확인 메일 (Send Email Hook) — **Forgot password와 별도**

`send-password-reset`만 배포한 상태에서는 **가입 확인 메일은 나가지 않습니다.**  
Sign up 후 파란 안내 문구만 보이고 메일이 없다면 아래 Hook 설정이 필요합니다.

### 보내는 사람이 `Supabase Auth` / `noreply@mail.app.supabase.io` 인 경우

그 메일은 **Supabase 기본 메일**입니다. Hook이 꺼져 있거나 `send-auth-email`이 실패했을 때 나갑니다.

| 원하는 값 | 설정 |
|-----------|------|
| 표시 이름 | `My Password Vault` |
| 주소 | `noreply@mypasswordvault.app` |

1. Resend에서 `mypasswordvault.app` 도메인 **Verified**
2. `supabase secrets set RESEND_FROM="My Password Vault <noreply@mypasswordvault.app>"`
3. `send-auth-email` 배포 + 아래 **Send Email Hook** 켜기
4. 테스트 가입 후 Resend Dashboard → Emails 에 발송 기록 확인

Hook이 켜지면 가입 확인 메일은 **브랜드 HTML 템플릿** + 위 발신 주소로 나갑니다.

## 3a. Sign up 확인 메일 (Send Email Hook)

Dashboard → **Authentication** → **Hooks** (또는 **Auth Hooks**) → **Send Email**:

| 항목 | 값 |
|------|-----|
| Enable | On |
| Hook URL | `https://fzwkemfytbaymkjrygpb.supabase.co/functions/v1/send-auth-email` |
| Secret | 생성 후 CLI에 저장 |

```bash
supabase secrets set SEND_EMAIL_HOOK_SECRET=v1,whsec_xxxxxxxx
```

Hook secret은 Dashboard에 표시된 값 **그대로** (또는 `v1,whsec_` 접두 포함) `SEND_EMAIL_HOOK_SECRET`에 넣습니다.  
`send-auth-email` 코드는 `v1,whsec_` 접두를 제거한 뒤 검증합니다.

**Authentication → Providers → Email** 이 켜져 있고, **Confirm email** 이 필요하면 가입 후 확인 메일이 Hook을 통해 나갑니다.

**Authentication → URL configuration** 에 앱 복귀 URL이 있어야 합니다 (비밀번호 재설정 링크가 여기로 돌아옵니다):

- `http://127.0.0.1:5173/app/**` ← curl `redirectTo` 와 **정확히 같은 호스트** (`127.0.0.1`, 포트 `5173`)
- `http://localhost:5173/app/**` (localhost로 열 때)
- `https://mypasswordvault.app/app/**`

링크 클릭 시 Supabase 화면에 **redirect url not allowed** 가 나오면 위 목록이 빠진 것입니다.

---

## 4. Forgot password (앱 → `send-password-reset`)

코드는 Supabase 기본 `resetPasswordForEmail` 대신 Edge Function을 직접 호출합니다 (`src/lib/passwordReset.ts`).

필수:

1. §2에서 `send-password-reset` 배포 + `RESEND_API_KEY`, `RESEND_FROM`
2. 앱 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 가 **같은 프로젝트** 것
3. Vercel 사용 시 env 변경 후 **Redeploy**

성공 시 UI는 항상 “메일을 보냈다”고 안내하고, 실제 발송은 Resend 로그에서 확인합니다.

---

## 5. `Failed to fetch` 트러블슈팅

| 원인 | 해결 |
|------|------|
| 함수 미배포 (404) | §2 `supabase functions deploy send-password-reset` |
| 잘못된 `VITE_SUPABASE_URL` | `.env` / Vercel과 Dashboard URL 일치, dev 서버 재시작 |
| Custom domain만 쓰는데 함수 404 | 일단 `https://fzwkemfytbaymkjrygpb.supabase.co` 로 배포·테스트 후 custom domain 재확인 |
| 브라우저 확장/광고 차단 | 시크릿 창에서 재시도 |
| Resend 도메인 미인증 | Resend Dashboard에서 도메인 Verified |

배포 후에도 `Failed to fetch` 이면 DevTools → **Network** 탭에서  
`send-password-reset` 요청의 URL·상태 코드·CORS 오류를 확인하세요.

---

## 6. 빠른 체크리스트

- [ ] Resend API 키 + 발신 도메인 인증
- [ ] `send-password-reset` 배포 + secrets
- [ ] `send-auth-email` 배포 + `SEND_EMAIL_HOOK_SECRET`
- [ ] Auth Send Email Hook URL 연결
- [ ] Email provider 활성, Redirect URLs 설정
- [ ] curl 또는 앱에서 Forgot password 테스트
- [ ] Resend Dashboard → Emails 에 발송 기록
