/**
 * Builds public/faq.html, public/pricing.html, public/privacy.html, and public/terms.html.
 * Run from repo root: node scripts/assemble-landing-pages.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pub = join(root, "public");

const LOGO_SVG = `            <svg viewBox="245 346 126 112" fill="currentColor" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
              <path d="M364.21,369.16h-4v-10.67c0-7.55-6.14-13.69-13.69-13.69h-.38c-7.15,0-14.1-2.52-19.59-7.1l-5.15-4.3c-1.06-.89-2.41-1.37-3.79-1.37h-23.61c-1.38,0-2.72.49-3.78,1.37l-5.17,4.31c-5.49,4.57-12.45,7.09-19.59,7.09h-.36c-7.55,0-13.69,6.14-13.69,13.69v10.67h-4.62c-5,0-9.06,4.06-9.06,9.06v33.2c0,5,4.06,9.06,9.06,9.06h10.34c3.71,6.9,9.05,12.82,15.59,17.18l28.29,18.86c1.43.95,3.08,1.46,4.8,1.46s3.37-.5,4.79-1.45l28.3-18.87c6.54-4.36,11.88-10.27,15.59-17.18h9.72c4.99,0,9.06-4.06,9.06-9.06v-33.2c0-5-4.06-9.06-9.06-9.06ZM258.91,358.49c0-3.41,2.77-6.19,6.19-6.19h.36c8.9,0,17.56-3.14,24.39-8.83l4.73-3.94h22.46l4.71,3.93c6.83,5.7,15.5,8.84,24.4,8.84h.38c3.41,0,6.19,2.77,6.19,6.19v10.67h-5.91v-4.1c0-4.43-3.6-8.02-8.02-8.02h-11.24l-9.39-7.83c-1.06-.88-2.41-1.37-3.79-1.37h-17.12c-1.38,0-2.73.49-3.79,1.37l-9.39,7.83h-11.23c-4.43,0-8.02,3.6-8.02,8.02v4.1h-5.91v-10.67ZM339.31,369.16h-66.99v-4.1c0-.29.24-.52.52-.52h11.8c1.38,0,2.72-.48,3.79-1.37l9.39-7.83h15.97l9.39,7.83c1.06.88,2.41,1.37,3.79,1.37h11.82c.29,0,.52.24.52.52v4.1ZM334.74,431.41l-28.3,18.87c-.38.25-.87.25-1.26,0l-28.3-18.86c-4.35-2.9-8.05-6.64-10.97-10.94h7.52c2.19,2.59,4.7,4.87,7.53,6.75l20.39,13.59c1.32.88,2.86,1.34,4.45,1.34s3.12-.46,4.45-1.35l20.38-13.59c2.83-1.89,5.35-4.17,7.54-6.75h7.52c-2.92,4.3-6.62,8.03-10.97,10.94ZM284.49,420.47h42.64c-.23.16-.42.36-.65.51l-20.38,13.59c-.19.12-.41.12-.58,0l-20.39-13.59c-.23-.15-.42-.35-.64-.51ZM365.77,411.41c0,.86-.7,1.56-1.56,1.56h-117.42c-.86,0-1.56-.7-1.56-1.56v-33.2c0-.86.7-1.56,1.56-1.56h117.42c.86,0,1.56.7,1.56,1.56v33.2Z" />
              <polygon points="278.69 385.25 271.31 390.18 271.87 381.37 265.92 381.37 266.51 390.18 259.13 385.25 256.13 390.52 264.09 394.39 256.13 398.27 259.13 403.47 266.51 398.54 265.92 407.35 271.87 407.35 271.31 398.54 278.69 403.47 281.63 398.27 273.73 394.39 281.63 390.52 278.69 385.25" />
              <polygon points="315.31 385.25 307.93 390.18 308.49 381.37 302.54 381.37 303.13 390.18 295.75 385.25 292.75 390.52 300.71 394.39 292.75 398.27 295.75 403.47 303.13 398.54 302.54 407.35 308.49 407.35 307.93 398.54 315.31 403.47 318.25 398.27 310.35 394.39 318.25 390.52 315.31 385.25" />
              <polygon points="351.93 385.25 344.55 390.18 345.11 381.37 339.16 381.37 339.75 390.18 332.37 385.25 329.37 390.52 337.33 394.39 329.37 398.27 332.37 403.47 339.75 398.54 339.16 407.35 345.11 407.35 344.55 398.54 351.93 403.47 354.87 398.27 346.97 394.39 354.87 390.52 351.93 385.25" />
            </svg>`;

function head(title, desc, canonicalPath = "/") {
  const esc = (s) => s.replace(/"/g, "&quot;").replace(/</g, "");
  const canonical = `https://mypasswordvault.app${canonicalPath}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="description" content="${esc(desc)}" />
    <meta name="robots" content="index, follow" />
    <meta name="author" content="Skyface, LLC" />
    <title>${esc(title)}</title>
    <link rel="canonical" href="${canonical}" />
    <meta property="og:site_name" content="My Password Vault" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:image" content="https://mypasswordvault.app/favicon.png" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="https://mypasswordvault.app/favicon.png" />
    <link rel="icon" href="./favicon.png" type="image/png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="./landing-site.css" />
  </head>`;
}

const bodyTop = (page, navInner) => `  <body data-landing-page="${page}">
    <div id="file-protocol-banner" class="file-protocol-banner" role="alert">
      <strong style="display: block; margin-bottom: 0.35rem">Opened as a local file (file://)</strong>
      Absolute paths like <code>/app/</code> do not work from disk. Run
      <code>npm run dev</code> in this project folder, then use
      <a href="http://127.0.0.1:5173/">http://127.0.0.1:5173/</a>
      — <strong>Sign In</strong> links below switch to the dev server while this page stays on
      <code>file://</code>.
    </div>
    <script>
      (function () {
        if (location.protocol !== "file:") return;
        document.documentElement.classList.add("file-protocol-landing");
        var b = document.getElementById("file-protocol-banner");
        if (b) b.classList.add("is-visible");
        document.querySelectorAll('a[href^="/app/"]').forEach(function (a) {
          var href = a.getAttribute("href") || "";
          a.setAttribute("href", "http://127.0.0.1:5173" + href);
        });
      })();
    </script>
    <div class="bg-grid" aria-hidden="true"></div>
    <div class="orb" aria-hidden="true"></div>
    <div class="orb orb2" aria-hidden="true"></div>

    <div class="landing-header-band">
      <div class="landing-header-band-inner">
        <header class="landing-header-main">
        <a class="logo" href="./index.html" data-logo-landing-aria aria-label="My Password Vault home">
          <span class="logo-mark" aria-hidden="true">
${LOGO_SVG}
          </span>
          <span class="logo-text">My Password Vault</span>
        </a>
        <button
          type="button"
          class="landing-menu-toggle"
          aria-expanded="false"
          aria-controls="landing-nav-panel"
          data-i18n-aria="navMenu"
          aria-label="Menu"
        >
          <span class="landing-menu-toggle-inner" aria-hidden="true">
            <span class="landing-menu-bar"></span>
            <span class="landing-menu-bar"></span>
            <span class="landing-menu-bar"></span>
          </span>
        </button>
        </header>
        <div id="landing-nav-backdrop" class="landing-nav-backdrop" aria-hidden="true"></div>
        <div id="landing-nav-panel" class="landing-nav-panel">
        <div class="nav-actions" role="navigation" aria-label="Main">
${navInner}
          <div id="landing-auth-root"></div>
          <div id="landing-lang-root"></div>
        </div>
        </div>
      </div>
    </div>

    <div class="wrap">
      <main class="landing-inner-main">
`;

const navFaq = `          <a class="btn btn-ghost landing-nav-link" href="./index.html" data-i18n="navHome">Home</a>
          <a class="btn btn-ghost landing-nav-link" href="./faq.html" data-i18n="navFaq" aria-current="page">FAQ</a>
          <a class="btn btn-ghost landing-nav-link" href="./pricing.html" data-i18n="navPricing">Pricing</a>
`;

const navPricing = `          <a class="btn btn-ghost landing-nav-link" href="./index.html" data-i18n="navHome">Home</a>
          <a class="btn btn-ghost landing-nav-link" href="./faq.html" data-i18n="navFaq">FAQ</a>
          <a class="btn btn-ghost landing-nav-link" href="./pricing.html" data-i18n="navPricing" aria-current="page">Pricing</a>
`;

const navLegal = `          <a class="btn btn-ghost landing-nav-link" href="./index.html" data-i18n="navHome">Home</a>
          <a class="btn btn-ghost landing-nav-link" href="./faq.html" data-i18n="navFaq">FAQ</a>
          <a class="btn btn-ghost landing-nav-link" href="./pricing.html" data-i18n="navPricing">Pricing</a>
`;

const TERMS_HTML = `
        <p class="eyebrow" data-i18n="legalTermsEyebrow">Legal</p>
        <h1 data-i18n="legalTermsTitle">Terms of Use</h1>
        <p class="sub" data-i18n="legalTermsIntro_html" data-i18n-html>
          These Terms of Use (“Terms”) govern your access to <strong>My Password Vault</strong> (the “Product”), including this
          website, the web application, cloud sync, and purchases, and your relationship with <strong>Skyface, LLC</strong>
          (“we,” “us,” “our”). App store or other distribution channels may impose additional terms where applicable.
        </p>
        <article class="landing-legal-article" data-i18n="legalTermsBody_html" data-i18n-html>
          <h2>1. Agreement &amp; privacy</h2>
          <p>
            By creating an account, signing in, or using the Product, you agree to these Terms and our
            <a href="./privacy.html">Privacy Policy</a>, which describes how we handle information. If you do not agree, do not use
            the Product.
          </p>
          <h2>2. Not professional advice</h2>
          <p>
            Materials about the Product describe security concepts in general terms. They are <strong>not legal, financial, or
            compliance advice</strong>. <strong>You</strong> are responsible for how you use the Product—including keeping your
            master password, passkey, and recovery materials secure—and for deciding whether the Product meets your personal or
            organizational needs and any regulatory obligations that apply to you. <strong>We</strong> (Skyface, LLC) select,
            contract with, and remain responsible for the third‑party infrastructure we use to operate the Product (including
            authentication, cloud sync, payments, and hosting), subject to the limitations in these Terms.
          </p>
          <h2>3. Eligibility &amp; accounts</h2>
          <p>
            You must be at least <strong>13 years old</strong> (or the minimum age required where you live) to use the Product.
            You are responsible for activity under your account, keeping your sign‑in credentials confidential, and maintaining a
            strong master password. Notify us promptly at
            <a href="mailto:contact@skyface.com">contact@skyface.com</a> if you suspect unauthorized access.
          </p>
          <h2>4. Plans, payments &amp; refunds</h2>
          <p>
            The free plan includes a limited number of password entries. A <strong>one‑time</strong> paid upgrade unlocks
            unlimited entries on your account; pricing is shown in the Product (currently <strong>$4.99 USD</strong> unless we
            change it on the pricing page). Payments are processed by <strong>Stripe</strong>; we do not store full card numbers.
            Purchases are generally <strong>non‑subscription</strong> and final except where required by law or where we approve a
            refund at our discretion. Refund requests may be sent to
            <a href="mailto:contact@skyface.com">contact@skyface.com</a>.
          </p>
          <h2>5. Acceptable use</h2>
          <p>
            You agree to use the Product only for lawful personal or internal business password management. You may not misuse the
            Product or infrastructure—including attempting unauthorized access, interfering with other users, scraping, reverse
            engineering the service to bypass security, or using the Product to violate applicable law. We may suspend or terminate
            access where reasonably necessary to protect users or systems.
          </p>
          <h2>6. Your data &amp; security responsibilities</h2>
          <p>
            The Product is designed as a <strong>local‑first encrypted vault</strong>. We cannot recover your master password or
            decrypt your entries without it. You are responsible for device security, backups you create, and any exports you store
            outside the Product. See the <a href="./privacy.html">Privacy Policy</a> for details on encryption and cloud sync.
          </p>
          <h2>7. Account deletion</h2>
          <p>
            You may permanently delete your account from <strong>Settings → Account → Delete account</strong>, which removes your
            cloud backup, license record, and sign‑in account as described in the Privacy Policy. Local data on your device is
            cleared in that flow on the device where you confirm deletion.
          </p>
          <h2>8. Service availability &amp; changes</h2>
          <p>
            We may change, suspend, or discontinue parts of the Product or this website at any time. We do not guarantee
            uninterrupted availability or error‑free operation. Features, entry limits, and pricing may change; we will post material
            pricing changes on the pricing page where practical.
          </p>
          <h2>9. Intellectual property</h2>
          <p>
            Branding, text, and visual assets for the Product and this site are owned by Skyface, LLC or its licensors unless
            otherwise noted. You may not copy or redistribute them for commercial purposes without permission. Your vault contents
            remain yours.
          </p>
          <h2>10. Disclaimer of warranties</h2>
          <p>
            The site and Product are provided <strong>“as is”</strong> to the maximum extent permitted by law. We disclaim implied
            warranties of merchantability, fitness for a particular purpose, and non‑infringement where allowed.
          </p>
          <h2>11. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, Skyface, LLC will not be liable for indirect, incidental, special,
            consequential, or punitive damages, or for loss of profits, data, or goodwill arising from your use of the site or
            Product, including loss of access to your vault if you lose your master password or device backups.
          </p>
          <h2>12. Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. The “Last updated” date at the bottom of this page will change when we
            do. Continued use of the Product after changes constitutes acceptance of the revised Terms where permitted by law.
          </p>
          <h2>13. Contact</h2>
          <p>
            Questions about these Terms:<br />
            Email <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />
            Website <a href="https://skyface.com/">https://skyface.com/</a>
          </p>
        </article>
        <p class="landing-legal-updated" data-i18n="legalTermsUpdated" data-i18n-html><em>Last updated: June 1, 2026</em></p>
`;

const storeBadges = `      <section class="landing-store-badges" aria-label="Download the app">
        <div class="landing-store-badges-row">
          <a
            class="landing-store-badge"
            data-store="apple"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            data-i18n-aria="storeBadgeAppStore"
          >
            <img
              src="./images/store-badge-app-store.png"
              alt=""
              width="132"
              height="44"
              loading="lazy"
              decoding="async"
            />
          </a>
          <a
            class="landing-store-badge"
            data-store="google"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            data-i18n-aria="storeBadgeGooglePlay"
          >
            <img
              src="./images/store-badge-google-play.png"
              alt=""
              width="148"
              height="44"
              loading="lazy"
              decoding="async"
            />
          </a>
        </div>
      </section>

`;

const footer = `      </main>

${storeBadges}      <footer>
        <p>
          <strong>My Password Vault</strong>
        </p>
        <p class="landing-footer-copy">
          <span data-i18n="footerCopy">© Skyface, LLC. All rights reserved.</span>
        </p>
        <p class="landing-footer-legal">
          <a href="./privacy.html" data-i18n="footerPrivacy">Privacy Policy</a>
          <a href="./terms.html" data-i18n="footerTerms">Terms of Use</a>
        </p>
      </footer>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="./landing-config.js"></script>
    <script src="./landing-store-badges.js"></script>
    <script src="./landing-overlays.js"></script>
    <script src="./landing-nav.js"></script>
    <script src="./landing-legal-i18n.js"></script>
    <script src="./landing-lang.js"></script>
    <script src="./landing-auth.js"></script>
  </body>
</html>
`;

const faqBody = readFileSync(join(root, ".tmp-landing-faq-body.html"), "utf8");
const pricingBody = readFileSync(join(root, ".tmp-landing-pricing-body.html"), "utf8");

writeFileSync(
  join(pub, "faq.html"),
  head(
    "FAQ — My Password Vault Password Manager",
    "Answers about My Password Vault security, encryption, passkeys, TOTP 2FA, encrypted sync, backups, pricing, and support.",
    "/faq.html",
  ) +
    "\n" +
    bodyTop("faq", navFaq) +
    faqBody +
    "\n" +
    footer,
  "utf8",
);

writeFileSync(
  join(pub, "pricing.html"),
  head(
    "Pricing — My Password Vault PRO License",
    "My Password Vault pricing: free password manager tier plus a $4.99 one-time PRO lifetime license for unlimited entries and encrypted export.",
    "/pricing.html",
  ) +
    "\n" +
    bodyTop("pricing", navPricing) +
    pricingBody +
    "\n" +
    footer,
  "utf8",
);

const privacyInner = readFileSync(join(root, ".tmp-privacy-main.html"), "utf8");

writeFileSync(
  join(pub, "privacy.html"),
  head(
    "Privacy Policy — My Password Vault",
    "Privacy Policy for My Password Vault by Skyface, LLC — local-first encryption, ciphertext-only sync, and what we never store.",
    "/privacy.html",
  ) +
    "\n" +
    bodyTop("privacy", navLegal) +
    privacyInner +
    "\n" +
    footer,
  "utf8",
);

writeFileSync(
  join(pub, "terms.html"),
  head(
    "Terms of Use — My Password Vault",
    "Terms of Use for My Password Vault by Skyface, LLC — accounts, purchases, acceptable use, and liability.",
    "/terms.html",
  ) +
    "\n" +
    bodyTop("terms", navLegal) +
    TERMS_HTML +
    "\n" +
    footer,
  "utf8",
);

console.log("Wrote public/faq.html, public/pricing.html, public/privacy.html, public/terms.html");
