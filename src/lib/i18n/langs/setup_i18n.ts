/**
 * Setup flow (4 stepper steps) for locales that spread English as base.
 */

const SETUP_PASSKEY_ERRORS_ES: Record<string, string> = {
  "errors.passkeyNotSupported":
    "Este navegador no admite passkeys. Usa Chrome, Safari o Edge en un dispositivo compatible.",
  "errors.passkeyRequired": "Registra una passkey antes de continuar.",
  "errors.passkeyNeedsSignIn": "Inicia sesión con Google antes de registrar una passkey.",
};

export const SETUP_ES: Record<string, string> = {
  ...SETUP_PASSKEY_ERRORS_ES,
  "setup.pageTitle": "Configuración",
  "setup.pageTitlePasskey": "Registrar passkey",
  "setup.pageTitleBackupTotp": "Autenticador de respaldo",
  "setup.pageTitleRecovery": "Códigos de recuperación",
  "setup.stepperAria": "Progreso de configuración",
  "setup.stepPassword": "Contraseña maestra",
  "setup.stepPasskey": "Passkey",
  "setup.stepBackupTotp": "Autenticador",
  "setup.stepRecovery": "Código de recuperación",
  "setup.passkeyHelpTitle": "¿Qué es una passkey?",
  "setup.passkeyHelpBody":
    "Una passkey usa el hardware seguro de tu dispositivo para demostrar que eres tú — Touch ID, Face ID, huella o PIN del dispositivo. La clave privada nunca sale del dispositivo; solo guardamos una clave pública.\n\nAl desbloquear la bóveda, apruebas con biometría o PIN. No hace falta escribir la contraseña maestra ni códigos cada día.",
  "setup.passkeyHelpGotIt": "Entendido",
  "setup.backupTotpRecommend":
    "Recomendado por seguridad — un respaldo si las passkeys no están disponibles en un dispositivo.",
  "setup.recoveryCalloutTitle": "Guarda estos códigos en un lugar seguro",
  "setup.recoveryCalloutBody":
    "Estos códigos de un solo uso son independientes de tu passkey y de la app autenticadora. Si pierdes el dispositivo, úsalos con tu contraseña maestra para iniciar sesión. Cada código funciona una sola vez — guárdalos sin conexión (gestor de contraseñas o impresión).",
  "setup.title": "Configurar My Password Vault",
  "setup.subtitle":
    "Después de iniciar sesión, crea tu bóveda aquí. La contraseña maestra no se guarda en ningún servidor.",
  "setup.masterPw": "Contraseña maestra",
  "setup.masterPwConfirm": "Confirmar contraseña maestra",
  "setup.placeholderMin": "Al menos 10 caracteres",
  "setup.autoLock": "Bloqueo automático (minutos)",
  "setup.nextPasskey": "Siguiente — registrar passkey",
  "setup.nextRecovery": "Siguiente — guardar códigos de recuperación",
  "setup.passkeyIntro":
    "Activa la passkey de este dispositivo y continúa. Se usará Touch ID o Face ID cuando esté disponible; el PIN del dispositivo sirve de respaldo.",
  "setup.passkeyContinue": "Continuar",
  "setup.passkeyRegistering": "Registrando…",
  "setup.passkeyMethodsLoading": "Comprobando opciones disponibles…",
  "setup.passkeyMethodsHint":
    "Se crea una passkey en este dispositivo. Las llaves de seguridad y otros dispositivos se pueden añadir después en Ajustes.",
  "setup.passkeyMethodAdded": "Añadido",
  "setup.passkeyPinIncluded":
    "Incluido automáticamente — se usa cuando la biometría no está disponible en este dispositivo.",
  "setup.passkeyPinIncludedBadge": "Incluido",
  "setup.passkeyMethodTouchId": "Touch ID",
  "setup.passkeyMethodFaceId": "Face ID",
  "setup.passkeyMethodFingerprint": "Huella dactilar",
  "setup.passkeyMethodBiometric": "Biometría",
  "setup.passkeyMethodWindowsHello": "Windows Hello",
  "setup.passkeyMethodPin": "PIN del dispositivo",
  "setup.passkeyUnsupported":
    "Las passkeys no están disponibles en este navegador. Usa Chrome, Safari o Edge en un dispositivo compatible.",
  "setup.backupTotpIntro":
    "Escanea el código QR con Google Authenticator, 1Password, Authy o similar. Luego introduce el código de 6 dígitos para confirmar.",
  "setup.recoveryIntro":
    "Copia o descarga los códigos siguientes y marca la casilla para confirmar que los has guardado.",
  "setup.recoveryAck": "He guardado estos códigos de recuperación en un lugar seguro.",
  "setup.copyRecoveryCodes": "Copiar todos los códigos de recuperación",
  "setup.copyRecoveryCodesDone": "Copiado",
  "setup.downloadRecoveryCodes": "Descargar códigos de recuperación como archivo de texto",
  "setup.downloadRecoveryCodesDone": "Descargado",
  "setup.skipBackupTotp": "Omitir — continuar sin app autenticadora",
  "setup.forgetWarn":
    "Si olvidas la contraseña maestra y pierdes la passkey y las copias de seguridad, la bóveda no se puede recuperar.",
  "setup.secretKey": "Clave secreta (entrada manual)",
  "setup.copyTotpSecret": "Copiar clave secreta para la app autenticadora",
  "setup.copyTotpSecretDone": "Copiado",
  "setup.totpAuthenticatorHint":
    "Escanea el QR con Google Authenticator, 1Password, Authy o similar. En Mac, usa una app autenticadora dedicada — Contraseñas de Apple no puede añadir códigos de respaldo a una passkey.",
  "setup.totpCode": "Código de 6 dígitos de la app",
  "setup.back": "Atrás",
  "setup.confirmStart": "Confirmar e iniciar",
  "setup.errMin": "La contraseña maestra debe tener al menos 10 caracteres.",
  "setup.errMismatch": "Las contraseñas no coinciden.",
  "setup.errGeneric": "Algo salió mal.",
};

const SETUP_PASSKEY_ERRORS_DE: Record<string, string> = {
  "errors.passkeyNotSupported":
    "Passkeys werden in diesem Browser nicht unterstützt. Verwende Chrome, Safari oder Edge auf einem unterstützten Gerät.",
  "errors.passkeyRequired": "Registriere zuerst einen Passkey.",
  "errors.passkeyNeedsSignIn": "Melde dich mit Google an, bevor du einen Passkey registrierst.",
};

export const SETUP_DE: Record<string, string> = {
  ...SETUP_PASSKEY_ERRORS_DE,
  "setup.pageTitle": "Einrichtung",
  "setup.pageTitlePasskey": "Passkey registrieren",
  "setup.pageTitleBackupTotp": "Backup-Authentifikator",
  "setup.pageTitleRecovery": "Wiederherstellungscodes",
  "setup.stepperAria": "Einrichtungsfortschritt",
  "setup.stepPassword": "Masterpasswort",
  "setup.stepPasskey": "Passkey",
  "setup.stepBackupTotp": "Authentifikator",
  "setup.stepRecovery": "Wiederherstellungscode",
  "setup.passkeyHelpTitle": "Was ist ein Passkey?",
  "setup.passkeyHelpBody":
    "Ein Passkey nutzt die sichere Hardware deines Geräts, um zu beweisen, dass du es bist — Touch ID, Face ID, Fingerabdruck oder Geräte-PIN. Der private Schlüssel verlässt das Gerät nie; wir speichern nur einen öffentlichen Schlüssel.\n\nBeim Entsperren bestätigst du mit Biometrie oder PIN. Kein tägliches Masterpasswort oder Codes.",
  "setup.passkeyHelpGotIt": "Verstanden",
  "setup.backupTotpRecommend":
    "Aus Sicherheitsgründen empfohlen — ein Backup, wenn Passkeys auf einem Gerät nicht verfügbar sind.",
  "setup.recoveryCalloutTitle": "Bewahre diese Codes an einem sicheren Ort auf",
  "setup.recoveryCalloutBody":
    "Diese Einmal-Codes sind getrennt von Passkey und Authentifikator-App. Bei Geräteverlust mit Masterpasswort anmelden. Jeder Code funktioniert nur einmal — offline aufbewahren (Passwort-Manager oder Ausdruck).",
  "setup.title": "My Password Vault einrichten",
  "setup.subtitle":
    "Nach der Anmeldung erstellst du hier deinen Tresor. Das Masterpasswort wird auf keinem Server gespeichert.",
  "setup.masterPw": "Masterpasswort",
  "setup.masterPwConfirm": "Masterpasswort bestätigen",
  "setup.placeholderMin": "Mindestens 10 Zeichen",
  "setup.autoLock": "Automatische Sperre (Minuten)",
  "setup.nextPasskey": "Weiter — Passkey registrieren",
  "setup.nextRecovery": "Weiter — Wiederherstellungscodes speichern",
  "setup.passkeyIntro":
    "Aktiviere den Passkey dieses Geräts und fahre fort. Touch ID oder Face ID wird bevorzugt; die Geräte-PIN ist der Fallback.",
  "setup.passkeyContinue": "Weiter",
  "setup.passkeyRegistering": "Wird registriert…",
  "setup.passkeyMethodsLoading": "Verfügbare Optionen werden geprüft…",
  "setup.passkeyMethodsHint":
    "Es wird ein Passkey auf diesem Gerät erstellt. Sicherheitsschlüssel und andere Geräte können später unter Einstellungen hinzugefügt werden.",
  "setup.passkeyMethodAdded": "Hinzugefügt",
  "setup.passkeyPinIncluded":
    "Automatisch enthalten — wird genutzt, wenn Biometrie auf diesem Gerät nicht verfügbar ist.",
  "setup.passkeyPinIncludedBadge": "Enthalten",
  "setup.passkeyMethodTouchId": "Touch ID",
  "setup.passkeyMethodFaceId": "Face ID",
  "setup.passkeyMethodFingerprint": "Fingerabdruck",
  "setup.passkeyMethodBiometric": "Biometrie",
  "setup.passkeyMethodWindowsHello": "Windows Hello",
  "setup.passkeyMethodPin": "Geräte-PIN",
  "setup.passkeyUnsupported":
    "Passkeys sind in diesem Browser nicht verfügbar. Verwende Chrome, Safari oder Edge auf einem unterstützten Gerät.",
  "setup.backupTotpIntro":
    "QR-Code mit Google Authenticator, 1Password, Authy o. Ä. scannen. Dann den 6-stelligen Code zur Bestätigung eingeben.",
  "setup.recoveryIntro":
    "Codes unten kopieren oder herunterladen und das Kontrollkästchen aktivieren, um zu bestätigen, dass du sie gespeichert hast.",
  "setup.recoveryAck": "Ich habe diese Wiederherstellungscodes an einem sicheren Ort gespeichert.",
  "setup.copyRecoveryCodes": "Alle Wiederherstellungscodes kopieren",
  "setup.copyRecoveryCodesDone": "Kopiert",
  "setup.downloadRecoveryCodes": "Wiederherstellungscodes als Textdatei herunterladen",
  "setup.downloadRecoveryCodesDone": "Heruntergeladen",
  "setup.skipBackupTotp": "Überspringen — ohne Authentifikator-App fortfahren",
  "setup.forgetWarn":
    "Wenn du das Masterpasswort vergisst und Passkey sowie Backups verlierst, ist der Tresor nicht wiederherstellbar.",
  "setup.secretKey": "Geheimschlüssel (manuell)",
  "setup.copyTotpSecret": "Geheimschlüssel für Authentifikator-App kopieren",
  "setup.copyTotpSecretDone": "Kopiert",
  "setup.totpAuthenticatorHint":
    "QR mit Google Authenticator, 1Password, Authy o. Ä. scannen. Auf dem Mac eine dedizierte Authentifikator-App verwenden — Apple Passwörter kann keine Backup-Codes zu einem Passkey-Eintrag hinzufügen.",
  "setup.totpCode": "6-stelliger Code aus der App",
  "setup.back": "Zurück",
  "setup.confirmStart": "Bestätigen und starten",
  "setup.errMin": "Das Masterpasswort muss mindestens 10 Zeichen haben.",
  "setup.errMismatch": "Passwörter stimmen nicht überein.",
  "setup.errGeneric": "Ein Fehler ist aufgetreten.",
};

const SETUP_PASSKEY_ERRORS_FR: Record<string, string> = {
  "errors.passkeyNotSupported":
    "Les passkeys ne sont pas prises en charge dans ce navigateur. Utilisez Chrome, Safari ou Edge sur un appareil compatible.",
  "errors.passkeyRequired": "Enregistrez une passkey avant de continuer.",
  "errors.passkeyNeedsSignIn": "Connectez-vous avec Google avant d’enregistrer une passkey.",
};

export const SETUP_FR: Record<string, string> = {
  ...SETUP_PASSKEY_ERRORS_FR,
  "setup.pageTitle": "Configuration",
  "setup.pageTitlePasskey": "Enregistrer une passkey",
  "setup.pageTitleBackupTotp": "Authentificateur de secours",
  "setup.pageTitleRecovery": "Codes de récupération",
  "setup.stepperAria": "Progression de la configuration",
  "setup.stepPassword": "Mot de passe maître",
  "setup.stepPasskey": "Passkey",
  "setup.stepBackupTotp": "Authentificateur",
  "setup.stepRecovery": "Code de récupération",
  "setup.passkeyHelpTitle": "Qu’est-ce qu’une passkey ?",
  "setup.passkeyHelpBody":
    "Une passkey utilise le matériel sécurisé de votre appareil pour prouver votre identité — Touch ID, Face ID, empreinte ou code PIN de l’appareil. La clé privée ne quitte jamais l’appareil ; nous ne stockons qu’une clé publique.\n\nPour déverrouiller le coffre, vous validez par biométrie ou PIN. Pas de mot de passe maître ni de codes à saisir chaque jour.",
  "setup.passkeyHelpGotIt": "Compris",
  "setup.backupTotpRecommend":
    "Recommandé pour la sécurité — une sauvegarde si les passkeys ne sont pas disponibles sur un appareil.",
  "setup.recoveryCalloutTitle": "Conservez ces codes en lieu sûr",
  "setup.recoveryCalloutBody":
    "Ces codes à usage unique sont distincts de votre passkey et de l’app d’authentification. En cas de perte d’appareil, utilisez-en un avec votre mot de passe maître. Chaque code ne fonctionne qu’une fois — gardez-les hors ligne (gestionnaire de mots de passe ou impression).",
  "setup.title": "Configurer My Password Vault",
  "setup.subtitle":
    "Après connexion, créez votre coffre ici. Le mot de passe maître n’est stocké sur aucun serveur.",
  "setup.masterPw": "Mot de passe maître",
  "setup.masterPwConfirm": "Confirmer le mot de passe maître",
  "setup.placeholderMin": "Au moins 10 caractères",
  "setup.autoLock": "Verrouillage auto (minutes)",
  "setup.nextPasskey": "Suivant — enregistrer la passkey",
  "setup.nextRecovery": "Suivant — enregistrer les codes de récupération",
  "setup.passkeyIntro":
    "Activez la passkey de cet appareil, puis continuez. Touch ID ou Face ID est utilisé si disponible ; le code PIN de l’appareil sert de secours.",
  "setup.passkeyContinue": "Continuer",
  "setup.passkeyRegistering": "Enregistrement…",
  "setup.passkeyMethodsLoading": "Vérification des options disponibles…",
  "setup.passkeyMethodsHint":
    "Une passkey est créée sur cet appareil. Les clés de sécurité et autres appareils peuvent être ajoutés plus tard dans Réglages.",
  "setup.passkeyMethodAdded": "Ajouté",
  "setup.passkeyPinIncluded":
    "Inclus automatiquement — utilisé lorsque la biométrie n’est pas disponible sur cet appareil.",
  "setup.passkeyPinIncludedBadge": "Inclus",
  "setup.passkeyMethodTouchId": "Touch ID",
  "setup.passkeyMethodFaceId": "Face ID",
  "setup.passkeyMethodFingerprint": "Empreinte digitale",
  "setup.passkeyMethodBiometric": "Biométrie",
  "setup.passkeyMethodWindowsHello": "Windows Hello",
  "setup.passkeyMethodPin": "Code PIN de l’appareil",
  "setup.passkeyUnsupported":
    "Les passkeys ne sont pas disponibles dans ce navigateur. Utilisez Chrome, Safari ou Edge sur un appareil compatible.",
  "setup.backupTotpIntro":
    "Scannez le code QR avec Google Authenticator, 1Password, Authy, etc. Puis saisissez le code à 6 chiffres pour confirmer.",
  "setup.recoveryIntro":
    "Copiez ou téléchargez les codes ci-dessous, puis cochez la case pour confirmer que vous les avez enregistrés.",
  "setup.recoveryAck": "J’ai enregistré ces codes de récupération en lieu sûr.",
  "setup.copyRecoveryCodes": "Copier tous les codes de récupération",
  "setup.copyRecoveryCodesDone": "Copié",
  "setup.downloadRecoveryCodes": "Télécharger les codes de récupération en fichier texte",
  "setup.downloadRecoveryCodesDone": "Téléchargé",
  "setup.skipBackupTotp": "Ignorer — continuer sans app d’authentification",
  "setup.forgetWarn":
    "Si vous oubliez le mot de passe maître et perdez la passkey et les sauvegardes, le coffre est irrécupérable.",
  "setup.secretKey": "Clé secrète (saisie manuelle)",
  "setup.copyTotpSecret": "Copier la clé secrète pour l’app d’authentification",
  "setup.copyTotpSecretDone": "Copié",
  "setup.totpAuthenticatorHint":
    "Scannez le QR avec Google Authenticator, 1Password, Authy, etc. Sur Mac, utilisez une app d’authentification dédiée — Mots de passe Apple ne peut pas ajouter de codes de secours à une passkey.",
  "setup.totpCode": "Code à 6 chiffres de l’app",
  "setup.back": "Retour",
  "setup.confirmStart": "Confirmer et démarrer",
  "setup.errMin": "Le mot de passe maître doit contenir au moins 10 caractères.",
  "setup.errMismatch": "Les mots de passe ne correspondent pas.",
  "setup.errGeneric": "Une erreur s’est produite.",
};

const SETUP_PASSKEY_ERRORS_IT: Record<string, string> = {
  "errors.passkeyNotSupported":
    "Le passkey non sono supportate in questo browser. Usa Chrome, Safari o Edge su un dispositivo supportato.",
  "errors.passkeyRequired": "Registra una passkey prima di continuare.",
  "errors.passkeyNeedsSignIn": "Accedi con Google prima di registrare una passkey.",
};

export const SETUP_IT: Record<string, string> = {
  ...SETUP_PASSKEY_ERRORS_IT,
  "setup.pageTitle": "Configurazione",
  "setup.pageTitlePasskey": "Registra passkey",
  "setup.pageTitleBackupTotp": "Autenticatore di backup",
  "setup.pageTitleRecovery": "Codici di recupero",
  "setup.stepperAria": "Avanzamento configurazione",
  "setup.stepPassword": "Password principale",
  "setup.stepPasskey": "Passkey",
  "setup.stepBackupTotp": "Autenticatore",
  "setup.stepRecovery": "Codice di recupero",
  "setup.passkeyHelpTitle": "Cos’è una passkey?",
  "setup.passkeyHelpBody":
    "Una passkey usa l’hardware sicuro del dispositivo per dimostrare che sei tu — Touch ID, Face ID, impronta o PIN del dispositivo. La chiave privata non lascia mai il dispositivo; memorizziamo solo una chiave pubblica.\n\nPer sbloccare la cassaforte, approvi con biometria o PIN. Nessuna password principale o codici da digitare ogni giorno.",
  "setup.passkeyHelpGotIt": "Capito",
  "setup.backupTotpRecommend":
    "Consigliato per sicurezza — un backup se le passkey non sono disponibili su un dispositivo.",
  "setup.recoveryCalloutTitle": "Conserva questi codici in un luogo sicuro",
  "setup.recoveryCalloutBody":
    "Questi codici monouso sono separati dalla passkey e dall’app autenticatore. Se perdi il dispositivo, usane uno con la password principale. Ogni codice funziona una sola volta — conservali offline (gestore password o stampa).",
  "setup.title": "Configura My Password Vault",
  "setup.subtitle":
    "Dopo l’accesso, crea qui la cassaforte. La password principale non viene mai salvata su un server.",
  "setup.masterPw": "Password principale",
  "setup.masterPwConfirm": "Conferma password principale",
  "setup.placeholderMin": "Almeno 10 caratteri",
  "setup.autoLock": "Blocco automatico (minuti)",
  "setup.nextPasskey": "Avanti — registra passkey",
  "setup.nextRecovery": "Avanti — salva codici di recupero",
  "setup.passkeyIntro":
    "Attiva la passkey di questo dispositivo e continua. Si usa Touch ID o Face ID quando disponibile; il PIN del dispositivo è il fallback.",
  "setup.passkeyContinue": "Continua",
  "setup.passkeyRegistering": "Registrazione…",
  "setup.passkeyMethodsLoading": "Verifica opzioni disponibili…",
  "setup.passkeyMethodsHint":
    "Viene creata una passkey su questo dispositivo. Chiavi di sicurezza e altri dispositivi si possono aggiungere dopo in Impostazioni.",
  "setup.passkeyMethodAdded": "Aggiunto",
  "setup.passkeyPinIncluded":
    "Incluso automaticamente — usato quando la biometria non è disponibile su questo dispositivo.",
  "setup.passkeyPinIncludedBadge": "Incluso",
  "setup.passkeyMethodTouchId": "Touch ID",
  "setup.passkeyMethodFaceId": "Face ID",
  "setup.passkeyMethodFingerprint": "Impronta digitale",
  "setup.passkeyMethodBiometric": "Biometria",
  "setup.passkeyMethodWindowsHello": "Windows Hello",
  "setup.passkeyMethodPin": "PIN dispositivo",
  "setup.passkeyUnsupported":
    "Le passkey non sono disponibili in questo browser. Usa Chrome, Safari o Edge su un dispositivo supportato.",
  "setup.backupTotpIntro":
    "Scansiona il codice QR con Google Authenticator, 1Password, Authy o simili. Poi inserisci il codice a 6 cifre per confermare.",
  "setup.recoveryIntro":
    "Copia o scarica i codici sotto, poi spunta la casella per confermare di averli salvati.",
  "setup.recoveryAck": "Ho salvato questi codici di recupero in un luogo sicuro.",
  "setup.copyRecoveryCodes": "Copia tutti i codici di recupero",
  "setup.copyRecoveryCodesDone": "Copiato",
  "setup.downloadRecoveryCodes": "Scarica codici di recupero come file di testo",
  "setup.downloadRecoveryCodesDone": "Scaricato",
  "setup.skipBackupTotp": "Salta — continua senza app autenticatore",
  "setup.forgetWarn":
    "Se dimentichi la password principale e perdi passkey e backup, la cassaforte non è recuperabile.",
  "setup.secretKey": "Chiave segreta (inserimento manuale)",
  "setup.copyTotpSecret": "Copia chiave segreta per app autenticatore",
  "setup.copyTotpSecretDone": "Copiato",
  "setup.totpAuthenticatorHint":
    "Scansiona il QR con Google Authenticator, 1Password, Authy o simili. Su Mac usa un’app autenticatore dedicata — Password Apple non può aggiungere codici di backup a una passkey.",
  "setup.totpCode": "Codice a 6 cifre dall’app",
  "setup.back": "Indietro",
  "setup.confirmStart": "Conferma e avvia",
  "setup.errMin": "La password principale deve avere almeno 10 caratteri.",
  "setup.errMismatch": "Le password non coincidono.",
  "setup.errGeneric": "Si è verificato un errore.",
};

const SETUP_PASSKEY_ERRORS_CN: Record<string, string> = {
  "errors.passkeyNotSupported": "此浏览器不支持通行密钥。请在支持的设备上使用 Chrome、Safari 或 Edge。",
  "errors.passkeyRequired": "请先注册通行密钥再继续。",
  "errors.passkeyNeedsSignIn": "注册通行密钥前请先用 Google 登录。",
};

export const SETUP_CN: Record<string, string> = {
  ...SETUP_PASSKEY_ERRORS_CN,
  "setup.pageTitle": "设置",
  "setup.pageTitlePasskey": "注册通行密钥",
  "setup.pageTitleBackupTotp": "备用验证器",
  "setup.pageTitleRecovery": "恢复代码",
  "setup.stepperAria": "设置进度",
  "setup.stepPassword": "主密码",
  "setup.stepPasskey": "通行密钥",
  "setup.stepBackupTotp": "验证器",
  "setup.stepRecovery": "恢复代码",
  "setup.passkeyHelpTitle": "什么是通行密钥？",
  "setup.passkeyHelpBody":
    "通行密钥使用设备的安全芯片证明您的身份 — Touch ID、Face ID、指纹或设备 PIN。私钥不会离开设备；我们只存储公钥。\n\n解锁保险库时，通过生物识别或 PIN 确认即可。无需每天输入主密码或验证码。",
  "setup.passkeyHelpGotIt": "知道了",
  "setup.backupTotpRecommend": "建议设置 — 当设备无法使用通行密钥时的备用方式。",
  "setup.recoveryCalloutTitle": "请将这些代码保存在安全的地方",
  "setup.recoveryCalloutBody":
    "这些一次性代码与通行密钥和验证器应用分开提供。若丢失设备，可与主密码一起用于登录。每个代码仅可使用一次 — 请离线保存（密码管理器或打印件）。",
  "setup.title": "设置 My Password Vault",
  "setup.subtitle": "登录后在此创建保险库。主密码绝不会保存在任何服务器上。",
  "setup.masterPw": "主密码",
  "setup.masterPwConfirm": "确认主密码",
  "setup.placeholderMin": "至少 10 个字符",
  "setup.autoLock": "自动锁定（分钟）",
  "setup.nextPasskey": "下一步 — 注册通行密钥",
  "setup.nextRecovery": "下一步 — 保存恢复代码",
  "setup.passkeyIntro":
    "开启本设备的通行密钥后继续。优先使用 Touch ID 或 Face ID；不可用时使用设备 PIN。",
  "setup.passkeyContinue": "继续",
  "setup.passkeyRegistering": "正在注册…",
  "setup.passkeyMethodsLoading": "正在检查可用选项…",
  "setup.passkeyMethodsHint": "将在本设备上创建一个通行密钥。安全密钥和其他设备可稍后在设置中添加。",
  "setup.passkeyMethodAdded": "已添加",
  "setup.passkeyPinIncluded": "自动包含 — 在本设备无法使用生物识别时使用。",
  "setup.passkeyPinIncludedBadge": "已包含",
  "setup.passkeyMethodTouchId": "Touch ID",
  "setup.passkeyMethodFaceId": "Face ID",
  "setup.passkeyMethodFingerprint": "指纹",
  "setup.passkeyMethodBiometric": "生物识别",
  "setup.passkeyMethodWindowsHello": "Windows Hello",
  "setup.passkeyMethodPin": "设备 PIN",
  "setup.passkeyUnsupported": "此浏览器无法使用通行密钥。请在支持的设备上使用 Chrome、Safari 或 Edge。",
  "setup.backupTotpIntro":
    "使用 Google 身份验证器、1Password、Authy 等扫描二维码，然后输入 6 位验证码确认。",
  "setup.recoveryIntro": "复制或下载下方代码，然后勾选确认已保存。",
  "setup.recoveryAck": "我已将这些恢复代码保存在安全的地方。",
  "setup.copyRecoveryCodes": "复制全部恢复代码",
  "setup.copyRecoveryCodesDone": "已复制",
  "setup.downloadRecoveryCodes": "将恢复代码下载为文本文件",
  "setup.downloadRecoveryCodesDone": "已下载",
  "setup.skipBackupTotp": "跳过 — 不使用验证器应用继续",
  "setup.forgetWarn": "若忘记主密码并丢失通行密钥和备份，保险库将无法恢复。",
  "setup.secretKey": "密钥（手动输入）",
  "setup.copyTotpSecret": "复制验证器应用用的密钥",
  "setup.copyTotpSecretDone": "已复制",
  "setup.totpAuthenticatorHint":
    "使用 Google 身份验证器、1Password、Authy 等扫描二维码。在 Mac 上请使用专用验证器应用 — Apple 密码无法为通行密钥条目添加备用代码。",
  "setup.totpCode": "应用中的 6 位验证码",
  "setup.back": "返回",
  "setup.confirmStart": "确认并开始",
  "setup.errMin": "主密码至少需要 10 个字符。",
  "setup.errMismatch": "两次输入的密码不一致。",
  "setup.errGeneric": "发生错误。",
};

const SETUP_PASSKEY_ERRORS_JP: Record<string, string> = {
  "errors.passkeyNotSupported":
    "このブラウザではパスキーを利用できません。対応デバイスで Chrome、Safari、Edge をお使いください。",
  "errors.passkeyRequired": "続行する前にパスキーを登録してください。",
  "errors.passkeyNeedsSignIn": "パスキーを登録する前に Google でログインしてください。",
};

export const SETUP_JP: Record<string, string> = {
  ...SETUP_PASSKEY_ERRORS_JP,
  "setup.pageTitle": "セットアップ",
  "setup.pageTitlePasskey": "パスキーを登録",
  "setup.pageTitleBackupTotp": "バックアップ認証アプリ",
  "setup.pageTitleRecovery": "リカバリーコード",
  "setup.stepperAria": "セットアップの進行状況",
  "setup.stepPassword": "マスターパスワード",
  "setup.stepPasskey": "パスキー",
  "setup.stepBackupTotp": "認証アプリ",
  "setup.stepRecovery": "リカバリーコード",
  "setup.passkeyHelpTitle": "パスキーとは？",
  "setup.passkeyHelpBody":
    "パスキーはデバイスのセキュリティチップで本人確認を行います — Touch ID、Face ID、指紋、またはデバイス PIN。秘密鍵はデバイス外に出ず、公開鍵のみ保存します。\n\nボールトのロック解除時は生体認証または PIN で承認します。毎日マスターパスワードや OTP を入力する必要はありません。",
  "setup.passkeyHelpGotIt": "了解",
  "setup.backupTotpRecommend":
    "安全のため推奨 — パスキーが使えないデバイス用のバックアップです。",
  "setup.recoveryCalloutTitle": "これらのコードを安全な場所に保管してください",
  "setup.recoveryCalloutBody":
    "以下の使い捨てコードはパスキー・認証アプリとは別に提供されます。デバイスを紛失した場合、マスターパスワードと併用してサインインできます。各コードは1回のみ — オフライン（パスワードマネージャーまたは印刷）で保管してください。",
  "setup.title": "My Password Vault のセットアップ",
  "setup.subtitle":
    "サインイン後、ここで新しいボールトを作成します。マスターパスワードはサーバーに保存されません。",
  "setup.masterPw": "マスターパスワード",
  "setup.masterPwConfirm": "マスターパスワード（確認）",
  "setup.placeholderMin": "10 文字以上",
  "setup.autoLock": "自動ロック（分）",
  "setup.nextPasskey": "次へ — パスキーを登録",
  "setup.nextRecovery": "次へ — リカバリーコードを保存",
  "setup.passkeyIntro":
    "このデバイスのパスキーをオンにして続行します。Touch ID / Face ID を優先し、利用できない場合はデバイス PIN を使用します。",
  "setup.passkeyContinue": "続行",
  "setup.passkeyRegistering": "登録中…",
  "setup.passkeyMethodsLoading": "利用可能なオプションを確認中…",
  "setup.passkeyMethodsHint":
    "このデバイスにパスキーを1つ作成します。セキュリティキーや他のデバイスは後から設定で追加できます。",
  "setup.passkeyMethodAdded": "登録済み",
  "setup.passkeyPinIncluded": "自動で含まれます — このデバイスで生体認証が使えない場合に使用します。",
  "setup.passkeyPinIncludedBadge": "含む",
  "setup.passkeyMethodTouchId": "Touch ID",
  "setup.passkeyMethodFaceId": "Face ID",
  "setup.passkeyMethodFingerprint": "指紋",
  "setup.passkeyMethodBiometric": "生体認証",
  "setup.passkeyMethodWindowsHello": "Windows Hello",
  "setup.passkeyMethodPin": "デバイス PIN",
  "setup.passkeyUnsupported":
    "このブラウザではパスキーを利用できません。対応デバイスで Chrome、Safari、Edge をお使いください。",
  "setup.backupTotpIntro":
    "Google Authenticator、1Password、Authy などで QR をスキャンし、6 桁のコードを入力して確認してください。",
  "setup.recoveryIntro":
    "下のコードをコピーまたはダウンロードし、保存したことを確認するチェックを入れてください。",
  "setup.recoveryAck": "リカバリーコードを安全な場所に保存しました。",
  "setup.copyRecoveryCodes": "リカバリーコードをすべてコピー",
  "setup.copyRecoveryCodesDone": "コピーしました",
  "setup.downloadRecoveryCodes": "リカバリーコードをテキストファイルでダウンロード",
  "setup.downloadRecoveryCodesDone": "ダウンロードしました",
  "setup.skipBackupTotp": "スキップ — 認証アプリなしで続行",
  "setup.forgetWarn":
    "マスターパスワードを忘れ、パスキーとバックアップを失った場合、ボールトは復元できません。",
  "setup.secretKey": "秘密鍵（手入力用）",
  "setup.copyTotpSecret": "認証アプリ用の秘密鍵をコピー",
  "setup.copyTotpSecretDone": "コピーしました",
  "setup.totpAuthenticatorHint":
    "Google Authenticator、1Password、Authy などで QR をスキャンしてください。Mac では専用の認証アプリを使用 — Apple のパスワードではパスキーにバックアップコードを追加できません。",
  "setup.totpCode": "アプリに表示される 6 桁のコード",
  "setup.back": "戻る",
  "setup.confirmStart": "確認して開始",
  "setup.errMin": "マスターパスワードは 10 文字以上にしてください。",
  "setup.errMismatch": "パスワードが一致しません。",
  "setup.errGeneric": "エラーが発生しました。",
};

const SETUP_PASSKEY_ERRORS_ID: Record<string, string> = {
  "errors.passkeyNotSupported":
    "Passkey tidak didukung di browser ini. Gunakan Chrome, Safari, atau Edge di perangkat yang didukung.",
  "errors.passkeyRequired": "Daftarkan passkey sebelum melanjutkan.",
  "errors.passkeyNeedsSignIn": "Masuk dengan Google sebelum mendaftarkan passkey.",
};

export const SETUP_ID: Record<string, string> = {
  ...SETUP_PASSKEY_ERRORS_ID,
  "setup.pageTitle": "Penyiapan",
  "setup.pageTitlePasskey": "Daftarkan passkey",
  "setup.pageTitleBackupTotp": "Autentikator cadangan",
  "setup.pageTitleRecovery": "Kode pemulihan",
  "setup.stepperAria": "Kemajuan penyiapan",
  "setup.stepPassword": "Kata sandi utama",
  "setup.stepPasskey": "Passkey",
  "setup.stepBackupTotp": "Autentikator",
  "setup.stepRecovery": "Kode pemulihan",
  "setup.passkeyHelpTitle": "Apa itu passkey?",
  "setup.passkeyHelpBody":
    "Passkey menggunakan perangkat keras aman perangkat untuk membuktikan identitas Anda — Touch ID, Face ID, sidik jari, atau PIN perangkat. Kunci privat tidak pernah meninggalkan perangkat; kami hanya menyimpan kunci publik.\n\nSaat membuka brankas, Anda menyetujui dengan biometrik atau PIN. Tidak perlu mengetik kata sandi utama atau kode setiap hari.",
  "setup.passkeyHelpGotIt": "Mengerti",
  "setup.backupTotpRecommend":
    "Disarankan untuk keamanan — cadangan jika passkey tidak tersedia di suatu perangkat.",
  "setup.recoveryCalloutTitle": "Simpan kode ini di tempat yang aman",
  "setup.recoveryCalloutBody":
    "Kode sekali pakai ini terpisah dari passkey dan aplikasi autentikator. Jika kehilangan perangkat, gunakan dengan kata sandi utama untuk masuk. Setiap kode hanya berlaku sekali — simpan offline (pengelola kata sandi atau cetakan).",
  "setup.title": "Siapkan My Password Vault",
  "setup.subtitle":
    "Setelah masuk, buat brankas Anda di sini. Kata sandi utama tidak pernah disimpan di server mana pun.",
  "setup.masterPw": "Kata sandi utama",
  "setup.masterPwConfirm": "Konfirmasi kata sandi utama",
  "setup.placeholderMin": "Minimal 10 karakter",
  "setup.autoLock": "Kunci otomatis (menit)",
  "setup.nextPasskey": "Berikutnya — daftarkan passkey",
  "setup.nextRecovery": "Berikutnya — simpan kode pemulihan",
  "setup.passkeyIntro":
    "Aktifkan passkey perangkat ini lalu lanjutkan. Touch ID atau Face ID digunakan jika tersedia; PIN perangkat sebagai cadangan.",
  "setup.passkeyContinue": "Lanjutkan",
  "setup.passkeyRegistering": "Mendaftarkan…",
  "setup.passkeyMethodsLoading": "Memeriksa opsi yang tersedia…",
  "setup.passkeyMethodsHint":
    "Satu passkey dibuat di perangkat ini. Kunci keamanan dan perangkat lain dapat ditambahkan nanti di Pengaturan.",
  "setup.passkeyMethodAdded": "Ditambahkan",
  "setup.passkeyPinIncluded":
    "Termasuk otomatis — digunakan saat biometrik tidak tersedia di perangkat ini.",
  "setup.passkeyPinIncludedBadge": "Termasuk",
  "setup.passkeyMethodTouchId": "Touch ID",
  "setup.passkeyMethodFaceId": "Face ID",
  "setup.passkeyMethodFingerprint": "Sidik jari",
  "setup.passkeyMethodBiometric": "Biometrik",
  "setup.passkeyMethodWindowsHello": "Windows Hello",
  "setup.passkeyMethodPin": "PIN perangkat",
  "setup.passkeyUnsupported":
    "Passkey tidak tersedia di browser ini. Gunakan Chrome, Safari, atau Edge di perangkat yang didukung.",
  "setup.backupTotpIntro":
    "Pindai kode QR dengan Google Authenticator, 1Password, Authy, atau sejenisnya. Lalu masukkan kode 6 digit untuk konfirmasi.",
  "setup.recoveryIntro":
    "Salin atau unduh kode di bawah, lalu centang untuk mengonfirmasi bahwa Anda telah menyimpannya.",
  "setup.recoveryAck": "Saya telah menyimpan kode pemulihan ini di tempat yang aman.",
  "setup.copyRecoveryCodes": "Salin semua kode pemulihan",
  "setup.copyRecoveryCodesDone": "Disalin",
  "setup.downloadRecoveryCodes": "Unduh kode pemulihan sebagai file teks",
  "setup.downloadRecoveryCodesDone": "Diunduh",
  "setup.skipBackupTotp": "Lewati — lanjutkan tanpa aplikasi autentikator",
  "setup.forgetWarn":
    "Jika Anda lupa kata sandi utama dan kehilangan passkey serta cadangan, brankas tidak dapat dipulihkan.",
  "setup.secretKey": "Kunci rahasia (input manual)",
  "setup.copyTotpSecret": "Salin kunci rahasia untuk aplikasi autentikator",
  "setup.copyTotpSecretDone": "Disalin",
  "setup.totpAuthenticatorHint":
    "Pindai QR dengan Google Authenticator, 1Password, Authy, atau sejenisnya. Di Mac gunakan aplikasi autentikator khusus — Kata Sandi Apple tidak dapat menambahkan kode cadangan ke entri passkey.",
  "setup.totpCode": "Kode 6 digit dari aplikasi",
  "setup.back": "Kembali",
  "setup.confirmStart": "Konfirmasi dan mulai",
  "setup.errMin": "Kata sandi utama minimal 10 karakter.",
  "setup.errMismatch": "Kata sandi tidak cocok.",
  "setup.errGeneric": "Terjadi kesalahan.",
};
