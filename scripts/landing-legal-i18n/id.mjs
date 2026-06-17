/** Indonesian legal copy. */
export default {
  metaTitlePrivacy: "Kebijakan Privasi — My Password Vault",
  metaDescriptionPrivacy:
    "Kebijakan Privasi My Password Vault oleh Skyface, LLC — enkripsi lokal-first, sinkron hanya ciphertext, dan apa yang tidak pernah kami simpan.",
  metaTitleTerms: "Ketentuan Penggunaan — My Password Vault",
  metaDescriptionTerms:
    "Ketentuan Penggunaan My Password Vault oleh Skyface, LLC — akun, pembelian, penggunaan yang dapat diterima, dan tanggung jawab.",
  legalPrivacyEyebrow: "Kebijakan privasi",
  legalPrivacyTitle: "Kebijakan Privasi My Password Vault",
  legalPrivacyIntro_html:
    'Berlaku untuk <strong>My Password Vault</strong> (「Produk」), termasuk aplikasi web dan klien pendamping yang didistribusikan oleh <strong>Skyface, LLC</strong> («kami»).',
  legalPrivacyBody_html: `<h2>Ringkasan</h2>
        <p>My Password Vault dirancang sebagai <strong>brankas local-first</strong>: entri Anda dienkripsi di perangkat sebelum keluar dari kendali Anda. Sinkronisasi cloud opsional menyimpan <strong>hanya ciphertext</strong> yang terikat ke sign-in Anda — kami sengaja merancang sistem agar <strong>kami tidak dapat membaca kata sandi terdekripsi Anda</strong>.</p>
        <p>Kebijakan ini menjelaskan kategori informasi, lokasi penyimpanan, mitra yang kami andalkan, dan batas tanggung jawab, agar Anda tahu apa yang kami dukung — dan apa yang tetap bersama Anda by design atau oleh hukum.</p>
        <h2>1. Data yang kami sentuh (dan tujuan)</h2>
        <ul>
          <li><strong>Akun &amp; sign-in:</strong> Saat membuat akun (email/kata sandi dan/atau sign-in Google), kami memproses ID pengguna, email, dan metadata metode sign-in untuk autentikasi dan operasi akun.</li>
          <li><strong>Payload brankas terenkripsi:</strong> Dengan sync cloud, kami menyimpan blob terenkripsi dan metadata kasar untuk rekonsiliasi versi — bukan kata sandi plaintext atau rahasia TOTP.</li>
          <li><strong>Lisensi &amp; pembelian:</strong> Untuk upgrade PRO permanen, kami menyimpan status lisensi, tanggal, referensi sesi Stripe Checkout, dan jumlah terkait email akun. <strong>Stripe</strong> memproses pembayaran kartu; kami tidak menerima atau menyimpan nomor kartu lengkap.</li>
          <li><strong>Email transaksional:</strong> Sign-in email atau reset kata sandi: penyedia email mengirim pesan ke alamat yang Anda berikan.</li>
          <li><strong>Operasional &amp; dukungan:</strong> Email ke <a href="mailto:contact@skyface.com">contact@skyface.com</a> diproses untuk membalas dan meningkatkan Produk.</li>
          <li><strong>Log teknis:</strong> Mitra hosting, database, dan pembayaran dapat menyimpan telemetri standar (IP, timestamp, log error).</li>
        </ul>
        <h2>2. Apa yang tetap di perangkat &amp; apa yang sengaja tidak kami miliki</h2>
        <p>Produk menurunkan kunci enkripsi secara lokal dari kata sandi master Anda. <strong>Kami tidak mengumpulkan, menyimpan, atau menerima kata sandi master dalam plaintext.</strong> Kami juga tidak menerima kunci dekripsi untuk entri di perangkat.</p>
        <p>Field terlindungi — termasuk kata sandi entri dan rahasia TOTP — dienkripsi di hardware dengan <strong>AES-GCM-256</strong> dan derivasi PBKDF2-SHA-256 di klien. Saat sync, <strong>server mencerminkan ciphertext</strong>; tanpa rahasia Anda, server tidak dapat mendekripsi brankas secara bermakna.</p>
        <h2>3. Layanan pihak ketiga</h2>
        <ul>
          <li><strong>Autentikasi &amp; database (Supabase):</strong> Sign-in akun dan penyimpanan record brankas terenkripsi serta metadata lisensi.</li>
          <li><strong>Google:</strong> Sign-in Google: ketentuan privasi Google berlaku untuk alur tersebut.</li>
          <li><strong>Pembayaran (Stripe):</strong> Checkout dan pemrosesan pembelian PRO sekali bayar; kebijakan Stripe berlaku untuk data pembayaran.</li>
          <li><strong>Email (Resend):</strong> Pengiriman pesan transaksional seperti sign-in dan reset kata sandi.</li>
          <li><strong>Infrastruktur/hosting/CDN:</strong> Produk dapat disampaikan melalui Vercel atau jaringan serupa.</li>
        </ul>
        <p>Vendor ini memproses data terbatas sebagai processor/sub-processor; ketentuan mereka juga berlaku.</p>
        <h2>4. Analitik, iklan, penjualan data</h2>
        <p>Kami <strong>tidak menjual informasi pribadi</strong> dan <strong>tidak</strong> menampilkan iklan pihak ketiga dalam pengalaman brankas. Kami tidak dengan sengaja membeli/menjual daftar kredensial — kata sandi Anda milik Anda.</p>
        <h2>5. Backup &amp; ekspor</h2>
        <p>Backup lokal opsional (ekspor JSON offline) berada di bawah kendali Anda. Jika dilampirkan ke email atau cloud, risiko itu pilihan Anda; kami tidak dapat mengamankan salinan yang Anda salin ke tempat lain.</p>
        <h2>6. Retensi &amp; penghapusan akun</h2>
        <p>Kami menyimpan akun, ciphertext, dan lisensi selama akun aktif, kecuali retensi terbatas yang diwajibkan hukum (mis. pencegahan fraud). Mitra pembayaran dapat menyimpan catatan billing sesuai kebijakan mereka.</p>
        <p>Anda dapat menghapus akun secara permanen dari <strong>Pengaturan → Akun → Hapus akun</strong>. Ini menghapus backup cloud terenkripsi, catatan lisensi, dan akun sign-in. Data brankas lokal dihapus di perangkat tempat Anda mengonfirmasi. Hubungi <a href="mailto:contact@skyface.com">contact@skyface.com</a> jika tidak dapat menghapus in-app.</p>
        <h2>7. Hak privasi Anda</h2>
        <p>Tergantung lokasi, Anda mungkin memiliki hak akses, koreksi, penghapusan, atau pembatasan pemrosesan. Karena kami tidak dapat mendekripsi brankas, kami hanya dapat membantu data tingkat akun yang benar-benar kami simpan. Kirim permintaan ke <a href="mailto:contact@skyface.com">contact@skyface.com</a>; kami mungkin perlu verifikasi identitas.</p>
        <h2>8. Privasi anak</h2>
        <p>Produk <strong>tidak ditujukan untuk anak di bawah 13 tahun</strong> (atau ambang usia lokal). Kami tidak dengan sengaja mengumpulkan informasi pribadi anak.</p>
        <h2>9. Keamanan &amp; tanggung jawab Anda</h2>
        <p>Keamanan berlapis: kriptografi di browser, TLS in transit (HTTPS), kontrol akses database. <strong>Tidak ada sistem yang sempurna.</strong></p>
        <p>Tanggung jawab Anda: kata sandi master kuat, melindungi perangkat, mengamankan ekspor, memverifikasi authenticator setelah kehilangan, kesadaran phishing. <strong>Konfigurasi salah, malware, phishing, reuse kata sandi, kehilangan authenticator/backup</strong>, atau <strong>situs HTTP</strong> dapat mengalahkan desain baik — risiko di luar kendali kami setelah data meninggalkan perlindungan default.</p>
        <h2>10. Jaminan &amp; disclaimer Skyface (ringkas)</h2>
        <p><strong>Kami berkomitmen pada kejujuran dan safeguard standar industri</strong>, termasuk enkripsi sisi klien dan pengetahuan server minimal.</p>
        <ul>
          <li>Kami <strong>tidak menjamin</strong> ketersediaan tanpa gangguan atau bebas error, atau kekebalan dari kerentanan undisclosed di browser, OS, library kripto, provider, atau penyalahgunaan.</li>
          <li><strong>Sejauh diizinkan hukum,</strong> kami menolak tanggung jawab atas kerugian tidak langsung, insidental, khusus, konsekuensial, atau punitif, dan akses tidak sah setelah kredensial/ekspor dikompromikan di perangkat Anda.</li>
          <li><strong>Pengecualian yurisdiksi:</strong> Beberapa wilayah melarang disclaimer tertentu; di mana dilarang, batas berlaku hanya sejauh diizinkan.</li>
        </ul>
        <p>Lihat <a href="./terms.html">Ketentuan Penggunaan</a> kami untuk batas jaminan dan tanggung jawab tambahan.</p>
        <h2>11. Pengguna internasional</h2>
        <p>Server dan processor dapat berada di AS atau yurisdiksi lain. Dengan menggunakan fitur cloud, Anda mengakui transfer lintas batas yang diperlukan di bawah safeguard kontraktual standar processor.</p>
        <h2>12. Perubahan</h2>
        <p>Kami dapat memperbarui Kebijakan ini secara material; kami memposting pembaruan di sini dengan tanggal «Terakhir diperbarui» yang direvisi. Penggunaan berkelanjutan setelah perubahan berarti penerimaan kebijakan revisi sejauh diizinkan hukum.</p>
        <h2>13. Kontak</h2>
        <p>Pertanyaan privasi atau pelaksanaan hak:<br />Email <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />Situs <a href="https://skyface.com/">https://skyface.com/</a></p>`,
  legalPrivacyUpdated: "<em>Terakhir diperbarui: 1 Juni 2026</em>",
  legalTermsEyebrow: "Legal",
  legalTermsTitle: "Ketentuan Penggunaan",
  legalTermsIntro_html:
    'Ketentuan Penggunaan ini («Ketentuan») mengatur akses Anda ke <strong>My Password Vault</strong> («Produk»), termasuk situs ini, aplikasi web, sinkronisasi cloud, dan pembelian, serta hubungan Anda dengan <strong>Skyface, LLC</strong> («kami»). App store atau saluran distribusi lain dapat menerapkan ketentuan tambahan.',
  legalTermsBody_html: `<h2>1. Persetujuan &amp; privasi</h2>
          <p>Dengan membuat akun, sign-in, atau menggunakan Produk, Anda setuju dengan Ketentuan ini dan <a href="./privacy.html">Kebijakan Privasi</a> kami. Jika tidak setuju, jangan gunakan Produk.</p>
          <h2>2. Bukan nasihat profesional</h2>
          <p>Materi tentang Produk menjelaskan konsep keamanan secara umum. <strong>Bukan nasihat hukum, keuangan, atau kepatuhan</strong>. <strong>Anda</strong> bertanggung jawab atas cara Anda menggunakan Produk (termasuk melindungi kata sandi master, passkey, dan materi pemulihan) serta menilai apakah Produk memenuhi kebutuhan pribadi atau organisasi Anda dan kewajiban regulasi yang berlaku. <strong>Kami</strong> (Skyface, LLC) memilih, mengontrak, dan tetap bertanggung jawab atas infrastruktur pihak ketiga yang kami gunakan untuk mengoperasikan Produk (autentikasi, sinkronisasi cloud, pembayaran, dan hosting), tunduk pada batasan dalam Ketentuan ini.</p>
          <h2>3. Kelayakan &amp; akun</h2>
          <p>Anda harus berusia minimal <strong>13 tahun</strong> (atau usia minimum lokal). Anda bertanggung jawab atas aktivitas di akun, kerahasiaan kredensial sign-in, dan kata sandi master yang kuat. Beri tahu kami di <a href="mailto:contact@skyface.com">contact@skyface.com</a> jika curiga akses tidak sah.</p>
          <h2>4. Paket, pembayaran &amp; refund</h2>
          <p>Paket gratis mencakup jumlah entri kata sandi terbatas. Upgrade <strong>sekali bayar</strong> membuka entri tak terbatas; harga ditampilkan di Produk (saat ini <strong>USD 4,99</strong> kecuali diubah di halaman harga). Pembayaran diproses <strong>Stripe</strong>; kami tidak menyimpan nomor kartu lengkap. Pembelian umumnya <strong>bukan langganan</strong> dan final kecuali diwajibkan hukum atau refund disetujui atas kebijakan kami. Permintaan refund ke <a href="mailto:contact@skyface.com">contact@skyface.com</a>.</p>
          <h2>5. Penggunaan yang dapat diterima</h2>
          <p>Gunakan Produk hanya untuk manajemen kata sandi pribadi atau bisnis internal yang sah menurut hukum. Dilarang menyalahgunakan — termasuk akses tidak sah, mengganggu pengguna lain, scraping, reverse engineering untuk bypass keamanan, atau melanggar hukum. Kami dapat menangguhkan atau mengakhiri akses jika perlu.</p>
          <h2>6. Data &amp; tanggung jawab keamanan Anda</h2>
          <p>Produk dirancang sebagai <strong>brankas terenkripsi local-first</strong>. Kami tidak dapat memulihkan kata sandi master atau mendekripsi entri tanpanya. Anda bertanggung jawab atas keamanan perangkat, backup, dan ekspor di luar Produk. Lihat <a href="./privacy.html">Kebijakan Privasi</a>.</p>
          <h2>7. Penghapusan akun</h2>
          <p>Anda dapat menghapus akun secara permanen dari <strong>Pengaturan → Akun → Hapus akun</strong>, menghapus backup cloud, lisensi, dan akun sign-in seperti di Kebijakan Privasi. Data lokal dihapus di perangkat konfirmasi.</p>
          <h2>8. Ketersediaan layanan &amp; perubahan</h2>
          <p>Kami dapat mengubah, menangguhkan, atau menghentikan bagian Produk atau situs kapan saja. Tidak menjamin ketersediaan tanpa gangguan atau operasi bebas error. Fitur, batas entri, dan harga dapat berubah; perubahan harga material diposting di halaman harga jika praktis.</p>
          <h2>9. Kekayaan intelektual</h2>
          <p>Merek, teks, dan aset visual milik Skyface, LLC atau pemberi lisensi kecuali dinyatakan lain. Tidak boleh menyalin atau mendistribusikan untuk tujuan komersial tanpa izin. Isi brankas tetap milik Anda.</p>
          <h2>10. Penolakan jaminan</h2>
          <p>Situs dan Produk disediakan <strong>«apa adanya»</strong> sejauh diizinkan hukum. Kami menolak jaminan tersirat merchantability, kesesuaian, dan non-pelanggaran sejauh diizinkan.</p>
          <h2>11. Batas tanggung jawab</h2>
          <p>Sejauh diizinkan hukum, Skyface, LLC tidak bertanggung jawab atas kerugian tidak langsung, insidental, khusus, konsekuensial, atau punitif, atau kehilangan laba, data, atau goodwill, termasuk kehilangan akses brankas jika Anda kehilangan kata sandi master atau backup perangkat.</p>
          <h2>12. Perubahan Ketentuan</h2>
          <p>Kami dapat memperbarui Ketentuan ini; tanggal «Terakhir diperbarui» akan berubah. Penggunaan berkelanjutan berarti penerimaan sejauh diizinkan hukum.</p>
          <h2>13. Kontak</h2>
          <p>Pertanyaan tentang Ketentuan ini:<br />Email <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />Situs <a href="https://skyface.com/">https://skyface.com/</a></p>`,
  legalTermsUpdated: "<em>Terakhir diperbarui: 1 Juni 2026</em>",
};
