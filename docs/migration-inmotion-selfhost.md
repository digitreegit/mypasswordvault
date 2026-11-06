# MyPasswordVault 이전 체크리스트: Supabase 클라우드 → InMotion VPS 셀프호스팅

목표

- Supabase Pro($25) + 커스텀 도메인 애드온($10), 월 약 $35 → 0
- 이미 배포된 iOS·Android 앱은 **업데이트 없이** 그대로 동작
- 비밀번호 앱 보안 수준 유지

최종 배치

| 구성 요소 | 지금 | 이전 후 |
|---|---|---|
| 웹 프론트 + 랜딩 (Vite 정적 빌드) | Vercel Hobby | Cloudflare Pages (무료, 상업적 이용 허용) |
| DB + Auth + REST + Edge Functions | Supabase 클라우드 (`fzwkemfytbaymkjrygpb`) | InMotion VPS의 Supabase 셀프호스팅 (Docker) |
| `auth.mypasswordvault.app` | Supabase 커스텀 도메인 | DNS를 VPS로 (호스트명 그대로) |
| DNS | 현재 등록처 | Cloudflare |
| 백업 | Supabase 자동 | 매일 `pg_dump` → Cloudflare R2 |

---

## 0. 미리 확인된 사항 (조사 결과)

| 항목 | 결론 | 근거 |
|---|---|---|
| 앱에 박힌 값 | `VITE_SUPABASE_URL=https://auth.mypasswordvault.app`, `VITE_SUPABASE_ANON_KEY=sb_publishable_GHKEzYn5lrDDutQMjgdiTA_Pj37IOr-` | `.env`, `src/lib/supabaseClient.ts` |
| `sb_publishable_` 키를 셀프호스팅이 받나 | **받음.** `.env`의 `SUPABASE_PUBLISHABLE_KEY`에 **기존 값을 그대로** 넣으면 됨. 게이트웨이는 체크섬을 검사하지 않고 문자열로만 비교 | [Self-hosted auth keys](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys), [Docker 가이드 "custom value"](https://supabase.com/docs/guides/self-hosting/docker) |
| Edge Functions 경로의 `sb_` 키 변환 | 셀프호스팅 docker **0.8.3 (2026-10-16) 이상** 필요 | [docker CHANGELOG](https://github.com/supabase/supabase/blob/master/docker/CHANGELOG.md), PR #46810 |
| 함수별 `verify_jwt` (`supabase/config.toml`) | 셀프호스팅은 **전역 `FUNCTIONS_VERIFY_JWT` 하나만** 지원 (함수별 설정 PR #38779 미병합) | PR #38779 |
| 전역 `FUNCTIONS_VERIFY_JWT=false`가 안전한가 | **안전.** 8개 함수가 모두 자체 인증함: 사용자 함수는 `auth.getUser()`, `stripe-webhook`은 Stripe 서명, `send-auth-email`은 웹훅 서명, `send-password-reset`은 원래 공개 + DB 스로틀 | `supabase/functions/*/index.ts` |
| 유저 계정·비밀번호 해시 | DB 덤프에 `auth.users` 포함 → 그대로 옮겨짐 | [Restore from platform](https://supabase.com/docs/guides/self-hosting/restore-from-platform) |
| 기존 로그인 세션 유지 | 클라우드의 **레거시 JWT secret**을 그대로 쓰면 유지. 다르면 최악의 경우 1회 재로그인 (볼트 데이터는 그대로) | [Migrating auth users](https://supabase.com/docs/guides/troubleshooting/migrating-auth-users-between-projects) |
| 모바일 OAuth 딥링크 | `com.skyface.mypasswordvault://auth/callback` — 변경 없음 | `src/lib/platform.ts` |
| 패스키 / 앱 연동 | `mypasswordvault.app/.well-known/*` (프론트 도메인). 프론트 이전 시 같은 파일·같은 Content-Type 유지 필요 | `public/.well-known/`, `vercel.json` |

---

## 1. 이전 전 준비 (Supabase 비용 계속 나감)

- [ ] Supabase Dashboard → Project Settings → **JWT Keys** 확인
  - 레거시 JWT secret을 쓰는 중이면: 값을 안전하게 복사해 둠 → 셀프호스팅 `JWT_SECRET`에 넣을 예정 (세션 유지)
  - 이미 비대칭 서명 키로 회전했으면: 개인키는 추출 불가 → 컷오버 때 사용자 1회 재로그인 감수
  - **확인 결과 (2026-11-03): Current = ECC (P-256), Previous = HS256 (Legacy).** 이미 비대칭 키로 회전된 상태
    - 리프레시 토큰은 DB(`auth.refresh_tokens`)에 있어 같이 옮겨짐 → 앱이 토큰을 갱신하면 새 서버 키로 재발급
    - 호스팅의 ECC **공개키**(`/auth/v1/.well-known/jwks.json`)를 셀프호스팅 JWKS에 검증 전용으로 추가하면, 컷오버 직후 남아 있는 액세스 토큰(최대 1시간)도 통과 → 재로그인 없이 넘어갈 가능성 높음. 스테이징에서 검증할 것
- [x] 버전 (2026-11-03, `supabase/.temp`): **Postgres 17.6.1**, GoTrue v2.189.0, PostgREST v14.5
  - 셀프호스팅 docker 기본 이미지가 Postgres 15면 **17 이미지로 맞춰야 함** (17 덤프는 15에 복원 불가)
- [x] 켜진 확장 (2026-11-03): `pgcrypto`, `plpgsql`, `uuid-ossp`, `pg_stat_statements` (+ Supabase 기본 내부 확장). `pg_cron`, `pg_net`, `vector`, `pg_graphql` 등은 꺼져 있음
- [ ] Dashboard → Authentication 설정 전부 기록 (스크린샷)
  - Site URL, Redirect URLs (최소: `https://mypasswordvault.app/app/`, `com.skyface.mypasswordvault://auth/callback`)
  - Google: Client ID / Secret
  - Apple: Services ID, Team ID, Key ID, `.p8` 기반 client secret (만료일 기록 — 6개월마다 갱신)
  - 이메일: Send Email Hook URL / secret, 이메일 확인 여부, 비밀번호 정책
  - JWT 만료 시간
- [ ] Edge Functions 시크릿 값 확보 (Dashboard → Edge Functions → Secrets). 셀프호스팅 `functions` 서비스 환경변수로 옮길 목록:

  | 변수 | 쓰는 함수 |
  |---|---|
  | `RESEND_API_KEY`, `RESEND_FROM` | send-auth-email, send-password-reset |
  | `SEND_EMAIL_HOOK_SECRET` | send-auth-email |
  | `PUBLIC_APP_URL`, `RESET_EMAIL_SUBJECT` | send-password-reset, create-checkout-session |
  | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_LICENSE_AMOUNT_CENTS` | checkout, confirm, webhook, admin |
  | `STRIPE_WEBHOOK_SECRET` | stripe-webhook |
  | `STORE_PRO_PRODUCT_ID` | verify-store-purchase |
  | `APPLE_BUNDLE_ID`, `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | verify-store-purchase (App Store) |
  | `GOOGLE_PLAY_PACKAGE_NAME`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | verify-store-purchase (Play) |
  | `ADMIN_EMAILS` | admin-api |
  | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | 셀프호스팅이 자동 주입 (코드가 `SUPABASE_SECRET_KEYS` 없으면 `SUPABASE_SERVICE_ROLE_KEY`로 폴백) |

  **넣지 말 것:** `STORE_VERIFY_DEV_BYPASS`, `DENO_ENV=development`

- [ ] 외부 서비스에 등록된 URL 확인 (현재 `fzwkemfytbaymkjrygpb.supabase.co`로 되어 있으면 컷오버 때 바꿔야 함)
  - Stripe Dashboard → Webhooks 엔드포인트 (`docs/billing-stripe.md`는 `*.supabase.co/functions/v1/stripe-webhook` 기준)
  - Google Cloud Console → OAuth 클라이언트 → 승인된 리디렉션 URI에 `https://auth.mypasswordvault.app/auth/v1/callback` 있는지
  - Apple Developer → Services ID → Return URL에 `https://auth.mypasswordvault.app/auth/v1/callback` 있는지
- [ ] `mypasswordvault.app` DNS가 어디서 관리되는지 확인 → Cloudflare로 옮길 준비
- [ ] `auth.mypasswordvault.app` 레코드의 **TTL을 300초로** 낮춰 두기 (롤백 대비, 컷오버 하루 전까지)

## 2. VPS 준비

- [x] InMotion Self-Managed VPS 4 vCPU / 8GB 주문 (2026-11-03, 3년, AMP 계정 hoyong@gmail.com, 갱신 2029-11-03 $611.64) — Ubuntu 24.04, 패널 없음
- [x] 보안 기본 설정 (2026-11-03)
  - [x] 사용자 `deploy` (sudo NOPASSWD, `wheel` 그룹 — InMotion sshd는 `AllowGroups wheel`만 허용), 키 로그인만, root 로그인·비밀번호 로그인 꺼짐, `MaxAuthTries 3`
    - Mac: `ssh mpv-vps` (`~/.ssh/config`, 키 `~/.ssh/inmotion_vps`)
    - 원본 백업: `/etc/ssh/sshd_config.bak-2026-11-03`
  - [x] 방화벽: iptables `INPUT DROP` 기본, 22/80/443 + InMotion 사무실 대역(216.54.31.80/29)만 허용, IPv6도 기본 차단. `netfilter-persistent`로 저장 (원본: `/etc/iptables/rules.v4.bak-inmotion`)
    - Docker 설치 후에는 `netfilter-persistent save` 하지 말 것 (Docker 체인이 저장돼 꼬임). 규칙 변경은 `rules.v4` 직접 수정
    - **Docker 공개 포트는 INPUT 체인을 우회함** → 컨테이너 포트는 반드시 `127.0.0.1:` 바인딩 (리버스 프록시 80/443만 예외)
  - [x] fail2ban (sshd, systemd backend), unattended-upgrades 켜짐, apache2·exim4 끔
  - [x] Docker 29.9 + Compose 설치, OpenVZ에서 동작 확인 (overlayfs, cgroup v1, Postgres 15 컨테이너 OK)
- [ ] Cloudflare, GitHub, InMotion 계정에 2FA (가능하면 하드웨어 키)
- 참고: 이 VPS는 **OpenVZ 컨테이너**라 커널은 호스트 것 (커널 모듈·sysctl 일부 변경 불가, 커널 업데이트는 InMotion 담당)

## 3. Supabase 셀프호스팅 설치 (스테이징)

**진행 상황 (2026-11-03):** `/opt/mpv`에 설치 완료, 7개 서비스 healthy
- `self-hosted/v0.8.3`, Postgres 17.6.1.136, GoTrue v2.197.0, PostgREST v14.18, edge-runtime v1.77.4
- `docker-compose.mpv.yml` 오버레이: realtime·storage·imgproxy·supavisor 끔, 게이트웨이 `127.0.0.1:8000`만, Google/Apple/메일 훅은 `.env` 플래그로 켬
- `.env` (600): 운영과 같은 URL·리디렉션·정책, 기존 publishable key, 레거시 JWT secret은 새로 생성 (호스팅이 이미 ECC로 회전해서 이전 불필요)
- 호스팅 ECC 공개키(kid `450ae9c1…`)를 `JWT_KEYS`/`JWT_JWKS`에 **검증 전용**으로 추가 → 컷오버 직후 기존 액세스 토큰 통과용 (4단계에서 실제 토큰으로 검증)
- 메일 훅 URI는 `https://auth.mypasswordvault.app/functions/v1/send-auth-email` (GoTrue가 http는 localhost만 허용)
- 점검: auth health 200, 기존 publishable key로 REST/functions 통과, 잘못된 키 401, Studio는 basic auth 401, 외부에서 8000 차단
- **남은 것:** Google/Apple/메일 훅 secret과 `functions.env` 시크릿 입력 (사용자가 서버에서 직접), 스테이징 HTTPS 호스트명
- **주의:** 컷오버 때 공개 프록시는 `/auth/v1`, `/rest/v1`, `/functions/v1`만 통과시키고 `/`(Studio)는 막을 것

- [x] 공식 Docker 스택 설치, 버전 **0.8.3 이상** 확인
- [ ] 스테이징 호스트명 연결: 예 `auth-new.mypasswordvault.app` → VPS IP, HTTPS(Let's Encrypt)
- [ ] `.env` 키 설정 순서 (스테이징에서 그대로 검증)
  1. `JWT_SECRET` = 클라우드 레거시 JWT secret (1단계에서 확보한 경우)
  2. 그 secret으로 `ANON_KEY` / `SERVICE_ROLE_KEY` (HS256) 재생성
  3. `sh utils/add-new-auth-keys.sh --update-env` → `JWT_KEYS`, `JWT_JWKS`, 비대칭 내부 키 생성
  4. `SUPABASE_PUBLISHABLE_KEY` = **`sb_publishable_GHKEzYn5lrDDutQMjgdiTA_Pj37IOr-`** (기존 값으로 덮어쓰기)
  5. `SUPABASE_SECRET_KEY`는 새로 생성된 값 사용 (클라이언트에 없음, 서버 전용)
  6. `sh run.sh recreate`
  7. 게이트웨이 로그에서 "opaque key translation" 모드 활성화 확인
- [ ] `FUNCTIONS_VERIFY_JWT=false` (근거는 0번 표)
- [ ] `functions` 서비스에 `SUPABASE_JWKS` 설정 (공식 compose 기준)
- [ ] Auth(GoTrue) 환경변수
  - `SITE_URL=https://mypasswordvault.app/app/`
  - `GOTRUE_URI_ALLOW_LIST`에 `https://mypasswordvault.app/app/`, `com.skyface.mypasswordvault://auth/callback` 등 1단계 기록값
  - `API_EXTERNAL_URL` = 스테이징 동안 `https://auth-new...`, 컷오버 시 `https://auth.mypasswordvault.app`
  - `GOTRUE_EXTERNAL_GOOGLE_*`, `GOTRUE_EXTERNAL_APPLE_*` (Redirect URI는 `<API_EXTERNAL_URL>/auth/v1/callback`)
  - Send Email Hook: `GOTRUE_HOOK_SEND_EMAIL_ENABLED=true`, URI는 셀프호스팅 `send-auth-email` 함수, secret은 `SEND_EMAIL_HOOK_SECRET`과 동일
  - 이메일 확인·비밀번호 정책·JWT 만료를 클라우드와 동일하게
- [ ] Studio / 관리 화면은 외부 비공개 (SSH 터널 또는 Cloudflare Access)

## 4. 데이터 복원 (스테이징 리허설)

공식 절차: [Restore a Platform Project to Self-Hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform). 원시 `pg_dump` 말고 `supabase db dump` 사용.

```sh
supabase db dump --db-url "$CLOUD_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$CLOUD_DB_URL" -f schema.sql
supabase db dump --db-url "$CLOUD_DB_URL" -f data.sql --use-copy --data-only

psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file roles.sql --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "$SELFHOST_DB_URL"
```

**리허설 결과 (2026-11-03): 성공.** 실제 사용한 방법 (컷오버 때 그대로 반복)

1. Mac에서 Docker Desktop 실행 후 `supabase db dump --linked ...` 3종 (DB 비밀번호 불필요, CLI 임시 로그인 역할 사용). 저장 위치는 `~/.mpv-dump-tmp` (700)
2. `data.sql`에서 `COPY "storage".*` 블록 제거 (Storage 미사용, 행 0개, 셀프호스팅에서 storage 서비스를 꺼서 테이블이 없음)
3. `roles + schema + "SET session_replication_role = replica;" + data`를 ssh로 `docker exec -i supabase-db psql -U postgres -v ON_ERROR_STOP=1 --single-transaction`에 바로 흘려 넣음 (서버 디스크에 덤프 안 남김)
4. **auth 스키마의 사용자 트리거는 `supabase db dump`에 안 들어감 → 반드시 다시 생성:**

   ```sql
   CREATE OR REPLACE TRIGGER "on_auth_user_created_entitlements" AFTER INSERT ON "auth"."users"
     FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user_entitlement"();
   ```

   (운영 auth 스키마에서 확인한 사용자 트리거는 이것 하나뿐)
5. 덤프 파일 `rm -P`로 삭제

- 행 수 일치: users 30, identities 31 (google 21 / email 5 / apple 5), sessions 35, refresh_tokens 253, user_vaults 17, user_entitlements 30, complimentary_grants 9
- RLS: public 테이블 5개 모두 켜짐, 정책 5개
- 스모크 테스트 (`/tmp/mpv-smoketest.sh` 방식): 임시 사용자 생성 → 비밀번호 로그인(ES256, 새 kid) → `/auth/v1/user` 200 → 자기 금고 0행, 다른 사람 금고 안 보임 → 트리거로 entitlement 1행 생성 → 리프레시 200 → 변조 토큰 401 → 삭제
- **아직 못 한 검증:** 운영에서 발급된 실제 액세스·리프레시 토큰이 셀프호스팅에서 통과하는지 (6단계에서 실제 로그인 세션으로)

- [x] 1단계에서 기록한 확장을 복원 전에 켜기 (스키마 덤프에 `CREATE EXTENSION IF NOT EXISTS` 포함)
- [x] 덤프 파일은 비밀번호 해시·이메일이 들어 있음 → 작업 PC에 오래 두지 말고, 끝나면 안전 삭제
- [x] 검증: 클라우드와 셀프호스팅에서 행 수 비교

  ```sql
  select count(*) from auth.users;
  select count(*) from auth.identities;
  select count(*) from public.user_vaults;
  select count(*) from public.user_entitlements;
  ```

- [ ] RLS 정책이 켜져 있는지 확인 (`select relname, relrowsecurity from pg_class where relname in ('user_vaults','user_entitlements');`)

## 5. Edge Functions 배포 (스테이징)

**진행 상황 (2026-11-03):** 함수 8개 + `_shared`를 `/opt/mpv/volumes/functions/`에 복사, 예제 `hello` 삭제. 시크릿 없이 부팅 확인 (설정 필요 함수는 `server_misconfigured`, 인증 필요 함수는 401)
- 시크릿 파일: `/opt/mpv/functions.env` (root 600, 변수 이름 양식). 번들 ID·패키지명·상품 ID는 채워 둠. 나머지는 사용자가 서버에서 직접 입력
- Supabase Edge Function 시크릿은 대시보드에서 다시 볼 수 없음 → 원래 출처(Resend, Stripe, App Store Connect, Play Console)에서 가져오거나 새로 발급
- 코드 수정: `send-auth-email`이 메일 링크에 `SUPABASE_PUBLIC_URL`을 우선 사용 (셀프호스팅의 `SUPABASE_URL`은 내부 주소 `http://api-gw:8000`). 호스팅에는 이 변수가 없어 동작 동일
- 함수 코드 업데이트 방법: 저장소 `supabase/functions/`를 tar로 서버에 복사 후 `docker compose up -d --force-recreate --no-deps functions`
- 시크릿 입력 완료 (2026-11-03). 값은 확인하지 않고 형식·길이만 검증:
  - `functions.env`: Resend, 메일 hook, Stripe 3종(live, restricted key), Apple IAP(새 키 `6LB5Z298C5`, Issuer `ad075ccd-…`), Google Play 서비스 계정 JSON, `ADMIN_EMAILS=hoyong@gmail.com` (슈퍼관리자)
  - `.env`: `SEND_EMAIL_HOOK_SECRET`(functions.env와 동일), `GOOGLE_SECRET`(새로 추가한 client secret, 기존 `****OpUL`도 유효), `APPLE_SECRET`
  - **`APPLE_SECRET`은 2027-05-02 만료.** Sign in with Apple 키 `KWBH5GD5AS`(Team `T42D4PX35G`, client `com.skyface.mypasswordvault.auth`)로 JWT를 다시 만들어 교체
  - Apple/Google client secret은 가짜 코드로 토큰 엔드포인트를 호출해 `invalid_grant`(=client 인증 통과) 확인
  - nano에서 `KEY = value`(공백 포함)로 저장하면 다른 변수가 됨. `KEY=value` 형식 유지
- Google Play 서비스 계정: `mpv-play-verify@mypasswordvault-496819.iam.gserviceaccount.com` (GCP 역할 없음, Play Console 앱 권한: 앱 정보 보기 + View financial data)
  - skyface.com 조직에 `iam.disableServiceAccountKeyCreation`이 걸려 있음. 키 재발급 시 프로젝트 단위로 잠시 예외 → 키 생성 → 다시 상속으로 되돌림 (Organization Policy Administrator 권한 필요, 작업 후 회수)

- [ ] `supabase/functions/` 전체(`_shared` 포함)를 셀프호스팅 `volumes/functions/`에 복사
- [ ] 1단계 시크릿을 `functions` 서비스 환경변수로 주입 (`.env` → compose). 저장소에 커밋 금지
- [ ] Stripe는 **테스트 모드 키 + 테스트 웹훅**으로 먼저 검증 (`stripe listen --forward-to https://auth-new.../functions/v1/stripe-webhook`)

## 6. 스테이징 테스트

스테이징 URL로 빌드한 웹(로컬 `VITE_SUPABASE_URL=https://staging-api.mypasswordvault.app`, 키는 기존 publishable 그대로)으로 확인.

**진행 상황 (2026-11-03):**
- Vercel DNS에 `staging-api` A 레코드 → `23.235.194.180` 추가 (컷오버 후 삭제)
- Caddy 2.6.2 (Ubuntu 패키지), `/etc/caddy/Caddyfile`: `/auth/v1/*`, `/rest/v1/*`, `/functions/v1/*`만 `127.0.0.1:8000`으로 프록시, 나머지는 404. Let's Encrypt 인증서 자동 발급
- 외부 점검: `/`, Studio, `/pg/` → 404 / apikey 없으면 401 / 익명 REST는 RLS로 `[]` / 웹훅 잘못된 서명 400 / http → https 308 / 8000 포트 직접 접근 차단
- OAuth(Google/Apple)는 `API_EXTERNAL_URL`이 `auth.mypasswordvault.app`이라 콜백이 운영 Supabase로 감 → 스테이징에서는 이메일 로그인·토큰·함수 위주로 검증하고, OAuth는 컷오버 직후 확인
- 스테이징 전용 `.env` 값 (컷오버 때 **삭제**): `FUNCTIONS_PUBLIC_URL`(메일 링크 호스트), `SEND_EMAIL_HOOK_URI`(메일 훅 → 스테이징 함수). 지우지 않으면 운영 메일 링크가 staging으로 감. 둘 다 없으면 기본값 `auth.mypasswordvault.app` 사용
  - 처음엔 훅이 운영 주소(=호스팅 Supabase 함수)를 호출해서 확인 링크가 `*.supabase.co`로 나갔음 → `SEND_EMAIL_HOOK_URI`로 해결

- [x] 이메일 가입 → 확인 메일(Resend 브랜드 메일) 수신 → 로그인
- [x] 비밀번호 재설정 메일 (메일 링크는 `API_EXTERNAL_URL` 때문에 `auth.mypasswordvault.app`으로 나감 → 스테이징에선 호스트만 바꿔 확인, 컷오버 후엔 그대로 맞음)
- [ ] Google 로그인, Apple 로그인 (웹)
- [ ] **기존 계정**으로 로그인 → 마스터 비밀번호로 볼트 열림 → 클라우드 싱크된 항목 그대로 보임
- [ ] 항목 추가·수정 → 다른 브라우저에서 싱크 확인
- [x] Stripe 테스트 결제 → `user_entitlements` 반영 → PRO 표시 (2026-11-04 실결제 $4.99 → admin-api refund로 환불, 스테이징 licensed=false/refunded 확인. 이 결제의 웹훅은 호스팅으로 가서 실패·재시도됨 — 무시)
- 2026-11-04 13:50경 VPS 전체가 수 분간 무응답(SSH·HTTPS·ping). 재부팅 없음, 메모리 여유, `systemd-journald Watchdog timeout` → 호스트 쪽 디스크 I/O 정지로 추정. 컷오버 전에 외부 업타임 모니터(예: UptimeRobot으로 `/auth/v1/health`) 걸어 두고, 반복되면 InMotion에 문의
- [x] 계정 삭제 (테스트 계정) — auth.users/identities/user_vaults/user_entitlements 모두 0
- [x] admin-api (관리자 이메일로) — 관리자(hoyong@gmail.com, 처음엔 skyface로 테스트 후 변경·재확인): check_admin/stats/list 200, 일반 사용자: stats 403, 토큰 없음: 401
- [x] `apikey` 없는 요청이 401로 막히는지, `/rest/v1/` 루트가 publishable 키로 안 열리는지 — 키 없음 401, 루트 403, 익명 조회 `[]`
- 남은 항목(Google/Apple 로그인, 기존 계정 로그인·볼트 열기, 다른 브라우저 싱크)은 OAuth 콜백과 최신 덤프가 필요해서 **컷오버 직후 9단계에서** 확인

## 7. 프론트 Cloudflare Pages 이전

- [x] GitHub 연결, 빌드 명령 `npm run build`, 출력 `dist` (2026-11-04, Cloudflare 계정 hoyong@skyface.com, 프로젝트 `mypasswordvault`, 프로덕션 브랜치 `main` → `mypasswordvault.pages.dev`)
- [x] 빌드 환경변수: `VITE_SUPABASE_URL=https://auth.mypasswordvault.app`, `VITE_SUPABASE_ANON_KEY`(publishable), `NODE_VERSION=22`. `VITE_STRIPE_PUBLISHABLE_KEY`는 서버(`STRIPE_PUBLISHABLE_KEY`)가 우선이라 넣지 않음 — 로컬 `.env` 값은 `pk_test`라 복사 금지
- [x] `vercel.json` → `public/_headers` (보안 헤더 + HSTS, `.well-known` JSON, 에셋 장기 캐시, `*.pages.dev`에는 `X-Robots-Tag: noindex`). `/app` → `/app/`(308) → `index.html`은 Pages 기본 동작이라 `_redirects` 불필요
  - `main` 푸시 시 컷오버 전까지는 Vercel·Cloudflare 둘 다 배포됨
  - 보안 헤더: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, CSP `frame-ancestors 'none'; base-uri 'self'; object-src 'none'`
  - `/.well-known/apple-app-site-association`, `/.well-known/assetlinks.json` → `Content-Type: application/json` (**패스키·앱 연동에 필수**)
  - `/assets/*`, `/app/assets/*` 장기 캐시
  - `/app`, `/app/` → `/app/index.html`
  - `*.vercel.app` 리다이렉트는 불필요
- [x] Vercel Analytics 제거 → Cloudflare Web Analytics (Pages 프로젝트 Metrics에서 Enable, 비컨 자동 삽입). 커밋 `d586ebe` (2026-11-05)
  - 랜딩의 `data-mpv-track` 클릭 이벤트(스토어 버튼 등)는 Cloudflare가 커스텀 이벤트를 지원하지 않아 더 이상 수집 안 됨. 페이지뷰·리퍼러·국가·Web Vitals만
- [x] `*.pages.dev` 확인: `/`, `/app/`, `.well-known` 2개(application/json), `landing-config.js`(auth.mypasswordvault.app), 보안 헤더, 에셋 `immutable` 캐시 모두 정상
- [x] `mypasswordvault.app` 도메인 연결 (2026-11-05 완료, 존 Active, Pages 커스텀 도메인 active)
  - [x] Cloudflare 존 생성(Free, `dax`/`maeve.ns.cloudflare.com`), DNSSEC 없음 확인. 레코드 정리 (2026-11-05):
    `auth` CNAME → `fzwkemfytbaymkjrygpb.supabase.co` (**DNS only**), `_acme-challenge.auth` TXT, `staging-api` A `23.235.194.180` (DNS only),
    `resend._domainkey` TXT, `send` TXT/MX, `@` google-site-verification TXT
  - [x] 임시: `@`, `www` A → Vercel `216.198.79.1`, `64.29.17.1` (DNS only) — NS 전파 중 사이트 유지용
  - [x] Vercel 대시보드(도메인 등록처는 계속 Vercel)에서 네임서버를 `dax.ns.cloudflare.com`, `maeve.ns.cloudflare.com`으로 변경. .app 레지스트리 반영 약 1분, 존 Active 약 2분
  - [x] Pages 커스텀 도메인 `mypasswordvault.app`, `www.mypasswordvault.app` 추가. 임시 Vercel A 레코드는 Pages가 proxied CNAME(`mypasswordvault.pages.dev`)으로 자동 교체
  - [x] Redirect Rule "Redirect from WWW to root": `https://www.*` → `https://${1}` 301, 쿼리스트링 유지(UTM)
  - Vercel에 남은 DNS 레코드는 더 이상 적용 안 됨. 레코드 변경은 Cloudflare에서만
- [x] 확인: apex·www 모두 `server=cloudflare`, `/`·`/app/` 200, `.well-known` 2개 200 `application/json`, HSTS·X-Frame·CSP 헤더, Cloudflare Insights 비컨 삽입, `auth` → Supabase(DNS only), `send` MX·DKIM 정상
- [x] iOS 실기기에서 패스키 잠금 해제 정상 (2026-11-05)

## 8. 컷오버 (트래픽 적은 시간)

**2026-11-05 실행.** 덤프 14:43:40Z, DNS 전환 14:45Z, 인증서 발급 14:45:20Z

- [x] 스테이징 전용 `.env` 값(`FUNCTIONS_PUBLIC_URL`, `SEND_EMAIL_HOOK_URI`) 삭제 → 메일 훅·링크 기본값 `auth.mypasswordvault.app` 확인
- [x] 셀프호스팅 DB 초기화: 스택 내림 → `volumes/db/data`를 `/opt/mpv-db-data-staging-<ts>`(700)로 옮김 → 빈 폴더로 다시 올림 (스테이징 데이터 백업은 10단계 때 삭제)
- [x] 클라우드에서 최종 덤프 → 복원 (4단계 방법 그대로) → 트리거 재생성. 행 수: users 30, identities 31, sessions 36, refresh_tokens 282, user_vaults 17, user_entitlements 30, grants 9. RLS 꺼진 public 테이블 0, 정책 5
- [x] 셀프호스팅 `API_EXTERNAL_URL=https://auth.mypasswordvault.app/auth/v1` (스테이징부터 운영 값)
- [x] Cloudflare `auth` 레코드: CNAME(Supabase) → **A `23.235.194.180`, DNS only**, TTL 300. `_acme-challenge.auth` TXT는 롤백 대비로 10단계까지 둠
- [x] Caddy: 기존 사이트 블록에 `auth.mypasswordvault.app` 추가 (같은 허용 목록 프록시). Let's Encrypt 인증서 DNS 변경 약 10초 후 발급
- [x] 외부 점검: health·settings 200, apikey 없음 401, `/rest/v1/` 403, 익명 금고 조회 `[]`, `/`·`/pg/` 404, 웹훅 잘못된 서명 400, Google·Apple·email 켜짐, 1.1.1.1·8.8.8.8·9.9.9.9 모두 VPS IP
- [x] Stripe 웹훅 엔드포인트는 원래 `https://auth.mypasswordvault.app/functions/v1/stripe-webhook` (변경 불필요, signing secret 동일)
- [x] Google·Apple 리디렉션 URI는 원래 `https://auth.mypasswordvault.app/auth/v1/callback` (변경 불필요)
- [x] 전환 공백 확인: 14:51Z에 클라우드 데이터를 다시 덤프해 컷오버 덤프와 비교 → **변경 0건** (유실 데이터 없음). 덤프 파일 `rm -P`
- [x] 스테이징 정리: Caddy에서 `staging-api` 호스트 제거, Cloudflare `staging-api` A 레코드 삭제

## 9. 컷오버 후 확인 (1~2주)

- [ ] 웹: 로그인(구글·애플·이메일), 싱크, 결제
- [ ] **iOS 스토어 버전 앱** (재설치 없이): 로그인 유지 또는 재로그인, 싱크, Apple 로그인, 구매 복원
- [ ] **Android 스토어 버전 앱**: 같은 항목, Play 구매 검증
- [x] Apple 로그인: iOS 앱에서 정상 (웹 앱에는 Apple 버튼 자체가 없음)
- [x] 비밀번호 재설정 메일 수신 (2026-11-05)
  - 제목이 비어 있던 문제: `functions.env`에 `RESET_EMAIL_SUBJECT=` 빈 값 → `??`는 빈 문자열을 그대로 사용. 코드를 `?.trim() ||`로 바꾸고 빈 줄 삭제
- [x] Resend 대시보드에서 메일 발송 정상 (Delivered 확인)
- [x] Resend API 키 교체 (2026-11-05, 디버깅 중 `docker compose config` 출력에 노출)
  - 새 키 `mpv-selfhost-functions`: Sending access, `mypasswordvault.app` 도메인만. 클립보드 → ssh로 `functions.env`에만 저장
  - 새 키로 발송 Delivered 확인 후 이전 키 `mypasswordvault-v3` 삭제
  - `My Password Vault` 키(Full access)는 클라우드 Supabase용으로 남김 → 10단계에서 삭제 완료 (2026-11-07)
  - 교훈: `docker compose config`는 비밀값을 그대로 출력함. 변수 이름 확인은 `awk`로 값 없이
- [x] 메일 hook 시크릿 교체 (같은 출력에 노출): 서버에서 새로 생성해 `.env`·`functions.env` 동시 교체, `/recover` 호출로 "Hook ran successfully" 확인
- [ ] 서버 로그에 401/500 급증 없는지
- [x] 백업 cron 동작 + **R2에서 실제 복원 테스트 1회** (2026-11-05, 아래 "백업" 참고)
- [x] 업타임 모니터 + 백업 실패 알림 (Better Stack 무료, 계정 hoyong@skyface.com, 알림은 이메일)
  - Caddy `/healthz`: 키 없이 호출 가능, 내부에서 `/auth/v1/health`로 바꿔 publishable key를 붙여 게이트웨이까지 통과 → 200이면 Caddy·게이트웨이·Auth 모두 정상
  - 모니터 "My Password Vault API": `/healthz` 3분마다, 4개 리전, IPv4, 1분 연속 실패 시 알림
  - 하트비트 "MPV daily DB backup": 1일 주기 + 2시간 유예. `mpv-backup` 성공 시 ping, 실패 시 `/fail` ping
  - 하트비트 URL은 `/etc/mpv-backup/heartbeat.env` (600)에만 저장. 비우면 ping 생략

## 백업 (2026-11-05 설정)

- R2 버킷 `mpv-db-backups` (ENAM, 비공개, Standard)
  - Lifecycle `delete-after-30-days`: 30일 후 자동 삭제
  - Bucket lock `retain-7-days`: 업로드 후 7일 동안 삭제·덮어쓰기 불가 (서버가 털려도 최근 백업 보호)
  - Account API token `mpv-backup-server`: Object Read & Write, 이 버킷만, IP `23.235.194.180`만, 만료 없음
- 암호화: `age`. 공개키 `age1jjskydz60y9xdw9zxss7cseelfdhe4r3n6t5qqsjdjyam2zp3pjq4zufs6`만 서버에 있음
  - **개인키는 Mac `~/.mpv-backup-key/age-key.txt` + 사용자가 따로 보관한 사본뿐.** 잃으면 백업 복원 불가
- 서버: `/usr/local/sbin/mpv-backup` (root), 키 `/etc/mpv-backup/r2.env`, 공개키 `/etc/mpv-backup/age-recipients.txt` (모두 600)
  - `pg_dump -Fc` → `age` 암호화 → `/var/tmp` 임시 파일 → `rclone copyto` 단일 PUT → 크기 확인 (10KB 미만이면 실패)
  - rclone 1.60 + 버킷 잠금 R2 조합에서 스트리밍/멀티파트 업로드와 업로드 후 HEAD가 501 → 임시 파일 + `--s3-upload-cutoff 4G` + `NO_HEAD`
  - `mpv-backup.timer`: 매일 03:30 EST (최대 10분 랜덤 지연, 꺼져 있던 동안 놓친 실행은 부팅 후 실행)
  - 수동 실행: `sudo systemctl start mpv-backup.service`, 로그: `journalctl -u mpv-backup.service`
- 첫 백업 `daily/mpv-20261105T152920Z.dump.age` (290KB). `test/` 아래 6바이트 테스트 파일 2개는 잠금 때문에 30일 뒤 자동 삭제

**복원 방법** (복호화된 데이터는 디스크에 안 남기고 파이프로만):

```sh
OBJ=daily/mpv-<시각>.dump.age
ssh mpv-vps "sudo bash -c 'set -a; . /etc/mpv-backup/r2.env; set +a; export RCLONE_CONFIG_R2_TYPE=s3 RCLONE_CONFIG_R2_PROVIDER=Cloudflare RCLONE_CONFIG_R2_ACCESS_KEY_ID=\$R2_ACCESS_KEY_ID RCLONE_CONFIG_R2_SECRET_ACCESS_KEY=\$R2_SECRET_ACCESS_KEY RCLONE_CONFIG_R2_ENDPOINT=https://5b986f1f53f22707003d24c70d0ef013.r2.cloudflarestorage.com; rclone cat r2:mpv-db-backups/$OBJ'" \
  | age -d -i ~/.mpv-backup-key/age-key.txt \
  | ssh mpv-vps 'sudo docker exec -i supabase-db pg_restore -U supabase_admin -d <대상 DB>'
```

- `-U supabase_admin`(슈퍼유저)로 해야 함. `postgres`로 하면 소유자·권한 오류 88건
- 서버를 새로 만드는 경우 R2 키가 IP 제한이라 새 서버 IP로 토큰을 다시 만들거나, Mac에서 Cloudflare 대시보드로 파일을 내려받아 `age -d`
- **복원 테스트 결과 (2026-11-05):** 임시 DB `restore_test`에 오류 0건. 운영 DB와 users 32 / vaults 19 / entitlements 32, 금고·이용권 내용 해시, 트리거, RLS, 정책 5개 모두 일치 → 확인 후 삭제

## 10. 비용 정리 (반드시 마지막)

- [x] Supabase 커스텀 도메인 애드온 끄기 (커스텀 도메인 삭제 후 Free 다운그레이드로 애드온 제거, 2026-11-07)
- [x] Skyface 조직을 Free로 다운그레이드 (클라우드 프로젝트는 한동안 읽기용 백업으로 남겨 두고, 이후 삭제) — 2026-11-07
- [x] Vercel의 Mypasswordvault 프로젝트 삭제 (도메인 `mypasswordvault.app` 연결 해제 확인 후) — 2026-11-07
- [x] Resend `My Password Vault` 키(Full access, 클라우드용) 삭제 — 2026-11-07 (`mpv-selfhost-functions` 유지)

**10단계를 먼저 하면 앱 로그인과 싱크가 즉시 끊김.** (컷오버·헬스 확인 후 진행 완료)

---

## 롤백

- 컷오버 직후 문제 발생 시: `auth.mypasswordvault.app` DNS를 원래 Supabase 커스텀 도메인 레코드로 되돌림 (TTL 300초라 5분 내 복구). **10단계 전까지는 애드온이 살아 있어야 가능.**
- 단, 컷오버 후 셀프호스팅에 쓰인 데이터(새 가입, 볼트 변경, 결제)는 클라우드에 없음 → 롤백 시 해당 기간 데이터를 수동으로 옮겨야 함. 그래서 컷오버는 트래픽이 적을 때, 문제는 빨리 판단.

## 운영 중 반복 작업

| 주기 | 작업 |
|---|---|
| 매일 (자동) | `pg_dump` → Cloudflare R2, 보관 30일 |
| 매월 | 셀프호스팅 Supabase 업데이트 확인 (CHANGELOG의 보안 수정), 업데이트 전 백업 |
| 분기 | 백업 복원 테스트 |
| 6개월 | Apple Sign in client secret(.p8 JWT) 재생성 → `GOTRUE_EXTERNAL_APPLE_SECRET` 교체 |
| 상시 | 서버 시크릿은 서버 환경변수에만. 저장소·채팅에 붙여넣지 않기 |
