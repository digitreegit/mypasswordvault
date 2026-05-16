import { MESSAGES_EN as en } from "../en";

export const MESSAGES_KR: Record<string, string> = {
  ...en,
  "legal.privacyPolicy": "개인정보 처리방침",

  "app.loading": "불러오는 중…",
  "app.authLoading": "로그인 상태 확인 중…",
  "app.brandName": "My Password Vault",

  "auth.title": "로그인",
  "auth.brandHomeAria": "소개 페이지로 이동",
  "auth.subtitle":
    "계정으로 암호화된 금고를 기기 간에 동기화합니다. 마스터 비밀번호는 서버로 전송되지 않습니다.",
  "auth.google": "Google로 계속하기",
  "auth.errGeneric": "문제가 발생했습니다. 다시 시도하세요.",
  "auth.securityNote":
    "마스터 비밀번호는 업로드되지 않습니다. Google 로그인은 본인 확인용이며, 금고 비밀은 마스터 비밀번호와 인증 앱으로 잠금 해제할 때만 풀립니다.",
  "auth.notConfiguredTitle": "Supabase가 설정되지 않았습니다",
  "auth.notConfiguredBody":
    "프로젝트 루트의 .env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 넣은 뒤 개발 서버를 다시 시작하세요. DB 테이블 생성과 Google 로그인 설정은 README.md를 참고하세요.",

  "auth.faqTitle": "자주 묻는 질문",
  "auth.faqTrustQ": "믿어도 되나요? 내 데이터는 안전한가요?",
  "auth.faqTrustA":
    "비밀번호는 기기에서 암호화된 뒤에만 동기화됩니다. 서버에는 복호화할 수 없는 암호문만 저장되며, 마스터 비밀번호와 평문 비밀은 우리가 읽을 수 있는 형태로 전송되지 않습니다. Google 로그인은 동기화할 계정을 확인하는 용도입니다.",
  "auth.faqUseQ": "어떻게 쓰나요? 매일 쓰기 부담스럽지 않나요?",
  "auth.faqUseA":
    "Google로 로그인하고, 강한 마스터 비밀번호를 정한 뒤 QR 한 번으로 2단계 인증을 연결하면 됩니다. 잠금 해제 후에는 목록에 항목을 추가·검색하면 됩니다. 자동 잠금으로 자리를 비울 때 금고가 닫히고, 다른 브라우저나 휴대폰에서 같은 계정으로 로그인하면 동기화됩니다.",
  "auth.faqWhatAuthenticatorQ":
    "인증(Authenticator) 앱이 무엇이고, 역할은 무엇이며 어떤 앱을 써야 하나요?",
  "auth.faqWhatAuthenticatorA":
    "인증 앱은 휴대폰이나 컴퓨터에 설치해 주기적으로 바뀌는 숫자 코드(보통 6자리)를 만들어 두 번째 확인 수단으로 쓰는 앱입니다. QR로 금고와 비밀이 공유된 뒤에는 잠금 해제 때마다 마스터 비밀번호와 새 코드가 함께 필요해, 마스터 비밀번호만 들킨 상태로는 열 수 없도록 합니다. Google Authenticator, Microsoft Authenticator, Authy, FreeOTP처럼 TOTP(RFC 기반 시간 OTP) 표준을 지원하는 신뢰할 수 있는 앱이면 대부분 사용할 수 있습니다. 쓰는 비밀번호 관리자(예: 1Password, Bitwarden) 안의 OTP 기능을 쓰셔도 됩니다. 업데이트를 잘 하는 앱과 제작사를 선택하세요.",
  "auth.faqAuthenticatorQ":
    "인증 앱이 고장 났거나, 휴대폰을 잃어버렸거나, 코드가 안 맞으면 어떻게 되나요?",
  "auth.faqAuthenticatorA":
    "암호화된 금고는 계정에 그대로 남아 있습니다. 새 기기나 초기화 후에는: 로그인 → 설정의 ‘계정에서 최신 받기’로 암호화 스냅샷을 받고 → 마스터 비밀번호를 입력한 뒤 → 안내에 따라 새 QR을 스캔해 대체 인증기를 연결하면 됩니다. 확인을 마치면 예전 시간 기반 코드는 더 이상 쓰이지 않는 것이 정상이지만, 데이터가 지워진 것은 아닙니다. 이전 인증 기기가 아직 있다면 종종 재연결 없이 마스터+6자리로 바로 잠금 해제할 수도 있습니다.",
  "auth.faqPricingQ": "유료인가요, 무료인가요?",
  "auth.faqPricingA":
    "비밀번호 항목은 무료로 최대 25개까지 저장할 수 있습니다. $4.99를 한 번만 결제하면 이 계정에서 항목 수 제한 없이 계속 쓸 수 있습니다. 앱 주소에 #/pricing 을 붙이거나 설정에서 요금제 페이지로 이동해 결제할 수 있습니다.",
  "auth.pricingLink": "요금제·결제",
  "auth.faqContactQ": "문제가 생기면 어디로 연락하나요?",
  "auth.faqContactA":
    "문의·버그 신고·제안은 contact@skyface.com 으로 메일 주세요. 보내주신 내용은 확인합니다.",
  "auth.faqMasterQ": "마스터 비밀번호를 잊으면 어떻게 되나요?",
  "auth.faqMasterA":
    "마스터 비밀번호 없이는 우리 포함 누구도 금고를 열 수 없습니다. 잊으면 해당 기기의 항목은 초기화로 모두 삭제해야 합니다. 클라우드 복구나 오프라인으로 받은 암호화 백업도, 그 백업을 만들 당시 쓰던 마스터 비밀번호가 있어야 열립니다.",
  "auth.faqExportQ": "오프라인 백업을 따로 가질 수 있나요?",
  "auth.faqExportA":
    "네. 잠금 해제 후 설정에서 ‘오프라인 JSON 파일(고급)’으로 암호화된 내보내기를 받을 수 있습니다. 안전한 곳에 보관하고, 그 시점의 마스터 비밀번호와 함께 관리하세요.",

  "common.cancel": "취소",
  "common.close": "닫기",
  "common.confirm": "확인",
  "common.save": "저장",
  "autoLock.m1": "1분",
  "autoLock.m5": "5분",
  "autoLock.m15": "15분",
  "autoLock.m30": "30분",
  "autoLock.off": "사용 안 함",
  "autoLock.offBad": "사용 안 함 (권장하지 않음)",
  "setup.pageTitle": "시작 설정",
  "setup.pageTitle2fa": "2단계 인증",
  "setup.title": "My Password Vault 설정",
  "setup.subtitle":
    "로그인한 뒤 여기서 새 vault를 만듭니다. 마스터 비밀번호는 어떤 서버에도 저장되지 않습니다.",
  "setup.masterPw": "마스터 비밀번호",
  "setup.masterPwConfirm": "마스터 비밀번호 확인",
  "setup.placeholderMin": "10자 이상",
  "setup.autoLock": "자동 잠금 (분)",
  "setup.next2fa": "다음 — 2단계 인증 설정",
  "setup.forgetWarn":
    "비밀번호를 잊으면 vault를 복구할 수 없습니다. 잊은 경우 데이터를 모두 잃고 새로 시작해야 합니다.",
  "setup.2faIntro":
    "아래 QR코드를 Google Authenticator, 1Password, Authy 등에 스캔하거나 비밀키를 직접 입력하세요. 그 다음 표시되는 6자리 코드를 입력해 확인합니다.",
  "setup.secretKey": "비밀키 (수동 입력용)",
  "setup.openOtpauth": "otpauth:// 링크 열기",
  "setup.totpCode": "앱에서 표시되는 6자리 코드",
  "setup.back": "뒤로",
  "setup.confirmStart": "확인 후 시작",
  "setup.errMin": "마스터 비밀번호는 10자 이상으로 설정하세요.",
  "setup.errMismatch": "두 비밀번호가 일치하지 않습니다.",
  "setup.errGeneric": "오류가 발생했습니다.",
  "lock.title": "잠긴 Vault",
  "lock.subtitle": "마스터 비밀번호와 6자리 인증 코드를 입력하세요.",
  "lock.masterPw": "마스터 비밀번호",
  "lock.totp": "2단계 인증 코드",
  "lock.unlock": "잠금 해제",
  "lock.forget": "비밀번호를 잊었나요? Vault 초기화…",
  "lock.resetWarn":
    "초기화하면 저장된 모든 비밀번호가 영구 삭제됩니다. 정말 계속하시겠어요?",
  "lock.deleteAll": "모두 삭제하고 새로 시작",
  "lock.errFailed": "잠금 해제 실패",
  "errors.masterTooShort": "마스터 비밀번호는 10자 이상이어야 합니다.",
  "errors.noPendingSetup": "진행 중인 설정이 없습니다.",
  "errors.invalidOtp": "인증 코드가 올바르지 않습니다.",
  "errors.notInitialized": "Vault가 초기화되지 않았습니다.",
  "errors.wrongMaster": "마스터 비밀번호가 올바르지 않습니다.",
  "errors.wrongTotp": "2단계 인증 코드가 올바르지 않습니다.",
  "errors.locked": "잠금 상태입니다.",
  "errors.invalidBackup": "올바른 vault 백업 파일이 아닙니다.",
  "errors.missingUserVaultsTable":
    "Supabase에 user_vaults 테이블이 없습니다. 대시보드 → SQL Editor에서 이 저장소의 supabase/migrations/20260513120000_user_vaults.sql 내용을 붙여넣어 실행한 뒤 다시 시도하세요.",
  "errors.noCloudBackup":
    "이 계정에 저장된 암호화 금고가 아직 없습니다. 이미 금고가 있는 기기에서 사용하거나, 아래 고급 메뉴의 오프라인 파일을 사용하세요.",
  "errors.entryLimitReached":
    "무료 플랜에서는 비밀번호 항목을 최대 {{limit}}개까지 저장할 수 있습니다. 더 추가하려면 유료 라이선스로 업그레이드하세요.",
  "errors.importExceedsEntryLimit":
    "이 백업에는 {{limit}}개를 넘는 항목이 있습니다. 가져오기 전에 영구 라이선스를 구매하거나, 파일에서 항목을 줄이세요.",

  "strength.0": "비어 있음",
  "strength.1": "약함",
  "strength.2": "보통",
  "strength.3": "강함",
  "strength.4": "매우 강함",
  "settings.title": "설정",
  "settings.autoLock": "자동 잠금 (분)",
  "settings.autoLockHint": "마우스/키보드 입력이 없으면 자동으로 잠깁니다.",
  "settings.language": "언어",
  "settings.danger": "위험 구역",
  "settings.resetVault": "Vault 초기화 (모든 데이터 삭제)",
  "settings.resetDesc":
    "저장된 모든 비밀번호와 2FA 설정이 삭제됩니다. 되돌릴 수 없습니다.",
  "settings.permanentDelete": "영구 삭제",

  "settings.syncTitle": "기기·백업",
  "settings.syncHint":
    "로그인한 동안 이 앱은 데이터베이스에 암호화된 사본을 둡니다(서버는 내용을 읽을 수 없습니다). 새 브라우저나 휴대폰에서는 같은 계정으로 로그인한 뒤, 필요하면 「계정에서 최신 받기」를 누르고, 예전과 같은 마스터 비밀번호와 인증 앱 6자리로 잠금 해제하세요.",
  "settings.pullCloud": "계정에서 최신 받기",
  "settings.pullCloudHint":
    "이 기기에만 있던 금고를 계정에 저장된 암호화 스냅샷으로 바꿉니다. 잠금 해제가 안 되거나 기기를 바꾼 직후에 사용하세요.",
  "settings.pullCloudDone": "계정에서 받았습니다. 설정 창이 열려 있으면 아래에서 다시 잠금 해제하세요.",
  "settings.fileBackupAdvanced": "오프라인 JSON 파일 (고급)",
  "settings.fileBackupAdvancedHint":
    "선택 사항입니다. 이 앱에서 보낸 .json만 가져오세요. 데이터는 동일하게 암호화되어 있으며, 마스터 비밀번호·6자리 코드는 그 파일을 만든 당시의 금고와 같아야 합니다.",
  "settings.exportBackup": "백업 다운로드 (.json)",
  "settings.copyBackupFail": "복사에 실패했습니다(용량 또는 권한). 다운로드를 사용하세요.",
  "settings.importBackup": "백업 가져오기…",
  "settings.importConfirm": "이 기기의 vault를 백업으로 바꿀까요? 저장하지 않은 변경은 사라지며 다시 잠금 해제해야 합니다.",
  "settings.importApply": "바꾸고 잠금",
  "settings.importCancel": "가져오기 취소",

  "settings.accountTitle": "계정",
  "settings.signedInAs": "로그인: {{email}}",
  "settings.signOut": "계정에서 로그아웃",
  "settings.signOutHint":
    "클라우드 동기화만 종료합니다. 이 기기의 로컬 금고는 초기화하기 전까지 유지됩니다.",

  "settings.licenseTitle": "요금제·항목 제한",
  "settings.licenseFree":
    "무료: 이 계정에 비밀번호 항목 최대 {{limit}}개. 서버는 비밀번호 내용을 알 수 없습니다.",
  "settings.licensePaid":
    "영구 라이선스: $4.99 일회 결제 — 항목 수 무제한. 로그인한 계정에 연결됩니다.",
  "settings.licenseStatusLicensed": "이 계정은 영구 라이선스가 적용되어 있습니다(항목 무제한).",
  "settings.licenseStatusFree": "무료 플랜입니다 ({{count}} / {{limit}}개 사용 중).",
  "settings.licenseLoading": "라이선스 확인 중…",
  "settings.licenseLink": "요금제·결제 페이지 열기",
  "settings.licenseRefresh": "상태 새로고침",
  "settings.planBadgeFree": "무료",
  "settings.planBadgeLicensed": "라이선스 적용",
  "settings.licenseKeyLabel": "라이선스 키",
  "settings.licenseKeyHint":
    "결제 시 발급된 참조 값(Stripe 체크아웃 세션)입니다. 읽기 전용이며 본인 기록용으로 보관하세요.",
  "settings.licenseCopyKey": "복사",
  "settings.licenseKeyCopied": "복사됨",
  "settings.licenseNoSessionId":
    "라이선스는 활성화되어 있으나, 이 계정에 저장된 결제 참조가 아직 없습니다.",

  "lock.syncTitle": "계정에서 불러오기",
  "lock.pullCloud": "계정에서 복원하기",
  "lock.pullCloudHint":
    "로그인이나 잠금 해제가 어려우신가요? 걱정하지 마세요. 비밀번호는 계정에 안전하게 백업되어 있습니다. 이 기기에서 복원하면 암호화된 금고를 받아 드린 뒤, 마스터 비밀번호 확인과 인증 앱 다시 등록을 단계별로 안내합니다.",
  "lock.pullCloudDone":
    "복원이 완료되었습니다. 아래에 마스터 비밀번호를 입력한 뒤 QR을 스캔해 마무리하세요.",
  "lock.rebindTitle": "이 기기에서 복구 마무리",
  "lock.rebindSubtitleMaster":
    "금고 데이터는 이 기기에 있습니다. 금고를 만들 때 쓰던 마스터 비밀번호를 입력하세요. 다음 화면에서 새 QR을 스캔하면 됩니다. 확인을 마치면 예전·분실한 휴대폰의 인증 코드는 더 이상 쓰이지 않습니다.",
  "lock.rebindContinue": "다음",
  "lock.rebindUseOldTotp":
    "예전 인증 앱이 그대로 있어요 — 건너뛰고 마스터 + 6자리로 잠금 해제",
  "lock.rebind2faIntro":
    "Google Authenticator, 1Password, Authy 등으로 QR을 스캔한 뒤, 표시되는 6자리 코드를 입력해 확인하세요. 이 금고의 이전 인증기는 교체됩니다.",
  "lock.rebindConfirm": "확인하고 금고 열기",
  "lock.fileBackupAdvanced": "오프라인 JSON 파일 (고급)",
  "lock.fileBackupAdvancedHint":
    "선택 사항입니다. 이 앱에서 보낸 .json만 가져오세요. 마스터 비밀번호·6자리 코드는 그 파일을 만들 당시의 금고와 같아야 합니다.",
  "lock.exportBackup": "암호화 백업 다운로드 (.json)",
  "lock.importBackup": "백업 파일에서 복원…",
  "lock.importConfirm": "선택한 백업으로 이 기기의 vault를 바꿀까요?",

  "setup.restoreBackup": "대신 백업 파일에서 복원",
  "setup.restoreConfirm":
    "이 백업으로 이 기기의 빈 vault 자리를 채웁니다. 계속할까요?",
  "setup.restoreApply": "백업 불러오기",

  "vault.pageTitle": "금고",
  "vault.licenseBadgeFree": "무료",
  "vault.licenseBadgeLicensed": "라이선스",
  "vault.search": "검색 (사이트, URL, 사용자명, 메모, 상세, 카테고리)",
  "vault.colCategory": "카테고리",
  "vault.manageCategories": "카테고리 관리",
  "vault.categoriesTitle": "카테고리",
  "vault.categoriesHint":
    "이름을 추가·수정한 뒤 저장하세요. 표의 카테고리 열에서 항목에 지정할 수 있습니다.",
  "vault.addCategory": "카테고리 추가",
  "vault.deleteCategory": "카테고리 삭제",
  "vault.deleteCategoryConfirm":
    "이 카테고리를 삭제할까요? 사용 중인 항목은 분류 없음으로 바뀝니다.",
  "vault.categoryName": "카테고리 이름",
  "vault.dragToReorder": "끌어서 순서 변경",
  "vault.newCategory": "새 카테고리",
  "vault.uncategorized": "—",
  "vault.ttPasswords": "표의 모든 비밀번호 보이기/가리기",
  "vault.revealAll": "모두 보기",
  "vault.maskAll": "모두 숨기기",
  "vault.addRow": "항목 추가",
  "vault.settings": "설정",
  "vault.lock": "잠그기",
  "vault.colSite": "사이트",
  "vault.colUrl": "URL",
  "vault.colUser": "사용자명",
  "vault.colPass": "비밀번호",
  "vault.colNotes": "메모",
  "vault.colMemo": "상세 메모",
  "vault.colActions": "동작",
  "vault.empty": "저장된 항목이 없습니다.",
  "vault.emptyCta": "새 항목을 추가하세요.",
  "vault.footer":
    "비밀번호는 AES-GCM-256으로 암호화됩니다. 로그인 시 암호문이 계정에 동기화되며 서버는 내용을 읽을 수 없습니다. 복사된 비밀번호는 20초 후 클립보드에서 지워집니다.",
  "vault.totalItems": "전체 {{count}}개",
  "vault.entryLimitBanner":
    "이 계정의 무료 한도({{limit}}개)에 도달했습니다. 한 번 업그레이드하면 항목을 무제한으로 추가할 수 있습니다.",
  "vault.entryLimitUpgrade": "요금제 보기·업그레이드",
  "vault.entryLimitModalTitle": "항목 한도 도달",
  "vault.entryLimitModalBody":
    "무료 플랜에서는 비밀번호 항목을 최대 {{limit}}개까지 저장할 수 있습니다. 영구 라이선스를 구매하면 계속 추가할 수 있습니다.",
  "vault.entryLimitModalCta": "요금제 보기",
  "vault.entryLimitModalClose": "닫기",
  "vault.summaryUncategorized": "분류 없음",
  "vault.newEntry": "새 항목",
  "vault.sortBy": "정렬",
  "vault.sortRecent": "최근 수정순",
  "vault.phMemo": "메모 입력",
  "vault.ttExpandRow": "URL·상세 메모 펼치기",
  "vault.ttCollapseRow": "URL·상세 메모 접기",

  "vault.phUrl": "https://…",
  "vault.phUser": "user@example.com",
  "vault.phPass": "비밀번호",
  "vault.ttOpenTab": "새 탭에서 열기",
  "vault.ttCopyUser": "사용자명 복사",
  "vault.hide": "숨기기",
  "vault.show": "보기",
  "vault.ttCopyPass": "비밀번호 복사",
  "vault.ttGenPass": "비밀번호 생성",
  "vault.ttDelete": "삭제",
  "pwdGen.title": "비밀번호 생성",
  "pwdGen.length": "길이",
  "pwdGen.regen": "다시 생성",
  "pwdGen.copy": "복사",
  "pwdGen.copied": "복사됨",
  "pwdGen.use": "사용",
  "pwdGen.cLower": "소문자 a-z",
  "pwdGen.cUpper": "대문자 A-Z",
  "pwdGen.cDigits": "숫자 0-9",
  "pwdGen.cSymbols": "특수문자 !@#$",
  "pwdGen.cAmbiguous": "혼동되는 문자 제외",

  "pricing.backHome": "소개 페이지",
  "pricing.backApp": "금고로 돌아가기",
  "pricing.title": "명확한 한도, 한 번의 업그레이드",
  "pricing.subtitle":
    "넉넉한 무료 한도로 시작한 뒤, 한 번의 결제로 무제한 항목을 쓸 수 있습니다. 월 구독이 없습니다.",
  "pricing.supabaseRequired":
    "결제·라이선스를 쓰려면 README에 따라 Supabase를 연결하세요.",
  "pricing.checkoutSuccess":
    "결제가 접수되었습니다. 라이선스가 아직 반영되지 않았다면 잠시 후 이 페이지를 새로고침하세요.",
  "pricing.checkoutCancel": "결제를 취소했습니다. 준비되면 다시 시도할 수 있습니다.",
  "pricing.youAreLicensed": "이 계정에는 이미 영구 라이선스가 적용되어 있습니다. 감사합니다.",
  "pricing.tierFree": "무료",
  "pricing.freeForever": "월 요금 없음",
  "pricing.freeDesc": "개인 사용과 보안 기능을 모두 체험하기에 적합합니다.",
  "pricing.freeF1": "비밀번호 항목 최대 25개",
  "pricing.freeF2": "로컬 우선 AES-GCM-256 암호화 + TOTP 2FA",
  "pricing.freeF3": "Supabase로 암호문만 동기화",
  "pricing.freeF4": "오프라인 JSON 백업·복원",
  "pricing.freeFootnote":
    "{{limit}}개에 도달하면 새 행 추가가 일시 중지됩니다. 업그레이드하거나 항목을 삭제하세요.",
  "pricing.tierPaid": "영구 라이선스",
  "pricing.paidOnce": "일회 USD 4.99 — 구독 없음",
  "pricing.paidDesc": "이 계정에서 비밀번호 항목을 영구적으로 무제한으로 저장합니다.",
  "pricing.paidF1": "비밀번호 항목 무제한",
  "pricing.paidF2": "무료 플랜의 모든 기능 + 항목 수 제한 해제",
  "pricing.paidF3": "동일한 제로 지식 모델 — 마스터 비밀번호는 서버로 가지 않습니다",
  "pricing.paidF4": "라이선스는 계정에 저장되며, 로그인하는 모든 기기에서 동일하게 적용됩니다",
  "pricing.signInToBuy": "Google로 로그인한 뒤 결제로 이동",
  "pricing.signInHint": "Google 계정은 라이선스와 암호화 금고를 연결하는 데만 사용됩니다.",
  "pricing.alreadyLicensed": "라이선스 적용됨 — 감사합니다",
  "pricing.ctaBuy": "안전한 결제 페이지로 이동",
  "pricing.stripeNote": "결제는 Stripe에서 처리됩니다. 결제를 위해 잠시 외부 페이지로 이동합니다.",
  "pricing.errSignIn": "먼저 로그인하세요.",
  "pricing.errCheckout": "결제를 시작할 수 없습니다. 다시 시도하거나 문의하세요.",
  "pricing.opsTitle": "운영 체크리스트 (Supabase + Stripe)",
  "pricing.ops1":
    "Supabase SQL Editor에서 `20260515180000_user_entitlements.sql` 마이그레이션을 실행하세요.",
  "pricing.ops2":
    "Edge Functions `create-checkout-session`, `stripe-webhook`을 배포하고 STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PUBLIC_APP_URL(배포 URL, 프로덕션은 /app 포함), 선택 STRIPE_LICENSE_AMOUNT_CENTS(기본 499)를 설정하세요.",
  "pricing.ops3": "Stripe 대시보드에서 `stripe-webhook` URL을 등록하고 checkout.session.completed 이벤트를 구독하세요.",
  "pricing.ops4": "결제 후 잠금 해제하거나 이 페이지를 열면 user_entitlements에서 라이선스를 다시 읽어 옵니다.",
};
