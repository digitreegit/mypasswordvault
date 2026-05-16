/** Base strings (English). Other locales spread this and override. */
export const MESSAGES_EN: Record<string, string> = {
  "legal.privacyPolicy": "Privacy Policy",

  "app.loading": "Loading…",
  "app.authLoading": "Checking your session…",
  "app.brandName": "My Password Vault",

  "auth.title": "Sign In",
  "auth.brandHomeAria": "Go to homepage",
  "auth.subtitle":
    "Use your account to sync the encrypted vault between devices. Your master password is never sent to the server.",
  "auth.google": "Continue with Google",
  "auth.errGeneric": "Something went wrong. Try again.",
  "auth.securityNote":
    "We never upload your master password. Google sign-in only identifies you; vault secrets stay encrypted until you unlock with your master password and authenticator.",
  "auth.notConfiguredTitle": "Supabase is not configured",
  "auth.notConfiguredBody":
    "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file in the project root, then restart the dev server. See README.md for creating the database table and enabling Google sign-in.",

  "auth.faqTitle": "Common questions",
  "auth.faqTrustQ": "Can I trust this app? Is my data safe?",
  "auth.faqTrustA":
    "Your passwords are encrypted on your device before anything is synced. Servers only ever see ciphertext—your master password and plain-text secrets never leave your control in readable form. Google sign-in is only used to tie the encrypted vault to your account.",
  "auth.faqUseQ": "How do I use it? Will it feel simple day to day?",
  "auth.faqUseA":
    "Sign in with Google, choose a strong master password, scan one QR code for two-factor authentication, then unlock to add or search entries. Auto-lock keeps the vault closed when you step away; sync picks up changes when you sign in on another browser or phone.",
  "auth.faqWhatAuthenticatorQ":
    "What is an authenticator app, what does it do, and which one should I use?",
  "auth.faqWhatAuthenticatorA":
    "An authenticator app is an app on your phone or computer that generates short-lived numeric codes—usually six digits—for two-factor authentication. After set-up it shares a secret with your vault via the QR scan; unlocking requires your master password plus a fresh code so a stolen password alone isn’t enough. Use any reputable time-based OTP (TOTP) app compatible with Authenticator/Google-style setups, such as Google Authenticator, Microsoft Authenticator, Authy, FreeOTP, 1Password’s OTP field, Bitwarden, or compatible built-in Authenticator modes—pick one from a publisher you trust and keep it updated.",
  "auth.faqAuthenticatorQ":
    "What if my authenticator app breaks, I lose my phone, or codes stop working?",
  "auth.faqAuthenticatorA":
    "Your encrypted vault remains in your account. On a new or reset device: sign in, download the latest vault from Devices & backup, enter your master password, then follow the prompts to scan a new QR code and link a replacement authenticator. After you confirm, old time-based codes stop working—that is expected—but your encrypted data was not erased. If you still have access to your previous authenticator, you can often unlock normally without resetting it.",
  "auth.faqPricingQ": "Is this free or paid?",
  "auth.faqPricingA":
    "You can save up to 25 password entries for free. A one-time $4.99 purchase unlocks unlimited entries on your account forever. Open Plans & pricing from the app (or add #/pricing to the app URL) for checkout.",
  "auth.pricingLink": "Plans & pricing",
  "auth.faqContactQ": "Who do I contact if something goes wrong?",
  "auth.faqContactA":
    "Email contact@skyface.com for questions, bug reports, or feedback—we read incoming mail.",
  "auth.faqMasterQ": "What if I forget my master password?",
  "auth.faqMasterA":
    "Nobody (including us) can recover your passwords without your master password. If you lose it you must reset the vault and lose existing entries on that device. Cloud restore and encrypted backup files always require the same master password used when those backups were made.",
  "auth.faqExportQ": "Can I keep an offline backup?",
  "auth.faqExportA":
    "Yes. After you unlock, open Settings → Offline JSON file (advanced) to download an encrypted export. Store it somewhere safe; you will still need the master password from the time of export to open it.",

  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.confirm": "Confirm",
  "common.save": "Save",

  "autoLock.m1": "1 min",
  "autoLock.m5": "5 min",
  "autoLock.m15": "15 min",
  "autoLock.m30": "30 min",
  "autoLock.off": "Off",
  "autoLock.offBad": "Off (not recommended)",

  "setup.pageTitle": "Set up",
  "setup.pageTitle2fa": "Two-factor authentication",
  "setup.title": "Set up My Password Vault",
  "setup.subtitle":
    "After you sign in, create your vault here. Your master password is never stored on any server.",
  "setup.masterPw": "Master password",
  "setup.masterPwConfirm": "Confirm master password",
  "setup.placeholderMin": "At least 10 characters",
  "setup.autoLock": "Auto-lock (minutes)",
  "setup.next2fa": "Next — set up two-factor authentication",
  "setup.forgetWarn":
    "If you forget your password, the vault cannot be recovered. You will lose all data and must start over.",
  "setup.2faIntro":
    "Scan the QR code with Google Authenticator, 1Password, Authy, etc., or enter the secret key manually. Then enter the 6-digit code shown in the app to confirm.",
  "setup.secretKey": "Secret key (manual entry)",
  "setup.openOtpauth": "Open otpauth:// link",
  "setup.totpCode": "6-digit code from the app",
  "setup.back": "Back",
  "setup.confirmStart": "Confirm and start",
  "setup.errMin": "Master password must be at least 10 characters.",
  "setup.errMismatch": "Passwords do not match.",
  "setup.errGeneric": "Something went wrong.",

  "lock.title": "Vault Locked",
  "lock.subtitle": "Enter your master password and 6-digit authentication code.",
  "lock.masterPw": "Master password",
  "lock.totp": "Two-factor code",
  "lock.unlock": "Unlock",
  "lock.forget": "Forgot master password? Reset vault…",
  "lock.resetWarn":
    "Resetting will permanently delete all saved passwords. Are you sure you want to continue?",
  "lock.deleteAll": "Delete everything and start over",
  "lock.errFailed": "Unlock failed",

  "errors.masterTooShort": "Master password must be at least 10 characters.",
  "errors.noPendingSetup": "No setup in progress.",
  "errors.invalidOtp": "Invalid authentication code.",
  "errors.notInitialized": "Vault is not initialized.",
  "errors.wrongMaster": "Incorrect master password.",
  "errors.wrongTotp": "Incorrect two-factor code.",
  "errors.locked": "Vault is locked.",
  "errors.invalidBackup": "This file is not a valid vault backup.",
  "errors.missingUserVaultsTable":
    "The Supabase project is missing the user_vaults table. In the Supabase dashboard open SQL Editor, paste and run the contents of supabase/migrations/20260513120000_user_vaults.sql in this repo, then try again.",
  "errors.noCloudBackup":
    "No encrypted vault found for this account yet. Use a device that already has the vault, or an offline file under Advanced below.",
  "errors.entryLimitReached":
    "The free plan allows up to {{limit}} password entries. Upgrade to add more.",
  "errors.importExceedsEntryLimit":
    "This backup has more than {{limit}} entries. Upgrade to a permanent license before importing, or remove entries from the file.",

  "strength.0": "Empty",
  "strength.1": "Weak",
  "strength.2": "Fair",
  "strength.3": "Strong",
  "strength.4": "Very strong",

  "settings.title": "Settings",
  "settings.autoLock": "Auto-lock (minutes)",
  "settings.autoLockHint":
    "Locks automatically when there is no mouse or keyboard activity.",
  "settings.language": "Language",
  "settings.danger": "Danger zone",
  "settings.resetVault": "Reset vault (delete all data)",
  "settings.resetDesc":
    "All saved passwords and 2FA settings will be deleted. This cannot be undone.",
  "settings.permanentDelete": "Delete permanently",

  "settings.syncTitle": "Devices & backup",
  "settings.syncHint":
    "While you are signed in, this app keeps an encrypted copy in your database (the server cannot read it). On a new browser or phone, sign in with the same account, tap “Download latest from account” if needed, then unlock with the same master password and authenticator app as before.",
  "settings.pullCloud": "Download latest from account",
  "settings.pullCloudHint":
    "Replaces the vault stored only on this device with the encrypted snapshot from your account. Use if unlock fails or you just switched devices.",
  "settings.pullCloudDone": "Vault updated from your account. Unlock again below if the settings dialog is open.",
  "settings.fileBackupAdvanced": "Offline JSON file (advanced)",
  "settings.fileBackupAdvancedHint":
    "Optional export/import. Only use a .json file you exported yourself here; it is the same encrypted data. Master password and 6-digit codes still match the vault when that file was made.",
  "settings.exportBackup": "Download backup (.json)",
  "settings.copyBackupFail": "Could not copy (size or permission). Use download instead.",
  "settings.importBackup": "Import backup…",
  "settings.importConfirm": "Replace this device’s vault with the backup? Unsaved changes here will be lost. You will need to unlock again.",
  "settings.importApply": "Replace and lock",
  "settings.importCancel": "Cancel import",

  "settings.accountTitle": "Account",
  "settings.signedInAs": "Signed in as {{email}}",
  "settings.signOut": "Sign out of account",
  "settings.signOutHint":
    "Signs out of cloud sync only. This device keeps its local vault until you reset it.",

  "settings.licenseTitle": "Plan & entry limit",
  "settings.licenseFree":
    "Free: up to {{limit}} password entries on this account. The server never sees your passwords.",
  "settings.licensePaid":
    "Permanent license: one-time $4.99 — unlimited entries. Tied to your signed-in account.",
  "settings.licenseStatusLicensed": "Your account has a permanent license (unlimited entries).",
  "settings.licenseStatusFree": "You are on the free plan ({{count}} / {{limit}} entries used).",
  "settings.licenseLoading": "Checking license…",
  "settings.licenseLink": "Open plans & pricing",
  "settings.licenseRefresh": "Refresh status",
  "settings.planBadgeFree": "Free",
  "settings.planBadgeLicensed": "Licensed",
  "settings.licenseKeyLabel": "License key",
  "settings.licenseKeyHint":
    "Purchase reference (Stripe checkout session). Read-only — keep it for your records.",
  "settings.licenseCopyKey": "Copy",
  "settings.licenseKeyCopied": "Copied",
  "settings.licenseNoSessionId":
    "License is active; no checkout reference is stored for this account yet.",

  "lock.syncTitle": "Load from your account",
  "lock.pullCloud": "Restore from account",
  "lock.pullCloudHint":
    "Having trouble unlocking? Don't worry — your passwords are safely backed up to your account. Restore them on this device: we'll download your encrypted vault, then guide you through your master password and setting up your authenticator again.",
  "lock.pullCloudDone":
    "Restore complete. Enter your master password below, then scan the QR code to finish.",
  "lock.rebindTitle": "Finish restoring this device",
  "lock.rebindSubtitleMaster":
    "Your vault data is here. Enter the master password you used when you created this vault. Next you will scan a new QR code — codes from an old or lost phone will no longer work after you confirm.",
  "lock.rebindContinue": "Continue",
  "lock.rebindUseOldTotp":
    "I still have my previous authenticator — skip and unlock with master + 6-digit code instead",
  "lock.rebind2faIntro":
    "Scan the QR with Google Authenticator, 1Password, Authy, etc., then enter the 6-digit code to confirm. This replaces the previous authenticator for this vault.",
  "lock.rebindConfirm": "Confirm and open vault",
  "lock.fileBackupAdvanced": "Offline JSON file (advanced)",
  "lock.fileBackupAdvancedHint":
    "Optional export/import. Only use a .json file you exported yourself here; it is the same encrypted data. Master password and 6-digit codes still match the vault when that file was made.",
  "lock.exportBackup": "Download encrypted backup (.json)",
  "lock.importBackup": "Restore from backup file…",
  "lock.importConfirm": "Replace the vault on this device with the selected backup?",

  "setup.restoreBackup": "Restore from backup file instead",
  "setup.restoreConfirm":
    "This backup file will replace the empty vault on this device. Continue?",
  "setup.restoreApply": "Load backup",

  "vault.pageTitle": "Vault",
  "vault.licenseBadgeFree": "FREE",
  "vault.licenseBadgeLicensed": "LICENSED",
  "vault.search": "Search (site, URL, username, notes, memo, category)",
  "vault.colCategory": "Category",
  "vault.manageCategories": "Manage categories",
  "vault.categoriesTitle": "Categories",
  "vault.categoriesHint":
    "Add names here, then assign each row from the Category column. Save applies name changes.",
  "vault.addCategory": "Add category",
  "vault.deleteCategory": "Remove category",
  "vault.deleteCategoryConfirm":
    "Remove this category? Entries using it become uncategorized.",
  "vault.categoryName": "Category name",
  "vault.dragToReorder": "Drag to reorder categories",
  "vault.newCategory": "New category",
  "vault.uncategorized": "—",
  "vault.ttPasswords": "Show or hide all passwords in the grid",
  "vault.revealAll": "Show all",
  "vault.maskAll": "Hide all",
  "vault.addRow": "Add entry",
  "vault.settings": "Settings",
  "vault.lock": "Lock",
  "vault.colSite": "Site",
  "vault.colUrl": "URL",
  "vault.colUser": "Username",
  "vault.colPass": "Password",
  "vault.colNotes": "Notes",
  "vault.colMemo": "Memo",
  "vault.colActions": "Actions",
  "vault.empty": "No entries yet.",
  "vault.emptyCta": "Add your first entry.",
  "vault.footer":
    "Passwords are encrypted with AES-GCM-256. When signed in, ciphertext syncs to your account; the server cannot read your secrets. Copied passwords are cleared from the clipboard after 20 seconds.",
  "vault.totalItems": "Total: {{count}} items",
  "vault.entryLimitBanner":
    "You have reached the free limit of {{limit}} password entries on this account. Upgrade once to add unlimited entries.",
  "vault.entryLimitUpgrade": "View plans & upgrade",
  "vault.entryLimitModalTitle": "Entry limit reached",
  "vault.entryLimitModalBody":
    "The free plan includes up to {{limit}} password entries. Purchase a permanent license to keep adding entries.",
  "vault.entryLimitModalCta": "See pricing",
  "vault.entryLimitModalClose": "Close",
  "vault.summaryUncategorized": "Uncategorized",
  "vault.newEntry": "New entry",
  "vault.sortBy": "Sort by",
  "vault.sortRecent": "Recently updated",

  "vault.phMemo": "Enter memo",
  "vault.ttExpandRow": "Show URL and memo",
  "vault.ttCollapseRow": "Hide URL and memo",

  "vault.phUrl": "https://…",
  "vault.phUser": "user@example.com",
  "vault.phPass": "Password",

  "vault.ttOpenTab": "Open in new tab",
  "vault.ttCopyUser": "Copy username",
  "vault.hide": "Hide",
  "vault.show": "Show",
  "vault.ttCopyPass": "Copy password",
  "vault.ttGenPass": "Generate password",
  "vault.ttDelete": "Delete",

  "pwdGen.title": "Generate password",
  "pwdGen.length": "Length",
  "pwdGen.regen": "Regenerate",
  "pwdGen.copy": "Copy",
  "pwdGen.copied": "Copied",
  "pwdGen.use": "Use",
  "pwdGen.cLower": "Lowercase a–z",
  "pwdGen.cUpper": "Uppercase A–Z",
  "pwdGen.cDigits": "Digits 0–9",
  "pwdGen.cSymbols": "Symbols !@#$",
  "pwdGen.cAmbiguous": "Exclude ambiguous characters",

  "pricing.backHome": "Home",
  "pricing.backApp": "Back to vault",
  "pricing.title": "Simple limits, one upgrade",
  "pricing.subtitle":
    "Start free with a generous entry cap, then unlock unlimited passwords with a single payment — no subscription.",
  "pricing.supabaseRequired":
    "Connect this app to Supabase (see README) to enable account billing and Stripe checkout.",
  "pricing.checkoutSuccess":
    "Payment received. If your license is not active yet, wait a few seconds and refresh this page.",
  "pricing.checkoutCancel": "Checkout was cancelled. You can try again whenever you are ready.",
  "pricing.youAreLicensed": "Your account already has a permanent license. Thank you for your support.",
  "pricing.tierFree": "Free",
  "pricing.freeForever": "No monthly fee",
  "pricing.freeDesc": "For personal use and trying the product with full security features.",
  "pricing.freeF1": "Up to 25 password entries",
  "pricing.freeF2": "Local-first AES-GCM-256 encryption + TOTP 2FA",
  "pricing.freeF3": "Encrypted sync to your Supabase project (ciphertext only)",
  "pricing.freeF4": "Offline JSON backup & restore",
  "pricing.freeFootnote":
    "When you reach {{limit}} entries, adding new rows is paused until you upgrade or delete entries.",
  "pricing.tierPaid": "Permanent license",
  "pricing.paidOnce": "One-time USD 4.99 — no subscription",
  "pricing.paidDesc": "Unlock unlimited password entries on this account forever.",
  "pricing.paidF1": "Unlimited password entries",
  "pricing.paidF2": "Everything in Free, plus no entry cap",
  "pricing.paidF3": "Same zero-knowledge model — we never receive your master password",
  "pricing.paidF4": "License stored on your account; works on every device you sign into",
  "pricing.signInToBuy": "Sign in with Google to continue to checkout",
  "pricing.signInHint": "We use your Google account only to attach the license and encrypted vault.",
  "pricing.alreadyLicensed": "Licensed — thank you",
  "pricing.ctaBuy": "Continue to secure checkout",
  "pricing.stripeNote": "Payments are processed by Stripe. You will leave this app to complete purchase.",
  "pricing.errSignIn": "Please sign in first.",
  "pricing.errCheckout": "Could not start checkout. Try again or contact support.",
  "pricing.opsTitle": "Operator checklist (Supabase + Stripe)",
  "pricing.ops1":
    "Run the SQL migration `20260515180000_user_entitlements.sql` in the Supabase SQL editor.",
  "pricing.ops2":
    "Deploy edge functions `create-checkout-session` and `stripe-webhook`; set secrets STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PUBLIC_APP_URL (your deployed app URL including /app if used), optional STRIPE_LICENSE_AMOUNT_CENTS (default 499).",
  "pricing.ops3": "In Stripe Dashboard, add the webhook endpoint URL for `stripe-webhook` and subscribe to checkout.session.completed.",
  "pricing.ops4": "After purchase, the app refreshes license from user_entitlements automatically when you unlock or open this page.",
};
