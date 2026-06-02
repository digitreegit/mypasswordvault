/**
 * Settings / account navigation strings for locales that otherwise fall back to English.
 */

export const SETTINGS_CN: Record<string, string> = {
  "settings.sidebarSection": "设置",
  "settings.navAria": "设置分区",
  "settings.navGeneral": "常规",
  "settings.navPlan": "套餐",
  "settings.navSecurity": "安全",
  "settings.navBackup": "备份",
  "settings.generalSubtitle": "此设备上的自动锁定及其他保险库偏好设置。",
  "settings.securitySubtitle": "添加通行密钥、安全密钥及其他无密码解锁方式。",
  "settings.planSubtitle": "条目限制与许可证状态。",
  "settings.backupSubtitle": "云同步与可选的离线备份文件。",
  "settings.accountSubtitle": "个人资料、登录与账户操作。",
  "settings.languageHint": "适用于此设备上的应用界面。",
  "settings.passkeysTitle": "通行密钥与解锁方式",
  "settings.passkeysHint":
    "添加安全密钥、其他设备或生物识别，以便无需主密码即可解锁。",
  "settings.passkeysListAria": "已注册的通行密钥",
  "settings.passkeysRegisteredLabel": "已注册",
  "settings.passkeysUnnamed": "通行密钥",
  "settings.passkeysEmpty": "尚未注册通行密钥。",
  "settings.passkeysAddLabel": "添加",
  "settings.passkeysAdding": "注册中…",
  "settings.passkeysAdded": "通行密钥已添加。",
  "settings.passkeysAddPlatformHint": "使用本设备的生物识别、设备 PIN 或其他解锁方式。",
  "settings.passkeysAddSecurityKeyHint": "USB、NFC 或蓝牙安全密钥（如 YubiKey）。",
  "settings.passkeysAddPhoneHint": "扫描二维码以在手机或平板上注册通行密钥。",
  "settings.syncTitle": "设备与备份",
  "settings.syncHint":
    "登录后，本应用会在数据库中保存加密副本（服务器无法读取内容）。在新浏览器或手机上使用同一账户登录即可自动同步保险库，并使用相同的主密码及身份验证器 6 位码或恢复码解锁。",
  "settings.fileBackupAdvanced": "离线 JSON 文件（高级）",
  "settings.fileBackupAdvancedHint":
    "可选。仅导入本应用导出的 .json 文件。数据同样经过加密，主密码和 6 位码须与创建该文件时的保险库一致。",
  "settings.exportBackup": "下载备份 (.json)",
  "settings.copyBackupFail": "无法复制（大小或权限）。请改用下载。",
  "settings.importBackup": "导入备份…",
  "settings.importConfirm":
    "是否用备份替换此设备上的保险库？未保存的更改将丢失，且需要重新解锁。",
  "settings.importApply": "替换并锁定",
  "settings.importCancel": "取消导入",
  "settings.accountTitle": "账户",
  "settings.signedInAs": "已登录：{{email}}",
  "settings.changePasswordTitle": "更改密码",
  "settings.changePasswordSubtitle": "欢迎回来！请输入新的强密码并保存。",
  "settings.currentPassword": "当前密码",
  "settings.updateEmailTitle": "更新电子邮件地址",
  "settings.updateEmailLabel": "请输入新的电子邮件地址",
  "settings.updateEmailPlaceholder": "example@email.com",
  "settings.updateEmailHint": "确认邮件将发送到您输入的地址。",
  "settings.updateEmailConfirm": "确认",
  "settings.updateEmailTooltip": "更新电子邮件地址",
  "settings.signOut": "退出登录",
  "settings.signOutHint":
    "仅结束登录会话。云同步将停止，但在删除账户或重置保险库之前，此设备上的本地数据仍会保留。",
  "settings.deleteAccount": "删除账户",
  "settings.deleteAccountHint":
    "永久删除账户、云端加密备份、许可证信息及此设备上的保险库数据。无法撤销。",
  "settings.deleteAccountConfirm":
    "永久删除 {{email}} 账户及所有数据？\n\n云端备份、许可证及此设备上的保险库将被删除，且无法恢复。",
  "settings.deleteAccountFailed": "无法删除账户。请稍后重试。",
  "settings.deleteAccountNotDeployed":
    "账户删除功能尚未部署。请部署 delete-account Edge Function（参见 README/docs）。",
  "nav.userMenu": "账户菜单",
  "settings.openAccountPage": "账户偏好",
  "account.backToVault": "返回保险库",
  "settings.licenseTitle": "套餐与条目限制",
  "settings.licenseFree":
    "免费：此账户最多 {{limit}} 个密码条目。服务器无法读取密码内容。",
  "settings.licensePaid":
    "永久许可证：$4.99 一次性付款。绑定到已登录账户。",
  "settings.licenseStatusLicensed": "您的账户拥有永久许可证（条目不限）。",
  "settings.licenseStatusFree": "您使用的是免费套餐（已用 {{count}} / {{limit}} 个条目）。",
  "settings.licenseLoading": "正在检查许可证…",
  "settings.licenseLink": "打开套餐与定价",
  "settings.upgradeToPro": "升级到 Pro",
  "settings.licenseRefresh": "刷新状态",
  "settings.planBadgeFree": "FREE",
  "settings.planBadgePro": "PRO",
  "settings.licenseKeyLabel": "许可证密钥",
  "settings.licenseKeyHint":
    "付款时发放的参考值（Stripe 结账会话）。只读，仅供个人记录。",
  "settings.licenseCopyKey": "复制",
  "settings.licenseKeyCopied": "已复制",
  "settings.licenseNoSessionId": "许可证已激活，但此账户尚无保存的付款参考。",
  "vault.entryLimitUpgrade": "升级",
  "vault.licenseBadgeFree": "FREE",
  "vault.licenseBadgePro": "PRO",
};

export const SETTINGS_JP: Record<string, string> = {
  "settings.sidebarSection": "設定",
  "settings.navAria": "設定セクション",
  "settings.navGeneral": "一般",
  "settings.navPlan": "プラン",
  "settings.navSecurity": "セキュリティ",
  "settings.navBackup": "バックアップ",
  "settings.generalSubtitle": "このデバイスの自動ロックなど、Vault の環境設定です。",
  "settings.securitySubtitle":
    "パスキー、セキュリティキー、その他のロック解除方法を追加します。",
  "settings.planSubtitle": "エントリー上限とライセンスの状態です。",
  "settings.backupSubtitle": "クラウド同期とオフラインのバックアップファイルです。",
  "settings.accountSubtitle": "プロフィール、サインイン、アカウント操作です。",
  "settings.languageHint": "このデバイスのアプリ画面に適用されます。",
  "settings.passkeysTitle": "パスキーとロック解除",
  "settings.passkeysHint":
    "セキュリティキー、別のデバイス、生体認証を追加すると、マスターパスワードなしでロック解除できます。",
  "settings.passkeysListAria": "登録済みパスキー",
  "settings.passkeysRegisteredLabel": "登録済み",
  "settings.passkeysUnnamed": "パスキー",
  "settings.passkeysEmpty": "パスキーはまだ登録されていません。",
  "settings.passkeysAddLabel": "追加",
  "settings.passkeysAdding": "登録中…",
  "settings.passkeysAdded": "パスキーを追加しました。",
  "settings.passkeysAddPlatformHint": "このデバイスの生体認証、PIN、または既存の解除方法を使用します。",
  "settings.passkeysAddSecurityKeyHint": "USB、NFC、または Bluetooth セキュリティキー（YubiKey など）。",
  "settings.passkeysAddPhoneHint": "QR コードをスキャンしてスマートフォンやタブレットにパスキーを登録します。",
  "settings.syncTitle": "デバイスとバックアップ",
  "settings.syncHint":
    "サインイン中、このアプリはデータベースに暗号化されたコピーを保存します（サーバーは内容を読めません）。新しいブラウザやスマートフォンでは同じアカウントでサインインすると Vault が自動的に同期され、同じマスターパスワードと認証アプリの6桁コードまたはリカバリーコードでロック解除してください。",
  "settings.fileBackupAdvanced": "オフライン JSON ファイル（上級）",
  "settings.fileBackupAdvancedHint":
    "任意です。このアプリからエクスポートした .json のみインポートしてください。データは同様に暗号化されており、マスターパスワードと6桁コードはファイル作成時の Vault と一致している必要があります。",
  "settings.exportBackup": "バックアップをダウンロード (.json)",
  "settings.copyBackupFail": "コピーできませんでした（サイズまたは権限）。ダウンロードを使用してください。",
  "settings.importBackup": "バックアップをインポート…",
  "settings.importConfirm":
    "このデバイスの Vault をバックアップで置き換えますか？未保存の変更は失われ、再度ロック解除が必要です。",
  "settings.importApply": "置き換えてロック",
  "settings.importCancel": "インポートをキャンセル",
  "settings.accountTitle": "アカウント",
  "settings.signedInAs": "サインイン中: {{email}}",
  "settings.changePasswordTitle": "パスワードを変更",
  "settings.changePasswordSubtitle":
    "おかえりなさい！新しい強力なパスワードを入力して保存してください。",
  "settings.currentPassword": "現在のパスワード",
  "settings.updateEmailTitle": "メールアドレスを更新",
  "settings.updateEmailLabel": "新しいメールアドレスを入力",
  "settings.updateEmailPlaceholder": "example@email.com",
  "settings.updateEmailHint": "入力したアドレスに確認メールが送信されます。",
  "settings.updateEmailConfirm": "確認",
  "settings.updateEmailTooltip": "メールアドレスを更新",
  "settings.signOut": "サインアウト",
  "settings.signOutHint":
    "サインインセッションのみ終了します。クラウド同期は停止しますが、アカウント削除または Vault リセットまではこのデバイスのローカルデータは残ります。",
  "settings.deleteAccount": "アカウントを削除",
  "settings.deleteAccountHint":
    "アカウント、クラウドの暗号化バックアップ、ライセンス情報、このデバイスの Vault データを永久に削除します。元に戻せません。",
  "settings.deleteAccountConfirm":
    "{{email}} のアカウントとすべてのデータを永久に削除しますか？\n\nクラウドバックアップ、ライセンス、このデバイスの Vault が削除され、取り消せません。",
  "settings.deleteAccountFailed": "アカウントを削除できませんでした。後でもう一度お試しください。",
  "settings.deleteAccountNotDeployed":
    "アカウント削除機能はまだデプロイされていません。delete-account Edge Function をデプロイしてください（README/docs 参照）。",
  "nav.userMenu": "アカウントメニュー",
  "settings.openAccountPage": "アカウント設定",
  "account.backToVault": "Vault に戻る",
  "settings.licenseTitle": "プランとエントリー上限",
  "settings.licenseFree":
    "無料: このアカウントはパスワードエントリー最大 {{limit}} 件。サーバーはパスワード内容を知りません。",
  "settings.licensePaid":
    "永久ライセンス: $4.99 一括。サインイン中のアカウントに紐づきます。",
  "settings.licenseStatusLicensed": "このアカウントには永久ライセンスがあります（エントリー無制限）。",
  "settings.licenseStatusFree": "無料プランです（{{count}} / {{limit}} 件使用中）。",
  "settings.licenseLoading": "ライセンスを確認中…",
  "settings.licenseLink": "プランと料金を開く",
  "settings.upgradeToPro": "Pro にアップグレード",
  "settings.licenseRefresh": "状態を更新",
  "settings.planBadgeFree": "FREE",
  "settings.planBadgePro": "PRO",
  "settings.licenseKeyLabel": "ライセンスキー",
  "settings.licenseKeyHint":
    "支払い時に発行された参照値（Stripe チェックアウトセッション）。読み取り専用で、個人記録用です。",
  "settings.licenseCopyKey": "コピー",
  "settings.licenseKeyCopied": "コピーしました",
  "settings.licenseNoSessionId":
    "ライセンスは有効ですが、このアカウントに保存された支払い参照はまだありません。",
  "vault.entryLimitUpgrade": "アップグレード",
  "vault.licenseBadgeFree": "FREE",
  "vault.licenseBadgePro": "PRO",
};

export const SETTINGS_ID: Record<string, string> = {
  "settings.sidebarSection": "Pengaturan",
  "settings.navAria": "Bagian pengaturan",
  "settings.navGeneral": "Umum",
  "settings.navPlan": "Paket",
  "settings.navSecurity": "Keamanan",
  "settings.navBackup": "Cadangan",
  "settings.generalSubtitle": "Kunci otomatis dan preferensi brankas lainnya di perangkat ini.",
  "settings.securitySubtitle":
    "Tambahkan passkey, kunci keamanan, dan metode buka kunci tanpa kata sandi.",
  "settings.planSubtitle": "Batas entri dan status lisensi Anda.",
  "settings.backupSubtitle": "Sinkronisasi cloud dan file cadangan offline opsional.",
  "settings.accountSubtitle": "Profil, masuk, dan tindakan akun.",
  "settings.languageHint": "Berlaku untuk antarmuka aplikasi di perangkat ini.",
  "settings.passkeysTitle": "Passkey & metode buka kunci",
  "settings.passkeysHint":
    "Tambahkan kunci keamanan, perangkat lain, atau biometrik agar dapat membuka kunci tanpa kata sandi utama.",
  "settings.passkeysListAria": "Passkey terdaftar",
  "settings.passkeysRegisteredLabel": "Terdaftar",
  "settings.passkeysUnnamed": "Passkey",
  "settings.passkeysEmpty": "Belum ada passkey terdaftar.",
  "settings.passkeysAddLabel": "Tambah",
  "settings.passkeysAdding": "Mendaftarkan…",
  "settings.passkeysAdded": "Passkey ditambahkan.",
  "settings.passkeysAddPlatformHint":
    "Menggunakan biometrik, PIN perangkat, atau metode buka kunci lain di perangkat ini.",
  "settings.passkeysAddSecurityKeyHint":
    "Kunci keamanan USB, NFC, atau Bluetooth (YubiKey, dll.).",
  "settings.passkeysAddPhoneHint":
    "Pindai kode QR untuk mendaftarkan passkey di ponsel atau tablet.",
  "settings.syncTitle": "Perangkat & cadangan",
  "settings.syncHint":
    "Saat masuk, aplikasi ini menyimpan salinan terenkripsi di database (server tidak dapat membaca isinya). Di browser atau ponsel baru, masuk dengan akun yang sama untuk menyinkronkan brankas, lalu buka kunci dengan kata sandi utama dan kode 6 digit atau kode pemulihan yang sama.",
  "settings.fileBackupAdvanced": "File JSON offline (lanjutan)",
  "settings.fileBackupAdvancedHint":
    "Opsional. Impor hanya .json yang diekspor dari aplikasi ini. Data terenkripsi dengan cara yang sama; kata sandi utama dan kode 6 digit harus cocok dengan brankas saat file dibuat.",
  "settings.exportBackup": "Unduh cadangan (.json)",
  "settings.copyBackupFail": "Tidak dapat menyalin (ukuran atau izin). Gunakan unduhan.",
  "settings.importBackup": "Impor cadangan…",
  "settings.importConfirm":
    "Ganti brankas perangkat ini dengan cadangan? Perubahan yang belum disimpan akan hilang dan Anda perlu membuka kunci lagi.",
  "settings.importApply": "Ganti dan kunci",
  "settings.importCancel": "Batalkan impor",
  "settings.accountTitle": "Akun",
  "settings.signedInAs": "Masuk sebagai {{email}}",
  "settings.changePasswordTitle": "Ubah kata sandi",
  "settings.changePasswordSubtitle":
    "Selamat datang kembali! Masukkan kata sandi baru yang kuat dan simpan.",
  "settings.currentPassword": "Kata sandi saat ini",
  "settings.updateEmailTitle": "Perbarui alamat email",
  "settings.updateEmailLabel": "Masukkan alamat email baru",
  "settings.updateEmailPlaceholder": "example@email.com",
  "settings.updateEmailHint": "Email konfirmasi akan dikirim ke alamat yang Anda masukkan.",
  "settings.updateEmailConfirm": "Konfirmasi",
  "settings.updateEmailTooltip": "Perbarui alamat email",
  "settings.signOut": "Keluar",
  "settings.signOutHint":
    "Hanya mengakhiri sesi masuk. Sinkronisasi cloud berhenti, tetapi data lokal di perangkat ini tetap ada sampai Anda menghapus akun atau mereset brankas.",
  "settings.deleteAccount": "Hapus akun",
  "settings.deleteAccountHint":
    "Hapus permanen akun, cadangan terenkripsi cloud, info lisensi, dan data brankas di perangkat ini. Tidak dapat dibatalkan.",
  "settings.deleteAccountConfirm":
    "Hapus permanen akun {{email}} dan semua data?\n\nCadangan cloud, lisensi, dan brankas di perangkat ini akan dihapus dan tidak dapat dipulihkan.",
  "settings.deleteAccountFailed": "Tidak dapat menghapus akun. Coba lagi nanti.",
  "settings.deleteAccountNotDeployed":
    "Penghapusan akun belum dideploy. Deploy Edge Function delete-account (lihat README/docs).",
  "nav.userMenu": "Menu akun",
  "settings.openAccountPage": "Preferensi akun",
  "account.backToVault": "Kembali ke brankas",
  "settings.licenseTitle": "Paket & batas entri",
  "settings.licenseFree":
    "Gratis: maksimal {{limit}} entri kata sandi untuk akun ini. Server tidak dapat membaca isi kata sandi.",
  "settings.licensePaid":
    "Lisensi permanen: $4,99 sekali bayar. Terikat ke akun yang masuk.",
  "settings.licenseStatusLicensed": "Akun Anda memiliki lisensi permanen (entri tanpa batas).",
  "settings.licenseStatusFree": "Anda menggunakan paket gratis ({{count}} / {{limit}} entri digunakan).",
  "settings.licenseLoading": "Memeriksa lisensi…",
  "settings.licenseLink": "Buka paket & harga",
  "settings.upgradeToPro": "Upgrade ke Pro",
  "settings.licenseRefresh": "Segarkan status",
  "settings.planBadgeFree": "FREE",
  "settings.planBadgePro": "PRO",
  "settings.licenseKeyLabel": "Kunci lisensi",
  "settings.licenseKeyHint":
    "Nilai referensi dari pembayaran (sesi checkout Stripe). Hanya baca, untuk catatan pribadi.",
  "settings.licenseCopyKey": "Salin",
  "settings.licenseKeyCopied": "Disalin",
  "settings.licenseNoSessionId":
    "Lisensi aktif, tetapi belum ada referensi pembayaran tersimpan untuk akun ini.",
  "vault.entryLimitUpgrade": "Tingkatkan",
  "vault.licenseBadgeFree": "FREE",
  "vault.licenseBadgePro": "PRO",
};

export const SETTINGS_ES: Record<string, string> = {
  "settings.sidebarSection": "Ajustes",
  "settings.navAria": "Secciones de ajustes",
  "settings.navGeneral": "General",
  "settings.navPlan": "Plan",
  "settings.navSecurity": "Seguridad",
  "settings.navBackup": "Copia de seguridad",
  "settings.generalSubtitle": "Bloqueo automático y otras preferencias de la bóveda en este dispositivo.",
  "settings.securitySubtitle":
    "Añade passkeys, llaves de seguridad y otros métodos de desbloqueo sin contraseña.",
  "settings.planSubtitle": "Límites de entradas y estado de la licencia.",
  "settings.backupSubtitle": "Sincronización en la nube y archivos de copia offline opcionales.",
  "settings.accountSubtitle": "Perfil, inicio de sesión y acciones de la cuenta.",
  "settings.languageHint": "Se aplica a la interfaz de la aplicación en este dispositivo.",
  "settings.passkeysTitle": "Passkeys y métodos de desbloqueo",
  "settings.passkeysHint":
    "Añade llaves de seguridad, otro dispositivo o biometría para desbloquear sin la contraseña maestra.",
  "settings.passkeysListAria": "Passkeys registradas",
  "settings.passkeysRegisteredLabel": "Registradas",
  "settings.passkeysUnnamed": "Passkey",
  "settings.passkeysEmpty": "Aún no hay passkeys registradas.",
  "settings.passkeysAddLabel": "Añadir",
  "settings.passkeysAdding": "Registrando…",
  "settings.passkeysAdded": "Passkey añadida.",
  "settings.passkeysAddPlatformHint":
    "Usa biometría, PIN del dispositivo u otro método de desbloqueo en este dispositivo.",
  "settings.passkeysAddSecurityKeyHint":
    "Llave de seguridad USB, NFC o Bluetooth (YubiKey, etc.).",
  "settings.passkeysAddPhoneHint":
    "Escanea un código QR para registrar una passkey en tu teléfono o tableta.",
  "settings.syncTitle": "Dispositivos y copia de seguridad",
  "settings.syncHint":
    "Al iniciar sesión, esta app guarda una copia cifrada en la base de datos (el servidor no puede leer el contenido). En un navegador o móvil nuevo, inicia sesión con la misma cuenta para sincronizar la bóveda y desbloquéala con la misma contraseña maestra y el código de 6 dígitos o código de recuperación.",
  "settings.fileBackupAdvanced": "Archivo JSON offline (avanzado)",
  "settings.fileBackupAdvancedHint":
    "Opcional. Importa solo .json exportados desde esta app. Los datos están cifrados igual; la contraseña maestra y el código de 6 dígitos deben coincidir con la bóveda al crear el archivo.",
  "settings.exportBackup": "Descargar copia (.json)",
  "settings.copyBackupFail": "No se pudo copiar (tamaño o permiso). Usa la descarga.",
  "settings.importBackup": "Importar copia…",
  "settings.importConfirm":
    "¿Reemplazar la bóveda de este dispositivo con la copia? Se perderán los cambios no guardados y tendrás que desbloquear de nuevo.",
  "settings.importApply": "Reemplazar y bloquear",
  "settings.importCancel": "Cancelar importación",
  "settings.accountTitle": "Cuenta",
  "settings.signedInAs": "Sesión iniciada como {{email}}",
  "settings.changePasswordTitle": "Cambiar contraseña",
  "settings.changePasswordSubtitle":
    "¡Bienvenido de nuevo! Introduce una contraseña nueva y segura y guárdala.",
  "settings.currentPassword": "Contraseña actual",
  "settings.updateEmailTitle": "Actualizar correo electrónico",
  "settings.updateEmailLabel": "Introduce una nueva dirección de correo",
  "settings.updateEmailPlaceholder": "example@email.com",
  "settings.updateEmailHint": "Se enviará un correo de confirmación a la dirección indicada.",
  "settings.updateEmailConfirm": "Confirmar",
  "settings.updateEmailTooltip": "Actualizar correo electrónico",
  "settings.signOut": "Cerrar sesión",
  "settings.signOutHint":
    "Solo cierra la sesión. La sincronización en la nube se detiene, pero los datos locales en este dispositivo permanecen hasta que elimines la cuenta o restablezcas la bóveda.",
  "settings.deleteAccount": "Eliminar cuenta",
  "settings.deleteAccountHint":
    "Elimina permanentemente la cuenta, la copia cifrada en la nube, la información de licencia y los datos de la bóveda en este dispositivo. No se puede deshacer.",
  "settings.deleteAccountConfirm":
    "¿Eliminar permanentemente la cuenta {{email}} y todos los datos?\n\nSe borrarán la copia en la nube, la licencia y la bóveda en este dispositivo sin posibilidad de recuperación.",
  "settings.deleteAccountFailed": "No se pudo eliminar la cuenta. Inténtalo más tarde.",
  "settings.deleteAccountNotDeployed":
    "La eliminación de cuenta aún no está desplegada. Despliega la Edge Function delete-account (ver README/docs).",
  "nav.userMenu": "Menú de cuenta",
  "settings.openAccountPage": "Preferencias de cuenta",
  "account.backToVault": "Volver a la bóveda",
  "settings.licenseTitle": "Plan y límite de entradas",
  "settings.licenseFree":
    "Gratis: hasta {{limit}} entradas de contraseña en esta cuenta. El servidor no puede leer el contenido.",
  "settings.licensePaid":
    "Licencia permanente: $4,99 pago único. Vinculada a la cuenta con sesión iniciada.",
  "settings.licenseStatusLicensed": "Tu cuenta tiene una licencia permanente (entradas ilimitadas).",
  "settings.licenseStatusFree": "Estás en el plan gratuito ({{count}} / {{limit}} entradas usadas).",
  "settings.licenseLoading": "Comprobando licencia…",
  "settings.licenseLink": "Abrir planes y precios",
  "settings.upgradeToPro": "Actualizar a Pro",
  "settings.licenseRefresh": "Actualizar estado",
  "settings.planBadgeFree": "FREE",
  "settings.planBadgePro": "PRO",
  "settings.licenseKeyLabel": "Clave de licencia",
  "settings.licenseKeyHint":
    "Valor de referencia del pago (sesión de checkout de Stripe). Solo lectura, para tu registro personal.",
  "settings.licenseCopyKey": "Copiar",
  "settings.licenseKeyCopied": "Copiado",
  "settings.licenseNoSessionId":
    "La licencia está activa, pero aún no hay referencia de pago guardada para esta cuenta.",
  "vault.entryLimitUpgrade": "Mejorar",
  "vault.licenseBadgeFree": "FREE",
  "vault.licenseBadgePro": "PRO",
};

export const SETTINGS_DE: Record<string, string> = {
  "settings.sidebarSection": "Einstellungen",
  "settings.navAria": "Einstellungsbereiche",
  "settings.navGeneral": "Allgemein",
  "settings.navPlan": "Tarif",
  "settings.navSecurity": "Sicherheit",
  "settings.navBackup": "Sicherung",
  "settings.generalSubtitle": "Automatische Sperre und andere Tresor-Einstellungen auf diesem Gerät.",
  "settings.securitySubtitle":
    "Passkeys, Sicherheitsschlüssel und weitere passwortlose Entsperrmethoden hinzufügen.",
  "settings.planSubtitle": "Eintragslimits und Lizenzstatus.",
  "settings.backupSubtitle": "Cloud-Sync und optionale Offline-Sicherungsdateien.",
  "settings.accountSubtitle": "Profil, Anmeldung und Kontoaktionen.",
  "settings.languageHint": "Gilt für die App-Oberfläche auf diesem Gerät.",
  "settings.passkeysTitle": "Passkeys & Entsperrmethoden",
  "settings.passkeysHint":
    "Fügen Sie Sicherheitsschlüssel, ein anderes Gerät oder Biometrie hinzu, um ohne Masterpasswort zu entsperren.",
  "settings.passkeysListAria": "Registrierte Passkeys",
  "settings.passkeysRegisteredLabel": "Registriert",
  "settings.passkeysUnnamed": "Passkey",
  "settings.passkeysEmpty": "Noch keine Passkeys registriert.",
  "settings.passkeysAddLabel": "Hinzufügen",
  "settings.passkeysAdding": "Registrierung…",
  "settings.passkeysAdded": "Passkey hinzugefügt.",
  "settings.passkeysAddPlatformHint":
    "Nutzt Biometrie, Geräte-PIN oder eine andere Entsperrmethode auf diesem Gerät.",
  "settings.passkeysAddSecurityKeyHint":
    "USB-, NFC- oder Bluetooth-Sicherheitsschlüssel (YubiKey usw.).",
  "settings.passkeysAddPhoneHint":
    "QR-Code scannen, um einen Passkey auf dem Smartphone oder Tablet zu registrieren.",
  "settings.syncTitle": "Geräte & Sicherung",
  "settings.syncHint":
    "Beim Anmelden speichert diese App eine verschlüsselte Kopie in der Datenbank (der Server kann den Inhalt nicht lesen). Melden Sie sich auf einem neuen Browser oder Smartphone mit demselben Konto an, um den Tresor zu synchronisieren, und entsperren Sie ihn mit demselben Masterpasswort und 6-stelligen Code oder Wiederherstellungscode.",
  "settings.fileBackupAdvanced": "Offline-JSON-Datei (erweitert)",
  "settings.fileBackupAdvancedHint":
    "Optional. Importieren Sie nur .json-Dateien, die aus dieser App exportiert wurden. Die Daten sind gleich verschlüsselt; Masterpasswort und 6-stelliger Code müssen zum Tresor beim Erstellen der Datei passen.",
  "settings.exportBackup": "Sicherung herunterladen (.json)",
  "settings.copyBackupFail": "Kopieren fehlgeschlagen (Größe oder Berechtigung). Bitte Download verwenden.",
  "settings.importBackup": "Sicherung importieren…",
  "settings.importConfirm":
    "Tresor auf diesem Gerät durch die Sicherung ersetzen? Nicht gespeicherte Änderungen gehen verloren und Sie müssen erneut entsperren.",
  "settings.importApply": "Ersetzen und sperren",
  "settings.importCancel": "Import abbrechen",
  "settings.accountTitle": "Konto",
  "settings.signedInAs": "Angemeldet als {{email}}",
  "settings.changePasswordTitle": "Passwort ändern",
  "settings.changePasswordSubtitle":
    "Willkommen zurück! Geben Sie ein neues, sicheres Passwort ein und speichern Sie es.",
  "settings.currentPassword": "Aktuelles Passwort",
  "settings.updateEmailTitle": "E-Mail-Adresse aktualisieren",
  "settings.updateEmailLabel": "Neue E-Mail-Adresse eingeben",
  "settings.updateEmailPlaceholder": "example@email.com",
  "settings.updateEmailHint": "Eine Bestätigungs-E-Mail wird an die eingegebene Adresse gesendet.",
  "settings.updateEmailConfirm": "Bestätigen",
  "settings.updateEmailTooltip": "E-Mail-Adresse aktualisieren",
  "settings.signOut": "Abmelden",
  "settings.signOutHint":
    "Beendet nur die Anmeldesitzung. Cloud-Sync stoppt, aber lokale Daten auf diesem Gerät bleiben, bis Sie das Konto löschen oder den Tresor zurücksetzen.",
  "settings.deleteAccount": "Konto löschen",
  "settings.deleteAccountHint":
    "Löscht dauerhaft Konto, verschlüsselte Cloud-Sicherung, Lizenzinformationen und Tresordaten auf diesem Gerät. Nicht rückgängig zu machen.",
  "settings.deleteAccountConfirm":
    "Konto {{email}} und alle Daten dauerhaft löschen?\n\nCloud-Sicherung, Lizenz und Tresor auf diesem Gerät werden gelöscht und können nicht wiederhergestellt werden.",
  "settings.deleteAccountFailed": "Konto konnte nicht gelöscht werden. Bitte später erneut versuchen.",
  "settings.deleteAccountNotDeployed":
    "Kontolöschung ist noch nicht bereitgestellt. Bitte delete-account Edge Function bereitstellen (siehe README/docs).",
  "nav.userMenu": "Kontomenü",
  "settings.openAccountPage": "Kontoeinstellungen",
  "account.backToVault": "Zurück zum Tresor",
  "settings.licenseTitle": "Tarif & Eintragslimit",
  "settings.licenseFree":
    "Kostenlos: bis zu {{limit}} Passworteinträge für dieses Konto. Der Server kann Passwortinhalte nicht lesen.",
  "settings.licensePaid":
    "Dauerlizenz: $4,99 einmalig. An das angemeldete Konto gebunden.",
  "settings.licenseStatusLicensed": "Ihr Konto hat eine Dauerlizenz (unbegrenzte Einträge).",
  "settings.licenseStatusFree": "Sie nutzen den kostenlosen Tarif ({{count}} / {{limit}} Einträge verwendet).",
  "settings.licenseLoading": "Lizenz wird geprüft…",
  "settings.licenseLink": "Tarife & Preise öffnen",
  "settings.upgradeToPro": "Auf Pro upgraden",
  "settings.licenseRefresh": "Status aktualisieren",
  "settings.planBadgeFree": "FREE",
  "settings.planBadgePro": "PRO",
  "settings.licenseKeyLabel": "Lizenzschlüssel",
  "settings.licenseKeyHint":
    "Referenzwert aus der Zahlung (Stripe-Checkout-Sitzung). Nur lesen, für Ihre Unterlagen.",
  "settings.licenseCopyKey": "Kopieren",
  "settings.licenseKeyCopied": "Kopiert",
  "settings.licenseNoSessionId":
    "Lizenz ist aktiv, aber für dieses Konto ist noch keine Zahlungsreferenz gespeichert.",
  "vault.entryLimitUpgrade": "Upgrade",
  "vault.licenseBadgeFree": "FREE",
  "vault.licenseBadgePro": "PRO",
};

export const SETTINGS_FR: Record<string, string> = {
  "settings.sidebarSection": "Paramètres",
  "settings.navAria": "Sections des paramètres",
  "settings.navGeneral": "Général",
  "settings.navPlan": "Forfait",
  "settings.navSecurity": "Sécurité",
  "settings.navBackup": "Sauvegarde",
  "settings.generalSubtitle": "Verrouillage automatique et autres préférences du coffre sur cet appareil.",
  "settings.securitySubtitle":
    "Ajoutez des passkeys, clés de sécurité et autres méthodes de déverrouillage sans mot de passe.",
  "settings.planSubtitle": "Limites d'entrées et statut de la licence.",
  "settings.backupSubtitle": "Synchronisation cloud et fichiers de sauvegarde hors ligne optionnels.",
  "settings.accountSubtitle": "Profil, connexion et actions du compte.",
  "settings.languageHint": "S'applique à l'interface de l'application sur cet appareil.",
  "settings.passkeysTitle": "Passkeys et déverrouillage",
  "settings.passkeysHint":
    "Ajoutez une clé de sécurité, un autre appareil ou la biométrie pour déverrouiller sans mot de passe principal.",
  "settings.passkeysListAria": "Passkeys enregistrées",
  "settings.passkeysRegisteredLabel": "Enregistrées",
  "settings.passkeysUnnamed": "Passkey",
  "settings.passkeysEmpty": "Aucune passkey enregistrée pour l'instant.",
  "settings.passkeysAddLabel": "Ajouter",
  "settings.passkeysAdding": "Enregistrement…",
  "settings.passkeysAdded": "Passkey ajoutée.",
  "settings.passkeysAddPlatformHint":
    "Utilise la biométrie, le PIN de l'appareil ou une autre méthode de déverrouillage sur cet appareil.",
  "settings.passkeysAddSecurityKeyHint":
    "Clé de sécurité USB, NFC ou Bluetooth (YubiKey, etc.).",
  "settings.passkeysAddPhoneHint":
    "Scannez un code QR pour enregistrer une passkey sur votre téléphone ou tablette.",
  "settings.syncTitle": "Appareils et sauvegarde",
  "settings.syncHint":
    "Une fois connecté, cette app enregistre une copie chiffrée dans la base de données (le serveur ne peut pas lire le contenu). Sur un nouveau navigateur ou téléphone, connectez-vous avec le même compte pour synchroniser le coffre, puis déverrouillez avec le même mot de passe principal et le code à 6 chiffres ou code de récupération.",
  "settings.fileBackupAdvanced": "Fichier JSON hors ligne (avancé)",
  "settings.fileBackupAdvancedHint":
    "Facultatif. Importez uniquement les .json exportés depuis cette app. Les données sont chiffrées de la même façon ; le mot de passe principal et le code à 6 chiffres doivent correspondre au coffre lors de la création du fichier.",
  "settings.exportBackup": "Télécharger la sauvegarde (.json)",
  "settings.copyBackupFail": "Impossible de copier (taille ou permission). Utilisez le téléchargement.",
  "settings.importBackup": "Importer une sauvegarde…",
  "settings.importConfirm":
    "Remplacer le coffre de cet appareil par la sauvegarde ? Les modifications non enregistrées seront perdues et vous devrez déverrouiller à nouveau.",
  "settings.importApply": "Remplacer et verrouiller",
  "settings.importCancel": "Annuler l'importation",
  "settings.accountTitle": "Compte",
  "settings.signedInAs": "Connecté en tant que {{email}}",
  "settings.changePasswordTitle": "Changer le mot de passe",
  "settings.changePasswordSubtitle":
    "Bon retour ! Saisissez un nouveau mot de passe fort et enregistrez-le.",
  "settings.currentPassword": "Mot de passe actuel",
  "settings.updateEmailTitle": "Mettre à jour l'adresse e-mail",
  "settings.updateEmailLabel": "Saisissez une nouvelle adresse e-mail",
  "settings.updateEmailPlaceholder": "example@email.com",
  "settings.updateEmailHint": "Un e-mail de confirmation sera envoyé à l'adresse saisie.",
  "settings.updateEmailConfirm": "Confirmer",
  "settings.updateEmailTooltip": "Mettre à jour l'adresse e-mail",
  "settings.signOut": "Se déconnecter",
  "settings.signOutHint":
    "Met fin à la session uniquement. La synchronisation cloud s'arrête, mais les données locales sur cet appareil restent jusqu'à la suppression du compte ou la réinitialisation du coffre.",
  "settings.deleteAccount": "Supprimer le compte",
  "settings.deleteAccountHint":
    "Supprime définitivement le compte, la sauvegarde chiffrée cloud, les informations de licence et les données du coffre sur cet appareil. Irréversible.",
  "settings.deleteAccountConfirm":
    "Supprimer définitivement le compte {{email}} et toutes les données ?\n\nLa sauvegarde cloud, la licence et le coffre sur cet appareil seront supprimés sans possibilité de récupération.",
  "settings.deleteAccountFailed": "Impossible de supprimer le compte. Réessayez plus tard.",
  "settings.deleteAccountNotDeployed":
    "La suppression de compte n'est pas encore déployée. Déployez l'Edge Function delete-account (voir README/docs).",
  "nav.userMenu": "Menu du compte",
  "settings.openAccountPage": "Préférences du compte",
  "account.backToVault": "Retour au coffre",
  "settings.licenseTitle": "Forfait et limite d'entrées",
  "settings.licenseFree":
    "Gratuit : jusqu'à {{limit}} entrées de mot de passe pour ce compte. Le serveur ne peut pas lire le contenu.",
  "settings.licensePaid":
    "Licence permanente : 4,99 $ en une fois. Liée au compte connecté.",
  "settings.licenseStatusLicensed": "Votre compte dispose d'une licence permanente (entrées illimitées).",
  "settings.licenseStatusFree": "Vous êtes sur le forfait gratuit ({{count}} / {{limit}} entrées utilisées).",
  "settings.licenseLoading": "Vérification de la licence…",
  "settings.licenseLink": "Ouvrir forfaits et tarifs",
  "settings.upgradeToPro": "Passer à Pro",
  "settings.licenseRefresh": "Actualiser le statut",
  "settings.planBadgeFree": "FREE",
  "settings.planBadgePro": "PRO",
  "settings.licenseKeyLabel": "Clé de licence",
  "settings.licenseKeyHint":
    "Valeur de référence du paiement (session de paiement Stripe). Lecture seule, pour vos archives.",
  "settings.licenseCopyKey": "Copier",
  "settings.licenseKeyCopied": "Copié",
  "settings.licenseNoSessionId":
    "La licence est active, mais aucune référence de paiement n'est encore enregistrée pour ce compte.",
  "vault.entryLimitUpgrade": "Mettre à niveau",
  "vault.licenseBadgeFree": "FREE",
  "vault.licenseBadgePro": "PRO",
};

export const SETTINGS_IT: Record<string, string> = {
  "settings.sidebarSection": "Impostazioni",
  "settings.navAria": "Sezioni impostazioni",
  "settings.navGeneral": "Generale",
  "settings.navPlan": "Piano",
  "settings.navSecurity": "Sicurezza",
  "settings.navBackup": "Backup",
  "settings.generalSubtitle": "Blocco automatico e altre preferenze del vault su questo dispositivo.",
  "settings.securitySubtitle":
    "Aggiungi passkey, chiavi di sicurezza e altri metodi di sblocco senza password.",
  "settings.planSubtitle": "Limiti di voci e stato della licenza.",
  "settings.backupSubtitle": "Sincronizzazione cloud e file di backup offline opzionali.",
  "settings.accountSubtitle": "Profilo, accesso e azioni dell'account.",
  "settings.languageHint": "Si applica all'interfaccia dell'app su questo dispositivo.",
  "settings.passkeysTitle": "Passkey e sblocco",
  "settings.passkeysHint":
    "Aggiungi chiavi di sicurezza, un altro dispositivo o la biometria per sbloccare senza la password principale.",
  "settings.passkeysListAria": "Passkey registrate",
  "settings.passkeysRegisteredLabel": "Registrate",
  "settings.passkeysUnnamed": "Passkey",
  "settings.passkeysEmpty": "Nessuna passkey registrata.",
  "settings.passkeysAddLabel": "Aggiungi",
  "settings.passkeysAdding": "Registrazione…",
  "settings.passkeysAdded": "Passkey aggiunta.",
  "settings.passkeysAddPlatformHint":
    "Usa biometria, PIN del dispositivo o un altro metodo di sblocco su questo dispositivo.",
  "settings.passkeysAddSecurityKeyHint":
    "Chiave di sicurezza USB, NFC o Bluetooth (YubiKey, ecc.).",
  "settings.passkeysAddPhoneHint":
    "Scansiona un codice QR per registrare una passkey su telefono o tablet.",
  "settings.syncTitle": "Dispositivi e backup",
  "settings.syncHint":
    "Quando accedi, questa app salva una copia crittografata nel database (il server non può leggere il contenuto). Su un nuovo browser o telefono, accedi con lo stesso account per sincronizzare il vault e sbloccalo con la stessa password principale e codice a 6 cifre o codice di recupero.",
  "settings.fileBackupAdvanced": "File JSON offline (avanzato)",
  "settings.fileBackupAdvancedHint":
    "Opzionale. Importa solo .json esportati da questa app. I dati sono crittografati allo stesso modo; password principale e codice a 6 cifre devono corrispondere al vault al momento della creazione del file.",
  "settings.exportBackup": "Scarica backup (.json)",
  "settings.copyBackupFail": "Impossibile copiare (dimensione o permesso). Usa il download.",
  "settings.importBackup": "Importa backup…",
  "settings.importConfirm":
    "Sostituire il vault di questo dispositivo con il backup? Le modifiche non salvate andranno perse e dovrai sbloccare di nuovo.",
  "settings.importApply": "Sostituisci e blocca",
  "settings.importCancel": "Annulla importazione",
  "settings.accountTitle": "Account",
  "settings.signedInAs": "Accesso effettuato come {{email}}",
  "settings.changePasswordTitle": "Cambia password",
  "settings.changePasswordSubtitle":
    "Bentornato! Inserisci una nuova password sicura e salvala.",
  "settings.currentPassword": "Password attuale",
  "settings.updateEmailTitle": "Aggiorna indirizzo e-mail",
  "settings.updateEmailLabel": "Inserisci un nuovo indirizzo e-mail",
  "settings.updateEmailPlaceholder": "example@email.com",
  "settings.updateEmailHint": "Un'e-mail di conferma verrà inviata all'indirizzo inserito.",
  "settings.updateEmailConfirm": "Conferma",
  "settings.updateEmailTooltip": "Aggiorna indirizzo e-mail",
  "settings.signOut": "Esci",
  "settings.signOutHint":
    "Termina solo la sessione di accesso. La sincronizzazione cloud si ferma, ma i dati locali su questo dispositivo restano finché non elimini l'account o reimposti il vault.",
  "settings.deleteAccount": "Elimina account",
  "settings.deleteAccountHint":
    "Elimina definitivamente account, backup crittografato cloud, informazioni di licenza e dati del vault su questo dispositivo. Irreversibile.",
  "settings.deleteAccountConfirm":
    "Eliminare definitivamente l'account {{email}} e tutti i dati?\n\nBackup cloud, licenza e vault su questo dispositivo verranno eliminati senza possibilità di recupero.",
  "settings.deleteAccountFailed": "Impossibile eliminare l'account. Riprova più tardi.",
  "settings.deleteAccountNotDeployed":
    "L'eliminazione dell'account non è ancora distribuita. Distribuisci l'Edge Function delete-account (vedi README/docs).",
  "nav.userMenu": "Menu account",
  "settings.openAccountPage": "Preferenze account",
  "account.backToVault": "Torna al vault",
  "settings.licenseTitle": "Piano e limite voci",
  "settings.licenseFree":
    "Gratuito: fino a {{limit}} voci password per questo account. Il server non può leggere il contenuto.",
  "settings.licensePaid":
    "Licenza permanente: $4,99 una tantum. Collegata all'account con accesso effettuato.",
  "settings.licenseStatusLicensed": "Il tuo account ha una licenza permanente (voci illimitate).",
  "settings.licenseStatusFree": "Sei sul piano gratuito ({{count}} / {{limit}} voci usate).",
  "settings.licenseLoading": "Verifica licenza…",
  "settings.licenseLink": "Apri piani e prezzi",
  "settings.upgradeToPro": "Passa a Pro",
  "settings.licenseRefresh": "Aggiorna stato",
  "settings.planBadgeFree": "FREE",
  "settings.planBadgePro": "PRO",
  "settings.licenseKeyLabel": "Chiave di licenza",
  "settings.licenseKeyHint":
    "Valore di riferimento del pagamento (sessione checkout Stripe). Solo lettura, per archivio personale.",
  "settings.licenseCopyKey": "Copia",
  "settings.licenseKeyCopied": "Copiato",
  "settings.licenseNoSessionId":
    "La licenza è attiva, ma non c'è ancora un riferimento di pagamento salvato per questo account.",
  "vault.entryLimitUpgrade": "Upgrade",
  "vault.licenseBadgeFree": "FREE",
  "vault.licenseBadgePro": "PRO",
};
