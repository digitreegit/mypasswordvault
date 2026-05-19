# Google 로그인: "continue to …supabase.co" → 내 도메인

Google 계정 선택 화면의 **"to continue to …"** 문구는 앱 소스가 아니라 **OAuth 요청을 처리하는 호스트**입니다. 기본 Supabase URL(`YOUR_REF.supabase.co`)을 쓰면 프로젝트 ref가 그대로 노출됩니다.

**목표:** `fzwkemfytbaymkjrygpb.supabase.co` (또는 커스텀 API 호스트) 대신 `mypasswordvault.app` 계열 호스트로 보이게 하기.

## 요약

| 단계 | 작업 |
|------|------|
| 1 | Supabase **Custom Domain** 활성화 (유료 플랜 애드온) |
| 2 | DNS(CNAME) + SSL 완료 후 `VITE_SUPABASE_URL`을 커스텀 API 호스트로 변경 |
| 3 | Supabase **Redirect URLs** / Google Cloud **Authorized redirect URIs** 갱신 |
| 4 | Google **OAuth consent screen**에 앱 이름·로고·`mypasswordvault.app` 도메인 등록 |

Google에는 보통 **커스텀 도메인 전체 호스트**가 표시됩니다(예: `auth.mypasswordvault.app`). 마케팅 사이트와 같은 **apex**(`mypasswordvault.app`)만 단독으로 Auth API에 쓰는 구성은 Supabase 기본 패턴과 맞지 않는 경우가 많습니다. apex와 동일한 **등록 도메인**으로 보이게 하려면 `auth.mypasswordvault.app` 같은 서브도메인을 쓰는 것이 일반적입니다.

참고: [Supabase — Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [Custom Domains](https://supabase.com/docs/guides/platform/custom-domains)

---

## 1. Supabase Custom Domain

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 → **Project Settings** → **Custom Domains**
2. Auth/API용 호스트 추가 (예: `auth.mypasswordvault.app`)
3. 안내대로 DNS **CNAME** 설정 후 검증·SSL 활성화 대기
4. 활성화되면 **프로젝트 API 베이스 URL**이 `https://auth.mypasswordvault.app` 형태가 됩니다

## 2. 환경 변수 (Vercel / `.env`)

배포·로컬 빌드 모두 **재배포/재시작** 필요.

```env
VITE_SUPABASE_URL=https://auth.mypasswordvault.app
VITE_SUPABASE_ANON_KEY=<기존 anon key 그대로>
```

`src/lib/supabase.ts`는 `VITE_SUPABASE_URL`만 사용하므로, 커스텀 도메인이 켜진 뒤 URL만 바꾸면 OAuth도 새 호스트로 나갑니다.

## 3. Supabase Authentication URL

**Authentication → URL configuration**

- **Site URL:** `https://mypasswordvault.app/app` (또는 개발용 `http://127.0.0.1:5173/app`)
- **Redirect URLs** (기존 유지 + 필요 시 추가):
  - `https://mypasswordvault.app/app/**`
  - `http://127.0.0.1:5173/app/**`, `http://localhost:5173/app/**`
  - Capacitor: `com.skyface.mypasswordvault://auth/callback`

OAuth **콜백**은 Supabase Auth 엔드포인트입니다. 커스텀 도메인 적용 후:

`https://auth.mypasswordvault.app/auth/v1/callback`

(실제 호스트는 대시보드에 표시된 커스텀 도메인과 동일하게 맞춥니다.)

## 4. Google Cloud Console

**APIs & Services → Credentials** → Supabase **Google** 프로바이더에 넣은 OAuth 2.0 클라이언트

1. **Authorized redirect URIs**에 위 콜백 URL 추가  
   - 마이그레이션 기간에는 기존 `https://fzwkemfytbaymkjrygpb.supabase.co/auth/v1/callback`도 잠시 유지 가능
2. **OAuth consent screen**
   - App name: `My Password Vault` (또는 제품명)
   - User support / Developer contact
   - **Authorized domains:** `mypasswordvault.app` (서브도메인 콜백을 쓰면 상위 도메인 등록)
   - 로고·홈페이지 URL: `https://mypasswordvault.app`

Supabase 대시보드 **Authentication → Providers → Google**에서 **자체 Google Client ID/Secret**을 쓰는 경우에만 이 콘솔 설정이 직접 반영됩니다. Supabase 기본 Google 앱을 쓰면 Supabase 측 도메인 정책이 우선입니다.

## 5. 확인

1. 시크릿 창에서 **Continue with Google** 실행
2. Google 화면에 `continue to auth.mypasswordvault.app`(또는 설정한 커스텀 호스트)가 보이는지 확인
3. 로그인 후 `https://mypasswordvault.app/app/` 로 돌아오는지 확인

## 코드에서 바꿀 수 없는 것

`signInWithOAuth({ provider: 'google', options: { redirectTo } })`의 `redirectTo`는 **로그인 완료 후 앱으로 돌아올 URL**입니다. Google **"continue to"** 호스트는 바꾸지 않습니다.

---

**체크리스트**

- [ ] Supabase Custom Domain 활성
- [ ] `VITE_SUPABASE_URL` 업데이트 + Vercel 재배포
- [ ] Supabase Redirect URLs / Site URL
- [ ] Google redirect URI + consent screen 도메인
- [ ] Google 로그인 UI에서 supabase.co 문구 사라짐 확인
