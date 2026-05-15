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

  var EN = {
    metaTitle: "My Password Vault — Secure passwords, zero clutter",
    metaDescription:
      "My Password Vault — local-first password manager. AES-GCM-256, TOTP 2FA, optional encrypted sync. Spreadsheet-simple.",
    logoAria: "My Password Vault home",
    langAria: "Language",
    navFaq: "FAQ",
    navSignIn: "Sign In",
    heroEyebrow: "hassle-free password manager",
    heroH1Line1: "Passwords you control.",
    heroH1Line2: "Clarity you feel.",
    heroLead_html:
      "A local-first vault that works like a spreadsheet — fast edits, categories, one-tap copy — while\n          your secrets stay encrypted on-device. Optional sync stores <strong>only ciphertext</strong> in\n          your database; your master password never leaves your hands.",
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
      '<span class="mono">PBKDF2-SHA256</span> with a per-vault salt and\n              <strong>310,000 iterations</strong> stretches your master password into a 256-bit key. Entry\n              passwords and the TOTP secret are sealed with <span class="mono">AES-GCM-256</span> and a\n              random 12-byte IV per encryption — modern AEAD, not home-grown crypto.',
    secDiagram:
      "master password + salt\n        │\n  PBKDF2-SHA256 (310k)\n        ▼\n AES-GCM key (memory only)\n   ├── verifier (proves master password)\n   ├── TOTP secret\n   └── each entry password (own IV)",
    secNeverTitle: "What never gets stored",
    nw1Strong: "Master password",
    nw1Span: "Neither plaintext nor a reusable hash is written to disk or sent to a server.",
    nw2Strong: "Derived AES key",
    nw2Span: "Lives in memory for your session; discarded on lock or when you close the tab.",
    nw3Strong: "Server-side knowledge",
    nw3Span_html:
      "Google sign-in only proves identity. Optional sync uploads the same ciphertext JSON you\n                    could export — never your master password or keys.",
    syncTitle: "Optional sync — encrypted blobs, not trust",
    syncDesc:
      "When signed in, your vault can sync automatically as encrypted data in your database (e.g. Supabase\n          with row-level security). The server stores what your browser already had: ciphertext. Unlocking\n          still requires your master password and 6-digit TOTP on every device.",
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
    gsStep1Strong: "Sign in with Google",
    gsStep1Span: "Identity for sync only — it doesn’t unlock your vault.",
    gsStep2Strong: "Create a strong master password",
    gsStep2Span: "10+ characters; strength meter nudges you toward better entropy.",
    gsStep3Strong: "Scan the TOTP QR",
    gsStep3Span: "Use Authenticator, 1Password, Authy, etc., then confirm with a 6-digit code.",
    gsStep4Strong: "Add rows like a sheet",
    gsStep4Span: "Sites, passwords, categories — save and sync when you’re ready.",
    faqTitle: "Common questions",
    faqDesc:
      "Quick answers about trust, day-to-day use, authenticators, backups, pricing, and how to reach us.",
    faq1_sum: "Can I trust this app? Is my data safe?",
    faq1_html:
      "Your passwords are encrypted on your device before anything is synced. Servers only ever see\n              ciphertext—your master password and plain-text secrets never leave your control in readable form.\n              Google sign-in is only used to tie the encrypted vault to your account.",
    faq2_sum: "How do I use it? Will it feel simple day to day?",
    faq2_html:
      "Sign in with Google, choose a strong master password, scan one QR code for two-factor\n              authentication, then unlock to add or search entries. Auto-lock keeps the vault closed when you\n              step away; sync picks up changes when you sign in on another browser or phone.",
    faq3_sum: "What is an authenticator app, what does it do, and which one should I use?",
    faq3_html:
      "An authenticator app is an app on your phone or computer that generates short-lived numeric codes—usually\n              six digits—for two-factor authentication. After set-up it shares a secret with your vault via the QR scan;\n              unlocking requires your master password plus a fresh code so a stolen password alone isn’t enough. Use any\n              reputable time-based OTP (TOTP) app compatible with Authenticator/Google-style setups, such as Google\n              Authenticator, Microsoft Authenticator, Authy, FreeOTP, 1Password’s OTP field, Bitwarden, or compatible\n              built-in Authenticator modes—pick one from a publisher you trust and keep it updated.",
    faq4_sum: "What if my authenticator app breaks, I lose my phone, or codes stop working?",
    faq4_html:
      "Your encrypted vault remains in your account. On a new or reset device: sign in, download the\n              latest vault from Devices & backup, enter your master password, then follow the prompts to\n              scan a new QR code and link a replacement authenticator. After you confirm, old time-based codes\n              stop working—that is expected—but your encrypted data was not erased. If you still have access to\n              your previous authenticator, you can often unlock normally without resetting it.",
    faq5_sum: "Is this free or paid?",
    faq5_html:
      "The service is free to use for now. If that ever changes, we will announce pricing clearly\n              beforehand.",
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
    footerPrivacy: "Privacy Policy",
    footerCopy: "©2026 Skyface, LLC. All rights reserved.",
  };

  var KO = {
    metaTitle: "My Password Vault — 안전하고 단순한 비밀번호 관리",
    metaDescription:
      "My Password Vault — 로컬 우선 비밀번호 관리자. AES-GCM-256, TOTP 2FA, 선택형 암호화 동기화. 스프레드시트처럼 간단합니다.",
    langAria: "언어 선택",
    navSignIn: "로그인",
    heroEyebrow: "부담 적은 패스워드 매니저",
    heroH1Line1: "통제하는 비밀번호.",
    heroH1Line2: "더 맑아지는 일상 보안.",
    heroLead_html:
      "로컬 우선 금고를 스프레드시트처럼 씁니다. 빠른 편집, 카테고리, 원탭 복사 — 비밀은 기기 안에서만 암호화됩니다. 선택한 동기화는 데이터베이스에 <strong>암호문만</strong> 저장합니다. 마스터 비밀번호는 손안을 떠나지 않습니다.",
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
      '볼트마다 다른 솔트와 함께 <span class="mono">PBKDF2-SHA256</span>을 <strong>310,000회</strong> 적용해 마스터 비밀번호를 256비트 키로 늘립니다. 항목 비밀번호와 TOTP 비밀은 <span class="mono">AES-GCM-256</span>과 암호화마다 새 12바이트 IV로 봉인합니다. 표준 AEAD를 쓰고, 비공식 암호화는 사용하지 않습니다.',
    secNeverTitle: "저장하지 않는 것",
    nw1Strong: "마스터 비밀번호",
    nw1Span: "평문이나 재사용 가능한 해시를 디스크에 쓰거나 서버로 보내지 않습니다.",
    nw2Strong: "파생 AES 키",
    nw2Span: "세션 동안 메모리에만 있고, 잠금 또는 탭을 닫으면 폐기됩니다.",
    nw3Strong: "서버가 알 수 있는 정보",
    nw3Span_html:
      "Google 로그인은 본인 확인용입니다. 동기화는 내보내기와 같은 암호문 JSON만 올리며 마스터 비밀번호나 키는 포함하지 않습니다.",
    syncTitle: "선택 동기화 — 신뢰가 아니라 암호화 덩어리",
    syncDesc:
      "로그인하면 데이터베이스(예: Supabase 및 RLS)에 암호화된 상태로 동기화할 수 있습니다. 서버는 브라우저가 이미 가진 암호문만 보관합니다. 기기마다 여전히 마스터 비밀번호와 6자리 TOTP가 필요합니다.",
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
    gsStep1Strong: "Google로 로그인",
    gsStep1Span:
      "동기화를 위한 본인 확인일 뿐, 금고 잠금 해제에는 쓰이지 않습니다.",
    gsStep2Strong: "강한 마스터 비밀번호 만들기",
    gsStep2Span: "10자 이상, 강도 표시가 엔트로피 향상을 도와 줍니다.",
    gsStep3Strong: "TOTP QR 스캔",
    gsStep3Span:
      "Google Authenticator, 1Password, Authy 등으로 스캔 후 6자리 코드로 확인합니다.",
    gsStep4Strong: "시트처럼 행 추가",
    gsStep4Span: "사이트·비밀번호·카테고리를 저장하고 준비되면 동기화합니다.",
    faqTitle: "자주 묻는 질문",
    faqDesc:
      "신뢰, 일상적인 사용법, 인증 앱, 백업, 가격, 연락처에 대한 짧은 답변입니다.",
    faq1_sum: "믿어도 되나요? 내 데이터는 안전한가요?",
    faq1_html:
      "비밀번호는 동기화되기 전에 기기에서 암호화됩니다. 서버에는 암호문만 보입니다. 마스터 비밀번호와 평문 비밀은 읽히는 형태로 통제 범위를 벗어나지 않습니다. Google 로그인은 암호화 금고를 계정과 연결하는 용도입니다.",
    faq2_sum: "어떻게 쓰나요? 매일 쓰기 부담스럽지 않나요?",
    faq2_html:
      "Google로 로그인하고, 강한 마스터 비밀번호를 정한 뒤 QR 한 번으로 2단계 인증을 연결하면 됩니다. 잠금 해제 후 목록에서 항목을 추가·검색합니다. 자동 잠금으로 자리를 비우면 금고가 닫히고, 다른 브라우저나 폰에서 로그인하면 동기화됩니다.",
    faq3_sum:
      "인증(Authenticator) 앱이 무엇이고, 역할은 무엇이며 어떤 앱을 써야 하나요?",
    faq3_html:
      "인증 앱은 폰이나 컴퓨터에 설치해 짧게 살아 있는 숫자 코드(보통 6자리)를 만들어 두 번째 확인 단계로 쓰는 앱입니다. QR로 금고와 비밀을 공유한 뒤에는 잠금 해제마다 마스터 비밀번호와 새 코드가 함께 필요합니다. Google Authenticator, Microsoft Authenticator, Authy, FreeOTP, 1Password나 Bitwarden의 OTP 등 표준 TOTP 앱이면 되며, 신뢰하는 제작사의 앱을 최신으로 유지하세요.",
    faq4_sum:
      "인증 앱이 고장 났거나, 휴대폰을 잃거나, 코드가 안 맞으면 어떻게 되나요?",
    faq4_html:
      "암호화 금고는 계정에 그대로 남습니다. 새 기기에서는 로그인 → Devices & 백업에서 최신 금고를 받고 마스터 비밀번호를 입력한 뒤, 안내에 따라 새 QR을 스캔해 대체 인증기를 연결합니다. 확인 후 예전 시간 기반 코드는 더 이상 쓰이지 않는 것이 정상이지만 데이터가 지워진 것은 아닙니다.",
    faq5_sum: "유료인가요, 무료인가요?",
    faq5_html:
      "지금은 무료로 이용할 수 있습니다. 정책이 바뀌면 가격 변경 전에 명확히 알리겠습니다.",
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
    footerPrivacy: "개인정보 처리방침",
    footerCopy: "©2026 Skyface, LLC. All rights reserved.",
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
    document.title = D.metaTitle;
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", D.metaDescription);

    document.querySelectorAll("[data-logo-landing-aria]").forEach(function (a) {
      a.setAttribute("aria-label", D.logoAria || EN.logoAria);
    });

    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.setAttribute("aria-label", D.langAria || EN.langAria);
    });

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      var val = typeof D[key] === "undefined" ? EN[key] : D[key];
      if (typeof val !== "string") return;
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = val;
      else el.textContent = val;
    });

    syncLangMenuActive(loc);
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

  function boot() {
    var slot = document.getElementById("landing-lang-root");
    buildLangUi(slot);
    applyLocale(pickLocaleInitial());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
