# My Password Vault — 자동 클라우드 동기화 백엔드 설계

## 1. 목표와 제약

| 목표 | 설명 |
|------|------|
| **자동 동기화** | 여러 브라우저·(향후) 네이티브 앱이 같은 vault를 백그라운드에 맞춤 |
| **제로 지식(Zero-knowledge)** | 서버·운영자가 평문 비밀번호, 마스터 비밀번호, TOTP 비밀키, 항목별 비밀번호를 **알 수 없음** |
| **기존 암호 모델 유지** | 클라이언트는 지금과 같이 PBKDF2 + AES-GCM으로 항목 암호화; 클라우드에는 **추가로 한 겹** 또는 **동일 키로 포장한 스냅샷**만 저장 |

**비목표(초기 단계)** | 공유 폴더, 팀 권한, 감사 로그 고도화 |

---

## 2. 위협 모델

- 서버 DB·객체 스토리지 유출 → **오직 암호문**만 노출; 마스터 없이 복호화 불가.
- 전송 구간(TLS) 공격 → TLS 1.3 + 인증서 고정(모바일) 권장.
- 클라이언트 멀웨어 → 로컬과 동일하게 **백엔드로는 방어 불가** (사용자 교육·기기 보안).

---

## 3. 핵심 원칙: “서버는 암호문 덩어리만 본다”

1. **Vault 스냅샷** = 현재 IndexedDB에 들어 있는 것과 동일한 구조의 JSON(`meta` + `entries[]`)을 직렬화한 바이트.
2. 클라이언트는 **동기화 전용 키** `K_sync`로 이 바이트 전체를 **한 번 더** 암호화한다 (예: AES-256-GCM, 랜덤 nonce, AAD에 `userId`·`revision`).
3. `K_sync`는 **마스터 키에서 파생**하거나, 최초 가입 시 생성한 **랜덤 동기화 키**를 마스터 키로 래핑해 로컬에만 보관 (아래 4절 비교).

서버는 `EncryptedBlob` + `revision` + `content_hash`만 저장한다.

---

## 4. 키·인증 설계 (두 가지 옵션)

### 옵션 A — 마스터에서만 파생 (가장 단순)

- `K_master = PBKDF2(masterPassword, salt)` (기존과 동일).
- `K_sync = HKDF-SHA256(K_master, salt_sync, info="mypasswordapp/sync/v1")`.
- `salt_sync`는 `meta` 또는 별도 필드에 저장; **백업 파일에도 포함**되면 다른 기기에서 동일 파생 가능.

**장점**: 별도 “동기화 비밀번호” 없음.  
**단점**: 마스터를 바꾸면 전체 재암호화·재업로드 필요.

### 옵션 B — 랜덤 동기화 키 + 래핑 (Bitwarden류에 가깝음)

- 기기에서 `K_sync` 32바이트 랜덤 생성.
- `wrap = AES-GCM(K_master, K_sync)` 를 로컬·백업·(선택) 서버 프로필에 저장.
- 업로드되는 vault blob은 항상 `K_sync`로만 암호화.

**장점**: 마스터 변경 시 `wrap`만 갱신하면 됨.  
**단점**: 첫 기기 외 로그인 시 `wrap`을 어떻게 배포할지(다른 기기에서 마스터 입력 후 복호화) 설계 필요.

**권장(MVP → 확장)**: **옵션 A**로 시작해 제품 검증 후 **옵션 B**로 마이그레이션.

---

## 5. 계정·세션 (서버가 “사람”을 구분)

서버는 **평문 비밀번호를 저장하지 않는다**.

### 5.1 권장: 이메일 + OPAQUE 또는 SRP (이상적)

- 회원가입·로그인 시 **PAKE**로 서버에 패스워드 동등성 증명만; 서버는 **Verifier**만 저장 (복구 불가).
- 세션: 짧은 만료 **access JWT** + httpOnly **refresh cookie** (웹), 모바일은 refresh를 Keychain에 저장.

### 5.2 MVP 현실안: “계정 비밀번호”와 마스터 분리 (UX 타협)

- **계정 비밀번호** (동기화 전용, 서버 검증용): Argon2id 해시만 DB 저장.
- **마스터 비밀번호**는 여전히 vault에만 사용, 서버로 절대 미전송.

단점: 사용자가 비밀번호 두 개를 기억해야 함 → 장기적으로 PAKE로 통합.

### 5.3 익명 계정 (빠른 MVP)

- `POST /v1/accounts/anonymous` → `account_id` + **한 번만 표시하는 recovery 키** (BIP39 단어 등).
- 이후 로그인은 recovery 키 또는 기기에 저장된 refresh token.

---

## 6. 데이터 모델 (PostgreSQL 예시)

```sql
-- 계정
accounts (
  id                UUID PRIMARY KEY,
  email             CITEXT UNIQUE,           -- nullable for anonymous
  password_hash     BYTEA,                   -- Argon2id (MVP) or SRP verifier
  created_at        TIMESTAMPTZ NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL
);

-- 기기 (선택: 푸시·세션 취소용)
devices (
  id             UUID PRIMARY KEY,
  account_id     UUID NOT NULL REFERENCES accounts(id),
  name           TEXT,
  public_key     BYTEA,                      -- optional: E2E device signing
  last_seen_at   TIMESTAMPTZ
);

-- Vault 리비전 (메타데이터만 DB, 페이로드는 객체 스토리지)
vault_revisions (
  account_id     UUID NOT NULL REFERENCES accounts(id),
  revision       BIGINT NOT NULL,           -- 단조 증가 (bigint)
  ciphertext_etag TEXT NOT NULL,            -- S3 object version or etag
  content_sha256  BYTEA NOT NULL,           -- 클라이언트가 계산한 암호문 SHA-256
  size_bytes      BIGINT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL,
  device_id       UUID REFERENCES devices(id),
  PRIMARY KEY (account_id, revision)
);

-- 현재 헤드 포인터 (빠른 읽기)
vault_heads (
  account_id      UUID PRIMARY KEY REFERENCES accounts(id),
  revision        BIGINT NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL
);
```

**객체 스토리지 (S3 / R2 / GCS)**  
- 키: `vaults/{account_id}/{revision}.bin`  
- 값: 클라이언트가 올린 **암호문 바이너리** (Content-Type: `application/octet-stream`).

---

## 7. API 설계 (REST 예시)

모든 `/vault/*` 는 `Authorization: Bearer <access_token>` 필요.

### 7.1 인증

| Method | Path | 설명 |
|--------|------|------|
| POST | `/v1/auth/register` | 이메일+비밀번호(MVP) 또는 anonymous |
| POST | `/v1/auth/login` | 세션 발급 |
| POST | `/v1/auth/refresh` | refresh 토큰 회전 |
| POST | `/v1/auth/logout` | refresh 폐기 |

### 7.2 Vault 동기화

| Method | Path | 설명 |
|--------|------|------|
| GET | `/v1/vault/status` | `{ revision, content_sha256, size_bytes }` — 변경 여부만 빠르게 |
| GET | `/v1/vault/download?revision=` | presigned URL 또는 스트리밍 바디 반환 |
| POST | `/v1/vault/upload` | **조건부 쓰기**: body + 헤더 `If-Match-Revision: <expected>` |
| | | 성공 시 `201` + `{ new_revision }` |
| | | 충돌 시 `409 Conflict` + `{ server_revision, server_sha256 }` |

**업로드 플로우**

1. 클라이언트 `GET /vault/status` → 로컬 `revision`과 비교.
2. 로컬이 더 최신이면: 로컬 스냅샷 → `K_sync`로 암호화 → `POST /upload` + `If-Match-Revision: local_base_revision`.
3. 서버가 `409`면: 서버 blob 다운로드 → 클라이언트 복호화 → **엔트리 단위 merge** (`id` 기준, `updatedAt` 큰 쪽) 또는 UX로 “어느 쪽 유지” 선택 → 다시 암호화 후 재시도.

**자동 백그라운드**: 잠금 해제 상태에서 debounce(예: 2s) 후 변경 있으면 업로드; 주기적 `GET status` 폴링(예: 30s) 또는 **SSE/WebSocket**으로 `revision` 푸시.

---

## 8. 충돌 해결 (권장)

- **항목 단위**: `entries[].id` + `updatedAt` — 같은 id면 더 큰 `updatedAt` 승리, 삭제는 **툼스톤**(`deleted_at`) 권장.
- **메타(`VaultMeta`)**: `updatedAt` 최신 한 쪽 salt/verifier 채택 시 복잡 → MVP는 **전체 스냅샷 단일 blob** + LWW + 409 시 수동 merge UI.
- **중기**: 로컬 변경 로그(암호화된 op log)로 CRDT/OT — 구현 비용 큼.

---

## 9. 서비스 구성

```
[ Client SPA / Native ]
        │ TLS
        ▼
[ API Gateway ]  — rate limit, WAF, JWT 검증
        │
        ├──► [ Auth service ]     — register/login/refresh
        │
        └──► [ Vault service ]   — revision 검증, presigned URL 발급
                    │
                    ├──► PostgreSQL
                    └──► S3-compatible object store
```

- **단일 리포** 모노리스(Node/Fastify, Go/gin, Rust/axum)로 시작 가능.
- 트래픽 증가 시 Vault 읽기/쓰기만 분리.

---

## 10. 보안 체크리스트

- [ ] TLS 전 구간, HSTS, `SameSite` refresh cookie 정책.
- [ ] 업로드 최대 크기 제한 (예: 5MB 암호문).
- [ ] 계정당 rate limit (업로드/분).
- [ ] `content_sha256`로 무결성 검증 (클라이언트·서버).
- [ ] presigned URL 만료 5분 이내.
- [ ] 로그에 **암호문·PII 최소화** (account_id만).
- [ ] GDPR: 계정 삭제 시 객체 스토리지 + DB cascade 삭제.

---

## 11. 기술 스택 제안

| 레이어 | 옵션 |
|--------|------|
| API | **Fastify** 또는 **Hono** (Node 20+), 또는 **Go** |
| DB | **PostgreSQL** (Neon, RDS, Cloud SQL) |
| Blob | **Cloudflare R2**, **S3**, **GCS** |
| 배포 | Fly.io, Railway, AWS ECS Fargate |
| 작업 큐 (선택) | 업로드 후 바이러스 스캔 등 — E2E면 생략 가능 |

---

## 12. 클라이언트 변경 요약 (향후 구현 시)

1. 잠금 해제 후 `K_sync` 파생 (또는 래핑 키 복호화).
2. `IndexedDB` 변경 시 큐에 넣고 debounce 업로드.
3. `GET /vault/status`로 원격 revision 비교 → 다운로드·병합·재암호화.
4. 오프라인 큐: 실패 시 재시도, `409` 시 merge 정책 실행.
5. **로그아웃 시** 메모리 키 제거 + 선택적 “로컬만 유지” 모드.

---

## 13. 단계별 로드맵

| 단계 | 내용 |
|------|------|
| **P0** | 계정 + JWT + `status`/`upload`/`download` + 단일 암호 blob + LWW |
| **P1** | 항목 단위 merge + 툼스톤 삭제 |
| **P2** | WebSocket revision 알림, 익명 계정 + recovery 키 |
| **P3** | PAKE(OPAQUE)로 계정 비밀번호 제거, `K_sync` 랜덤키 래핑 |

---

## 14. 오픈소스·BaaS 대안 (직접 백엔드 대신)

- **Supabase** + RLS로 “행당 암호문 JSON”만 저장 (서버는 여전히 ciphertext만).
- **Firebase** + Security Rules로 `users/{uid}/vaultBlob` 쓰기 제한.

직접 백엔드가 필요한 경우: **감사·규제·커스텀 충돌 정책·요금 최적화**가 이유인 경우가 많음.

---

이 문서는 구현 전 **아키텍처 합의**용이며, API 경로·필드명은 구현 시 OpenAPI로 구체화하면 됩니다.
