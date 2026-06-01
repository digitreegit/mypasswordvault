/** German legal copy. */
export default {
  metaTitlePrivacy: "Datenschutzerklärung — My Password Vault",
  metaDescriptionPrivacy: "Datenschutzerklärung für My Password Vault von Skyface, LLC.",
  metaTitleTerms: "Nutzungsbedingungen — My Password Vault",
  metaDescriptionTerms: "Nutzungsbedingungen für My Password Vault von Skyface, LLC.",
  legalPrivacyEyebrow: "Datenschutzerklärung",
  legalPrivacyTitle: "Datenschutzerklärung für My Password Vault",
  legalPrivacyIntro_html:
    'Gilt für <strong>My Password Vault</strong> (das „Produkt“), einschließlich Webanwendung und begleitender Clients, bereitgestellt von <strong>Skyface, LLC</strong> („wir“).',
  legalPrivacyBody_html: `<h2>Zusammenfassung</h2>
        <p>My Password Vault ist als <strong>local-first-Tresor</strong> aufgebaut: Einträge werden auf Ihrem Gerät verschlüsselt, bevor sie Ihre Kontrolle verlassen. Optionale Cloud-Synchronisation speichert <strong>nur Chiffretext</strong>, der an Ihre Anmeldung gebunden ist — wir gestalten das System absichtlich so, dass <strong>wir Ihre entschlüsselten Passwörter nicht lesen können</strong>.</p>
        <p>Diese Erklärung beschreibt Informationskategorien, Speicherorte, Partner und Haftungsgrenzen, damit Sie wissen, wofür wir einstehen — und was bei Ihnen verbleibt, ob durch Design oder Gesetz.</p>
        <h2>1. Daten, die wir verarbeiten (und Zweck)</h2>
        <ul>
          <li><strong>Konto &amp; Anmeldung:</strong> Bei Kontoerstellung (E-Mail/Passwort und/oder Google-Anmeldung) verarbeiten wir Kennungen wie Benutzer-ID, E-Mail und Anmeldemetadaten zur Authentifizierung und Kontoführung.</li>
          <li><strong>Verschlüsselte Tresor-Payloads:</strong> Bei Cloud-Sync speichern wir verschlüsselte Blobs und grobe Metadaten zur Versionsabgleich (z. B. Zeitstempel, Eintragszahlen) — keine Klartext-Passwörter oder TOTP-Geheimnisse.</li>
          <li><strong>Lizenz &amp; Kauf:</strong> Beim permanenten PRO-Upgrade speichern wir Lizenzstatus, Kaufdatum, Stripe-Checkout-Sitzungsreferenz und Betrag, gebunden an Ihre Konto-E-Mail. <strong>Stripe</strong> verarbeitet Kartenzahlungen; wir erhalten oder speichern keine vollständigen Kartennummern.</li>
          <li><strong>Transaktions-E-Mails:</strong> Bei E-Mail-Anmeldung oder Passwort-Reset liefert unser E-Mail-Anbieter Nachrichten an die von Ihnen angegebene Adresse.</li>
          <li><strong>Betrieb &amp; Support:</strong> E-Mails an <a href="mailto:contact@skyface.com">contact@skyface.com</a> verarbeiten wir zur Beantwortung und Produktverbesserung.</li>
          <li><strong>Technische Protokolle:</strong> Hosting-, Datenbank- und Zahlungspartner können Standard-Telemetrie (IPs, Zeitstempel, Fehlerprotokolle) aufbewahren.</li>
        </ul>
        <h2>2. Was auf Ihrem Gerät bleibt &amp; was wir bewusst nicht haben</h2>
        <p>Das Produkt leitet Verschlüsselungsschlüssel lokal aus Ihrem Master-Passwort ab. <strong>Wir erfassen, speichern oder empfangen Ihr Master-Passwort nicht im Klartext.</strong> Auch keine entschlüsselungsfähigen Schlüssel für Geräteeinträge.</p>
        <p>Geschützte Felder — einschließlich Eintragspasswörter und TOTP-Geheimnisse — werden clientseitig mit <strong>AES-GCM-256</strong> und PBKDF2-SHA-256 abgeleitet verschlüsselt. Bei Sync <strong>spiegelt der Server Chiffretext</strong>; ohne Ihre Geheimnisse kann er den Tresor nicht sinnvoll entschlüsseln.</p>
        <h2>3. Drittanbieter</h2>
        <ul>
          <li><strong>Authentifizierung &amp; Datenbank (Supabase):</strong> Anmeldung und Speicher verschlüsselter Tresordaten und Lizenzmetadaten.</li>
          <li><strong>Google:</strong> Bei Google-Anmeldung gelten Googles Datenschutzbedingungen für diesen Flow.</li>
          <li><strong>Zahlungen (Stripe):</strong> Checkout und Verarbeitung des einmaligen PRO-Kaufs; Stripes Richtlinien gelten für Zahlungsdaten.</li>
          <li><strong>E-Mail (Resend):</strong> Zustellung transaktionaler Nachrichten wie Anmeldung und Passwort-Reset.</li>
          <li><strong>Infrastruktur/Hosting/CDN:</strong> Bereitstellung u. a. über Vercel oder ähnliche Anbieter.</li>
        </ul>
        <p>Diese Anbieter verarbeiten begrenzte Daten als Auftragsverarbeiter; deren Bedingungen gelten ebenfalls.</p>
        <h2>4. Analyse, Werbung, Datenverkauf</h2>
        <p>Wir <strong>verkaufen keine personenbezogenen Daten</strong> und schalten <strong>keine</strong> Drittanbieter-Werbung im Tresor. Wir kaufen/verkaufen keine Credential-Listen — Ihre Passwörter gehören Ihnen.</p>
        <h2>5. Backups &amp; Exporte</h2>
        <p>Optionale lokale Backups (Offline-JSON-Exporte) kontrollieren Sie. An E-Mail oder Clouds angehängte Kopien liegen in Ihrem Risikoprofil; freiwillig woanders kopierte Dateien können wir nicht absichern.</p>
        <h2>6. Aufbewahrung &amp; Kontolöschung</h2>
        <p>Wir bewahren Konto-, Chiffretext- und Lizenzdaten auf, solange das Konto aktiv ist, außer gesetzlich erforderliche begrenzte Aufbewahrung (z. B. Betrugsprävention). Zahlungspartner können Abrechnungsdaten nach eigenen Richtlinien aufbewahren.</p>
        <p>Sie können Ihr Konto dauerhaft unter <strong>Einstellungen → Konto → Konto löschen</strong> entfernen. Das löscht verschlüsseltes Cloud-Backup, Lizenzdaten und Ihr Anmeldekonto. Lokale Tresordaten werden auf dem Gerät gelöscht, auf dem Sie bestätigen. Bei Problemen: <a href="mailto:contact@skyface.com">contact@skyface.com</a>.</p>
        <h2>7. Ihre Datenschutzrechte</h2>
        <p>Je nach Wohnort haben Sie ggf. Rechte auf Auskunft, Berichtigung, Löschung oder Einschränkung. Da wir Ihren Tresor nicht entschlüsseln können, helfen wir nur bei Kontodaten, die wir tatsächlich halten. Anfragen an <a href="mailto:contact@skyface.com">contact@skyface.com</a>; Identitätsprüfung möglich.</p>
        <h2>8. Datenschutz von Kindern</h2>
        <p>Das Produkt richtet sich <strong>nicht an Kinder unter 13 Jahren</strong> (oder lokale Mindestaltersgrenzen). Wir erfassen wissentlich keine Kinderdaten.</p>
        <h2>9. Sicherheit &amp; Ihre Pflichten</h2>
        <p>Sicherheit ist mehrschichtig: Browser-Kryptografie, TLS bei HTTPS, Datenbank-Zugriffskontrollen. <strong>Kein System ist perfekt.</strong></p>
        <p>Ihre Pflichten: starkes Master-Passwort, Geräteschutz, Exporte sichern, Authenticator nach Verlust prüfen, Phishing-Bewusstsein. <strong>Fehlkonfiguration, Malware, Phishing, Passwort-Wiederverwendung, Verlust von Authenticator/Backups</strong> oder <strong>HTTP-Seiten</strong> können gute Designs aushebeln — Risiken außerhalb unserer Kontrolle.</p>
        <h2>10. Skyface-Garantien &amp; Haftungsausschlüsse (Kurzform)</h2>
        <p><strong>Wir verpflichten uns zu Transparenz und branchenüblichen Schutzmaßnahmen</strong>, einschließlich clientseitiger Verschlüsselung und minimalem Serverwissen.</p>
        <ul>
          <li>Wir <strong>garantieren nicht</strong> unterbrechungsfreie oder fehlerfreie Verfügbarkeit oder Immunität vor unbekannten Schwachstellen in Browsern, OS, Krypto-Bibliotheken, Anbietern oder Missbrauch.</li>
          <li><strong>Soweit gesetzlich zulässig</strong> schließen wir Haftung für indirekte, beiläufige, besondere, Folge- oder Strafschäden sowie unbefugten Zugriff nach Kompromittierung Ihrer Credentials/Exporte auf Ihren Geräten aus.</li>
          <li><strong>Jurisdiktionsausnahmen:</strong> In manchen Regionen sind bestimmte Ausschlüsse unzulässig; dort gelten Grenzen nur im erlaubten Umfang.</li>
        </ul>
        <p>Siehe unsere <a href="./terms.html">Nutzungsbedingungen</a> für weitere Garantie- und Haftungsbegrenzungen.</p>
        <h2>11. Internationale Nutzer</h2>
        <p>Server und Verarbeiter können in den USA oder anderen Rechtsordnungen stehen. Mit Cloud-Funktionen erkennen Sie grenzüberschreitende Übermittlungen unter vertraglichen Schutzmaßnahmen der Verarbeiter an.</p>
        <h2>12. Änderungen</h2>
        <p>Wir können diese Erklärung wesentlich aktualisieren und veröffentlichen sie hier mit neuem „Zuletzt aktualisiert“-Datum. Fortgesetzte Nutzung nach Änderungen gilt als Zustimmung, soweit erlaubt.</p>
        <h2>13. Kontakt</h2>
        <p>Fragen zum Datenschutz oder Rechten:<br />E-Mail <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />Web <a href="https://skyface.com/">https://skyface.com/</a></p>`,
  legalPrivacyUpdated: "<em>Zuletzt aktualisiert: 1. Juni 2026</em>",
  legalTermsEyebrow: "Rechtliches",
  legalTermsTitle: "Nutzungsbedingungen",
  legalTermsIntro_html:
    'Diese Nutzungsbedingungen („Bedingungen“) regeln Ihren Zugang zu <strong>My Password Vault</strong> (dem „Produkt“), einschließlich Website, Webanwendung, Cloud-Sync und Käufen, sowie Ihr Verhältnis zu <strong>Skyface, LLC</strong> („wir“). App-Stores können zusätzliche Bedingungen vorschreiben.',
  legalTermsBody_html: `<h2>1. Vereinbarung &amp; Datenschutz</h2>
          <p>Mit Kontoerstellung, Anmeldung oder Nutzung stimmen Sie diesen Bedingungen und unserer <a href="./privacy.html">Datenschutzerklärung</a> zu. Wenn nicht einverstanden, nutzen Sie das Produkt nicht.</p>
          <h2>2. Keine professionelle Beratung</h2>
          <p>Materialien beschreiben Sicherheitskonzepte allgemein. Sie sind <strong>keine Rechts-, Finanz- oder Compliance-Beratung</strong>. <strong>Sie</strong> sind für Ihre Nutzung des Produkts (einschließlich Schutz von Master-Passwort, Passkey und Wiederherstellungsmaterial) und dafür verantwortlich, ob das Produkt Ihre persönlichen oder organisatorischen Anforderungen und geltende Regulierung erfüllt. <strong>Wir</strong> (Skyface, LLC) wählen, beauftragen und bleiben verantwortlich für die Drittanbieter-Infrastruktur, die wir zum Betrieb des Produkts nutzen (Authentifizierung, Cloud-Sync, Zahlungen, Hosting), vorbehaltlich der Beschränkungen dieser Bedingungen.</p>
          <h2>3. Berechtigung &amp; Konten</h2>
          <p>Sie müssen mindestens <strong>13 Jahre</strong> alt sein (oder das lokale Mindestalter). Sie sind verantwortlich für Aktivitäten unter Ihrem Konto, Vertraulichkeit der Anmeldedaten und ein starkes Master-Passwort. Bei Verdacht auf unbefugten Zugriff: <a href="mailto:contact@skyface.com">contact@skyface.com</a>.</p>
          <h2>4. Pläne, Zahlungen &amp; Erstattungen</h2>
          <p>Der kostenlose Plan umfasst begrenzte Einträge. Ein <strong>einmaliges</strong> Upgrade schaltet unbegrenzte Einträge frei; Preis im Produkt angezeigt (derzeit <strong>4,99 USD</strong>, sofern nicht auf der Preisseite geändert). Zahlungen über <strong>Stripe</strong>; keine vollständigen Kartennummern bei uns. Käufe sind in der Regel <strong>ohne Abo</strong> und endgültig, außer gesetzlich oder nach unserem Ermessen. Erstattungen an <a href="mailto:contact@skyface.com">contact@skyface.com</a>.</p>
          <h2>5. Zulässige Nutzung</h2>
          <p>Nutzen Sie das Produkt nur für rechtmäßige persönliche oder interne Passwortverwaltung. Kein Missbrauch — einschließlich unbefugtem Zugriff, Störung anderer Nutzer, Scraping, Reverse Engineering zum Umgehen der Sicherheit oder Gesetzesverstößen. Wir können den Zugang bei Bedarf sperren oder beenden.</p>
          <h2>6. Ihre Daten &amp; Sicherheitspflichten</h2>
          <p>Das Produkt ist ein <strong>local-first verschlüsselter Tresor</strong>. Ohne Master-Passwort keine Wiederherstellung oder Entschlüsselung. Sie sind verantwortlich für Gerätesicherheit, Backups und extern gespeicherte Exporte. Siehe <a href="./privacy.html">Datenschutzerklärung</a>.</p>
          <h2>7. Kontolöschung</h2>
          <p>Dauerhafte Löschung unter <strong>Einstellungen → Konto → Konto löschen</strong> entfernt Cloud-Backup, Lizenz und Anmeldekonto gemäß Datenschutzerklärung. Lokale Daten werden auf dem bestätigenden Gerät gelöscht.</p>
          <h2>8. Verfügbarkeit &amp; Änderungen</h2>
          <p>Wir können Teile des Produkts oder der Website jederzeit ändern, aussetzen oder einstellen. Keine Garantie für unterbrechungsfreie oder fehlerfreie Verfügbarkeit. Funktionen, Limits und Preise können sich ändern; wesentliche Preisänderungen auf der Preisseite, wo praktikabel.</p>
          <h2>9. Geistiges Eigentum</h2>
          <p>Marke, Texte und visuelle Assets gehören Skyface, LLC oder Lizenzgebern, sofern nicht anders angegeben. Keine kommerzielle Vervielfältigung ohne Erlaubnis. Tresor-Inhalte bleiben Ihre.</p>
          <h2>10. Gewährleistungsausschluss</h2>
          <p>Website und Produkt werden <strong>„wie besehen“</strong> im gesetzlich zulässigen Umfang bereitgestellt. Ausschluss stillschweigender Gewährleistungen der Marktgängigkeit, Eignung und Nichtverletzung, soweit erlaubt.</p>
          <h2>11. Haftungsbeschränkung</h2>
          <p>Soweit gesetzlich zulässig haftet Skyface, LLC nicht für indirekte, beiläufige, besondere, Folge- oder Strafschäden oder entgangenen Gewinn, Daten- oder Goodwill-Verlust, einschließlich Tresor-Zugangsverlust bei verlorenem Master-Passwort oder Backups.</p>
          <h2>12. Änderungen dieser Bedingungen</h2>
          <p>Wir können diese Bedingungen aktualisieren; das „Zuletzt aktualisiert“-Datum ändert sich. Fortgesetzte Nutzung gilt als Zustimmung, soweit erlaubt.</p>
          <h2>13. Kontakt</h2>
          <p>Fragen zu diesen Bedingungen:<br />E-Mail <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />Web <a href="https://skyface.com/">https://skyface.com/</a></p>`,
  legalTermsUpdated: "<em>Zuletzt aktualisiert: 1. Juni 2026</em>",
};
