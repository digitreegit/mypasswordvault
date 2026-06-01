/** Italian legal copy. */
export default {
  metaTitlePrivacy: "Informativa sulla privacy — My Password Vault",
  metaDescriptionPrivacy: "Informativa sulla privacy di My Password Vault di Skyface, LLC.",
  metaTitleTerms: "Termini di utilizzo — My Password Vault",
  metaDescriptionTerms: "Termini di utilizzo di My Password Vault di Skyface, LLC.",
  legalPrivacyEyebrow: "Informativa sulla privacy",
  legalPrivacyTitle: "Informativa sulla privacy di My Password Vault",
  legalPrivacyIntro_html:
    'Si applica a <strong>My Password Vault</strong> (il «Prodotto»), inclusa l\'applicazione web e i client correlati distribuiti da <strong>Skyface, LLC</strong> («noi»).',
  legalPrivacyBody_html: `<h2>Sintesi</h2>
        <p>My Password Vault è progettato come <strong>cassaforte local-first</strong>: le voci sono crittografate sul dispositivo prima di uscire dal vostro controllo. La sincronizzazione cloud opzionale memorizza <strong>solo testo cifrato</strong> collegato al vostro accesso — progettiamo il sistema affinché <strong>non possiamo leggere le password decifrate</strong>.</p>
        <p>Questa Informativa spiega categorie di informazioni, ubicazione, partner e limiti di responsabilità, così sapete cosa garantiamo — e cosa resta con voi per design o per legge.</p>
        <h2>1. Dati che trattiamo (e finalità)</h2>
        <ul>
          <li><strong>Account e accesso:</strong> Alla creazione dell'account (e-mail/password e/o accesso Google) trattiamo ID utente, e-mail e metadati del metodo di accesso per autenticarvi e gestire l'account.</li>
          <li><strong>Payload crittografati della cassaforte:</strong> Con sync cloud memorizziamo blob crittografati e metadati grossolani per riconciliare versioni — non password in chiaro né segreti TOTP.</li>
          <li><strong>Licenza e acquisti:</strong> Per l'upgrade PRO permanente memorizziamo stato licenza, data, riferimento sessione Stripe Checkout e importo legati all'e-mail. <strong>Stripe</strong> elabora i pagamenti con carta; non riceviamo né memorizziamo numeri completi.</li>
          <li><strong>E-mail transazionali:</strong> Accesso e-mail o reset password: il provider invia messaggi all'indirizzo fornito.</li>
          <li><strong>Operazioni e supporto:</strong> E-mail a <a href="mailto:contact@skyface.com">contact@skyface.com</a> trattate per rispondere e migliorare il Prodotto.</li>
          <li><strong>Log tecnici:</strong> Partner di hosting, database e pagamenti possono conservare telemetria standard (IP, timestamp, log errori).</li>
        </ul>
        <h2>2. Cosa resta sul dispositivo e cosa non abbiamo</h2>
        <p>Il Prodotto deriva le chiavi localmente dalla password principale. <strong>Non raccogliamo, memorizziamo né riceviamo la password principale in chiaro.</strong> Non riceviamo chiavi di decifratura per le voci sul dispositivo.</p>
        <p>I campi protetti — password delle voci e segreti TOTP — sono crittografati sull'hardware con <strong>AES-GCM-256</strong> e derivazione PBKDF2-SHA-256 lato client. In sync, <strong>il server rispecchia il testo cifrato</strong>; senza i vostri segreti non può decifrare la cassaforte.</p>
        <h2>3. Servizi di terze parti</h2>
        <ul>
          <li><strong>Autenticazione e database (Supabase):</strong> Accesso e archiviazione record crittografati e metadati licenza.</li>
          <li><strong>Google:</strong> Accesso Google: si applicano i termini privacy di Google a quel flusso.</li>
          <li><strong>Pagamenti (Stripe):</strong> Checkout e elaborazione acquisto PRO una tantum; policy Stripe sui dati di pagamento.</li>
          <li><strong>E-mail (Resend):</strong> Consegna messaggi transazionali (accesso, reset password).</li>
          <li><strong>Infrastruttura/hosting/CDN:</strong> Il Prodotto può essere erogato via Vercel o reti simili.</li>
        </ul>
        <p>Questi fornitori trattano dati limitati come responsabili del trattamento; si applicano anche i loro termini.</p>
        <h2>4. Analisi, pubblicità, vendita dati</h2>
        <p><strong>Non vendiamo informazioni personali</strong> e <strong>non</strong> mostriamo pubblicità di terzi nell'esperienza cassaforte. Non compriamo/vendiamo liste di credenziali — le password sono vostre.</p>
        <h2>5. Backup ed export</h2>
        <p>I backup locali opzionali (export JSON offline) sono sotto il vostro controllo. Se li allegati a e-mail o cloud, assumete quel rischio; non possiamo proteggere copie duplicate altrove.</p>
        <h2>6. Conservazione ed eliminazione account</h2>
        <p>Conserviamo account, testo cifrato e licenza finché l'account è attivo, salvo conservazione limitata per legge (es. prevenzione frodi). I partner di pagamento possono conservare fatture secondo le proprie policy.</p>
        <p>Eliminazione permanente da <strong>Impostazioni → Account → Elimina account</strong>. Rimuove backup cloud crittografato, licenza e account di accesso. I dati locali sono cancellati sul dispositivo dove confermate. Contatto: <a href="mailto:contact@skyface.com">contact@skyface.com</a>.</p>
        <h2>7. I vostri diritti privacy</h2>
        <p>A seconda della giurisdizione, potreste avere diritti di accesso, rettifica, cancellazione o limitazione. Non potendo decifrare la cassaforte, aiutiamo solo sui dati di account che deteniamo. Richieste a <a href="mailto:contact@skyface.com">contact@skyface.com</a>; possibile verifica identità.</p>
        <h2>8. Privacy dei minori</h2>
        <p>Il Prodotto <strong>non è destinato a minori di 13 anni</strong> (o età minima locale). Non raccogliamo consapevolmente dati personali di minori.</p>
        <h2>9. Sicurezza e vostre responsabilità</h2>
        <p>La sicurezza è a strati: crittografia nel browser, TLS in transito (HTTPS), controlli accesso database. <strong>Nessun sistema è perfetto.</strong></p>
        <p>Responsabilità: password principale forte, protezione dispositivi, export al sicuro, verifica authenticator dopo perdita, consapevolezza phishing. <strong>Configurazione errata, malware, phishing, riuso password, perdita authenticator/backup</strong> o <strong>siti HTTP</strong> possono vanificare buoni design — rischi fuori dal nostro controllo.</p>
        <h2>10. Garanzie ed esclusioni di Skyface (sintesi)</h2>
        <p><strong>Ci impegniamo a trasparenza e salvaguardie standard del settore</strong>, inclusa crittografia lato client e conoscenza minima del server.</p>
        <ul>
          <li><strong>Non garantiamo</strong> disponibilità ininterrotta o priva di errori, né immunità da vulnerabilità non divulgate in browser, OS, librerie crypto, provider o uso improprio.</li>
          <li><strong>Nella misura massima consentita dalla legge,</strong> escludiamo responsabilità per danni indiretti, incidentali, speciali, consequenziali o punitivi, e accessi non autorizzati dopo compromissione di credenziali/export sul dispositivo.</li>
          <li><strong>Eccezioni giurisdizionali:</strong> Alcune regioni non consentono certe esclusioni; dove vietato, i limiti si applicano solo nella misura permessa.</li>
        </ul>
        <p>Vedi i nostri <a href="./terms.html">Termini di utilizzo</a> per ulteriori limiti di garanzia e responsabilità.</p>
        <h2>11. Utenti internazionali</h2>
        <p>Server e responsabili del trattamento possono risiedere negli USA o altrove. Usando il cloud, riconoscete trasferimenti transfrontalieri necessari con garanzie contrattuali standard dei responsabili.</p>
        <h2>12. Modifiche</h2>
        <p>Possiamo aggiornare materialmente questa Informativa; pubblichiamo gli aggiornamenti qui con data «Ultimo aggiornamento» rivista. L'uso continuato dopo le modifiche implica accettazione, ove consentito.</p>
        <h2>13. Contatto</h2>
        <p>Domande su privacy o esercizio diritti:<br />E-mail <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />Sito <a href="https://skyface.com/">https://skyface.com/</a></p>`,
  legalPrivacyUpdated: "<em>Ultimo aggiornamento: 1 giugno 2026</em>",
  legalTermsEyebrow: "Note legali",
  legalTermsTitle: "Termini di utilizzo",
  legalTermsIntro_html:
    'Questi Termini di utilizzo («Termini») regolano l\'accesso a <strong>My Password Vault</strong> (il «Prodotto»), incluso questo sito, l\'applicazione web, la sincronizzazione cloud e gli acquisti, e il rapporto con <strong>Skyface, LLC</strong> («noi»). Gli store possono imporre termini aggiuntivi.',
  legalTermsBody_html: `<h2>1. Accordo e privacy</h2>
          <p>Creando un account, accedendo o usando il Prodotto, accettate questi Termini e la nostra <a href="./privacy.html">Informativa sulla privacy</a>. Se non siete d'accordo, non usate il Prodotto.</p>
          <h2>2. Non consulenza professionale</h2>
          <p>I materiali descrivono concetti di sicurezza in termini generali. <strong>Non costituiscono consulenza legale, finanziaria o di conformità</strong>. <strong>Lei</strong> è responsabile di come usa il Prodotto (inclusa la protezione della password principale, passkey e materiali di recupero) e di stabilire se il Prodotto soddisfa le sue esigenze personali o organizzative e gli obblighi normativi applicabili. <strong>Noi</strong> (Skyface, LLC) selezioniamo, contrattiamo e restiamo responsabili dell'infrastruttura di terzi che usiamo per operare il Prodotto (autenticazione, sync cloud, pagamenti e hosting), fatti salvi i limiti di questi Termini.</p>
          <h2>3. Idoneità e account</h2>
          <p>Dovete avere almeno <strong>13 anni</strong> (o età minima locale). Siete responsabili dell'attività sotto il vostro account, riservatezza delle credenziali e password principale forte. Segnalate accessi sospetti a <a href="mailto:contact@skyface.com">contact@skyface.com</a>.</p>
          <h2>4. Piani, pagamenti e rimborsi</h2>
          <p>Il piano gratuito include un numero limitato di voci. Un upgrade <strong>una tantum</strong> sblocca voci illimitate; prezzo mostrato nel Prodotto (attualmente <strong>4,99 USD</strong> salvo modifica nella pagina prezzi). Pagamenti via <strong>Stripe</strong>; non memorizziamo numeri completi di carta. Acquisti generalmente <strong>senza abbonamento</strong> e definitivi salvo obbligo di legge o rimborso approvato a nostra discrezione. Richieste a <a href="mailto:contact@skyface.com">contact@skyface.com</a>.</p>
          <h2>5. Uso accettabile</h2>
          <p>Usate il Prodotto solo per gestione legale di password personale o interna. Vietato l'uso improprio — accesso non autorizzato, interferenza con altri utenti, scraping, reverse engineering per aggirare la sicurezza o violazione di legge. Possiamo sospendere o terminare l'accesso se necessario.</p>
          <h2>6. Dati e responsabilità di sicurezza</h2>
          <p>Il Prodotto è una <strong>cassaforte crittografata local-first</strong>. Non possiamo recuperare la password principale né decifrare senza di essa. Siete responsabili della sicurezza del dispositivo, backup ed export esterni. Vedi <a href="./privacy.html">Informativa sulla privacy</a>.</p>
          <h2>7. Eliminazione account</h2>
          <p>Eliminazione permanente da <strong>Impostazioni → Account → Elimina account</strong>, rimuove backup cloud, licenza e account come descritto nell'Informativa. Dati locali cancellati sul dispositivo di conferma.</p>
          <h2>8. Disponibilità e modifiche del servizio</h2>
          <p>Possiamo modificare, sospendere o interrompere parti del Prodotto o sito in qualsiasi momento. Nessuna garanzia di disponibilità ininterrotta o priva di errori. Funzionalità, limiti e prezzi possono cambiare; modifiche materiali ai prezzi sulla pagina prezzi quando praticabile.</p>
          <h2>9. Proprietà intellettuale</h2>
          <p>Marchio, testi e asset visivi appartengono a Skyface, LLC o licenzianti salvo diversa indicazione. Nessuna copia o ridistribuzione commerciale senza permesso. Il contenuto della cassaforte resta vostro.</p>
          <h2>10. Esclusione di garanzie</h2>
          <p>Sito e Prodotto sono forniti <strong>«così com'è»</strong> nella misura massima consentita. Esclusione di garanzie implicite di commerciabilità, idoneità e non violazione, ove consentito.</p>
          <h2>11. Limitazione di responsabilità</h2>
          <p>Nella misura massima consentita, Skyface, LLC non sarà responsabile per danni indiretti, incidentali, speciali, consequenziali o punitivi, o perdita di profitti, dati o goodwill, inclusa perdita di accesso alla cassaforte se perdete password principale o backup.</p>
          <h2>12. Modifiche a questi Termini</h2>
          <p>Possiamo aggiornare questi Termini; la data «Ultimo aggiornamento» cambierà. L'uso continuato implica accettazione, ove consentito.</p>
          <h2>13. Contatto</h2>
          <p>Domande su questi Termini:<br />E-mail <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />Sito <a href="https://skyface.com/">https://skyface.com/</a></p>`,
  legalTermsUpdated: "<em>Ultimo aggiornamento: 1 giugno 2026</em>",
};
