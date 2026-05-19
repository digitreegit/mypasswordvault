# My Password Vault

엑셀처럼 직관적인 폼으로 다루는 로컬 우선(local-first) 비밀번호 매니저. 단 하나의 마스터 비밀번호 + 2단계 인증(TOTP)으로 잠금을 해제하고, 각 비밀번호는 AES-GCM-256으로 암호화되어 브라우저 IndexedDB에 저장됩니다. Supabase를 설정하면 동일한 암호문이 계정에 동기화되어 여러 기기에서 이어 쓸 수 있습니다.

## 핵심 특징

- 엑셀 스타일의 인라인 편집 가능한 그리드 (사이트 / URL / 사용자명 / 비밀번호 / 메모)
- 한 번의 클릭으로 사용자명·비밀번호 복사, URL 새 탭에서 열기
- 비밀번호 칸은 행별 / 전체 보기-숨기기 토글
- 비밀번호 자동 생성 (길이·문자 클래스 옵션, CSPRNG, 모듈로 편향 제거)
- 마스터 비밀번호로부터 PBKDF2-SHA256(310,000회) + 32B salt로 키 파생
- 모든 비밀번호와 TOTP 비밀키는 AES-GCM-256 + 12B 랜덤 IV로 암호화
- TOTP 2FA (Google Authenticator, 1Password, Authy 등 호환). QR + 수동 키 모두 제공
- 자동 잠금 (기본 5분 비활성) + 페이지 닫을 때 메모리 키 폐기
- 복사된 비밀번호는 20초 후 클립보드에서 자동 제거
- 로그인 시 **Supabase**에 동일한 암호문 JSON(백업과 같은 형식)을 동기화해 여러 기기·브라우저에서 사용 가능(마스터 비밀번호·파생 키는 여전히 서버에 없음)
- 서버는 **평문 비밀번호나 마스터 비밀번호를 받지 않음** — 로그인은 Supabase Auth **Google**만 담당

## 보안 모델

```
masterPassword + salt
        |
   PBKDF2-SHA256 (310k iters)
        |
        v
  256-bit AES-GCM key (메모리에만 존재)
        |
        +-- VERIFIER 평문 암호화 → 마스터 비번 검증
        +-- TOTP 비밀키 암호화
        +-- 각 항목의 password 필드 암호화 (per-entry IV)
```

- `meta.vault`: salt, 암호화된 verifier, 암호화된 TOTP 비밀키, 자동잠금 설정
- `entries.*`: 항목별 id, 사이트, URL, 사용자명, **암호화된 비밀번호**, 메모
- (로그인 시) Supabase `user_vaults`: 위와 **동일한 암호문**을 JSON 텍스트로 사용자별 1행 저장(RLS로 본인만 읽기/쓰기)

저장되지 않는 것:

- 마스터 비밀번호 (원본도, 해시도)
- 파생된 AES 키 (메모리 + 잠금 해제 시간 동안만)

## Supabase 연동(멀티 디바이스)

1. [Supabase](https://supabase.com)에서 프로젝트를 만들고 **Authentication → Providers**에서 **Google**을 켭니다. **Authentication → URL configuration**의 **Redirect URLs**에 아래를 포함합니다(개발·배포 모두). OAuth는 React 앱이 `/app/`에서 열리므로 **`/app/**` 경로가 반드시 허용**되어야 합니다.  
   - 예: `http://127.0.0.1:5173/app/**`, `http://localhost:5173/app/**`, 프로덕션 `https://your-domain/app/**`  
   - 루트(`/`)는 정적 **랜딩 페이지**이고, **Continue with Google** 화면은 `/app/` 입니다.  
   **Site URL**은 OAuth 후 기본 돌아올 주소로, 예: `http://127.0.0.1:5173/app` 또는 배포 시 `https://mypasswordvault.app/app` 을 권장합니다.  
   **Google "continue to …supabase.co"** 문구는 앱 코드가 아니라 OAuth Auth 호스트입니다. `mypasswordvault.app` 브랜딩은 Supabase **Custom Domain** + `VITE_SUPABASE_URL` 변경이 필요합니다 → **[docs/google-oauth-domain.md](./docs/google-oauth-domain.md)** (유료 플랜).
2. SQL 편집기에서 마이그레이션을 **순서대로** 실행합니다: `20260513120000_user_vaults.sql`, `20260515180000_user_entitlements.sql`. 새 프로젝트 체크리스트는 **[docs/new-supabase-project.md](./docs/new-supabase-project.md)** 참고.
3. `.env.example`을 참고해 `.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 설정합니다 (프로덕션 ref: `fzwkemfytbaymkjrygpb`). **이 값이 없으면** 첫 화면에서 Supabase 설정 안내만 표시되고 금고로 들어가지 않습니다.

### 인증 이메일 · Resend (선택)

Supabase에서 이메일 공급자나 Send Email Hook을 쓰는 경우, Edge Function **`send-password-reset`** / **`send-auth-email`** 과 Resend 설정은 **[AUTH_EMAIL_SETUP.md](./AUTH_EMAIL_SETUP.md)** 를 참고하세요. 이 웹앱 로그인 화면은 OAuth만 사용합니다.

동기화는 `meta.updatedAt` 기준으로 **더 최근 스냅샷이 이깁니다**(로그인 직후 로컬과 클라우드가 모두 있을 때). 오프라인에서 여러 기기를 오래 각각 수정하면 나중에 한쪽이 덮어쓰일 수 있습니다.

## 빌드 및 실행

```bash
npm install
npm run dev        # 랜딩: http://127.0.0.1:5173/  ·  앱(Google 로그인): http://127.0.0.1:5173/app/
npm run build      # dist/ 정적 빌드
npm run preview    # 빌드 결과 미리보기
```

### iOS 앱 (App Store)

네이티브 빌드는 **랜딩 없이** 바로 React 앱(`Auth` → 보관함)을 로드합니다. `npm run dev`에 붙인 **라이브 리로드**만 Vite가 루트에 마케팅 페이지를 두기 때문에 `capacitor.config.ts`가 개발 서버 URL에 자동으로 `/app/`을 붙입니다.

```bash
npm run cap:ios    # 빌드 → ios 동기화 → Xcode 열기
```

`index.html`을 Finder에서 더블클릭해 `file://`로 열면 `/app/`(Sign in)이 브라우저에서 열리지 않습니다. 위처럼 `npm run dev` 또는 `npm run preview`로 접속하세요.

> 최신 브라우저(Web Crypto API + IndexedDB + Clipboard API 지원) 필요.

## 첫 사용

1. 첫 실행 시 마스터 비밀번호(10자 이상)와 자동 잠금 시간 설정
2. 표시되는 QR을 인증 앱(Authy / Google Authenticator / 1Password 등)에 스캔
3. 앱이 보여주는 6자리 코드를 입력해 2FA 등록 확인
4. 이후부터는 마스터 비밀번호 + 6자리 코드로 잠금 해제

## 주의사항

- 마스터 비밀번호를 잊으면 vault를 **복구할 수 없습니다**. 잠금 화면의 “초기화”는 모든 데이터를 영구 삭제합니다.
- 2FA 비밀키는 마스터 비밀번호로 암호화되어 같은 vault 안에 저장됩니다. 추가 인증 기기를 사용하고 싶다면 등록 단계에서 보여지는 base32 비밀키를 안전한 곳(예: 종이)에 백업하세요.
- 본 앱은 **로컬 IndexedDB + 선택적 Supabase 동기화**입니다. Supabase에는 암호문만 올라가며, 마스터 비밀번호는 여전히 기기에서만 사용됩니다.
- 진정한 위협 모델(말웨어가 동작하는 OS, 키로거 등)을 완전히 막을 수는 없습니다. 신뢰할 수 있는 기기에서만 사용하세요.

## 폴더 구조

```
index.html              루트 랜딩(마케팅) — 빌드 시 dist/index.html
app/index.html          React SPA 진입 — 빌드 시 dist/app/index.html (base: /app/)
landing/index.html      개발용 참고; 배포 시 루트로 리다이렉트만 (원본 랜딩은 루트 index.html)
supabase/
  config.toml                      Edge Function JWT 검증 끔(send-auth-email, send-password-reset)
  functions/send-password-reset/   비밀번호 재설정 메일(Resend, Admin generateLink)
  functions/send-auth-email/       나머지 Auth 메일(Resend, Send Email Hook)
  migrations/                      Postgres 마이그레이션
src/
  App.tsx                 Supabase 로그인 게이트 + Vault 라우팅
  main.tsx                React 부트스트랩
  index.css               Tailwind + 공통 유틸 클래스
  lib/
    crypto.ts             Web Crypto: PBKDF2 + AES-GCM
    passwordGenerator.ts  CSPRNG 기반 비밀번호 생성기
    storage.ts            IndexedDB(idb) 래퍼
    totp.ts               otpauth + qrcode
    vault.tsx             React Context: 세션 + 자동 잠금 + 클라우드 푸시
    supabaseClient.ts     Supabase 브라우저 클라이언트
    cloudVault.ts         로그인 후 동기화(병합/업서트)
    auth.tsx              Supabase Auth 컨텍스트
  components/
    AuthScreen.tsx        Google OAuth 로그인
    SetupScreen.tsx       최초 vault 생성 + 2FA 등록
    LockScreen.tsx        마스터 비번 + TOTP 잠금 해제
    VaultScreen.tsx       엑셀 스타일 그리드 (메인 화면)
    PasswordGenerator.tsx 비밀번호 생성기 다이얼로그
    SettingsDialog.tsx    설정 + Vault 초기화
    Icons.tsx             인라인 SVG 아이콘
```
