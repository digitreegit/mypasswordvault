/** Base strings (English). Other locales spread this and override. */
export const MESSAGES_EN: Record<string, string> = {
  "legal.privacyPolicy": "Privacy Policy",
  "legal.termsOfUse": "Terms of Use",

  "app.loading": "Loading…",
  "app.authLoading": "Checking your session…",
  "app.brandName": "My Password Vault",

  "auth.title": "Welcome back",
  "auth.titleSignUp": "Get started",
  "auth.titleForgot": "Forgot your password?",
  "auth.titleNewPassword": "Set a new password",
  "auth.subtitleSignUp": "Create a new account",
  "auth.subtitleForgot":
    "Enter your email and we'll send you a code to reset the password",
  "auth.subtitleNewPassword": "Choose a new password for your account",
  "auth.brandHomeAria": "Go to homepage",
  "auth.subtitle": "Sign in to your account",
  "auth.google": "Continue with Google",
  "auth.lastUsed": "LAST USED",
  "auth.or": "or",
  "auth.email": "Email",
  "auth.emailPlaceholder": "you@example.com",
  "auth.password": "Password",
  "auth.passwordConfirm": "Confirm password",
  "auth.forgotPassword": "Forgot password?",
  "auth.signIn": "Sign in",
  "auth.signUp": "Sign up",
  "auth.sendResetLink": "Send reset code",
  "auth.saveNewPassword": "Save new password",
  "auth.noAccount": "Don't have an account?",
  "auth.hasAccount": "Already have an account?",
  "auth.switchSignUp": "Sign up",
  "auth.switchSignIn": "Sign in",
  "auth.resetSent":
    "If an account exists for that email, we sent a password reset link. Check your inbox and spam folder.",
  "auth.checkEmailConfirm":
    "Check your email to confirm your account, then sign in.",
  "auth.errInvalidCredentials": "Invalid email or password.",
  "auth.errEmailTaken": "An account with this email already exists. Try signing in.",
  "auth.errWeakPassword": "Password must be at least 6 characters.",
  "auth.errResetSend": "Could not send the reset email. Try again later.",
  "auth.errResetNotDeployed":
    "Password reset email is not set up yet. Deploy the send-password-reset Edge Function and Resend secrets (see docs/auth-email-resend.md).",
  "auth.errRecoverySession":
    "This reset link expired or the session was lost. Request a new password reset email and open the latest link in the same browser.",
  "auth.errPasswordMismatch": "Passwords do not match.",
  "auth.termsNotice":
    "By continuing, you agree to MyPasswordVault's __TERMS__ and __PRIVACY__.",
  "auth.oauthHostWarning":
    "This build still uses {{host}} for Google sign-in. Set VITE_SUPABASE_URL to https://auth.mypasswordvault.app in Vercel (or .env locally), then redeploy or restart npm run dev.",
  "auth.errGeneric": "Something went wrong. Try again.",
  "auth.securityNote":
    "We never upload your master password. Google sign-in only identifies you; vault secrets stay encrypted until you unlock with your passkey, or with your master password plus a backup method.",
  "auth.notConfiguredTitle": "Supabase is not configured",
  "auth.notConfiguredBody":
    "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file in the project root, then restart the dev server. See README.md for creating the database table and enabling Google sign-in.",

  "auth.faqTitle": "Common questions",
  "auth.faqTrustQ": "Can I trust this app? Is my data safe?",
  "auth.faqTrustA":
    "Your passwords are encrypted on your device before anything is synced. Servers only ever see ciphertext—your master password and plain-text secrets never leave your control in readable form. Google sign-in is only used to tie the encrypted vault to your account.",
  "auth.faqUseQ": "How do I use it? Will it feel simple day to day?",
  "auth.faqUseA":
    "Sign in with Google, choose a strong master password, register a passkey (Face ID, Touch ID, Windows Hello, or phone), then set up a backup authenticator app and save your recovery codes. Day to day, unlock with your passkey—no typing passwords or OTP codes. Auto-lock keeps the vault closed when you step away.",
  "auth.faqWhatAuthenticatorQ":
    "What is a passkey and how do I sign in?",
  "auth.faqWhatAuthenticatorA":
    "A passkey uses your device’s secure hardware (Secure Enclave, TPM, Titan chip, etc.) to prove it’s you—Touch ID, Face ID, fingerprint, or device PIN. The server only stores a public key; your private key never leaves the device. When you unlock, you approve with biometrics or PIN and the device signs a challenge—no password or authenticator code to type.",
  "auth.faqAuthenticatorQ":
    "What are the backup options (authenticator and recovery codes)?",
  "auth.faqAuthenticatorA":
    "If you lose your passkey device, use backup sign-in: your master password plus either a code from your authenticator app (TOTP backup) or a one-time recovery code you saved during setup. Each recovery code works once. You can also restore from your account and re-register a passkey after verifying your master password.",
  "auth.faqPricingQ": "Is this free or paid?",
  "auth.faqPricingA":
    "You can save up to 25 password entries for free. A one-time $4.99 purchase unlocks unlimited entries on your account forever. Open __PRICING_LINK__ from the app for checkout.",
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
  "setup.pageTitlePasskey": "Register passkey",
  "setup.pageTitleBackupTotp": "Backup authenticator",
  "setup.pageTitleRecovery": "Recovery codes",
  "setup.stepperAria": "Setup progress",
  "setup.stepPassword": "Master password",
  "setup.stepPasskey": "Passkey",
  "setup.stepBackupTotp": "Authenticator",
  "setup.stepRecovery": "Recovery code",
  "setup.passkeyHelpTitle": "What is a passkey?",
  "setup.passkeyHelpBody":
    "A passkey uses your device’s secure hardware to prove it’s you — Touch ID, Face ID, fingerprint, or device PIN. Your private key never leaves the device; we only store a public key.\n\nWhen you unlock the vault, you approve with biometrics or PIN. No master password or codes to type every day.",
  "setup.passkeyHelpGotIt": "Got it",
  "setup.backupTotpRecommend":
    "Recommended for safety — a backup if passkeys aren’t available on a device.",
  "setup.recoveryCalloutTitle": "Store these codes somewhere safe",
  "setup.recoveryCalloutBody":
    "These one-time codes are separate from your passkey and authenticator app. If you lose your device, use a code with your master password to sign in. Each code works only once — keep them offline (password manager or printout).",
  "setup.pageTitle2fa": "Two-factor authentication",
  "setup.title": "Set up My Password Vault",
  "setup.subtitle":
    "After you sign in, create your vault here. Your master password is never stored on any server.",
  "setup.masterPw": "Master password",
  "setup.masterPwConfirm": "Confirm master password",
  "setup.placeholderMin": "At least 10 characters",
  "setup.autoLock": "Auto-lock (minutes)",
  "setup.nextPasskey": "Next — register passkey",
  "setup.next2fa": "Next — set up two-factor authentication",
  "setup.nextRecovery": "Next — save recovery codes",
  "setup.passkeyIntro":
    "Turn on this device’s passkey, then continue. Touch ID or Face ID is used when available; your device PIN works as a fallback.",
  "setup.registerPasskey": "Register passkey",
  "setup.passkeyContinue": "Continue",
  "setup.passkeyRegistering": "Registering…",
  "setup.passkeyMethodsLoading": "Checking available options…",
  "setup.passkeyMethodsHint":
    "This creates one passkey on this device. Security keys and other devices can be added later from Settings.",
  "setup.passkeyMethodAdded": "Added",
  "setup.passkeyPinIncluded":
    "Included automatically — used when biometrics aren’t available on this device.",
  "setup.passkeyPinIncludedBadge": "Included",
  "setup.passkeyMethodTouchId": "Touch ID",
  "setup.passkeyMethodFaceId": "Face ID",
  "setup.passkeyMethodFingerprint": "Fingerprint",
  "setup.passkeyMethodBiometric": "Biometrics",
  "setup.passkeyMethodWindowsHello": "Windows Hello",
  "setup.passkeyMethodPin": "Device PIN",
  "setup.passkeyMethodSecurityKey": "Security key",
  "setup.passkeyMethodPhone": "Phone passkey",
  "setup.passkeyUnsupported":
    "Passkeys are not available in this browser. Use Chrome, Safari, or Edge on a supported device.",
  "setup.passkeyLocalHint":
    "For passkeys in local dev, use http://localhost:5173/app only (not 127.0.0.1 — browsers reject IP addresses for passkeys).",
  "errors.passkeyUseLocalhost":
    "Passkeys do not work on 127.0.0.1. Open http://localhost:5173/app/ instead (same app, valid domain for Touch ID).",
  "setup.backupTotpIntro":
    "Scan the QR code with Google Authenticator, 1Password, Authy, or similar. Then enter the 6-digit code to confirm.",
  "setup.recoveryIntro":
    "Copy or download the codes below, then check the box to confirm you’ve saved them.",
  "setup.recoveryAck":
    "I have saved these recovery codes in a safe place.",
  "setup.copyRecoveryCodes": "Copy all recovery codes",
  "setup.copyRecoveryCodesDone": "Copied",
  "setup.downloadRecoveryCodes": "Download recovery codes as text file",
  "setup.downloadRecoveryCodesDone": "Downloaded",
  "setup.skipBackupTotp": "Skip — continue without authenticator app",
  "setup.backupTotpSkipWarn":
    "Recommended for safety — a backup if passkeys aren’t available on a device. You can skip, but setup takes about a minute.",
  "setup.forgetWarn":
    "If you forget your master password and lose your passkey and backups, the vault cannot be recovered.",
  "setup.2faIntro":
    "Scan the QR code with Google Authenticator, 1Password, Authy, etc., or enter the secret key manually. Then enter the 6-digit code shown in the app to confirm.",
  "setup.secretKey": "Secret key (manual entry)",
  "setup.openOtpauth": "Open otpauth:// link",
  "setup.copyTotpSecret": "Copy secret key for authenticator app",
  "setup.copyTotpSecretDone": "Copied",
  "setup.totpAuthenticatorHint":
    "Scan the QR with Google Authenticator, 1Password, Authy, or similar. On Mac, use a dedicated authenticator app — Apple Passwords cannot add backup codes to a passkey entry.",
  "setup.totpCode": "6-digit code from the app",
  "setup.back": "Back",
  "setup.confirmStart": "Confirm and start",
  "setup.errMin": "Master password must be at least 10 characters.",
  "setup.errMismatch": "Passwords do not match.",
  "setup.errGeneric": "Something went wrong.",

  "lock.title": "Vault Locked",
  "lock.subtitle": "Unlock with your passkey, or use a backup method below.",
  "lock.checkoutUnlockHint":
    "Unlock below to open your vault — your list is waiting.",
  "lock.unlockPasskey": "Unlock with passkey",
  "lock.passkeyWrongSite":
    "Your passkey was created on {{site}}, not this site. Use backup sign-in below (master password + authenticator or recovery code). You can register a new passkey here after unlocking.",
  "lock.useBackup": "Use backup sign-in",
  "lock.hideBackup": "Hide backup sign-in",
  "lock.backupHint":
    "Backup: master password plus authenticator code or a one-time recovery code.",
  "lock.backupTotpTab": "Authenticator",
  "lock.backupRecoveryTab": "Recovery code",
  "lock.recoveryCode": "Recovery code",
  "lock.unlockBackup": "Unlock with backup",
  "lock.masterPw": "Master password",
  "lock.totp": "Authenticator code (backup)",
  "lock.unlock": "Unlock",
  "lock.forget": "Forgot master password? Reset vault.",
  "lock.resetWarn":
    "Resetting will permanently delete all saved passwords. Are you sure you want to continue?",
  "lock.deleteAll": "Delete everything and start over",
  "lock.errFailed": "Unlock failed",

  "errors.masterTooShort": "Master password must be at least 10 characters.",
  "errors.noPendingSetup": "No setup in progress.",
  "errors.invalidOtp": "Invalid authentication code.",
  "errors.notInitialized": "Vault is not initialized.",
  "errors.wrongMaster": "Incorrect master password.",
  "errors.wrongTotp": "Incorrect authenticator code.",
  "errors.passkeyNotSupported": "Passkeys are not supported in this browser.",
  "errors.passkeyFailed": "Passkey verification failed.",
  "errors.passkeyCancelled":
    "Passkey sign-in was cancelled or timed out. Try again, or use backup sign-in below.",
  "errors.passkeyTimeout":
    "Passkey sign-in timed out. Try again, or use backup sign-in below.",
  "errors.passkeyWrongDomain":
    "This passkey does not apply on this site (passkeys are tied to where you registered them). Use backup sign-in below.",
  "errors.passkeySetupSecurity":
    "Could not register a passkey on this site. Use Safari or Chrome, complete the Touch ID / Face ID prompt, and always use the same address (127.0.0.1 vs localhost — pick one and stick to it).",
  "errors.passkeySetupOrigin":
    "The browser address does not match where this app is running. Open the vault at the same URL you started setup with (including 127.0.0.1 vs localhost).",
  "errors.passkeySetupPrf":
    "Passkey was created but encryption setup failed. Click Continue again and complete the second Touch ID / Face ID prompt, or try Safari. Clear site data for 127.0.0.1 if you keep retrying.",
  "errors.passkeySetupUv":
    "Touch ID / Face ID did not complete verification. Try again and finish the system prompt.",
  "errors.passkeyInvalidState":
    "A passkey for this site already exists in your password manager. Remove old passkeys for 127.0.0.1 in System Settings → Passwords, clear site data, then try again.",
  "errors.passkeyNoPasswordless":
    "Passkey unlock is not available on this device. Use backup sign-in with your master password.",
  "errors.passkeyRequired": "Register a passkey before continuing.",
  "errors.passkeyNeedsSignIn": "Sign in with Google before registering a passkey.",
  "errors.invalidRecoveryCode": "Invalid or already used recovery code.",
  "errors.noPasskeyRegistered": "No passkey is registered for this vault.",
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
  "settings.sidebarSection": "Settings",
  "settings.navAria": "Settings sections",
  "settings.navGeneral": "General",
  "settings.navPlan": "Plan",
  "settings.navBackup": "Backup",
  "settings.generalSubtitle": "Auto-lock and other vault preferences on this device.",
  "settings.planSubtitle": "Entry limits and your license status.",
  "settings.backupSubtitle": "Cloud sync and optional offline backup files.",
  "settings.accountSubtitle": "Profile, sign-in, and account actions.",
  "settings.autoLock": "Auto-lock (minutes)",
  "settings.autoLockHint":
    "Locks automatically when there is no mouse or keyboard activity.",
  "settings.language": "Language",
  "settings.languageHint": "Applies to the app interface on this device.",
  "settings.danger": "Danger zone",
  "settings.resetVault": "Reset vault (delete all data)",
  "settings.resetDesc":
    "All saved passwords and 2FA settings will be deleted. This cannot be undone.",
  "settings.permanentDelete": "Delete permanently",

  "settings.syncTitle": "Devices & backup",
  "settings.syncHint":
    "While you are signed in, this app keeps an encrypted copy in your database (the server cannot read it). On a new browser or phone, sign in with the same account — your vault downloads automatically — then unlock with the same master password and authenticator or recovery code as before.",
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
  "settings.changePasswordTitle": "Change your password",
  "settings.changePasswordSubtitle":
    "Welcome back! Choose a new strong password and save it to proceed.",
  "settings.currentPassword": "Current password",
  "settings.updateEmailTitle": "Update email address",
  "settings.updateEmailLabel": "Provide a new email address",
  "settings.updateEmailPlaceholder": "example@email.com",
  "settings.updateEmailHint":
    "A confirmation email will be sent to the provided email address.",
  "settings.updateEmailConfirm": "Confirm",
  "settings.updateEmailTooltip": "Update email address",
  "settings.signOut": "Sign out",
  "settings.signOutHint":
    "Ends your session. Cloud sync stops, but this device keeps its local vault until you reset or delete the account.",
  "settings.deleteAccount": "Delete account",
  "settings.deleteAccountHint":
    "Permanently deletes your account, encrypted cloud backup, license record, and all vault data on this device. Cannot be undone.",
  "settings.deleteAccountConfirm":
    "Permanently delete your account and all data for {{email}}?\n\nThis removes your cloud backup, license, and local vault on this device. You cannot undo this.",
  "settings.deleteAccountFailed": "Could not delete the account. Try again later.",
  "settings.deleteAccountNotDeployed":
    "Account deletion is not set up yet. Deploy the delete-account Edge Function (see README / docs).",
  "nav.userMenu": "Account menu",
  "settings.openAccountPage": "Account preference",

  "account.title": "Account settings",
  "account.navAria": "Account sections",
  "account.navPreferences": "Account preference",
  "account.navVault": "Open vault",
  "account.profileTitle": "Profile",
  "account.saveEmail": "Save email",
  "account.emailUpdated":
    "If your provider requires it, check your inbox to confirm the new email address.",
  "account.emailChangeHint":
    "Changing your email may require confirmation from your inbox before it takes effect.",
  "account.passwordTitle": "Change password",
  "account.newPassword": "New password",
  "account.savePassword": "Update password",
  "account.passwordUpdated": "Your sign-in password has been updated.",
  "account.backToVault": "Back to vault",
  "account.sidebarSection": "Account settings",
  "account.preferencesSubtitle": "Update your profile email and sign-in password.",
  "account.signInMethod.google": "Google",
  "account.signInMethod.email": "Email",
  "account.signInMethod.unknown": "Sign-in",

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
  "settings.planBadgeFree": "FREE",
  "settings.planBadgePro": "PRO",
  "settings.licenseKeyLabel": "License key",
  "settings.licenseKeyHint":
    "Purchase reference (Stripe checkout session). Read-only — keep it for your records.",
  "settings.licenseCopyKey": "Copy",
  "settings.licenseKeyCopied": "Copied",
  "settings.licenseNoSessionId":
    "License is active; no checkout reference is stored for this account yet.",

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
  "vault.licenseBadgePro": "PRO",
  "vault.search": "Search (site, URL, username, memo, category)",
  "vault.searchPlaceholder": "Search",
  "vault.mobileBack": "Back",
  "vault.addShort": "Add",
  "vault.colCategory": "Category",
  "vault.manageCategories": "Manage categories",
  "vault.categoriesTitle": "Categories",
  "vault.categoriesHint":
    "Add names here, then assign each row from the Category column. Save applies name changes.",
  "vault.addCategory": "+ Add Category",
  "vault.addCategoryMenu": "Add category",
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
  "vault.colNote": "Note",
  "vault.colMemo": "Memo",
  "vault.colActions": "Actions",
  "vault.colAction": "Action",
  "vault.empty": "No entries yet.",
  "vault.emptyCta": "Add your first entry.",
  "vault.footer":
    "Passwords are encrypted with AES-GCM-256. When signed in, ciphertext syncs to your account; the server cannot read your secrets. Copied passwords are cleared from the clipboard after 20 seconds.",
  "vault.totalItems": "Total: {{count}} items",
  "vault.entryLimitBanner":
    "You have reached the free limit of {{limit}} password entries on this account. Upgrade once to add unlimited entries.",
  "vault.entryLimitUpgrade": "Upgrade",
  "vault.entryLimitBannerDismiss": "Dismiss notification",
  "vault.entryLimitModalTitle": "Entry limit reached",
  "vault.entryLimitModalBody":
    "The free plan includes up to {{limit}} password entries. Purchase a permanent license to keep adding entries.",
  "vault.entryLimitModalCta": "See pricing",
  "vault.entryLimitModalClose": "Close",
  "vault.summaryUncategorized": "Uncategorized",
  "vault.newEntry": "new entry",
  "vault.sortBy": "Sort by",
  "vault.sortRecent": "Recently updated",

  "vault.phMemo": "Enter memo",
  "vault.ttExpandRow": "Show URL and memo",
  "vault.ttCollapseRow": "Hide URL and memo",

  "vault.phUrl": "https://…",
  "vault.phUser": "username",
  "vault.phPass": "password",

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
  "pwdGen.minDigits": "Minimum numbers",
  "pwdGen.minSymbols": "Minimum special characters",

  "pricing.backHome": "Home",
  "pricing.backApp": "Back to vault",
  "pricing.title": "Simple limits, one upgrade",
  "pricing.subtitle":
    "Start free with a generous entry cap, then unlock unlimited passwords with a single payment — no subscription.",
  "pricing.supabaseRequired":
    "Connect this app to Supabase (see README) to enable account billing and Stripe checkout.",
  "pricing.checkoutSuccess":
    "Payment received. If your license is not active yet, wait a few seconds and refresh this page.",
  "pricing.checkoutClosingTab":
    "Payment complete. Closing this tab and returning to your vault…",
  "pricing.checkoutCancel": "Checkout was cancelled. You can try again whenever you are ready.",
  "pricing.youAreLicensed": "Your account already has a permanent license. Thank you for your support.",
  "pricing.tierFree": "Free",
  "pricing.freeForever": "No monthly fee",
  "pricing.freeDesc": "For personal use and trying the product with full security features.",
  "pricing.freeF1": "Up to 25 password entries",
  "pricing.freeF2": "Passkey unlock + AES-GCM-256 encryption (TOTP backup)",
  "pricing.freeF3": "Encrypted sync to your account (ciphertext only in your database)",
  "pricing.freeF4": "Offline JSON backup & restore",
  "pricing.freeF5": "Syncs and works on every device you sign into",
  "pricing.freeFootnote":
    "When you reach {{limit}} entries, adding new rows is paused until you upgrade or delete entries.",
  "pricing.tierPaid": "Permanent license",
  "pricing.mostPopular": "Most popular",
  "pricing.paidOnce": "One-time USD 4.99 — no subscription",
  "pricing.paidDesc": "Unlock unlimited password entries on this account forever.",
  "pricing.paidF1": "Unlimited password entries",
  "pricing.paidF2": "Everything in Free, plus no entry cap",
  "pricing.paidF3": "One-time payment — no subscription",
  "pricing.paidF4": "Permanent license on this account; unlimited entries with no 25-row pause",
  "pricing.paidF5": "Syncs and works on every device you sign into",
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
