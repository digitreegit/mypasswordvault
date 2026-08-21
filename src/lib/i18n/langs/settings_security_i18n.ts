/**
 * Settings → Security panel strings for locales that otherwise fall back to English.
 */

const SECURITY_KEYS = [
  "settings.securitySubtitle",
  "settings.securityPasskeysTitle",
  "settings.securityPasskeysHint",
  "settings.securityPasskeyLegacyHint",
  "settings.passkeysRemoveLabel",
  "settings.passkeysRemoveLastHint",
  "settings.securityTotpTitle",
  "settings.securityTotpHint",
  "settings.securityTotpConfigured",
  "settings.securityTotpNotConfigured",
  "settings.securityTotpSetup",
  "settings.securityTotpConfirm",
  "settings.securityTotpConfirming",
  "settings.securityTotpAdded",
  "settings.securityRecoveryTitle",
  "settings.securityRecoveryHint",
  "settings.securityRecoveryRemaining",
  "settings.securityRecoveryOnceHint",
  "settings.securityRecoveryRegenerate",
  "settings.securityRecoveryRegenerateWarn",
  "settings.securityRecoveryRegenerateConfirm",
  "settings.securityRecoveryRegenerating",
  "settings.securityRecoveryDismiss",
  "settings.passkeyFinishPrf",
  "settings.passkeyFinishPrfHint",
  "settings.passkeyFinishPrfBusy",
  "errors.passkeyUseLocalhost",
  "errors.passkeyWrongDomain",
] as const;

export const SETTINGS_SECURITY_CN: Record<string, string> = {
  "settings.securitySubtitle":
    "用于解锁保险库的通行密钥、验证器应用和恢复代码。",
  "settings.securityPasskeysTitle": "通行密钥",
  "settings.securityPasskeysHint":
    "可选：使用生物识别、设备 PIN 或安全密钥无密码解锁。可随时添加。",
  "settings.securityPasskeyLegacyHint":
    "macOS 和浏览器会保留创建通行密钥时保存的名称。若仍显示 user-xxxxxxxx，请在下方添加新通行密钥（将使用您的电子邮件），在此移除旧密钥，然后在系统设置 → 密码中删除旧的 localhost 条目。",
  "settings.passkeysRemoveLabel": "移除",
  "settings.passkeysRemoveLastHint": "至少须保留一个通行密钥。请先添加另一个通行密钥。",
  "settings.securityTotpTitle": "验证器应用与恢复代码",
  "settings.securityTotpHint":
    "使用 6 位验证器代码保护主密码登录。应用不可用时，可用一次性恢复代码替代。",
  "settings.securityTotpConfigured": "验证器应用已配置",
  "settings.securityTotpNotConfigured":
    "未配置 — 您在设置过程中跳过了此步骤。可在此添加以用于备份解锁。",
  "settings.securityTotpSetup": "设置验证器应用",
  "settings.securityTotpConfirm": "确认并保存",
  "settings.securityTotpConfirming": "保存中…",
  "settings.securityTotpAdded": "验证器应用已保存。",
  "settings.securityRecoveryTitle": "恢复代码",
  "settings.securityRecoveryHint":
    "用于替代验证器代码的一次性代码。仍需输入主密码。",
  "settings.securityRecoveryRemaining": "{{count}} 个未使用的代码",
  "settings.securityRecoveryOnceHint":
    "代码创建时仅显示一次。生成新代码以再次复制或下载（将替换所有先前的代码）。",
  "settings.securityRecoveryRegenerate": "生成新的恢复代码",
  "settings.securityRecoveryRegenerateWarn":
    "这将替换所有现有恢复代码。您之前保存的代码将失效。",
  "settings.securityRecoveryRegenerateConfirm": "生成新代码",
  "settings.securityRecoveryRegenerating": "生成中…",
  "settings.securityRecoveryDismiss": "完成",
  "settings.passkeyFinishPrf": "完成设置",
  "settings.passkeyFinishPrfHint":
    "此通行密钥已在您的设备上，但尚未与保险库关联。请完成后续提示。",
  "settings.passkeyFinishPrfBusy": "关联中…",
  "errors.passkeyUseLocalhost":
    "通行密钥在 127.0.0.1 上无法使用。请改用 http://localhost:5173/app/（同一应用，Touch ID 可用域名）。",
  "errors.passkeyWrongDomain":
    "此通行密钥不适用于本站点（通行密钥与注册站点绑定）。",
};

export const SETTINGS_SECURITY_JP: Record<string, string> = {
  "settings.securitySubtitle":
    "Vault のロック解除に使うパスキー、認証アプリ、リカバリーコードです。",
  "settings.securityPasskeysTitle": "パスキー",
  "settings.securityPasskeysHint":
    "任意：生体認証、デバイス PIN、またはセキュリティキーでパスワードなしにロック解除。いつでも追加できます。",
  "settings.securityPasskeyLegacyHint":
    "macOS とブラウザは、パスキー作成時に保存した名前を表示し続けます。user-xxxxxxxx が表示される場合は、下で新しいパスキーを追加してください（メールアドレスが使われます）。ここで古いパスキーを削除し、システム設定 → パスワードから localhost の項目も削除してください。",
  "settings.passkeysRemoveLabel": "削除",
  "settings.passkeysRemoveLastHint":
    "パスキーは最低 1 つ必要です。先に別のパスキーを追加してください。",
  "settings.securityTotpTitle": "認証アプリと復旧コード",
  "settings.securityTotpHint":
    "マスターパスワードでのログインを6桁の認証コードで保護します。アプリが使えない場合は使い捨ての復旧コードで代替できます。",
  "settings.securityTotpConfigured": "認証アプリ設定済み",
  "settings.securityTotpNotConfigured":
    "未設定 — セットアップ時にスキップしました。バックアップ用のロック解除としてここで追加できます。",
  "settings.securityTotpSetup": "認証アプリを設定",
  "settings.securityTotpConfirm": "確認して保存",
  "settings.securityTotpConfirming": "保存中…",
  "settings.securityTotpAdded": "認証アプリを保存しました。",
  "settings.securityRecoveryTitle": "リカバリーコード",
  "settings.securityRecoveryHint":
    "認証アプリのコードの代わりに使う使い捨てコードです。マスターパスワードも必要です。",
  "settings.securityRecoveryRemaining": "未使用コード {{count}} 件",
  "settings.securityRecoveryOnceHint":
    "コードは作成時に一度だけ表示されます。再度コピーまたはダウンロードするには新しいコードを生成してください（以前のコードはすべて無効になります）。",
  "settings.securityRecoveryRegenerate": "新しいリカバリーコードを生成",
  "settings.securityRecoveryRegenerateWarn":
    "既存のリカバリーコードがすべて置き換えられます。保存していたコードは使えなくなります。",
  "settings.securityRecoveryRegenerateConfirm": "新しいコードを生成",
  "settings.securityRecoveryRegenerating": "生成中…",
  "settings.securityRecoveryDismiss": "完了",
  "settings.passkeyFinishPrf": "設定を完了",
  "settings.passkeyFinishPrfHint":
    "このパスキーはデバイス上にありますが、まだ Vault にリンクされていません。続くプロンプトを完了してください。",
  "settings.passkeyFinishPrfBusy": "リンク中…",
  "errors.passkeyUseLocalhost":
    "127.0.0.1 ではパスキーは使えません。http://localhost:5173/app/ を開いてください（同じアプリで、Touch ID 用の有効なドメインです）。",
  "errors.passkeyWrongDomain":
    "このパスキーはこのサイトでは使えません（パスキーは登録したサイトに紐づきます）。",
};

export const SETTINGS_SECURITY_ID: Record<string, string> = {
  "settings.securitySubtitle":
    "Passkey, aplikasi autentikator, dan kode pemulihan untuk membuka kunci brankas.",
  "settings.securityPasskeysTitle": "Passkey",
  "settings.securityPasskeysHint":
    "Opsional: buka kunci tanpa kata sandi dengan biometrik, PIN perangkat, atau kunci keamanan. Dapat ditambahkan kapan saja.",
  "settings.securityPasskeyLegacyHint":
    "macOS dan browser mengingat label saat setiap passkey dibuat. Jika masih melihat user-xxxxxxxx, tambahkan passkey baru di bawah (email Anda akan digunakan), hapus yang lama di sini, lalu hapus entri localhost lama di Pengaturan Sistem → Kata Sandi.",
  "settings.passkeysRemoveLabel": "Hapus",
  "settings.passkeysRemoveLastHint":
    "Minimal satu passkey harus tetap ada. Tambahkan passkey lain terlebih dahulu.",
  "settings.securityTotpTitle": "Aplikasi autentikator & kode pemulihan",
  "settings.securityTotpHint":
    "Lindungi login kata sandi utama dengan kode autentikator 6 digit. Kode pemulihan sekali pakai dapat menggantikannya.",
  "settings.securityTotpConfigured": "Aplikasi autentikator dikonfigurasi",
  "settings.securityTotpNotConfigured":
    "Belum dikonfigurasi — Anda melewatinya saat penyiapan. Tambahkan di sini untuk buka kunci cadangan.",
  "settings.securityTotpSetup": "Siapkan aplikasi autentikator",
  "settings.securityTotpConfirm": "Konfirmasi dan simpan",
  "settings.securityTotpConfirming": "Menyimpan…",
  "settings.securityTotpAdded": "Aplikasi autentikator disimpan.",
  "settings.securityRecoveryTitle": "Kode pemulihan",
  "settings.securityRecoveryHint":
    "Kode sekali pakai pengganti kode autentikator. Kata sandi utama tetap diperlukan.",
  "settings.securityRecoveryRemaining": "{{count}} kode belum digunakan",
  "settings.securityRecoveryOnceHint":
    "Kode hanya ditampilkan sekali saat dibuat. Buat kode baru untuk menyalin atau mengunduh lagi (mengganti semua kode sebelumnya).",
  "settings.securityRecoveryRegenerate": "Buat kode pemulihan baru",
  "settings.securityRecoveryRegenerateWarn":
    "Ini mengganti semua kode pemulihan yang ada. Kode yang Anda simpan sebelumnya tidak akan berfungsi lagi.",
  "settings.securityRecoveryRegenerateConfirm": "Buat kode baru",
  "settings.securityRecoveryRegenerating": "Membuat…",
  "settings.securityRecoveryDismiss": "Selesai",
  "settings.passkeyFinishPrf": "Selesaikan penyiapan",
  "settings.passkeyFinishPrfHint":
    "Passkey ini ada di perangkat Anda tetapi belum ditautkan ke brankas. Selesaikan prompt lanjutan.",
  "settings.passkeyFinishPrfBusy": "Menautkan…",
  "errors.passkeyUseLocalhost":
    "Passkey tidak berfungsi di 127.0.0.1. Buka http://localhost:5173/app/ sebagai gantinya (aplikasi yang sama, domain valid untuk Touch ID).",
  "errors.passkeyWrongDomain":
    "Passkey ini tidak berlaku di situs ini (passkey terikat ke tempat pendaftarannya).",
};

export const SETTINGS_SECURITY_ES: Record<string, string> = {
  "settings.securitySubtitle":
    "Passkeys, app autenticadora y códigos de recuperación para desbloquear la bóveda.",
  "settings.securityPasskeysTitle": "Passkey",
  "settings.securityPasskeysHint":
    "Opcional: desbloqueo sin contraseña con biometría, PIN del dispositivo o llave de seguridad. Puedes añadirla cuando quieras.",
  "settings.securityPasskeyLegacyHint":
    "macOS y los navegadores recuerdan la etiqueta de cuando se creó cada passkey. Si aún ves user-xxxxxxxx, añade una passkey nueva abajo (se usará tu correo), elimina la antigua aquí y borra la entrada localhost en Ajustes del sistema → Contraseñas.",
  "settings.passkeysRemoveLabel": "Eliminar",
  "settings.passkeysRemoveLastHint":
    "Debe quedar al menos una passkey. Añade otra passkey primero.",
  "settings.securityTotpTitle": "App autenticadora y códigos de recuperación",
  "settings.securityTotpHint":
    "Protege el inicio con contraseña maestra mediante un código de 6 dígitos. Los códigos de recuperación pueden sustituirlo.",
  "settings.securityTotpConfigured": "App autenticadora configurada",
  "settings.securityTotpNotConfigured":
    "Sin configurar — lo omitiste durante la configuración. Añádelo aquí para desbloqueo de respaldo.",
  "settings.securityTotpSetup": "Configurar app autenticadora",
  "settings.securityTotpConfirm": "Confirmar y guardar",
  "settings.securityTotpConfirming": "Guardando…",
  "settings.securityTotpAdded": "App autenticadora guardada.",
  "settings.securityRecoveryTitle": "Códigos de recuperación",
  "settings.securityRecoveryHint":
    "Códigos de un solo uso que sustituyen al código del autenticador. La contraseña maestra sigue siendo obligatoria.",
  "settings.securityRecoveryRemaining": "{{count}} códigos sin usar",
  "settings.securityRecoveryOnceHint":
    "Los códigos se muestran una sola vez al crearlos. Genera códigos nuevos para copiarlos o descargarlos de nuevo (reemplaza todos los anteriores).",
  "settings.securityRecoveryRegenerate": "Generar nuevos códigos de recuperación",
  "settings.securityRecoveryRegenerateWarn":
    "Esto reemplaza todos los códigos de recuperación existentes. Los códigos guardados dejarán de funcionar.",
  "settings.securityRecoveryRegenerateConfirm": "Generar códigos nuevos",
  "settings.securityRecoveryRegenerating": "Generando…",
  "settings.securityRecoveryDismiss": "Listo",
  "settings.passkeyFinishPrf": "Completar configuración",
  "settings.passkeyFinishPrfHint":
    "Esta passkey está en tu dispositivo pero aún no está vinculada a la bóveda. Completa el siguiente aviso.",
  "settings.passkeyFinishPrfBusy": "Vinculando…",
  "errors.passkeyUseLocalhost":
    "Las passkeys no funcionan en 127.0.0.1. Abre http://localhost:5173/app/ en su lugar (misma app, dominio válido para Touch ID).",
  "errors.passkeyWrongDomain":
    "Esta passkey no aplica en este sitio (las passkeys están ligadas al sitio donde se registraron).",
};

export const SETTINGS_SECURITY_DE: Record<string, string> = {
  "settings.securitySubtitle":
    "Passkeys, Authentifikator-App und Wiederherstellungscodes zum Entsperren des Tresors.",
  "settings.securityPasskeysTitle": "Passkey",
  "settings.securityPasskeysHint":
    "Optional: passwortloses Entsperren mit Biometrie, Geräte-PIN oder Sicherheitsschlüssel. Jederzeit hinzufügbar.",
  "settings.securityPasskeyLegacyHint":
    "macOS und Browser merken sich die Bezeichnung von der Passkey-Erstellung. Wenn weiterhin user-xxxxxxxx angezeigt wird, fügen Sie unten einen neuen Passkey hinzu (Ihre E-Mail wird verwendet), entfernen Sie den alten hier und löschen Sie den localhost-Eintrag unter Systemeinstellungen → Passwörter.",
  "settings.passkeysRemoveLabel": "Entfernen",
  "settings.passkeysRemoveLastHint":
    "Mindestens ein Passkey muss verbleiben. Fügen Sie zuerst einen weiteren Passkey hinzu.",
  "settings.securityTotpTitle": "Authenticator-App & Wiederherstellungscodes",
  "settings.securityTotpHint":
    "Schützt die Masterpasswort-Anmeldung mit einem 6-stelligen Code. Einmalige Wiederherstellungscodes können ihn ersetzen.",
  "settings.securityTotpConfigured": "Authentifikator-App eingerichtet",
  "settings.securityTotpNotConfigured":
    "Nicht eingerichtet — beim Setup übersprungen. Hier für Backup-Entsperrung hinzufügen.",
  "settings.securityTotpSetup": "Authentifikator-App einrichten",
  "settings.securityTotpConfirm": "Bestätigen und speichern",
  "settings.securityTotpConfirming": "Speichern…",
  "settings.securityTotpAdded": "Authentifikator-App gespeichert.",
  "settings.securityRecoveryTitle": "Wiederherstellungscodes",
  "settings.securityRecoveryHint":
    "Einmalcodes als Ersatz für den Authenticator-Code. Das Masterpasswort ist weiterhin erforderlich.",
  "settings.securityRecoveryRemaining": "{{count}} unbenutzte Codes",
  "settings.securityRecoveryOnceHint":
    "Codes werden bei Erstellung nur einmal angezeigt. Neue Codes generieren zum erneuten Kopieren oder Herunterladen (ersetzt alle bisherigen).",
  "settings.securityRecoveryRegenerate": "Neue Wiederherstellungscodes generieren",
  "settings.securityRecoveryRegenerateWarn":
    "Dies ersetzt alle vorhandenen Wiederherstellungscodes. Gespeicherte Codes funktionieren nicht mehr.",
  "settings.securityRecoveryRegenerateConfirm": "Neue Codes generieren",
  "settings.securityRecoveryRegenerating": "Generieren…",
  "settings.securityRecoveryDismiss": "Fertig",
  "settings.passkeyFinishPrf": "Einrichtung abschließen",
  "settings.passkeyFinishPrfHint":
    "Dieser Passkey ist auf Ihrem Gerät, aber noch nicht mit dem Tresor verknüpft. Schließen Sie die Folgeaufforderung ab.",
  "settings.passkeyFinishPrfBusy": "Verknüpfen…",
  "errors.passkeyUseLocalhost":
    "Passkeys funktionieren nicht auf 127.0.0.1. Öffnen Sie stattdessen http://localhost:5173/app/ (dieselbe App, gültige Domain für Touch ID).",
  "errors.passkeyWrongDomain":
    "Dieser Passkey gilt auf dieser Website nicht (Passkeys sind an den Registrierungsort gebunden).",
};

export const SETTINGS_SECURITY_FR: Record<string, string> = {
  "settings.securitySubtitle":
    "Passkeys, application d’authentification et codes de récupération pour déverrouiller le coffre.",
  "settings.securityPasskeysTitle": "Passkey",
  "settings.securityPasskeysHint":
    "Facultatif : déverrouillage sans mot de passe avec biométrie, PIN ou clé de sécurité. Ajoutable à tout moment.",
  "settings.securityPasskeyLegacyHint":
    "macOS et les navigateurs conservent le libellé de la création de chaque passkey. Si vous voyez encore user-xxxxxxxx, ajoutez une nouvelle passkey ci-dessous (votre e-mail sera utilisé), supprimez l’ancienne ici, puis supprimez l’entrée localhost dans Réglages système → Mots de passe.",
  "settings.passkeysRemoveLabel": "Supprimer",
  "settings.passkeysRemoveLastHint":
    "Au moins une passkey doit rester. Ajoutez d’abord une autre passkey.",
  "settings.securityTotpTitle": "Authentification et codes de récupération",
  "settings.securityTotpHint":
    "Protège la connexion par mot de passe maître avec un code à 6 chiffres. Les codes de récupération peuvent le remplacer.",
  "settings.securityTotpConfigured": "Application d’authentification configurée",
  "settings.securityTotpNotConfigured":
    "Non configurée — vous l’avez ignorée lors de la configuration. Ajoutez-la ici pour un déverrouillage de secours.",
  "settings.securityTotpSetup": "Configurer l’application d’authentification",
  "settings.securityTotpConfirm": "Confirmer et enregistrer",
  "settings.securityTotpConfirming": "Enregistrement…",
  "settings.securityTotpAdded": "Application d’authentification enregistrée.",
  "settings.securityRecoveryTitle": "Codes de récupération",
  "settings.securityRecoveryHint":
    "Codes à usage unique remplaçant le code d’authentification. Le mot de passe maître reste obligatoire.",
  "settings.securityRecoveryRemaining": "{{count}} codes inutilisés",
  "settings.securityRecoveryOnceHint":
    "Les codes ne s’affichent qu’une fois à la création. Générez de nouveaux codes pour les copier ou télécharger à nouveau (remplace tous les codes précédents).",
  "settings.securityRecoveryRegenerate": "Générer de nouveaux codes de récupération",
  "settings.securityRecoveryRegenerateWarn":
    "Cela remplace tous les codes de récupération existants. Les codes enregistrés ne fonctionneront plus.",
  "settings.securityRecoveryRegenerateConfirm": "Générer de nouveaux codes",
  "settings.securityRecoveryRegenerating": "Génération…",
  "settings.securityRecoveryDismiss": "Terminé",
  "settings.passkeyFinishPrf": "Terminer la configuration",
  "settings.passkeyFinishPrfHint":
    "Cette passkey est sur votre appareil mais n’est pas encore liée au coffre. Terminez l’invite suivante.",
  "settings.passkeyFinishPrfBusy": "Liaison…",
  "errors.passkeyUseLocalhost":
    "Les passkeys ne fonctionnent pas sur 127.0.0.1. Ouvrez http://localhost:5173/app/ à la place (même app, domaine valide pour Touch ID).",
  "errors.passkeyWrongDomain":
    "Cette passkey ne s’applique pas sur ce site (les passkeys sont liées au site d’enregistrement).",
};

export const SETTINGS_SECURITY_IT: Record<string, string> = {
  "settings.securitySubtitle":
    "Passkey, app autenticatore e codici di recupero per sbloccare il vault.",
  "settings.securityPasskeysTitle": "Passkey",
  "settings.securityPasskeysHint":
    "Facoltativo: sblocco senza password con biometria, PIN o chiave di sicurezza. Puoi aggiungerla in qualsiasi momento.",
  "settings.securityPasskeyLegacyHint":
    "macOS e i browser ricordano l’etichetta usata alla creazione di ogni passkey. Se vedi ancora user-xxxxxxxx, aggiungi una nuova passkey sotto (verrà usata la tua e-mail), rimuovi quella vecchia qui, poi elimina la voce localhost in Impostazioni di sistema → Password.",
  "settings.passkeysRemoveLabel": "Rimuovi",
  "settings.passkeysRemoveLastHint":
    "Deve restare almeno una passkey. Aggiungi prima un’altra passkey.",
  "settings.securityTotpTitle": "Autenticatore e codici di recupero",
  "settings.securityTotpHint":
    "Protegge l’accesso con password principale tramite un codice a 6 cifre. I codici di recupero possono sostituirlo.",
  "settings.securityTotpConfigured": "App autenticatore configurata",
  "settings.securityTotpNotConfigured":
    "Non configurata — l’hai saltata durante la configurazione. Aggiungila qui per lo sblocco di backup.",
  "settings.securityTotpSetup": "Configura app autenticatore",
  "settings.securityTotpConfirm": "Conferma e salva",
  "settings.securityTotpConfirming": "Salvataggio…",
  "settings.securityTotpAdded": "App autenticatore salvata.",
  "settings.securityRecoveryTitle": "Codici di recupero",
  "settings.securityRecoveryHint":
    "Codici monouso che sostituiscono il codice autenticatore. La password principale resta obbligatoria.",
  "settings.securityRecoveryRemaining": "{{count}} codici non usati",
  "settings.securityRecoveryOnceHint":
    "I codici vengono mostrati una sola volta alla creazione. Genera nuovi codici per copiarli o scaricarli di nuovo (sostituisce tutti i precedenti).",
  "settings.securityRecoveryRegenerate": "Genera nuovi codici di recupero",
  "settings.securityRecoveryRegenerateWarn":
    "Questo sostituisce tutti i codici di recupero esistenti. I codici salvati non funzioneranno più.",
  "settings.securityRecoveryRegenerateConfirm": "Genera nuovi codici",
  "settings.securityRecoveryRegenerating": "Generazione…",
  "settings.securityRecoveryDismiss": "Fine",
  "settings.passkeyFinishPrf": "Completa configurazione",
  "settings.passkeyFinishPrfHint":
    "Questa passkey è sul dispositivo ma non è ancora collegata al vault. Completa il prompt successivo.",
  "settings.passkeyFinishPrfBusy": "Collegamento…",
  "errors.passkeyUseLocalhost":
    "Le passkey non funzionano su 127.0.0.1. Apri http://localhost:5173/app/ (stessa app, dominio valido per Touch ID).",
  "errors.passkeyWrongDomain":
    "Questa passkey non si applica su questo sito (le passkey sono legate al sito di registrazione).",
};

/** @internal — documents expected key coverage for security panel locales */
export type SettingsSecurityKey = (typeof SECURITY_KEYS)[number];
