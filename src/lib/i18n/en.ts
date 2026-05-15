/** Base strings (English). Other locales spread this and override. */
export const MESSAGES_EN: Record<string, string> = {
  "app.loading": "Loading…",
  "app.authLoading": "Checking your session…",

  "auth.title": "Sign in",
  "auth.subtitle":
    "Use your account to sync the encrypted vault between devices. Your master password is never sent to the server.",
  "auth.google": "Continue with Google",
  "auth.errGeneric": "Something went wrong. Try again.",
  "auth.securityNote":
    "We never upload your master password. Google sign-in only identifies you; vault secrets stay encrypted until you unlock with your master password and authenticator.",
  "auth.notConfiguredTitle": "Supabase is not configured",
  "auth.notConfiguredBody":
    "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file in the project root, then restart the dev server. See README.md for creating the database table and enabling Google sign-in.",

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
  "lock.forget": "Forgot password? Reset vault.",
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
  "vault.summaryUncategorized": "Uncategorized",
  "vault.newEntry": "New entry",

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
};
