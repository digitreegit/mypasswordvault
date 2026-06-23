/**
 * Landing page translations. Shares localStorage locale with SPA: mypasswordapp-locale.
 * Full copy for es/cn/jp/de/fr/it/id lives in landing-overlays.js → MPV_LANDING_OVERLAYS (KR remains here).
 */
(function () {
  var STORAGE_KEY = "mypasswordapp-locale";
  var LOCALES = ["en", "es", "kr", "cn", "jp", "de", "fr", "it", "id"];
  var LABELS = {
    en: "English",
    es: "Español",
    kr: "한국어",
    cn: "简体中文",
    jp: "日本語",
    de: "Deutsch",
    fr: "Français",
    it: "Italiano",
    id: "Bahasa Indonesia",
  };
  var HTML_LANG_MAP = {
    en: "en",
    es: "es",
    kr: "ko",
    cn: "zh-CN",
    jp: "ja",
    de: "de",
    fr: "fr",
    it: "it",
    id: "id",
  };

  function normalizeLocale(raw) {
    if (!raw) return "en";
    var k = String(raw)
      .trim()
      .toLowerCase()
      .replace("_", "-");
    if (LOCALES.indexOf(k) >= 0) return k;
    var short = k.split("-")[0] || k;
    if (LOCALES.indexOf(short) >= 0) return short;
    var alias = {
      ko: "kr",
      zh: "cn",
      "zh-cn": "cn",
      "zh-hans": "cn",
      ja: "jp",
      "en-us": "en",
      "en-gb": "en",
      "es-mx": "es",
      th: "en",
      "th-th": "en",
      vi: "en",
      "vi-vn": "en",
    };
    return alias[k] || alias[short] || "en";
  }

  function applyVars(str) {
    var year = String(new Date().getFullYear());
    return str.replace(/\{\{year\}\}/g, year);
  }

  var CANONICAL_BASE = "https://mypasswordvault.app";
  var CANONICAL_PATHS = {
    home: "/",
    faq: "/faq.html",
    pricing: "/pricing.html",
    privacy: "/privacy.html",
    terms: "/terms.html",
  };

  function upsertMeta(attr, key, value) {
    if (!value) return;
    var sel = "meta[" + attr + '="' + key + '"]';
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  }

  function upsertCanonical(href) {
    if (!href) return;
    var el = document.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  }

  function applySeoMeta(title, desc, page, dict) {
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", desc);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", desc);
    var canonical = CANONICAL_BASE + (CANONICAL_PATHS[page] || "/");
    upsertMeta("property", "og:url", canonical);
    upsertCanonical(canonical);
    var keywords =
      typeof dict.metaKeywords === "string" && dict.metaKeywords
        ? dict.metaKeywords
        : typeof EN.metaKeywords === "string"
          ? EN.metaKeywords
          : "";
    if (keywords) upsertMeta("name", "keywords", keywords);
  }

  var EN = {
    metaTitle: "My Password Vault — Local-First Encrypted Password Manager",
    metaDescription:
      "Password manager with AES-GCM-256 encryption, TOTP 2FA, passkeys, and spreadsheet-simple editing. Your master password is not sent to our servers. Optional encrypted, ciphertext-only sync on web, iOS & Android.",
    metaKeywords:
      "password manager, encrypted password vault, local-first password manager, TOTP 2FA, passkey login, encrypted sync, spreadsheet password manager, password generator, Skyface",
    metaTitleFaq: "FAQ — My Password Vault Password Manager",
    metaDescriptionFaq:
      "Answers about My Password Vault security, AES-GCM-256 encryption, master password, passkeys, TOTP 2FA, encrypted cloud sync, backups, pricing, and support.",
    metaTitlePricing: "Pricing — My Password Vault PRO License",
    metaDescriptionPricing:
      "My Password Vault pricing: free password manager tier plus a $4.99 one-time PRO lifetime license for unlimited entries, encrypted export, and premium features.",
    metaTitlePrivacy: "Privacy Policy — My Password Vault",
    metaDescriptionPrivacy:
      "Privacy Policy for My Password Vault by Skyface, LLC — local-first encryption, ciphertext-only sync, and what we never store.",
    metaTitleTerms: "Terms of Use — My Password Vault",
    metaDescriptionTerms:
      "Terms of Use for My Password Vault by Skyface, LLC — accounts, purchases, acceptable use, and liability.",
    logoAria: "My Password Vault home",
    langAria: "Language",
    navHome: "Home",
    navMenu: "Menu",
    navFaq: "FAQ",
    navPricing: "Pricing",
    navSignIn: "Sign In",
    navUserMenu: "Account menu",
    navOpenMyVault: "Open my vault",
    navAccountPreference: "Account preference",
    navSettings: "Settings",
    navLogOut: "Log out",
    heroEyebrow: "hassle-free password manager",
    heroH1Line1: "Passwords you control.",
    heroH1Line2: "Clarity you feel.",
    heroLead_html:
      "A local-first vault that works like a spreadsheet — fast edits, categories, one-tap copy — while\n          your secrets stay encrypted on-device. Optional sync stores <strong>only ciphertext</strong> in\n          your database; your master password is never sent to our servers.",
    ctaGettingStarted: "Getting started",
    featTitle: "Built for flow",
    featDesc:
      "No vault-inside-vault navigation. One grid: site, URL, username, password, notes — edit inline,\n          expand rows for URL & memo, filter and sort. Categories keep teams and life buckets tidy.",
    featCard1Title: "Spreadsheet brain, vault muscle",
    featCard1Body:
      "Type directly in the grid. Reveal or mask passwords per row or globally. Copy username or\n              password in one click; copied passwords auto-clear from the clipboard after 20 seconds.",
    featCard2Title: "Categories & search",
    featCard2Body:
      "Drag to reorder folders in settings. Search spans site, URL, username, notes, memo, and\n              category — find the right row without hunting through menus.",
    featCard3Title: "Strong passwords, fast",
    featCard3Body:
      "Built-in generator with length and character-class controls, CSPRNG-backed generation, and\n              bias-mitigated modulo — then drop the result straight into the row.",
    secTitle: 'Security that earns the name "vault"',
    secDesc:
      "Cryptography runs in your browser via the Web Crypto API. Data at rest in IndexedDB is encrypted;\n          the key material derived from your master password exists in memory only while unlocked.",
    secDerivTitle: "Key derivation & encryption",
    secDerivLead_html:
      '<span class="mono">PBKDF2-SHA256</span> with a per-vault salt and\n              <strong>600,000 iterations</strong> stretches your master password into a 256-bit key. Entry\n              passwords and the TOTP secret are sealed with <span class="mono">AES-GCM-256</span> and a\n              random 12-byte IV per encryption — modern AEAD, not home-grown crypto.',
    secDiagram:
      "master password + salt\n        │\n  PBKDF2-SHA256 (600k)\n        ▼\n AES-GCM key (memory only)\n   ├── verifier (proves master password)\n   ├── TOTP secret\n   └── each entry password (own IV)",
    secNeverTitle: "What never gets stored",
    nw1Strong: "Master password",
    nw1Span: "Neither plaintext nor a reusable hash is written to disk or sent to a server.",
    nw2Strong: "Derived AES key",
    nw2Span: "Lives in memory for your session; discarded on lock or when you close the tab.",
    nw3Strong: "Server-side knowledge",
    nw3Span_html:
      "Google or email sign-in only proves identity. Optional sync uploads the same ciphertext JSON you\n                    could export — never your master password or keys.",
    syncTitle: "Optional sync — encrypted blobs, not trust",
    syncDesc:
      "When signed in, your vault can sync automatically as encrypted data in your database (e.g. Supabase\n          with row-level security). The server stores what your browser already had: ciphertext. On every\n          device you unlock with your passkey — Touch ID, Face ID, or device PIN — or with your master\n          password and a backup code.",
    syncC1Title: "Conflict handling",
    syncC1Body:
      "Reconciliation uses vault metadata timestamps so the newest snapshot wins when merging local and\n              remote — predictable behavior for a personal vault.",
    syncC2Title: "Portable backups",
    syncC2Body:
      "Export a JSON backup anytime from settings or the lock screen. Import replaces or restores a\n              device — ideal for migration or cold storage alongside sync.",
    syncC3Title: "Auto-lock",
    syncC3Body:
      "Idle timeout (1–30 minutes or off) locks the vault automatically. Activity resets the timer so\n              brief walks away don’t leave rows exposed.",
    gsTitle: "Getting started",
    gsDesc:
      "First launch walks you through a vault you actually own — no vendor password to forget on top of\n          your own.",
    gsStep1Strong: "Sign in with Google or email",
    gsStep1Span: "Identity for sync only — it doesn’t unlock your vault.",
    gsStep2Strong: "Create a strong master password",
    gsStep2Span: "10+ characters; strength meter nudges you toward better entropy.",
    gsStep3Strong: "Register a passkey",
    gsStep3Span:
      "Unlock with Touch ID, Face ID, or device PIN. Add a backup authenticator (TOTP) and save your recovery codes for new devices.",
    gsStep4Strong: "Add rows like a sheet",
    gsStep4Span: "Sites, passwords, categories — save and sync when you’re ready.",
    landingPriceTitle: "Simple limits, one upgrade",
    landingPriceSubtitle:
      "Start free with a generous entry cap, then unlock unlimited passwords with a single payment — no subscription.",
    landingTierFree: "Free",
    landingFreeForever: "No monthly fee",
    landingFreeDesc: "For personal use and trying the product with full security features.",
    landingFreeF1: "Up to 25 password entries",
    landingFreeF2: "Passkey unlock + AES-GCM-256 encryption (TOTP backup)",
    landingFreeF3: "Encrypted sync to your account (ciphertext only in your database)",
    landingFreeF4: "Offline JSON backup & restore",
    landingFreeF5: "Syncs and works on every device you sign into",
    landingFreeFootnote:
      "When you reach 25 entries, adding new rows is paused until you upgrade or delete entries.",
    landingTierPaid: "PRO",
    landingMostPopular: "Most popular",
    landingPaidOnce: "One-time USD 4.99 — no subscription",
    landingPaidDesc: "Unlock unlimited password entries on this account forever.",
    landingPaidF1: "Unlimited password entries",
    landingPaidF2: "Everything in Free, plus:",
    landingPaidF3: "One-time payment — no subscription",
    landingPaidF4: "Permanent license on this account",
    landingCtaBuy: "Continue to secure checkout",
    landingSignInHint: "We use your Google or email account only to attach the license and encrypted vault.",
    faqTitle: "Common questions",
    faqDesc:
      "Quick answers about trust, day-to-day use, passkeys, backups, pricing, and how to reach us.",
    faq1_sum: "How does My Password Vault protect my data?",
    faq1_html:
      "Your entries are encrypted on your device before anything is synced, so the servers store ciphertext\n              rather than readable passwords, and your master password is not sent to us. Google or email sign-in is\n              used only to tie the encrypted vault to your account. No software can promise perfect security, so a strong\n              master password and good device hygiene remain important on your side.",
    faq2_sum: "How do I use it? Will it feel simple day to day?",
    faq2_html:
      "Sign in with Google or email, set a master password, register a passkey, then save a backup authenticator and recovery codes. Day to day, unlock with Touch ID, Face ID, or device PIN—no typing passwords or OTP codes.",
    faq3_sum: "What is a passkey and how do I sign in?",
    faq3_html:
      "A passkey uses your device’s secure chip to prove it’s you. Only a public key is stored on the server. Unlock by approving with biometrics or PIN—the device signs a challenge. No password or authenticator code on normal sign-in.",
    faq4_sum: "What are backup authenticator and recovery codes?",
    faq4_html:
      "If you lose your passkey device, use your master password plus a backup authenticator app (TOTP) or a one-time recovery code from setup. Restore from your account and register a new passkey when needed.",
    faq5_sum: "Is this free or paid?",
    faq5_html:
      "Up to 25 password entries are free. A one-time $4.99 payment unlocks unlimited entries on your\n              account — no subscription. See <a href=\"./pricing.html\">Plans &amp; pricing</a> for checkout.",
    faq6_sum: "What if I forget my master password?",
    faq6_html:
      "Nobody (including us) can recover your passwords without your master password. If you lose it you\n              must reset the vault and lose existing entries on that device. Cloud restore and encrypted backup\n              files always require the same master password used when those backups were made.",
    faq7_sum: "Can I keep an offline backup?",
    faq7_html:
      "Yes. After you unlock, open Settings → Offline JSON file (advanced) to download an encrypted\n              export. Store it somewhere safe; you will still need the master password from the time of export\n              to open it.",
    faq8_sum: "Who do I contact if something goes wrong?",
    faq8_html:
      'Email\n              <a href="mailto:contact@skyface.com">contact@skyface.com</a>\n              for questions, bug reports, or feedback—we read incoming mail.',
    ctaReadyTitle: "Ready when you are",
    ctaReadyLead:
      "Same tool for weekend admins and daily operators: fewer clicks, fewer tabs, more confidence that\n          your credentials never left encryption you control.",
    seoOverviewTitle: "A password manager built for clarity, not clutter",
    seoOverviewBody:
      "My Password Vault is a local-first password manager for web, iPhone, and Android. Store site logins in an AES-GCM-256 encrypted vault with PBKDF2 key stretching, unlock with your master password plus passkey or TOTP two-factor authentication, and edit everything in a spreadsheet-style grid with categories, search, and one-click copy. Cloud sync is optional and uploads ciphertext only—we never receive your master password or decrypted secrets. Start free, then upgrade to PRO with a one-time license for unlimited entries and encrypted backup export.",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Use",
    footerCopy: "©{{year}} Skyface, LLC. All rights reserved.",
    storeBadgeAppStore: "Download on the App Store",
    storeBadgeGooglePlay: "Get it on Google Play",
  };

  var KO = {
    metaTitle: "My Password Vault — 로컬 우선 암호화 비밀번호 관리",
    metaDescription:
      "AES-GCM-256 암호화, TOTP 2FA, 패스키, 스프레드시트형 편집을 갖춘 비밀번호 관리자. 마스터 비밀번호는 당사 서버로 전송되지 않습니다. 웹·iOS·Android에서 선택형 암호문 전용 동기화.",
    metaKeywords:
      "비밀번호 관리자, 암호화 비밀번호 금고, 로컬 우선, TOTP 2FA, 패스키, 암호화 동기화, 스프레드시트형 비밀번호 관리, My Password Vault",
    metaTitleFaq: "자주 묻는 질문 — My Password Vault",
    metaDescriptionFaq:
      "My Password Vault 보안, AES-GCM-256 암호화, 마스터 비밀번호, 패스키, TOTP 2FA, 암호화 동기화, 백업, 요금, 지원에 대한 답변.",
    metaTitlePricing: "요금제 — My Password Vault PRO",
    metaDescriptionPricing:
      "My Password Vault 요금: 무료 플랜과 $4.99 일회성 PRO 평생 라이선스(무제한 항목, 암호화 내보내기 등).",
    metaTitlePrivacy: "개인정보 처리방침 — My Password Vault",
    metaDescriptionPrivacy:
      "Skyface, LLC My Password Vault 개인정보 처리방침 — 로컬 우선 암호화, 암호문만 동기화, 저장하지 않는 정보.",
    metaTitleTerms: "이용약관 — My Password Vault",
    metaDescriptionTerms:
      "Skyface, LLC My Password Vault 이용약관 — 계정, 구매, 허용 사용 및 책임.",
    langAria: "언어 선택",
    navHome: "홈",
    navMenu: "메뉴",
    navFaq: "자주 묻는 질문",
    navPricing: "요금제",
    navSignIn: "로그인",
    navUserMenu: "계정 메뉴",
    navOpenMyVault: "내 금고 열기",
    navAccountPreference: "계정 설정",
    navSettings: "설정",
    navLogOut: "로그아웃",
    heroEyebrow: "부담 적은 패스워드 매니저",
    heroH1Line1: "통제하는 비밀번호.",
    heroH1Line2: "더 맑아지는 일상 보안.",
    heroLead_html:
      "로컬 우선 금고를 스프레드시트처럼 씁니다. 빠른 편집, 카테고리, 원탭 복사 — 비밀은 기기 안에서만 암호화됩니다. 선택한 동기화는 데이터베이스에 <strong>암호문만</strong> 저장합니다. 마스터 비밀번호는 당사 서버로 전송되지 않습니다.",
    ctaGettingStarted: "시작하기",
    featTitle: "흐름에 맞춘 설계",
    featDesc:
      "금고 속의 금고 같은 이동이 없습니다. 한 그리드에 사이트, URL, 사용자명, 비밀번호, 메모까지 — 인라인 편집, URL·메모 확장 행, 필터·정렬. 카테고리로 일과 생활을 정리합니다.",
    featCard1Title: "스프레드시트 감각, 금고 수준 보안",
    featCard1Body:
      "그리드에 바로 입력합니다. 행마다 또는 전체로 비밀번호 표시/숨김. 사용자명·비밀번호를 한 번의 클립으로 복사하고, 복사된 비밀번호는 20초 후 클립보드에서 비웁니다.",
    featCard2Title: "카테고리 & 검색",
    featCard2Body:
      "설정에서 폴더를 드래그해 순서를 바꿉니다. 사이트·URL·사용자명·메모·카테고리까지 검색해 원하는 줄을 빠르게 찾습니다.",
    featCard3Title: "강한 비밀번호, 빠르게",
    featCard3Body:
      "길이·문자 종류를 조절하는 생성기, CSPRNG·편향 완화 모듈로 만든 다음 바로 줄에 넣습니다.",
    secTitle: "‘금고’라는 이름에 걸맞은 보안",
    secDesc:
      "암호화는 브라우저 Web Crypto API에서 동작합니다. IndexedDB 저장 데이터는 암호화되고, 마스터 비밀번호에서 파생한 키 자료는 잠금 해제 중에만 메모리에 존재합니다.",
    secDerivTitle: "키 유도 · 암호화",
    secDerivLead_html:
      '볼트마다 다른 솔트와 함께 <span class="mono">PBKDF2-SHA256</span>을 <strong>600,000회</strong> 적용해 마스터 비밀번호를 256비트 키로 늘립니다. 항목 비밀번호와 TOTP 비밀은 <span class="mono">AES-GCM-256</span>과 암호화마다 새 12바이트 IV로 봉인합니다. 표준 AEAD를 쓰고, 비공식 암호화는 사용하지 않습니다.',
    secNeverTitle: "저장하지 않는 것",
    nw1Strong: "마스터 비밀번호",
    nw1Span: "평문이나 재사용 가능한 해시를 디스크에 쓰거나 서버로 보내지 않습니다.",
    nw2Strong: "파생 AES 키",
    nw2Span: "세션 동안 메모리에만 있고, 잠금 또는 탭을 닫으면 폐기됩니다.",
    nw3Strong: "서버가 알 수 있는 정보",
    nw3Span_html:
      "Google 또는 이메일 로그인은 본인 확인용입니다. 동기화는 내보내기와 같은 암호문 JSON만 올리며 마스터 비밀번호나 키는 포함하지 않습니다.",
    syncTitle: "선택 동기화 — 신뢰가 아니라 암호화 덩어리",
    syncDesc:
      "로그인하면 데이터베이스(예: Supabase 및 RLS)에 암호화된 상태로 동기화할 수 있습니다. 서버는 브라우저가 이미 가진 암호문만 보관합니다. 어느 기기에서든 패스키(Touch ID·Face ID·기기 PIN)로, 또는 마스터 비밀번호와 백업 코드로 잠금을 해제합니다.",
    syncC1Title: "충돌 처리",
    syncC1Body:
      "볼트 메타 타임스탬프를 사용해 새 스냅샷을 우선하므로 로컬·원격 합치기가 예측 가능합니다.",
    syncC2Title: "휴대 가능한 백업",
    syncC2Body:
      "설정 또는 잠금 화면에서 언제든 JSON 백업을 내보냅니다. 가져오기로 기기를 교체·복구하며 동기화와 함께 쓰기 좋습니다.",
    syncC3Title: "자동 잠금",
    syncC3Body:
      "유휴 1–30분(또는 끔) 후 자동 잠금입니다. 활동이 있으면 타이머가 리셋되어 잠시 자리 비울 때도 행이 그대로 드러나지 않습니다.",
    gsTitle: "시작하기",
    gsDesc:
      "첫 실행에서 진짜 당신 소유 금고를 만듭니다. 벤더 비밀번호를 따로 기억할 필요가 없습니다.",
    gsStep1Strong: "Google 또는 이메일로 로그인",
    gsStep1Span:
      "동기화를 위한 본인 확인일 뿐, 금고 잠금 해제에는 쓰이지 않습니다.",
    gsStep2Strong: "강한 마스터 비밀번호 만들기",
    gsStep2Span: "10자 이상, 강도 표시가 엔트로피 향상을 도와 줍니다.",
    gsStep3Strong: "패스키 등록",
    gsStep3Span:
      "Touch ID·Face ID·기기 PIN으로 잠금을 해제합니다. 새 기기를 위해 백업 인증 앱(TOTP)을 추가하고 복구 코드를 저장하세요.",
    gsStep4Strong: "시트처럼 행 추가",
    gsStep4Span: "사이트·비밀번호·카테고리를 저장하고 준비되면 동기화합니다.",
    landingPriceTitle: "명확한 한도, 한 번의 업그레이드",
    landingPriceSubtitle:
      "넉넉한 무료 한도로 시작한 뒤, 한 번의 결제로 무제한 항목을 쓸 수 있습니다. 월 구독이 없습니다.",
    landingTierFree: "무료",
    landingFreeForever: "월 요금 없음",
    landingFreeDesc: "개인 사용과 보안 기능을 모두 체험하기에 적합합니다.",
    landingFreeF1: "비밀번호 항목 최대 25개",
    landingFreeF2: "패스키 잠금 해제 + AES-GCM-256 암호화 (TOTP 백업)",
    landingFreeF3: "계정으로 암호화 동기화 (서버에는 암호문만 저장)",
    landingFreeF4: "오프라인 JSON 백업·복원",
    landingFreeF5: "로그인하는 모든 기기에서 동기화되고 그대로 사용할 수 있습니다",
    landingFreeFootnote:
      "25개에 도달하면 새 행 추가가 일시 중지됩니다. 업그레이드하거나 항목을 삭제하세요.",
    landingTierPaid: "PRO",
    landingMostPopular: "가장 인기",
    landingPaidOnce: "일회 USD 4.99 — 구독 없음",
    landingPaidDesc: "이 계정에서 비밀번호 항목을 영구적으로 무제한으로 저장합니다.",
    landingPaidF1: "비밀번호 항목 무제한",
    landingPaidF2: "무료 플랜 포함, 추가로:",
    landingPaidF3: "일회 결제 — 구독 없음",
    landingPaidF4: "이 계정에 영구 라이선스",
    landingCtaBuy: "안전한 결제 페이지로 이동",
    landingSignInHint: "Google 또는 이메일 계정은 라이선스와 암호화 금고를 연결하는 데만 사용됩니다.",
    faqTitle: "자주 묻는 질문",
    faqDesc:
      "신뢰, 일상적인 사용법, 패스키, 백업, 가격, 연락처에 대한 짧은 답변입니다.",
    faq1_sum: "My Password Vault는 내 데이터를 어떻게 보호하나요?",
    faq1_html:
      "항목은 동기화되기 전에 기기에서 암호화되므로 서버에는 읽을 수 있는 비밀번호가 아니라 암호문만 저장되며, 마스터 비밀번호는 당사로 전송되지 않습니다. Google 또는 이메일 로그인은 암호화 금고를 계정과 연결하는 용도로만 사용됩니다. 완벽한 보안을 보장할 수 있는 소프트웨어는 없으므로, 강력한 마스터 비밀번호와 안전한 기기 관리는 사용자 측에서도 중요합니다.",
    faq2_sum: "어떻게 쓰나요? 매일 쓰기 부담스럽지 않나요?",
    faq2_html:
      "Google 또는 이메일로 로그인 → 마스터 비밀번호 설정 → 패스키 등록 → 백업 인증 앱·복구 코드 저장. 평소에는 Face ID·Touch ID·기기 PIN으로 잠금을 해제하므로 비밀번호나 OTP 코드를 입력할 필요가 없습니다.",
    faq3_sum: "패스키란 무엇이고, 어떻게 로그인하나요?",
    faq3_html:
      "패스키는 기기 보안 칩에 저장된 키로 본인을 확인합니다. 서버에는 공개키만 저장됩니다. 생체 인증이나 PIN으로 챌린지에 서명하며, 평소에는 비밀번호·OTP 입력이 필요 없습니다.",
    faq4_sum: "백업 인증 앱과 복구 코드는 무엇인가요?",
    faq4_html:
      "패스키 기기를 잃었을 때는 마스터 비밀번호 + 백업 인증 앱(TOTP) 또는 설정 시 저장한 일회용 복구 코드로 잠금 해제할 수 있습니다. 필요하면 계정에서 금고를 복원하고 새 패스키를 등록하세요.",
    faq5_sum: "유료인가요, 무료인가요?",
    faq5_html:
      "비밀번호 항목은 최대 25개까지 무료입니다. $4.99를 한 번만 결제하면 이 계정에서 항목 수 제한 없이\n              계속 사용할 수 있습니다(구독 없음). <a href=\"./pricing.html\">요금제·결제</a>에서 결제할 수 있습니다.",
    faq6_sum: "마스터 비밀번호를 잊으면 어떻게 되나요?",
    faq6_html:
      "마스터 비밀번호 없이는 우리 포함 누구도 복구할 수 없습니다. 잊으면 해당 기기의 금고를 초기화해야 합니다. 클라우드 복구·암호화 백업 파일도 만들 당시의 마스터 비밀번호가 있어야 열 수 있습니다.",
    faq7_sum: "오프라인 백업을 따로 가질 수 있나요?",
    faq7_html:
      "네. 잠금 해제 후 설정에서 「오프라인 JSON 파일(고급)」으로 암호화된 내보내기를 받습니다. 안전한 곳에 보관하고, 내보낸 시점의 마스터 비밀번호와 함께 관리하세요.",
    faq8_sum: "문제가 생기면 어디로 연락하나요?",
    faq8_html:
      '문의·버그·제안은 <a href="mailto:contact@skyface.com">contact@skyface.com</a>으로 보내 주세요.',
    ctaReadyTitle: "준비되면 시작하세요",
    ctaReadyLead:
      "주말 관리자든 매일 운영하든 같은 도구입니다. 클릭과 탭을 줄이고, 통제 가능한 암호화 안에 자격 증명을 두세요.",
    seoOverviewTitle: "복잡함 대신 명확함을 위한 비밀번호 관리자",
    seoOverviewBody:
      "My Password Vault는 웹, iPhone, Android용 로컬 우선 비밀번호 관리자입니다. 사이트 로그인을 AES-GCM-256 암호화 금고에 PBKDF2 키 스트레칭과 함께 저장하고, 마스터 비밀번호와 패스키 또는 TOTP 2단계 인증으로 잠금을 해제합니다. 카테고리, 검색, 원탭 복사가 있는 스프레드시트형 그리드에서 편집하세요. 클라우드 동기화는 선택 사항이며 암호문만 업로드합니다. 마스터 비밀번호나 복호화된 비밀은 받지 않습니다. 무료로 시작한 뒤, 일회성 PRO 라이선스로 무제한 항목과 암호화 백업 내보내기를 이용하세요.",
    footerPrivacy: "개인정보 처리방침",
    footerTerms: "이용약관",
    footerCopy: "©{{year}} Skyface, LLC. All rights reserved.",
    storeBadgeAppStore: "App Store에서 다운로드",
    storeBadgeGooglePlay: "Google Play에서 받기",
  };

  var OVERLAYS = Object.assign(
    {},
    typeof globalThis.MPV_LANDING_OVERLAYS === "object" && globalThis.MPV_LANDING_OVERLAYS !== null
      ? globalThis.MPV_LANDING_OVERLAYS
      : {},
    { kr: KO },
  );

  function dictFor(locale) {
    locale = normalizeLocale(locale);
    var o = Object.assign({}, EN);
    if (OVERLAYS[locale]) Object.assign(o, OVERLAYS[locale]);
    var legal =
      typeof globalThis.MPV_LANDING_LEGAL === "object" && globalThis.MPV_LANDING_LEGAL !== null
        ? globalThis.MPV_LANDING_LEGAL
        : {};
    if (legal.en) Object.assign(o, legal.en);
    if (locale !== "en" && legal[locale]) Object.assign(o, legal[locale]);
    return o;
  }

  function pickLocaleInitial() {
    try {
      return normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
    } catch (e2) {
      return normalizeLocale(navigator.language);
    }
  }

  function applyLocale(rawLoc) {
    var loc = normalizeLocale(rawLoc);
    if (LOCALES.indexOf(loc) < 0) loc = "en";
    var D = dictFor(loc);
    try {
      window.localStorage.setItem(STORAGE_KEY, loc);
    } catch (e) {}

    document.documentElement.lang = HTML_LANG_MAP[loc] || "en";
    var page = (document.body && document.body.getAttribute("data-landing-page")) || "home";
    var titleKey = "metaTitle";
    var descKey = "metaDescription";
    if (page === "faq") {
      titleKey = "metaTitleFaq";
      descKey = "metaDescriptionFaq";
    } else if (page === "pricing") {
      titleKey = "metaTitlePricing";
      descKey = "metaDescriptionPricing";
    } else if (page === "privacy") {
      titleKey = "metaTitlePrivacy";
      descKey = "metaDescriptionPrivacy";
    } else if (page === "terms") {
      titleKey = "metaTitleTerms";
      descKey = "metaDescriptionTerms";
    }
    function pickStr(dict, key, fb) {
      var v = dict[key];
      return typeof v === "string" && v ? v : fb;
    }
    document.title = pickStr(D, titleKey, pickStr(EN, titleKey, D.metaTitle));
    var pageTitle = document.title;
    var pageDesc = pickStr(D, descKey, pickStr(EN, descKey, D.metaDescription));
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", pageDesc);
    applySeoMeta(pageTitle, pageDesc, page, D);

    document.querySelectorAll("[data-logo-landing-aria]").forEach(function (a) {
      a.setAttribute("aria-label", D.logoAria || EN.logoAria);
    });

    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.setAttribute("aria-label", D.langAria || EN.langAria);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (!key) return;
      var val = typeof D[key] === "undefined" ? EN[key] : D[key];
      if (typeof val !== "string") return;
      el.setAttribute("aria-label", val);
    });

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      var val = typeof D[key] === "undefined" ? EN[key] : D[key];
      if (typeof val !== "string") return;
      val = applyVars(val);
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = val;
      else if (el.tagName === "PRE" || el.hasAttribute("data-i18n-pre")) el.textContent = val;
      else el.textContent = val.replace(/\s*\n+\s*/g, " ").replace(/[ \t]{2,}/g, " ").trim();
    });

    syncLangMenuActive(loc);

    if (window.MPV_LANDING_AUTH_REFRESH_I18N) {
      window.MPV_LANDING_AUTH_REFRESH_I18N();
    }
  }

  function syncLangMenuActive(locale) {
    document.querySelectorAll(".landing-lang-opt").forEach(function (btn) {
      var active =
        normalizeLocale(btn.getAttribute("data-locale")) === normalizeLocale(locale);
      btn.setAttribute("data-active", active ? "true" : "false");
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function buildLangUi(slot) {
    if (!slot) return;
    var wrap = document.createElement("div");
    wrap.className = "landing-lang-root";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "landing-lang-btn";
    btn.setAttribute("data-lang-btn", "");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-haspopup", "listbox");
    btn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/></svg>';

    var panel = document.createElement("div");
    panel.className = "landing-lang-panel";
    panel.setAttribute("role", "listbox");

    LOCALES.forEach(function (locCode) {
      var opt = document.createElement("button");
      opt.type = "button";
      opt.className = "landing-lang-opt";
      opt.setAttribute("data-locale", locCode);
      opt.setAttribute("role", "option");
      opt.textContent = LABELS[locCode] || locCode;
      opt.addEventListener("click", function () {
        applyLocale(locCode);
        panel.style.display = "none";
        btn.setAttribute("aria-expanded", "false");
      });
      panel.appendChild(opt);
    });

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var vis = panel.style.display === "block";
      panel.style.display = vis ? "none" : "block";
      btn.setAttribute("aria-expanded", vis ? "false" : "true");
    });

    document.addEventListener("pointerdown", function (ev) {
      if (!wrap.contains(ev.target)) {
        panel.style.display = "none";
        btn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") {
        panel.style.display = "none";
        btn.setAttribute("aria-expanded", "false");
      }
    });

    panel.style.display = "none";
    wrap.appendChild(btn);
    wrap.appendChild(panel);
    slot.appendChild(wrap);
  }

  window.MPV_LANDING_T = function (key) {
    var D = dictFor(pickLocaleInitial());
    var val = typeof D[key] === "undefined" ? EN[key] : D[key];
    return typeof val === "string" ? applyVars(val) : key;
  };

  window.MPV_LANDING_APPLY_I18N = function (scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var loc = pickLocaleInitial();
    var D = dictFor(loc);
    root.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (!key) return;
      var val = typeof D[key] === "undefined" ? EN[key] : D[key];
      if (typeof val === "string") el.setAttribute("aria-label", val);
    });
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      var val = typeof D[key] === "undefined" ? EN[key] : D[key];
      if (typeof val !== "string") return;
      val = applyVars(val);
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = val;
      else el.textContent = val;
    });
  };

  function boot() {
    var slot = document.getElementById("landing-lang-root");
    buildLangUi(slot);
    applyLocale(pickLocaleInitial());
    if (window.MPV_LANDING_AUTH_INIT) window.MPV_LANDING_AUTH_INIT();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
