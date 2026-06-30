/**
 * Sign-in / sign-up / forgot-password strings for locales that otherwise spread English.
 */

const AUTH_COMMON = {
  emailPlaceholder: "you@example.com",
} as const;

export const AUTH_ES: Record<string, string> = {
  "legal.privacyPolicy": "Política de privacidad",
  "legal.termsOfUse": "Términos de uso",
  "app.authLoading": "Comprobando tu sesión…",
  "auth.title": "Hola de nuevo",
  "auth.titleSignUp": "Crear cuenta",
  "auth.titleForgot": "¿Olvidaste tu contraseña?",
  "auth.titleNewPassword": "Nueva contraseña",
  "auth.subtitleSignUp": "Crea una cuenta nueva",
  "auth.subtitleForgot":
    "Introduce tu correo y te enviaremos un código para restablecer la contraseña",
  "auth.subtitleNewPassword": "Elige una contraseña nueva para tu cuenta",
  "auth.brandHomeAria": "Ir a la página de inicio",
  "auth.subtitle": "Inicia sesión en tu cuenta",
  "auth.google": "Continuar con Google",
  "auth.apple": "Continuar con Apple",
  "auth.lastUsed": "USADO RECIENTEMENTE",
  "auth.or": "o",
  "auth.email": "Correo electrónico",
  "auth.emailPlaceholder": AUTH_COMMON.emailPlaceholder,
  "auth.password": "Contraseña",
  "auth.passwordConfirm": "Confirmar contraseña",
  "auth.forgotPassword": "¿Olvidaste tu contraseña?",
  "auth.signIn": "Iniciar sesión",
  "auth.signUp": "Registrarse",
  "auth.sendResetLink": "Enviar código de restablecimiento",
  "auth.saveNewPassword": "Guardar contraseña",
  "auth.noAccount": "¿No tienes cuenta?",
  "auth.hasAccount": "¿Ya tienes cuenta?",
  "auth.switchSignUp": "Registrarse",
  "auth.switchSignIn": "Iniciar sesión",
  "auth.resetSent":
    "Si existe una cuenta con ese correo, te hemos enviado un enlace para restablecer la contraseña. Revisa la bandeja de entrada y el spam.",
  "auth.checkEmailConfirm":
    "Revisa tu correo para confirmar la cuenta y luego inicia sesión.",
  "auth.errInvalidCredentials": "Correo o contraseña incorrectos.",
  "auth.errEmailTaken": "Ya existe una cuenta con este correo. Prueba a iniciar sesión.",
  "auth.errWeakPassword": "La contraseña debe tener al menos 6 caracteres.",
  "auth.errResetSend": "No se pudo enviar el correo de restablecimiento. Inténtalo más tarde.",
  "auth.errResetNotDeployed":
    "El correo de restablecimiento aún no está configurado. Despliega la función send-password-reset y los secretos de Resend (consulta docs/auth-email-resend.md).",
  "auth.errRecoverySession":
    "El enlace ha caducado o se perdió la sesión. Solicita un nuevo correo de restablecimiento y abre el enlace más reciente en el mismo navegador.",
  "auth.errPasswordMismatch": "Las contraseñas no coinciden.",
  "auth.termsNotice":
    "Al continuar, aceptas los __TERMS__ y la __PRIVACY__ de MyPasswordVault.",
  "auth.oauthHostWarning":
    "Esta compilación usa {{host}} para iniciar sesión con Google. Configura VITE_SUPABASE_URL como https://auth.mypasswordvault.app en Vercel (o en .env local) y vuelve a desplegar o reinicia npm run dev.",
  "auth.errGeneric": "Algo salió mal. Inténtalo de nuevo.",
  "auth.notConfiguredTitle": "Supabase no está configurado",
  "auth.notConfiguredBody":
    "Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en un archivo .env en la raíz del proyecto y reinicia el servidor de desarrollo. Consulta README.md para crear la tabla y activar el inicio de sesión con Google.",
  "auth.faqIosSyncQ": "¿Cómo sincronizo la app iOS con mi caja fuerte web?",
  "auth.faqIosSyncA":
    "La sync en la nube va ligada a tu <strong>cuenta de inicio de sesión</strong>, no al dispositivo. En iOS, si usas <strong>Continuar con Apple</strong> y quieres la misma caja fuerte que en la web, debes elegir <strong>Compartir mi correo</strong> cuando Apple pregunte—<strong>no Ocultar mi correo</strong>. Ocultar mi correo crea una dirección relay y una <strong>cuenta separada</strong> que no coincide con una caja fuerte web iniciada con Google o tu correo habitual. Lo más fácil si ya usas la web: pulsa <strong>Continuar con Google</strong> en iOS con el <strong>mismo correo</strong>. Si prefieres Apple en iOS, elige Compartir mi correo. ¿Ya elegiste Ocultar mi correo? Desactiva My Password Vault en Ajustes → Apple ID → iCloud → Ocultar mi correo (o en appleid.apple.com), cierra sesión en la app e inicia de nuevo.",
};

export const AUTH_DE: Record<string, string> = {
  "legal.privacyPolicy": "Datenschutzerklärung",
  "legal.termsOfUse": "Nutzungsbedingungen",
  "app.authLoading": "Sitzung wird geprüft…",
  "auth.title": "Willkommen zurück",
  "auth.titleSignUp": "Konto erstellen",
  "auth.titleForgot": "Passwort vergessen?",
  "auth.titleNewPassword": "Neues Passwort",
  "auth.subtitleSignUp": "Neues Konto anlegen",
  "auth.subtitleForgot":
    "Gib deine E-Mail ein — wir senden dir einen Code zum Zurücksetzen des Passworts",
  "auth.subtitleNewPassword": "Wähle ein neues Passwort für dein Konto",
  "auth.brandHomeAria": "Zur Startseite",
  "auth.subtitle": "Melde dich in deinem Konto an",
  "auth.google": "Mit Google fortfahren",
  "auth.apple": "Mit Apple fortfahren",
  "auth.lastUsed": "ZULETZT GENUTZT",
  "auth.or": "oder",
  "auth.email": "E-Mail",
  "auth.emailPlaceholder": AUTH_COMMON.emailPlaceholder,
  "auth.password": "Passwort",
  "auth.passwordConfirm": "Passwort bestätigen",
  "auth.forgotPassword": "Passwort vergessen?",
  "auth.signIn": "Anmelden",
  "auth.signUp": "Registrieren",
  "auth.sendResetLink": "Code zum Zurücksetzen senden",
  "auth.saveNewPassword": "Passwort speichern",
  "auth.noAccount": "Noch kein Konto?",
  "auth.hasAccount": "Bereits ein Konto?",
  "auth.switchSignUp": "Registrieren",
  "auth.switchSignIn": "Anmelden",
  "auth.resetSent":
    "Wenn es ein Konto mit dieser E-Mail gibt, haben wir einen Link zum Zurücksetzen gesendet. Prüfe Posteingang und Spam.",
  "auth.checkEmailConfirm":
    "Bestätige deine E-Mail, um das Konto zu aktivieren, und melde dich dann an.",
  "auth.errInvalidCredentials": "E-Mail oder Passwort ist falsch.",
  "auth.errEmailTaken": "Diese E-Mail ist bereits registriert. Bitte anmelden.",
  "auth.errWeakPassword": "Das Passwort muss mindestens 6 Zeichen haben.",
  "auth.errResetSend": "Die E-Mail zum Zurücksetzen konnte nicht gesendet werden. Versuche es später erneut.",
  "auth.errResetNotDeployed":
    "Passwort-zurücksetzen per E-Mail ist noch nicht eingerichtet. Edge Function send-password-reset und Resend-Secrets deployen (siehe docs/auth-email-resend.md).",
  "auth.errRecoverySession":
    "Der Link ist abgelaufen oder die Sitzung fehlt. Fordere eine neue E-Mail an und öffne den neuesten Link im selben Browser.",
  "auth.errPasswordMismatch": "Die Passwörter stimmen nicht überein.",
  "auth.termsNotice":
    "Mit dem Fortfahren akzeptierst du die __TERMS__ und __PRIVACY__ von MyPasswordVault.",
  "auth.oauthHostWarning":
    "Dieser Build nutzt {{host}} für Google-Anmeldung. Setze VITE_SUPABASE_URL auf https://auth.mypasswordvault.app in Vercel (oder lokal in .env) und deploye neu oder starte npm run dev neu.",
  "auth.errGeneric": "Etwas ist schiefgelaufen. Bitte erneut versuchen.",
  "auth.notConfiguredTitle": "Supabase ist nicht konfiguriert",
  "auth.notConfiguredBody":
    "Trage VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in eine .env-Datei im Projektroot ein und starte den Dev-Server neu. Siehe README.md für Datenbanktabelle und Google-Anmeldung.",
  "auth.faqIosSyncQ": "iOS-App mit Web-Tresor synchronisieren?",
  "auth.faqIosSyncA":
    "Cloud-Sync hängt am <strong>Anmeldekonto</strong>, nicht am Gerät. Nutzen Sie auf iOS <strong>Mit Apple fortfahren</strong> und wollen denselben Tresor wie im Web, wählen Sie bei Apple <strong>E-Mail teilen</strong>—<strong>nicht E-Mail verbergen</strong>. Verbergen erzeugt eine Relay-Adresse und ein <strong>separates Konto</strong>, das nicht zum Web-Tresor mit Google oder Ihrer normalen E-Mail passt. Am einfachsten, wenn Sie das Web schon nutzen: auf iOS <strong>Mit Google fortfahren</strong> mit derselben E-Mail. Bevorzugen Sie Apple, wählen Sie E-Mail teilen. Bereits verborgen? My Password Vault unter Einstellungen → Apple-ID → iCloud → E-Mail verbergen (oder appleid.apple.com) trennen, abmelden und erneut anmelden.",
};

export const AUTH_FR: Record<string, string> = {
  "legal.privacyPolicy": "Politique de confidentialité",
  "legal.termsOfUse": "Conditions d'utilisation",
  "app.authLoading": "Vérification de la session…",
  "auth.title": "Bon retour",
  "auth.titleSignUp": "Créer un compte",
  "auth.titleForgot": "Mot de passe oublié ?",
  "auth.titleNewPassword": "Nouveau mot de passe",
  "auth.subtitleSignUp": "Créer un nouveau compte",
  "auth.subtitleForgot":
    "Saisissez votre e-mail — nous vous enverrons un code pour réinitialiser le mot de passe",
  "auth.subtitleNewPassword": "Choisissez un nouveau mot de passe pour votre compte",
  "auth.brandHomeAria": "Aller à la page d'accueil",
  "auth.subtitle": "Connectez-vous à votre compte",
  "auth.google": "Continuer avec Google",
  "auth.apple": "Continuer avec Apple",
  "auth.lastUsed": "UTILISÉ RÉCEMMENT",
  "auth.or": "ou",
  "auth.email": "E-mail",
  "auth.emailPlaceholder": AUTH_COMMON.emailPlaceholder,
  "auth.password": "Mot de passe",
  "auth.passwordConfirm": "Confirmer le mot de passe",
  "auth.forgotPassword": "Mot de passe oublié ?",
  "auth.signIn": "Se connecter",
  "auth.signUp": "S'inscrire",
  "auth.sendResetLink": "Envoyer le code de réinitialisation",
  "auth.saveNewPassword": "Enregistrer le mot de passe",
  "auth.noAccount": "Pas encore de compte ?",
  "auth.hasAccount": "Vous avez déjà un compte ?",
  "auth.switchSignUp": "S'inscrire",
  "auth.switchSignIn": "Se connecter",
  "auth.resetSent":
    "Si un compte existe pour cet e-mail, nous avons envoyé un lien de réinitialisation. Vérifiez la boîte de réception et les spams.",
  "auth.checkEmailConfirm":
    "Confirmez votre e-mail pour activer le compte, puis connectez-vous.",
  "auth.errInvalidCredentials": "E-mail ou mot de passe incorrect.",
  "auth.errEmailTaken": "Un compte existe déjà avec cet e-mail. Essayez de vous connecter.",
  "auth.errWeakPassword": "Le mot de passe doit contenir au moins 6 caractères.",
  "auth.errResetSend": "Impossible d'envoyer l'e-mail de réinitialisation. Réessayez plus tard.",
  "auth.errResetNotDeployed":
    "L'e-mail de réinitialisation n'est pas encore configuré. Déployez la fonction send-password-reset et les secrets Resend (voir docs/auth-email-resend.md).",
  "auth.errRecoverySession":
    "Le lien a expiré ou la session est perdue. Demandez un nouvel e-mail et ouvrez le lien le plus récent dans le même navigateur.",
  "auth.errPasswordMismatch": "Les mots de passe ne correspondent pas.",
  "auth.termsNotice":
    "En continuant, vous acceptez les __TERMS__ et la __PRIVACY__ de MyPasswordVault.",
  "auth.oauthHostWarning":
    "Cette version utilise {{host}} pour la connexion Google. Définissez VITE_SUPABASE_URL sur https://auth.mypasswordvault.app dans Vercel (ou en local dans .env), puis redéployez ou relancez npm run dev.",
  "auth.errGeneric": "Une erreur s'est produite. Réessayez.",
  "auth.notConfiguredTitle": "Supabase n'est pas configuré",
  "auth.notConfiguredBody":
    "Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans un fichier .env à la racine du projet, puis redémarrez le serveur de développement. Voir README.md pour la table et la connexion Google.",
  "auth.faqIosSyncQ": "Synchroniser l'app iOS avec le coffre web ?",
  "auth.faqIosSyncA":
    "La sync cloud est liée au <strong>compte de connexion</strong>, pas à l'appareil. Sur iOS, si vous utilisez <strong>Continuer avec Apple</strong> et voulez le même coffre que sur le web, choisissez <strong>Partager mon e-mail</strong>—<strong>pas Masquer mon e-mail</strong>. Masquer crée une adresse relais et un <strong>compte séparé</strong>, incompatible avec un coffre web connecté via Google ou votre e-mail habituel. Le plus simple si vous utilisez déjà le web : <strong>Continuer avec Google</strong> sur iOS avec le <strong>même e-mail</strong>. Si vous préférez Apple, choisissez Partager mon e-mail. Déjà masqué ? Désactivez My Password Vault dans Réglages → Apple ID → iCloud → Masquer mon e-mail (ou appleid.apple.com), déconnectez-vous et reconnectez-vous.",
};

export const AUTH_IT: Record<string, string> = {
  "legal.privacyPolicy": "Informativa sulla privacy",
  "legal.termsOfUse": "Termini di utilizzo",
  "app.authLoading": "Verifica della sessione…",
  "auth.title": "Bentornato",
  "auth.titleSignUp": "Crea account",
  "auth.titleForgot": "Password dimenticata?",
  "auth.titleNewPassword": "Nuova password",
  "auth.subtitleSignUp": "Crea un nuovo account",
  "auth.subtitleForgot":
    "Inserisci la tua e-mail — ti invieremo un codice per reimpostare la password",
  "auth.subtitleNewPassword": "Scegli una nuova password per il tuo account",
  "auth.brandHomeAria": "Vai alla home page",
  "auth.subtitle": "Accedi al tuo account",
  "auth.google": "Continua con Google",
  "auth.apple": "Continua con Apple",
  "auth.lastUsed": "USATO DI RECENTE",
  "auth.or": "oppure",
  "auth.email": "E-mail",
  "auth.emailPlaceholder": AUTH_COMMON.emailPlaceholder,
  "auth.password": "Password",
  "auth.passwordConfirm": "Conferma password",
  "auth.forgotPassword": "Password dimenticata?",
  "auth.signIn": "Accedi",
  "auth.signUp": "Registrati",
  "auth.sendResetLink": "Invia codice di reimpostazione",
  "auth.saveNewPassword": "Salva password",
  "auth.noAccount": "Non hai un account?",
  "auth.hasAccount": "Hai già un account?",
  "auth.switchSignUp": "Registrati",
  "auth.switchSignIn": "Accedi",
  "auth.resetSent":
    "Se esiste un account con questa e-mail, abbiamo inviato un link per reimpostare la password. Controlla posta in arrivo e spam.",
  "auth.checkEmailConfirm":
    "Conferma l'e-mail per attivare l'account, poi accedi.",
  "auth.errInvalidCredentials": "E-mail o password non validi.",
  "auth.errEmailTaken": "Esiste già un account con questa e-mail. Prova ad accedere.",
  "auth.errWeakPassword": "La password deve avere almeno 6 caratteri.",
  "auth.errResetSend": "Impossibile inviare l'e-mail di reimpostazione. Riprova più tardi.",
  "auth.errResetNotDeployed":
    "L'e-mail di reimpostazione non è ancora configurata. Distribuisci la funzione send-password-reset e i secret Resend (vedi docs/auth-email-resend.md).",
  "auth.errRecoverySession":
    "Il link è scaduto o la sessione è andata persa. Richiedi una nuova e-mail e apri il link più recente nello stesso browser.",
  "auth.errPasswordMismatch": "Le password non coincidono.",
  "auth.termsNotice":
    "Continuando, accetti i __TERMS__ e la __PRIVACY__ di MyPasswordVault.",
  "auth.oauthHostWarning":
    "Questa build usa {{host}} per l'accesso con Google. Imposta VITE_SUPABASE_URL su https://auth.mypasswordvault.app in Vercel (o in .env locale), poi ridistribuisci o riavvia npm run dev.",
  "auth.errGeneric": "Qualcosa è andato storto. Riprova.",
  "auth.notConfiguredTitle": "Supabase non è configurato",
  "auth.notConfiguredBody":
    "Aggiungi VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in un file .env nella root del progetto e riavvia il server di sviluppo. Vedi README.md per la tabella e l'accesso con Google.",
  "auth.faqIosSyncQ": "Sincronizzare l'app iOS con il vault web?",
  "auth.faqIosSyncA":
    "La sync cloud è legata all'<strong>account di accesso</strong>, non al dispositivo. Su iOS, se usi <strong>Continua con Apple</strong> e vuoi lo stesso vault del web, scegli <strong>Condividi la mia e-mail</strong>—<strong>non Nascondi la mia e-mail</strong>. Nascondi crea un indirizzo relay e un <strong>account separato</strong>, non allineato al vault web con Google o la tua e-mail abituale. Più semplice se usi già il web: <strong>Continua con Google</strong> su iOS con la <strong>stessa e-mail</strong>. Se preferisci Apple, scegli Condividi. Già scelto Nascondi? Disattiva My Password Vault in Impostazioni → ID Apple → iCloud → Nascondi e-mail (o appleid.apple.com), esci e accedi di nuovo.",
};

export const AUTH_CN: Record<string, string> = {
  "legal.privacyPolicy": "隐私政策",
  "legal.termsOfUse": "使用条款",
  "app.authLoading": "正在检查登录状态…",
  "auth.title": "欢迎回来",
  "auth.titleSignUp": "注册账号",
  "auth.titleForgot": "忘记密码？",
  "auth.titleNewPassword": "设置新密码",
  "auth.subtitleSignUp": "创建新账号",
  "auth.subtitleForgot": "输入邮箱，我们将发送重置密码的验证码",
  "auth.subtitleNewPassword": "为账号设置一个新密码",
  "auth.brandHomeAria": "前往首页",
  "auth.subtitle": "登录你的账号",
  "auth.google": "使用 Google 继续",
  "auth.apple": "通过 Apple 继续",
  "auth.lastUsed": "最近使用",
  "auth.or": "或",
  "auth.email": "电子邮箱",
  "auth.emailPlaceholder": AUTH_COMMON.emailPlaceholder,
  "auth.password": "密码",
  "auth.passwordConfirm": "确认密码",
  "auth.forgotPassword": "忘记密码？",
  "auth.signIn": "登录",
  "auth.signUp": "注册",
  "auth.sendResetLink": "发送重置验证码",
  "auth.saveNewPassword": "保存新密码",
  "auth.noAccount": "还没有账号？",
  "auth.hasAccount": "已有账号？",
  "auth.switchSignUp": "注册",
  "auth.switchSignIn": "登录",
  "auth.resetSent":
    "如果该邮箱已注册，我们已发送密码重置链接。请查看收件箱和垃圾邮件。",
  "auth.checkEmailConfirm": "请查收邮件完成账号验证后再登录。",
  "auth.errInvalidCredentials": "邮箱或密码不正确。",
  "auth.errEmailTaken": "该邮箱已注册，请尝试登录。",
  "auth.errWeakPassword": "密码至少需要 6 个字符。",
  "auth.errResetSend": "无法发送重置邮件，请稍后再试。",
  "auth.errResetNotDeployed":
    "密码重置邮件尚未配置。请部署 send-password-reset 函数并设置 Resend 密钥（见 docs/auth-email-resend.md）。",
  "auth.errRecoverySession":
    "重置链接已过期或会话丢失。请重新申请重置邮件，并在同一浏览器中打开最新链接。",
  "auth.errPasswordMismatch": "两次输入的密码不一致。",
  "auth.termsNotice": "继续即表示你同意 MyPasswordVault 的 __TERMS__ 和 __PRIVACY__。",
  "auth.oauthHostWarning":
    "当前构建使用 {{host}} 进行 Google 登录。请在 Vercel（或本地 .env）将 VITE_SUPABASE_URL 设为 https://auth.mypasswordvault.app 后重新部署或重启 npm run dev。",
  "auth.errGeneric": "出现问题，请重试。",
  "auth.notConfiguredTitle": "尚未配置 Supabase",
  "auth.notConfiguredBody":
    "请在项目根目录的 .env 文件中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY，然后重启开发服务器。数据库表与 Google 登录说明见 README.md。",
  "auth.faqIosSyncQ": "如何让 iOS 应用与网页保险库同步？",
  "auth.faqIosSyncA":
    "云同步绑定的是您的<strong>登录账户</strong>，而非设备。在 iOS 上若使用<strong>通过 Apple 继续</strong>且要与网页使用同一保险库，请在 Apple 询问时选择<strong>共享我的电子邮件</strong>——<strong>不要选择隐藏邮件地址</strong>。隐藏邮件会生成 relay 地址并创建<strong>独立账户</strong>，无法与通过 Google 或常用邮箱登录的网页保险库匹配。若您已在网页使用：在 iOS 点<strong>使用 Google 继续</strong>并用<strong>相同邮箱</strong>登录最简单。若坚持用 Apple，请选择共享邮件。若已选隐藏邮件？请在 设置 → Apple ID → iCloud → 隐藏邮件地址（或 appleid.apple.com）中断开 My Password Vault，退出应用后重新登录。",
};

export const AUTH_JP: Record<string, string> = {
  "legal.privacyPolicy": "プライバシーポリシー",
  "legal.termsOfUse": "利用規約",
  "app.authLoading": "セッションを確認しています…",
  "auth.title": "おかえりなさい",
  "auth.titleSignUp": "アカウント作成",
  "auth.titleForgot": "パスワードをお忘れですか？",
  "auth.titleNewPassword": "新しいパスワード",
  "auth.subtitleSignUp": "新しいアカウントを作成",
  "auth.subtitleForgot":
    "メールアドレスを入力してください。パスワード再設定用のコードをお送りします",
  "auth.subtitleNewPassword": "アカウントの新しいパスワードを設定してください",
  "auth.brandHomeAria": "ホームページへ",
  "auth.subtitle": "アカウントにサインイン",
  "auth.google": "Google で続行",
  "auth.apple": "Apple で続行",
  "auth.lastUsed": "最近の利用",
  "auth.or": "または",
  "auth.email": "メールアドレス",
  "auth.emailPlaceholder": AUTH_COMMON.emailPlaceholder,
  "auth.password": "パスワード",
  "auth.passwordConfirm": "パスワード（確認）",
  "auth.forgotPassword": "パスワードをお忘れですか？",
  "auth.signIn": "サインイン",
  "auth.signUp": "新規登録",
  "auth.sendResetLink": "再設定コードを送信",
  "auth.saveNewPassword": "パスワードを保存",
  "auth.noAccount": "アカウントをお持ちでない方",
  "auth.hasAccount": "すでにアカウントをお持ちの方",
  "auth.switchSignUp": "新規登録",
  "auth.switchSignIn": "サインイン",
  "auth.resetSent":
    "そのメールで登録がある場合、再設定リンクを送信しました。受信トレイと迷惑メールをご確認ください。",
  "auth.checkEmailConfirm":
    "確認メールでアカウントを有効化してからサインインしてください。",
  "auth.errInvalidCredentials": "メールアドレスまたはパスワードが正しくありません。",
  "auth.errEmailTaken": "このメールは既に登録されています。サインインをお試しください。",
  "auth.errWeakPassword": "パスワードは6文字以上にしてください。",
  "auth.errResetSend": "再設定メールを送信できませんでした。しばらくしてからお試しください。",
  "auth.errResetNotDeployed":
    "パスワード再設定メールはまだ設定されていません。send-password-reset のデプロイと Resend のシークレットを確認してください（docs/auth-email-resend.md）。",
  "auth.errRecoverySession":
    "リンクの有効期限が切れたか、セッションがありません。再設定メールを再度リクエストし、同じブラウザで最新のリンクを開いてください。",
  "auth.errPasswordMismatch": "パスワードが一致しません。",
  "auth.termsNotice":
    "続行すると、MyPasswordVault の __TERMS__ および __PRIVACY__ に同意したものとみなされます。",
  "auth.oauthHostWarning":
    "このビルドは Google サインインに {{host}} を使用しています。Vercel（またはローカル .env）で VITE_SUPABASE_URL を https://auth.mypasswordvault.app に設定し、再デプロイまたは npm run dev を再起動してください。",
  "auth.errGeneric": "問題が発生しました。もう一度お試しください。",
  "auth.notConfiguredTitle": "Supabase が設定されていません",
  "auth.notConfiguredBody":
    "プロジェクトルートの .env に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を追加し、開発サーバーを再起動してください。テーブル作成と Google ログインは README.md を参照してください。",
  "auth.faqIosSyncQ": "iOSアプリとWebのVaultを同期するには？",
  "auth.faqIosSyncA":
    "クラウド同期は端末ではなく<strong>サインインアカウント</strong>に紐づきます。iOSで<strong>Appleで続行</strong>を使いWebと同じVaultにしたい場合、Appleの質問では<strong>メールを共有</strong>を選び、<strong>メールを非公開</strong>は選ばないでください。非公開にするとリレーアドレスの<strong>別アカウント</strong>になり、Googleや通常メールでWebにログインしたVaultと一致しません。Web利用中なら最も簡単なのは、iOSで<strong>Googleで続行</strong>し<strong>同じメール</strong>でログインすることです。Appleを使う場合はメールを共有してください。すでに非公開を選んだ場合は、設定 → Apple ID → iCloud → メールを非公開（または appleid.apple.com）で My Password Vault を解除し、サインアウト後に再ログインしてください。",
};

export const AUTH_ID: Record<string, string> = {
  "legal.privacyPolicy": "Kebijakan Privasi",
  "legal.termsOfUse": "Ketentuan Penggunaan",
  "app.authLoading": "Memeriksa sesi Anda…",
  "auth.title": "Selamat datang kembali",
  "auth.titleSignUp": "Buat akun",
  "auth.titleForgot": "Lupa kata sandi?",
  "auth.titleNewPassword": "Kata sandi baru",
  "auth.subtitleSignUp": "Buat akun baru",
  "auth.subtitleForgot":
    "Masukkan email Anda — kami akan mengirim kode untuk mengatur ulang kata sandi",
  "auth.subtitleNewPassword": "Pilih kata sandi baru untuk akun Anda",
  "auth.brandHomeAria": "Ke beranda",
  "auth.subtitle": "Masuk ke akun Anda",
  "auth.google": "Lanjutkan dengan Google",
  "auth.apple": "Lanjutkan dengan Apple",
  "auth.lastUsed": "TERAKHIR DIGUNAKAN",
  "auth.or": "atau",
  "auth.email": "Email",
  "auth.emailPlaceholder": AUTH_COMMON.emailPlaceholder,
  "auth.password": "Kata sandi",
  "auth.passwordConfirm": "Konfirmasi kata sandi",
  "auth.forgotPassword": "Lupa kata sandi?",
  "auth.signIn": "Masuk",
  "auth.signUp": "Daftar",
  "auth.sendResetLink": "Kirim kode reset",
  "auth.saveNewPassword": "Simpan kata sandi",
  "auth.noAccount": "Belum punya akun?",
  "auth.hasAccount": "Sudah punya akun?",
  "auth.switchSignUp": "Daftar",
  "auth.switchSignIn": "Masuk",
  "auth.resetSent":
    "Jika ada akun dengan email itu, kami telah mengirim tautan reset. Periksa kotak masuk dan spam.",
  "auth.checkEmailConfirm":
    "Konfirmasi email Anda untuk mengaktifkan akun, lalu masuk.",
  "auth.errInvalidCredentials": "Email atau kata sandi salah.",
  "auth.errEmailTaken": "Email ini sudah terdaftar. Coba masuk.",
  "auth.errWeakPassword": "Kata sandi minimal 6 karakter.",
  "auth.errResetSend": "Email reset tidak dapat dikirim. Coba lagi nanti.",
  "auth.errResetNotDeployed":
    "Email reset belum dikonfigurasi. Deploy fungsi send-password-reset dan secret Resend (lihat docs/auth-email-resend.md).",
  "auth.errRecoverySession":
    "Tautan kedaluwarsa atau sesi hilang. Minta email reset baru dan buka tautan terbaru di browser yang sama.",
  "auth.errPasswordMismatch": "Kata sandi tidak cocok.",
  "auth.termsNotice":
    "Dengan melanjutkan, Anda menyetujui __TERMS__ dan __PRIVACY__ MyPasswordVault.",
  "auth.oauthHostWarning":
    "Build ini masih memakai {{host}} untuk masuk dengan Google. Setel VITE_SUPABASE_URL ke https://auth.mypasswordvault.app di Vercel (atau .env lokal), lalu deploy ulang atau jalankan ulang npm run dev.",
  "auth.errGeneric": "Terjadi kesalahan. Coba lagi.",
  "auth.notConfiguredTitle": "Supabase belum dikonfigurasi",
  "auth.notConfiguredBody":
    "Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY ke file .env di root proyek, lalu mulai ulang server dev. Lihat README.md untuk tabel database dan masuk dengan Google.",
  "auth.faqIosSyncQ": "Sinkronkan app iOS dengan brankas web?",
  "auth.faqIosSyncA":
    "Sinkron cloud terikat ke <strong>akun masuk</strong>, bukan perangkat. Di iOS, jika memakai <strong>Lanjutkan dengan Apple</strong> dan ingin brankas yang sama dengan web, pilih <strong>Bagikan Email Saya</strong>—<strong>bukan Sembunyikan Email Saya</strong>. Sembunyikan membuat alamat relay dan <strong>akun terpisah</strong> yang tidak cocok dengan brankas web via Google atau email biasa Anda. Paling mudah jika sudah pakai web: ketuk <strong>Lanjutkan dengan Google</strong> di iOS dengan <strong>email yang sama</strong>. Jika lebih suka Apple, pilih Bagikan Email. Sudah pilih Sembunyikan? Nonaktifkan My Password Vault di Pengaturan → Apple ID → iCloud → Sembunyikan Email (atau appleid.apple.com), keluar, lalu masuk lagi.",
};
