/** Shared SEO constants and HTML head helpers for marketing landing pages. */

export const SITE_ORIGIN = "https://mypasswordvault.app";
export const SITE_NAME = "My Password Vault";
export const OG_IMAGE_PATH = "/images/og-image.png";
export const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_ALT =
  "My Password Vault — local-first encrypted password manager for web, iOS, and Android";

/** Public marketing pages included in sitemap.xml (SPA /app/ excluded). */
export const SITEMAP_PAGES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/faq.html", priority: "0.8", changefreq: "monthly" },
  { path: "/pricing.html", priority: "0.8", changefreq: "monthly" },
  { path: "/privacy.html", priority: "0.3", changefreq: "yearly" },
  { path: "/terms.html", priority: "0.3", changefreq: "yearly" },
];

/** English FAQ pairs for FAQPage JSON-LD (default HTML before i18n overlay). */
export const FAQ_SCHEMA_ENTRIES = [
  {
    question: "How does My Password Vault protect my data?",
    answer:
      "Your entries are encrypted on your device before anything is synced, so the servers store ciphertext rather than readable passwords, and your master password is not sent to us. Google sign-in is used only to tie the encrypted vault to your account. No software can promise perfect security, so a strong master password and good device hygiene remain important on your side.",
  },
  {
    question: "How do I use it? Will it feel simple day to day?",
    answer:
      "Sign in with Google, choose a strong master password, scan one QR code for two-factor authentication, then unlock to add or search entries. Auto-lock keeps the vault closed when you step away; sync picks up changes when you sign in on another browser or phone.",
  },
  {
    question:
      "What is an authenticator app, what does it do, and which one should I use?",
    answer:
      "An authenticator app is an app on your phone or computer that generates short-lived numeric codes—usually six digits—for two-factor authentication. After set-up it shares a secret with your vault via the QR scan; unlocking requires your master password plus a fresh code so a stolen password alone is not enough. Use any reputable time-based OTP (TOTP) app compatible with Authenticator/Google-style setups, such as Google Authenticator, Microsoft Authenticator, Authy, FreeOTP, 1Password OTP, Bitwarden, or compatible built-in Authenticator modes—pick one from a publisher you trust and keep it updated.",
  },
  {
    question:
      "What if my authenticator app breaks, I lose my phone, or codes stop working?",
    answer:
      "Your encrypted vault remains in your account. On a new or reset device: sign in, download the latest vault from Devices and backup, enter your master password, then follow the prompts to scan a new QR code and link a replacement authenticator. After you confirm, old time-based codes stop working—that is expected—but your encrypted data was not erased. If you still have access to your previous authenticator, you can often unlock normally without resetting it.",
  },
  {
    question: "How do I sync the iOS app with my web vault?",
    answer:
      "Cloud sync is tied to your sign-in account, not your device. On iOS, if you use Sign in with Apple and want the same vault as on the web, you must choose Share My Email when Apple asks—not Hide My Email. Hide My Email creates a private relay address and a separate account that will not match a web vault signed in with Google or your normal email. Easiest if you already use the web: tap Continue with Google on iOS with the same email. If you prefer Apple on iOS, pick Share My Email so your real address matches your web login.",
  },
  {
    question: "Is this free or paid?",
    answer:
      "Up to 25 password entries are free. A one-time $4.99 payment unlocks unlimited entries on your account — no subscription. See Plans and pricing for checkout.",
  },
  {
    question: "What if I forget my master password?",
    answer:
      "Nobody (including us) can recover your passwords without your master password. If you lose it you must reset the vault and lose existing entries on that device. Cloud restore and encrypted backup files always require the same master password used when those backups were made.",
  },
  {
    question: "Can I keep an offline backup?",
    answer:
      "Yes. After you unlock, open Settings → Offline JSON file (advanced) to download an encrypted export. Store it somewhere safe; you will still need the master password from the time of export to open it.",
  },
  {
    question: "Who do I contact if something goes wrong?",
    answer:
      "Email contact@skyface.com for questions, bug reports, or feedback—we read incoming mail.",
  },
];

export function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function buildLandingHead({ title, description, canonicalPath, extraHead = "" }) {
  const esc = escapeHtmlAttr;
  const canonical = `${SITE_ORIGIN}${canonicalPath}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="description" content="${esc(description)}" />
    <meta name="robots" content="index, follow" />
    <meta name="author" content="Skyface, LLC" />
    <title>${esc(title)}</title>
    <link rel="canonical" href="${canonical}" />
    <meta property="og:site_name" content="${esc(SITE_NAME)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${OG_IMAGE_URL}" />
    <meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />
    <meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />
    <meta property="og:image:alt" content="${esc(OG_IMAGE_ALT)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${OG_IMAGE_URL}" />
    <meta name="twitter:image:alt" content="${esc(OG_IMAGE_ALT)}" />
    <link rel="icon" href="./favicon.png" type="image/png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="./landing-site.css" />
${extraHead}  </head>`;
}

export function buildFaqPageSchemaScript() {
  const payload = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_SCHEMA_ENTRIES.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
  return `    <script type="application/ld+json">
${JSON.stringify(payload, null, 2)
  .split("\n")
  .map((line) => `      ${line}`)
  .join("\n")}
    </script>`;
}
