/**
 * Pricing page (+ header strings used only there) for locales that otherwise
 * spread English from `en.ts`.
 */

export const PRICING_ES: Record<string, string> = {
  "legal.privacyPolicy": "Política de privacidad",
  "app.authLoading": "Comprobando tu sesión…",
  "pricing.backHome": "Inicio",
  "pricing.backApp": "Volver a la bóveda",
  "pricing.title": "Límites claros, una mejora",
  "pricing.subtitle":
    "Empieza gratis con un límite generoso de entradas; luego desbloquea contraseñas ilimitadas con un solo pago — sin suscripción.",
  "pricing.supabaseRequired":
    "Conecta esta app a Supabase (ver README) para activar facturación por cuenta y el pago con Stripe.",
  "pricing.checkoutSuccess":
    "Pago recibido. Si tu licencia aún no está activa, espera unos segundos y actualiza esta página.",
  "pricing.checkoutCancel": "Pago cancelado. Puedes intentarlo de nuevo cuando quieras.",
  "pricing.youAreLicensed":
    "Tu cuenta ya tiene una licencia permanente. Gracias por tu apoyo.",
  "pricing.tierFree": "Gratis",
  "pricing.freeForever": "Sin cuota mensual",
  "pricing.freeDesc": "Para uso personal y probar el producto con todas las funciones de seguridad.",
  "pricing.freeF1": "Hasta 25 entradas de contraseña",
  "pricing.freeF2": "Cifrado AES-GCM-256 local + 2FA TOTP",
  "pricing.freeF3": "Sincronización cifrada con tu cuenta (solo texto cifrado en tu base de datos)",
  "pricing.freeF4": "Copia de seguridad y restauración JSON sin conexión",
  "pricing.freeF5": "Se sincroniza y funciona en cada dispositivo donde inicias sesión",
  "pricing.freeFootnote":
    "Al llegar a {{limit}} entradas, añadir filas nuevas queda en pausa hasta que mejores el plan o borres entradas.",
  "pricing.tierPaid": "PRO",
  "pricing.mostPopular": "Más popular",
  "pricing.paidOnce": "Pago único 4,99 USD — sin suscripción",
  "pricing.paidDesc": "Desbloquea entradas de contraseña ilimitadas en esta cuenta para siempre.",
  "pricing.paidF1": "Entradas de contraseña ilimitadas sin pausa al llegar a 25",
  "pricing.paidTierUnlimited": "Entradas de contraseña ilimitadas",
  "pricing.paidF2": "Todo lo del plan Gratis, más:",
  "pricing.paidF3": "Pago único — sin suscripción",
  "pricing.paidF4": "Licencia permanente en esta cuenta",
  "pricing.paidF5": "Se sincroniza y funciona en cada dispositivo donde inicias sesión",
  "pricing.signInToBuy": "Inicia sesión con Google para ir al pago",
  "pricing.signInHint":
    "Usamos tu cuenta de Google solo para vincular la licencia y la bóveda cifrada.",
  "pricing.alreadyLicensed": "Con licencia — gracias",
  "pricing.ctaBuy": "Continuar al pago seguro",
  "pricing.stripeNote":
    "Los pagos los procesa Stripe. Saldrás de esta app para completar la compra.",
  "pricing.errSignIn": "Primero inicia sesión.",
  "pricing.errCheckout":
    "No se pudo iniciar el pago. Inténtalo de nuevo o contacta con soporte.",
  "pricing.opsTitle": "Lista para operadores (Supabase + Stripe)",
  "pricing.ops1":
    "Ejecuta la migración SQL `20260515180000_user_entitlements.sql` en el editor SQL de Supabase.",
  "pricing.ops2":
    "Despliega las funciones edge `create-checkout-session` y `stripe-webhook`; configura los secretos STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PUBLIC_APP_URL (URL de la app en producción, incluyendo /app si aplica), opcional STRIPE_LICENSE_AMOUNT_CENTS (por defecto 499).",
  "pricing.ops3":
    "En el panel de Stripe, añade la URL del webhook para `stripe-webhook` y suscríbete al evento checkout.session.completed.",
  "pricing.ops4":
    "Tras la compra, la app actualiza la licencia desde user_entitlements al desbloquear o al abrir esta página.",
};

export const PRICING_DE: Record<string, string> = {
  "legal.privacyPolicy": "Datenschutzerklärung",
  "app.authLoading": "Sitzung wird geprüft…",
  "pricing.backHome": "Start",
  "pricing.backApp": "Zurück zum Tresor",
  "pricing.title": "Klare Limits, ein Upgrade",
  "pricing.subtitle":
    "Starte kostenlos mit einem großzügigen Eintragslimit, schalte dann unbegrenzte Passwörter mit einer einmaligen Zahlung frei — ohne Abo.",
  "pricing.supabaseRequired":
    "Verbinde diese App mit Supabase (siehe README), um Kontobilling und Stripe-Checkout zu aktivieren.",
  "pricing.checkoutSuccess":
    "Zahlung erhalten. Wenn die Lizenz noch nicht aktiv ist, ein paar Sekunden warten und diese Seite aktualisieren.",
  "pricing.checkoutCancel": "Checkout abgebrochen. Du kannst es jederzeit erneut versuchen.",
  "pricing.youAreLicensed":
    "Dein Konto hat bereits eine Dauerlizenz. Vielen Dank für deine Unterstützung.",
  "pricing.tierFree": "Kostenlos",
  "pricing.freeForever": "Keine Monatsgebühr",
  "pricing.freeDesc": "Für den persönlichen Gebrauch und zum Testen mit allen Sicherheitsfunktionen.",
  "pricing.freeF1": "Bis zu 25 Passwort-Einträge",
  "pricing.freeF2": "Lokal zuerst: AES-GCM-256-Verschlüsselung + TOTP-2FA",
  "pricing.freeF3": "Verschlüsselte Sync zu deinem Konto (nur Geheimtext in deiner Datenbank)",
  "pricing.freeF4": "Offline-JSON-Backup und Wiederherstellung",
  "pricing.freeF5": "Synchronisiert und funktioniert auf jedem Gerät, auf dem du dich anmeldest",
  "pricing.freeFootnote":
    "Bei {{limit}} Einträgen ist das Hinzufügen neuer Zeilen pausiert, bis du upgradest oder Einträge löschst.",
  "pricing.tierPaid": "PRO",
  "pricing.mostPopular": "Am beliebtesten",
  "pricing.paidOnce": "Einmalig 4,99 USD — kein Abo",
  "pricing.paidDesc": "Schalte unbegrenzte Passwort-Einträge auf diesem Konto dauerhaft frei.",
  "pricing.paidF1": "Unbegrenzte Passwort-Einträge ohne Pause bei 25 Einträgen",
  "pricing.paidTierUnlimited": "Unbegrenzte Passwort-Einträge",
  "pricing.paidF2": "Alles aus Kostenlos, plus:",
  "pricing.paidF3": "Einmalige Zahlung — kein Abo",
  "pricing.paidF4": "Dauerlizenz für dieses Konto",
  "pricing.paidF5": "Synchronisiert und funktioniert auf jedem Gerät, auf dem du dich anmeldest",
  "pricing.signInToBuy": "Mit Google anmelden, um zum Checkout zu gehen",
  "pricing.signInHint":
    "Wir nutzen dein Google-Konto nur, um Lizenz und verschlüsselten Tresor zu verknüpfen.",
  "pricing.alreadyLicensed": "Lizenziert — danke",
  "pricing.ctaBuy": "Weiter zum sicheren Checkout",
  "pricing.stripeNote":
    "Zahlungen werden von Stripe verarbeitet. Du verlässt die App, um den Kauf abzuschließen.",
  "pricing.errSignIn": "Bitte zuerst anmelden.",
  "pricing.errCheckout":
    "Checkout konnte nicht gestartet werden. Erneut versuchen oder Support kontaktieren.",
  "pricing.opsTitle": "Checkliste für Betrieb (Supabase + Stripe)",
  "pricing.ops1":
    "SQL-Migration `20260515180000_user_entitlements.sql` im Supabase-SQL-Editor ausführen.",
  "pricing.ops2":
    "Edge-Funktionen `create-checkout-session` und `stripe-webhook` deployen; Geheimnisse STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PUBLIC_APP_URL setzen (Produktions-URL inkl. /app falls nötig), optional STRIPE_LICENSE_AMOUNT_CENTS (Standard 499).",
  "pricing.ops3":
    "Im Stripe-Dashboard Webhook-URL für `stripe-webhook` anlegen und checkout.session.completed abonnieren.",
  "pricing.ops4":
    "Nach dem Kauf lädt die App die Lizenz aus user_entitlements automatisch beim Entsperren oder beim Öffnen dieser Seite.",
};

export const PRICING_FR: Record<string, string> = {
  "legal.privacyPolicy": "Politique de confidentialité",
  "app.authLoading": "Vérification de la session…",
  "pricing.backHome": "Accueil",
  "pricing.backApp": "Retour au coffre",
  "pricing.title": "Des limites claires, une mise à niveau",
  "pricing.subtitle":
    "Commencez gratuitement avec une limite d’entrées généreuse, puis débloquez des mots de passe illimités avec un seul paiement — sans abonnement.",
  "pricing.supabaseRequired":
    "Connectez cette app à Supabase (voir le README) pour activer la facturation et le paiement Stripe.",
  "pricing.checkoutSuccess":
    "Paiement reçu. Si la licence n’est pas encore active, attendez quelques secondes et actualisez cette page.",
  "pricing.checkoutCancel": "Paiement annulé. Vous pouvez réessayer quand vous voulez.",
  "pricing.youAreLicensed":
    "Votre compte dispose déjà d’une licence permanente. Merci pour votre soutien.",
  "pricing.tierFree": "Gratuit",
  "pricing.freeForever": "Sans frais mensuels",
  "pricing.freeDesc": "Pour un usage personnel et tester le produit avec toutes les fonctions de sécurité.",
  "pricing.freeF1": "Jusqu’à 25 entrées de mots de passe",
  "pricing.freeF2": "Chiffrement AES-GCM-256 local + 2FA TOTP",
  "pricing.freeF3": "Synchronisation chiffrée vers votre compte (texte chiffré uniquement dans votre base)",
  "pricing.freeF4": "Sauvegarde et restauration JSON hors ligne",
  "pricing.freeF5": "Se synchronise et fonctionne sur chaque appareil où vous vous connectez",
  "pricing.freeFootnote":
    "À {{limit}} entrées, l’ajout de nouvelles lignes est suspendu jusqu’à une mise à niveau ou une suppression d’entrées.",
  "pricing.tierPaid": "PRO",
  "pricing.mostPopular": "Le plus populaire",
  "pricing.paidOnce": "Paiement unique 4,99 USD — sans abonnement",
  "pricing.paidDesc": "Débloquez des entrées de mots de passe illimitées sur ce compte pour toujours.",
  "pricing.paidF1": "Entrées de mots de passe illimitées sans pause à 25 entrées",
  "pricing.paidTierUnlimited": "Entrées de mots de passe illimitées",
  "pricing.paidF2": "Tout le plan Gratuit, plus :",
  "pricing.paidF3": "Paiement unique — sans abonnement",
  "pricing.paidF4": "Licence permanente sur ce compte",
  "pricing.paidF5": "Se synchronise et fonctionne sur chaque appareil où vous vous connectez",
  "pricing.signInToBuy": "Connectez-vous avec Google pour passer au paiement",
  "pricing.signInHint":
    "Nous utilisons votre compte Google uniquement pour lier la licence et le coffre chiffré.",
  "pricing.alreadyLicensed": "Sous licence — merci",
  "pricing.ctaBuy": "Continuer vers le paiement sécurisé",
  "pricing.stripeNote":
    "Les paiements sont traités par Stripe. Vous quitterez cette app pour finaliser l’achat.",
  "pricing.errSignIn": "Veuillez d’abord vous connecter.",
  "pricing.errCheckout":
    "Impossible de démarrer le paiement. Réessayez ou contactez le support.",
  "pricing.opsTitle": "Liste opérateur (Supabase + Stripe)",
  "pricing.ops1":
    "Exécutez la migration SQL `20260515180000_user_entitlements.sql` dans l’éditeur SQL Supabase.",
  "pricing.ops2":
    "Déployez les fonctions edge `create-checkout-session` et `stripe-webhook` ; définissez les secrets STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PUBLIC_APP_URL (URL de prod incluant /app si besoin), optionnel STRIPE_LICENSE_AMOUNT_CENTS (défaut 499).",
  "pricing.ops3":
    "Dans le tableau de Stripe, ajoutez l’URL du webhook pour `stripe-webhook` et abonnez-vous à checkout.session.completed.",
  "pricing.ops4":
    "Après achat, l’app actualise la licence depuis user_entitlements au déverrouillage ou à l’ouverture de cette page.",
};

export const PRICING_IT: Record<string, string> = {
  "legal.privacyPolicy": "Informativa sulla privacy",
  "app.authLoading": "Verifica della sessione…",
  "pricing.backHome": "Home",
  "pricing.backApp": "Torna alla cassaforte",
  "pricing.title": "Limiti chiari, un solo upgrade",
  "pricing.subtitle":
    "Inizia gratis con un limite generoso di voci, poi sblocca password illimitate con un unico pagamento — nessun abbonamento.",
  "pricing.supabaseRequired":
    "Collega l’app a Supabase (vedi README) per abilitare fatturazione e checkout Stripe.",
  "pricing.checkoutSuccess":
    "Pagamento ricevuto. Se la licenza non è ancora attiva, attendi qualche secondo e aggiorna la pagina.",
  "pricing.checkoutCancel": "Checkout annullato. Puoi riprovare quando vuoi.",
  "pricing.youAreLicensed":
    "Il tuo account ha già una licenza permanente. Grazie per il supporto.",
  "pricing.tierFree": "Gratis",
  "pricing.freeForever": "Nessuna quota mensile",
  "pricing.freeDesc": "Per uso personale e provare il prodotto con tutte le funzioni di sicurezza.",
  "pricing.freeF1": "Fino a 25 voci password",
  "pricing.freeF2": "Crittografia AES-GCM-256 locale + 2FA TOTP",
  "pricing.freeF3": "Sync crittografata sul tuo account (solo ciphertext nel database)",
  "pricing.freeF4": "Backup e ripristino JSON offline",
  "pricing.freeF5": "Si sincronizza e funziona su ogni dispositivo con cui accedi",
  "pricing.freeFootnote":
    "Raggiunte {{limit}} voci, l’aggiunta di nuove righe è in pausa fino all’upgrade o alla cancellazione di voci.",
  "pricing.tierPaid": "PRO",
  "pricing.mostPopular": "Più popolare",
  "pricing.paidOnce": "Pagamento unico 4,99 USD — nessun abbonamento",
  "pricing.paidDesc": "Sblocca voci password illimitate su questo account per sempre.",
  "pricing.paidF1": "Voci password illimitate senza pausa a 25 voci",
  "pricing.paidTierUnlimited": "Voci password illimitate",
  "pricing.paidF2": "Tutto il piano Gratis, più:",
  "pricing.paidF3": "Pagamento unico — nessun abbonamento",
  "pricing.paidF4": "Licenza permanente su questo account",
  "pricing.paidF5": "Si sincronizza e funziona su ogni dispositivo con cui accedi",
  "pricing.signInToBuy": "Accedi con Google per andare al checkout",
  "pricing.signInHint":
    "Usiamo Google solo per associare licenza e cassaforte crittografata.",
  "pricing.alreadyLicensed": "Con licenza — grazie",
  "pricing.ctaBuy": "Continua al checkout sicuro",
  "pricing.stripeNote":
    "I pagamenti sono gestiti da Stripe. Uscirai dall’app per completare l’acquisto.",
  "pricing.errSignIn": "Accedi prima.",
  "pricing.errCheckout":
    "Impossibile avviare il checkout. Riprova o contatta il supporto.",
  "pricing.opsTitle": "Checklist operatore (Supabase + Stripe)",
  "pricing.ops1":
    "Esegui la migrazione SQL `20260515180000_user_entitlements.sql` nell’editor SQL di Supabase.",
  "pricing.ops2":
    "Distribuisci le edge function `create-checkout-session` e `stripe-webhook`; imposta i secret STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PUBLIC_APP_URL (URL dell’app in produzione incluso /app se serve), opzionale STRIPE_LICENSE_AMOUNT_CENTS (predefinito 499).",
  "pricing.ops3":
    "Nel dashboard Stripe aggiungi l’URL webhook per `stripe-webhook` e iscriviti a checkout.session.completed.",
  "pricing.ops4":
    "Dopo l’acquisto l’app aggiorna la licenza da user_entitlements allo sblocco o aprendo questa pagina.",
};

export const PRICING_CN: Record<string, string> = {
  "legal.privacyPolicy": "隐私政策",
  "app.authLoading": "正在检查登录状态…",
  "pricing.backHome": "首页",
  "pricing.backApp": "返回保险库",
  "pricing.title": "额度清晰，一次升级",
  "pricing.subtitle":
    "免费起步，条目额度宽松；一次付款即可无限保存密码——无需订阅。",
  "pricing.supabaseRequired":
    "请将本应用连接至 Supabase（见 README）以启用账户计费与 Stripe 结账。",
  "pricing.checkoutSuccess":
    "已收到付款。若许可尚未生效，请等待数秒后刷新本页。",
  "pricing.checkoutCancel": "已取消结账。您可随时重试。",
  "pricing.youAreLicensed": "您的账户已拥有永久许可。感谢您的支持。",
  "pricing.tierFree": "免费",
  "pricing.freeForever": "无月费",
  "pricing.freeDesc": "适合个人试用，并体验完整安全功能。",
  "pricing.freeF1": "最多 25 条密码条目",
  "pricing.freeF2": "本地优先 AES-GCM-256 加密 + TOTP 两步验证",
  "pricing.freeF3": "加密同步至您的账户（数据库中仅密文）",
  "pricing.freeF4": "离线 JSON 备份与恢复",
  "pricing.freeF5": "在您登录的每台设备上同步并正常使用",
  "pricing.freeFootnote":
    "达到 {{limit}} 条后，新增行将暂停，直至升级或删除条目。",
  "pricing.tierPaid": "PRO",
  "pricing.mostPopular": "最受欢迎",
  "pricing.paidOnce": "一次性 4.99 美元 — 无订阅",
  "pricing.paidDesc": "在本账户上永久解锁无限密码条目。",
  "pricing.paidF1": "无限密码条目，不受 25 条暂停限制",
  "pricing.paidTierUnlimited": "无限密码条目",
  "pricing.paidF2": "包含免费版全部功能，另加：",
  "pricing.paidF3": "一次性付款 — 无订阅",
  "pricing.paidF4": "此账户永久许可",
  "pricing.paidF5": "在您登录的每台设备上同步并正常使用",
  "pricing.signInToBuy": "使用 Google 登录以继续结账",
  "pricing.signInHint": "我们仅使用 Google 账户关联许可与加密保险库。",
  "pricing.alreadyLicensed": "已许可 — 谢谢",
  "pricing.ctaBuy": "前往安全结账",
  "pricing.stripeNote": "付款由 Stripe 处理。完成购买时将离开本应用。",
  "pricing.errSignIn": "请先登录。",
  "pricing.errCheckout": "无法开始结账。请重试或联系支持。",
  "pricing.opsTitle": "运维清单（Supabase + Stripe）",
  "pricing.ops1":
    "在 Supabase SQL 编辑器中运行迁移 `20260515180000_user_entitlements.sql`。",
  "pricing.ops2":
    "部署 Edge 函数 `create-checkout-session` 与 `stripe-webhook`；设置密钥 STRIPE_SECRET_KEY、STRIPE_WEBHOOK_SECRET、PUBLIC_APP_URL（生产环境应用 URL，若使用子路径请包含 /app），可选 STRIPE_LICENSE_AMOUNT_CENTS（默认 499）。",
  "pricing.ops3":
    "在 Stripe 控制台添加 `stripe-webhook` 的 Webhook 地址并订阅 checkout.session.completed。",
  "pricing.ops4":
    "购买后，解锁或打开本页时应用会自动从 user_entitlements 刷新许可。",
};

export const PRICING_JP: Record<string, string> = {
  "legal.privacyPolicy": "プライバシーポリシー",
  "app.authLoading": "セッションを確認しています…",
  "pricing.backHome": "ホーム",
  "pricing.backApp": "ボールトに戻る",
  "pricing.title": "わかりやすい上限、一度のアップグレード",
  "pricing.subtitle":
    "寛容なエントリ上限で無料開始。一度のお支払いでパスワード無制限 — サブスクなし。",
  "pricing.supabaseRequired":
    "アカウント課金と Stripe チェックアウトを有効にするには Supabase に接続してください（README 参照）。",
  "pricing.checkoutSuccess":
    "お支払いを受け付けました。ライセンスがまだ有効でない場合は数秒待ってからこのページを更新してください。",
  "pricing.checkoutCancel": "チェックアウトをキャンセルしました。いつでも再試行できます。",
  "pricing.youAreLicensed":
    "お使いのアカウントには既に永久ライセンスがあります。ご支援ありがとうございます。",
  "pricing.tierFree": "無料",
  "pricing.freeForever": "月額なし",
  "pricing.freeDesc": "個人利用やセキュリティ機能の試用に適しています。",
  "pricing.freeF1": "パスワードエントリは最大 25 件",
  "pricing.freeF2": "ローカル優先の AES-GCM-256 暗号化 + TOTP 2FA",
  "pricing.freeF3": "アカウントへ暗号化同期（DB には暗号文のみ）",
  "pricing.freeF4": "オフライン JSON のバックアップと復元",
  "pricing.freeF5": "ログインするすべてのデバイスで同期して利用可能",
  "pricing.freeFootnote":
    "{{limit}} 件に達すると、プランを上げるか削除するまで新規行の追加は一時停止されます。",
  "pricing.tierPaid": "PRO",
  "pricing.mostPopular": "一番人気",
  "pricing.paidOnce": "一回限り 4.99 USD — サブスクなし",
  "pricing.paidDesc": "このアカウントでパスワードエントリを永久に無制限に。",
  "pricing.paidF1": "25 件での一時停止なし — パスワードエントリ無制限",
  "pricing.paidTierUnlimited": "パスワードエントリ無制限",
  "pricing.paidF2": "無料プランに加えて：",
  "pricing.paidF3": "一度きりの支払い — サブスクなし",
  "pricing.paidF4": "このアカウントに永久ライセンス",
  "pricing.paidF5": "ログインするすべてのデバイスで同期して利用可能",
  "pricing.signInToBuy": "Google でログインしてチェックアウトへ",
  "pricing.signInHint":
    "Google アカウントはライセンスと暗号化ボールトの紐付けにのみ使用します。",
  "pricing.alreadyLicensed": "ライセンス済み — ありがとうございます",
  "pricing.ctaBuy": "安全なチェックアウトへ進む",
  "pricing.stripeNote":
    "決済は Stripe が処理します。購入完了のため一時的にアプリ外へ移動します。",
  "pricing.errSignIn": "先にログインしてください。",
  "pricing.errCheckout":
    "チェックアウトを開始できませんでした。再試行するかサポートへ連絡してください。",
  "pricing.opsTitle": "運用チェックリスト（Supabase + Stripe）",
  "pricing.ops1":
    "Supabase SQL エディタでマイグレーション `20260515180000_user_entitlements.sql` を実行。",
  "pricing.ops2":
    "Edge 関数 `create-checkout-session` と `stripe-webhook` をデプロイ。シークレット STRIPE_SECRET_KEY、STRIPE_WEBHOOK_SECRET、PUBLIC_APP_URL（本番 URL。/app を使う場合は含める）を設定。任意で STRIPE_LICENSE_AMOUNT_CENTS（既定 499）。",
  "pricing.ops3":
    "Stripe ダッシュボードで `stripe-webhook` の Webhook URL を追加し、checkout.session.completed を購読。",
  "pricing.ops4":
    "購入後、アンロックまたはこのページを開くと user_entitlements からライセンスを自動更新します。",
};

export const PRICING_ID: Record<string, string> = {
  "legal.privacyPolicy": "Kebijakan privasi",
  "app.authLoading": "Memeriksa sesi…",
  "pricing.backHome": "Beranda",
  "pricing.backApp": "Kembali ke brankas",
  "pricing.title": "Batas jelas, satu kali upgrade",
  "pricing.subtitle":
    "Mulai gratis dengan batas entri yang longgar, lalu buka kata sandi tanpa batas dengan satu pembayaran — tanpa langganan.",
  "pricing.supabaseRequired":
    "Hubungkan aplikasi ke Supabase (lihat README) untuk mengaktifkan penagihan akun dan checkout Stripe.",
  "pricing.checkoutSuccess":
    "Pembayaran diterima. Jika lisensi belum aktif, tunggu beberapa detik dan segarkan halaman ini.",
  "pricing.checkoutCancel": "Checkout dibatalkan. Anda bisa coba lagi kapan saja.",
  "pricing.youAreLicensed":
    "Akun Anda sudah memiliki lisensi permanen. Terima kasih atas dukungannya.",
  "pricing.tierFree": "Gratis",
  "pricing.freeForever": "Tanpa biaya bulanan",
  "pricing.freeDesc": "Untuk pemakaian pribadi dan mencoba produk dengan fitur keamanan lengkap.",
  "pricing.freeF1": "Hingga 25 entri kata sandi",
  "pricing.freeF2": "Enkripsi AES-GCM-256 lokal + 2FA TOTP",
  "pricing.freeF3": "Sinkron terenkripsi ke akun Anda (hanya ciphertext di database)",
  "pricing.freeF4": "Cadangan & pemulihan JSON offline",
  "pricing.freeF5": "Tersinkron dan berfungsi di setiap perangkat tempat Anda masuk",
  "pricing.freeFootnote":
    "Saat mencapai {{limit}} entri, menambah baris baru dijeda sampai Anda upgrade atau menghapus entri.",
  "pricing.tierPaid": "PRO",
  "pricing.mostPopular": "Paling populer",
  "pricing.paidOnce": "Sekali bayar 4,99 USD — tanpa langganan",
  "pricing.paidDesc": "Buka entri kata sandi tanpa batas di akun ini selamanya.",
  "pricing.paidF1": "Entri kata sandi tanpa batas tanpa jeda 25 entri",
  "pricing.paidTierUnlimited": "Entri kata sandi tanpa batas",
  "pricing.paidF2": "Semua fitur Gratis, plus:",
  "pricing.paidF3": "Bayar sekali — tanpa langganan",
  "pricing.paidF4": "Lisensi permanen di akun ini",
  "pricing.paidF5": "Tersinkron dan berfungsi di setiap perangkat tempat Anda masuk",
  "pricing.signInToBuy": "Masuk dengan Google untuk lanjut ke checkout",
  "pricing.signInHint":
    "Kami hanya memakai akun Google untuk menautkan lisensi dan brankas terenkripsi.",
  "pricing.alreadyLicensed": "Berlisensi — terima kasih",
  "pricing.ctaBuy": "Lanjut ke checkout aman",
  "pricing.stripeNote":
    "Pembayaran diproses oleh Stripe. Anda akan meninggalkan aplikasi untuk menyelesaikan pembelian.",
  "pricing.errSignIn": "Silakan masuk terlebih dahulu.",
  "pricing.errCheckout":
    "Tidak dapat memulai checkout. Coba lagi atau hubungi dukungan.",
  "pricing.opsTitle": "Daftar operator (Supabase + Stripe)",
  "pricing.ops1":
    "Jalankan migrasi SQL `20260515180000_user_entitlements.sql` di editor SQL Supabase.",
  "pricing.ops2":
    "Deploy fungsi edge `create-checkout-session` dan `stripe-webhook`; setel rahasia STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PUBLIC_APP_URL (URL aplikasi produksi termasuk /app jika dipakai), opsional STRIPE_LICENSE_AMOUNT_CENTS (bawaan 499).",
  "pricing.ops3":
    "Di dasbor Stripe, tambahkan URL webhook untuk `stripe-webhook` dan berlangganan checkout.session.completed.",
  "pricing.ops4":
    "Setelah pembelian, aplikasi menyegarkan lisensi dari user_entitlements saat membuka kunci atau membuka halaman ini.",
};
