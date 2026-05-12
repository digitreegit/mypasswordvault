# MyPasswordApp

엑셀처럼 직관적인 폼으로 다루는 로컬 우선(local-first) 비밀번호 매니저. 단 하나의 마스터 비밀번호 + 2단계 인증(TOTP)으로 잠금을 해제하고, 각 비밀번호는 AES-GCM-256으로 암호화되어 브라우저 IndexedDB에만 저장됩니다.

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
- 서버 전송 없음 — 모든 처리는 브라우저에서

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

저장되는 것 (IndexedDB, `mypasswordapp`):

- `meta.vault`: salt, 암호화된 verifier, 암호화된 TOTP 비밀키, 자동잠금 설정
- `entries.*`: 항목별 id, 사이트, URL, 사용자명, **암호화된 비밀번호**, 메모

저장되지 않는 것:

- 마스터 비밀번호 (원본도, 해시도)
- 파생된 AES 키 (메모리 + 잠금 해제 시간 동안만)

## 빌드 및 실행

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # dist/ 정적 빌드
npm run preview    # 빌드 결과 미리보기
```

> 최신 브라우저(Web Crypto API + IndexedDB + Clipboard API 지원) 필요.

## 첫 사용

1. 첫 실행 시 마스터 비밀번호(10자 이상)와 자동 잠금 시간 설정
2. 표시되는 QR을 인증 앱(Authy / Google Authenticator / 1Password 등)에 스캔
3. 앱이 보여주는 6자리 코드를 입력해 2FA 등록 확인
4. 이후부터는 마스터 비밀번호 + 6자리 코드로 잠금 해제

## 주의사항

- 마스터 비밀번호를 잊으면 vault를 **복구할 수 없습니다**. 잠금 화면의 “초기화”는 모든 데이터를 영구 삭제합니다.
- 2FA 비밀키는 마스터 비밀번호로 암호화되어 같은 vault 안에 저장됩니다. 추가 인증 기기를 사용하고 싶다면 등록 단계에서 보여지는 base32 비밀키를 안전한 곳(예: 종이)에 백업하세요.
- 본 앱은 단일 기기 로컬 우선 설계입니다. 클라우드 동기화는 포함되어 있지 않습니다.
- 진정한 위협 모델(말웨어가 동작하는 OS, 키로거 등)을 완전히 막을 수는 없습니다. 신뢰할 수 있는 기기에서만 사용하세요.

## 폴더 구조

```
src/
  App.tsx                 라우팅 (loading / fresh / locked / unlocked)
  main.tsx                React 부트스트랩
  index.css               Tailwind + 공통 유틸 클래스
  lib/
    crypto.ts             Web Crypto: PBKDF2 + AES-GCM
    passwordGenerator.ts  CSPRNG 기반 비밀번호 생성기
    storage.ts            IndexedDB(idb) 래퍼
    totp.ts               otpauth + qrcode
    vault.tsx             React Context: 세션 상태 + 자동 잠금
  components/
    SetupScreen.tsx       최초 vault 생성 + 2FA 등록
    LockScreen.tsx        마스터 비번 + TOTP 잠금 해제
    VaultScreen.tsx       엑셀 스타일 그리드 (메인 화면)
    PasswordGenerator.tsx 비밀번호 생성기 다이얼로그
    SettingsDialog.tsx    설정 + Vault 초기화
    Icons.tsx             인라인 SVG 아이콘
```
