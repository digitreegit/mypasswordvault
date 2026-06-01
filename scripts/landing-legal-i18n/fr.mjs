/** French legal copy. */
export default {
  metaTitlePrivacy: "Politique de confidentialité — My Password Vault",
  metaDescriptionPrivacy: "Politique de confidentialité de My Password Vault par Skyface, LLC.",
  metaTitleTerms: "Conditions d'utilisation — My Password Vault",
  metaDescriptionTerms: "Conditions d'utilisation de My Password Vault par Skyface, LLC.",
  legalPrivacyEyebrow: "Politique de confidentialité",
  legalPrivacyTitle: "Politique de confidentialité de My Password Vault",
  legalPrivacyIntro_html:
    'S\'applique à <strong>My Password Vault</strong> (le « Produit »), y compris son application web et clients associés, distribués par <strong>Skyface, LLC</strong> (« nous »).',
  legalPrivacyBody_html: `<h2>Résumé</h2>
        <p>My Password Vault est conçu comme <strong>un coffre local-first</strong> : vos entrées sont chiffrées sur votre appareil avant de quitter votre contrôle. La synchronisation cloud optionnelle stocke <strong>uniquement du texte chiffré</strong> lié à votre connexion — nous concevons le système pour que <strong>nous ne puissions pas lire vos mots de passe déchiffrés</strong>.</p>
        <p>Cette politique explique les catégories d'information, leur emplacement, nos partenaires et les limites de responsabilité, afin que vous sachiez ce que nous garantissons — et ce qui reste avec vous par conception ou par la loi.</p>
        <h2>1. Données que nous traitons (et finalité)</h2>
        <ul>
          <li><strong>Compte et connexion :</strong> Lors de la création d'un compte (e-mail/mot de passe et/ou connexion Google), nous traitons identifiants, e-mail et métadonnées de connexion pour vous authentifier et gérer le compte.</li>
          <li><strong>Charges chiffrées du coffre :</strong> Avec la sync cloud, nous stockons des blobs chiffrés et métadonnées grossières pour réconcilier les versions — pas de mots de passe en clair ni secrets TOTP.</li>
          <li><strong>Licence et achats :</strong> Pour l'upgrade PRO permanent, nous stockons statut de licence, date, référence de session Stripe Checkout et montant liés à votre e-mail. <strong>Stripe</strong> traite les paiements par carte ; nous ne recevons ni ne stockons les numéros complets.</li>
          <li><strong>E-mails transactionnels :</strong> Connexion par e-mail ou réinitialisation : notre fournisseur envoie des messages à l'adresse fournie.</li>
          <li><strong>Exploitation et support :</strong> E-mails à <a href="mailto:contact@skyface.com">contact@skyface.com</a> traités pour répondre et améliorer le Produit.</li>
          <li><strong>Journaux techniques :</strong> Partenaires d'hébergement, base de données et paiement peuvent conserver télémétrie standard (IP, horodatages, journaux d'erreur).</li>
        </ul>
        <h2>2. Ce qui reste sur votre appareil et ce que nous n'avons pas</h2>
        <p>Le Produit dérive les clés localement à partir de votre mot de passe maître. <strong>Nous ne collectons, stockons ni recevons votre mot de passe maître en clair.</strong> Nous ne recevons pas non plus de clés de déchiffrement pour lire les entrées sur l'appareil.</p>
        <p>Les champs protégés — mots de passe d'entrée et secrets TOTP — sont chiffrés sur votre matériel avec <strong>AES-GCM-256</strong> et dérivation PBKDF2-SHA-256 côté client. En sync, <strong>le serveur reflète le texte chiffré</strong> ; sans vos secrets, il ne peut pas déchiffrer le coffre.</p>
        <h2>3. Services tiers</h2>
        <ul>
          <li><strong>Authentification et base de données (Supabase) :</strong> Connexion et stockage des enregistrements chiffrés et métadonnées de licence.</li>
          <li><strong>Google :</strong> Connexion Google : les conditions de confidentialité de Google s'appliquent à ce flux.</li>
          <li><strong>Paiements (Stripe) :</strong> Checkout et traitement de l'achat PRO unique ; la politique Stripe s'applique aux données de paiement.</li>
          <li><strong>E-mail (Resend) :</strong> Livraison de messages transactionnels (connexion, réinitialisation).</li>
          <li><strong>Infrastructure/hébergement/CDN :</strong> Le Produit peut être diffusé via Vercel ou des réseaux similaires.</li>
        </ul>
        <p>Ces prestataires traitent des données limitées en tant que sous-traitants ; leurs conditions s'appliquent également.</p>
        <h2>4. Analyse, publicité, vente de données</h2>
        <p>Nous <strong>ne vendons pas d'informations personnelles</strong> et <strong>n'affichons pas</strong> de publicité tierce dans l'expérience coffre. Nous n'achetons ni ne vendons de listes d'identifiants — vos mots de passe vous appartiennent.</p>
        <h2>5. Sauvegardes et exportations</h2>
        <p>Les sauvegardes locales optionnelles (export JSON hors ligne) sont sous votre contrôle. Si vous les joignez à des e-mails ou clouds, vous assumez ce risque ; nous ne pouvons pas sécuriser les copies que vous dupliquez ailleurs.</p>
        <h2>6. Conservation et suppression de compte</h2>
        <p>Nous conservons compte, texte chiffré et licence tant que le compte est actif, sauf conservation limitée exigée par la loi (p. ex. prévention de fraude). Les partenaires de paiement peuvent conserver des factures selon leurs politiques.</p>
        <p>Suppression permanente via <strong>Paramètres → Compte → Supprimer le compte</strong>. Cela supprime la sauvegarde cloud chiffrée, la licence et le compte de connexion. Les données locales sont effacées sur l'appareil où vous confirmez. Contact : <a href="mailto:contact@skyface.com">contact@skyface.com</a>.</p>
        <h2>7. Vos droits à la vie privée</h2>
        <p>Selon votre lieu de résidence, vous pouvez avoir des droits d'accès, rectification, suppression ou limitation. Comme nous ne pouvons pas déchiffrer votre coffre, nous aidons uniquement pour les données de compte que nous détenons. Demandes à <a href="mailto:contact@skyface.com">contact@skyface.com</a> ; vérification d'identité possible.</p>
        <h2>8. Confidentialité des enfants</h2>
        <p>Le Produit <strong>n'est pas destiné aux enfants de moins de 13 ans</strong> (ou l'âge minimum local). Nous ne collectons pas sciemment d'informations personnelles d'enfants.</p>
        <h2>9. Sécurité et vos responsabilités</h2>
        <p>La sécurité est multicouche : cryptographie navigateur, TLS en transit (HTTPS), contrôles d'accès base de données. <strong>Aucun système n'est parfait.</strong></p>
        <p>Vos responsabilités : mot de passe maître fort, protection des appareils, exportations sécurisées, vérification de l'authentificateur après perte, sensibilisation au phishing. <strong>Mauvaise configuration, malware, phishing, réutilisation de mots de passe, perte d'authentificateur/sauvegardes</strong> ou <strong>sites HTTP</strong> peuvent compromettre de bons designs — risques hors de notre contrôle.</p>
        <h2>10. Garanties et exclusions de Skyface (résumé)</h2>
        <p><strong>Nous nous engageons à la transparence et aux garanties standard du secteur</strong>, y compris chiffrement côté client et connaissance serveur minimale.</p>
        <ul>
          <li>Nous <strong>ne garantissons pas</strong> une disponibilité ininterrompue ou sans erreur, ni l'immunité face aux vulnérabilités non divulguées dans navigateurs, OS, bibliothèques crypto, fournisseurs ou mauvaise utilisation.</li>
          <li><strong>Dans la mesure maximale permise par la loi,</strong> nous excluons la responsabilité pour dommages indirects, accessoires, spéciaux, consécutifs ou punitifs, et accès non autorisé après compromission de vos identifiants/exportations sur vos appareils.</li>
          <li><strong>Exceptions juridictionnelles :</strong> Certaines régions interdisent certaines exclusions ; là où c'est interdit, les limites s'appliquent seulement dans la mesure permise.</li>
        </ul>
        <p>Voir nos <a href="./terms.html">Conditions d'utilisation</a> pour d'autres limites de garantie et responsabilité.</p>
        <h2>11. Utilisateurs internationaux</h2>
        <p>Les serveurs et processeurs peuvent être aux États-Unis ou ailleurs. En utilisant le cloud, vous reconnaissez les transferts transfrontaliers nécessaires sous les garanties contractuelles standard des processeurs.</p>
        <h2>12. Modifications</h2>
        <p>Nous pouvons mettre à jour matériellement cette politique ; nous publions les changements ici avec une date « Dernière mise à jour » révisée. L'utilisation continue après changement vaut acceptation, là où la loi le permet.</p>
        <h2>13. Contact</h2>
        <p>Questions sur la confidentialité ou l'exercice des droits :<br />E-mail <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />Site <a href="https://skyface.com/">https://skyface.com/</a></p>`,
  legalPrivacyUpdated: "<em>Dernière mise à jour : 1 juin 2026</em>",
  legalTermsEyebrow: "Mentions légales",
  legalTermsTitle: "Conditions d'utilisation",
  legalTermsIntro_html:
    'Ces Conditions d\'utilisation (« Conditions ») régissent votre accès à <strong>My Password Vault</strong> (le « Produit »), y compris ce site, l\'application web, la synchronisation cloud et les achats, ainsi que votre relation avec <strong>Skyface, LLC</strong> (« nous »). Les stores d\'applications peuvent imposer des conditions supplémentaires.',
  legalTermsBody_html: `<h2>1. Accord et confidentialité</h2>
          <p>En créant un compte, en vous connectant ou en utilisant le Produit, vous acceptez ces Conditions et notre <a href="./privacy.html">Politique de confidentialité</a>. Si vous n'êtes pas d'accord, n'utilisez pas le Produit.</p>
          <h2>2. Pas de conseil professionnel</h2>
          <p>Les documents sur le Produit décrivent des concepts de sécurité de manière générale. Ils ne constituent <strong>pas un conseil juridique, financier ou de conformité</strong>. <strong>Vous</strong> êtes responsable de la façon dont vous utilisez le Produit (y compris la protection de votre mot de passe maître, clé d'accès et documents de récupération) et de déterminer si le Produit répond à vos besoins personnels ou organisationnels et aux obligations réglementaires qui s'appliquent à vous. <strong>Nous</strong> (Skyface, LLC) sélectionnons, contractons et restons responsables de l'infrastructure tierce que nous utilisons pour exploiter le Produit (authentification, synchronisation cloud, paiements et hébergement), sous réserve des limites de ces Conditions.</p>
          <h2>3. Éligibilité et comptes</h2>
          <p>Vous devez avoir au moins <strong>13 ans</strong> (ou l'âge minimum local). Vous êtes responsable de l'activité sous votre compte, de la confidentialité de vos identifiants et d'un mot de passe maître fort. Signalez tout accès suspect à <a href="mailto:contact@skyface.com">contact@skyface.com</a>.</p>
          <h2>4. Offres, paiements et remboursements</h2>
          <p>L'offre gratuite inclut un nombre limité d'entrées. Un upgrade <strong>unique</strong> débloque des entrées illimitées ; prix affiché dans le Produit (actuellement <strong>4,99 USD</strong> sauf changement sur la page tarifs). Paiements via <strong>Stripe</strong> ; nous ne stockons pas les numéros complets de carte. Achats généralement <strong>sans abonnement</strong> et définitifs sauf obligation légale ou remboursement approuvé à notre discrétion. Demandes à <a href="mailto:contact@skyface.com">contact@skyface.com</a>.</p>
          <h2>5. Utilisation acceptable</h2>
          <p>Utilisez le Produit uniquement pour une gestion légale de mots de passe personnelle ou interne. Pas d'usage abusif — accès non autorisé, perturbation d'autres utilisateurs, scraping, ingénierie inverse pour contourner la sécurité ou violation de la loi. Nous pouvons suspendre ou résilier l'accès si nécessaire.</p>
          <h2>6. Vos données et responsabilités de sécurité</h2>
          <p>Le Produit est un <strong>coffre chiffré local-first</strong>. Nous ne pouvons pas récupérer votre mot de passe maître ni déchiffrer sans lui. Vous êtes responsable de la sécurité des appareils, des sauvegardes et des exportations hors Produit. Voir la <a href="./privacy.html">Politique de confidentialité</a>.</p>
          <h2>7. Suppression de compte</h2>
          <p>Suppression permanente via <strong>Paramètres → Compte → Supprimer le compte</strong>, supprimant sauvegarde cloud, licence et compte comme décrit dans la Politique de confidentialité. Données locales effacées sur l'appareil de confirmation.</p>
          <h2>8. Disponibilité et modifications du service</h2>
          <p>Nous pouvons modifier, suspendre ou interrompre des parties du Produit ou du site à tout moment. Pas de garantie de disponibilité ininterrompue ou sans erreur. Fonctionnalités, limites et prix peuvent changer ; changements tarifaires importants publiés sur la page tarifs lorsque possible.</p>
          <h2>9. Propriété intellectuelle</h2>
          <p>Marque, textes et éléments visuels appartiennent à Skyface, LLC ou concédants sauf mention contraire. Pas de copie ou redistribution commerciale sans autorisation. Le contenu de votre coffre reste le vôtre.</p>
          <h2>10. Exclusion de garanties</h2>
          <p>Le site et le Produit sont fournis <strong>« en l'état »</strong> dans la mesure maximale permise. Exclusion des garanties implicites de qualité marchande, d'adéquation et de non-contrefaçon, là où autorisé.</p>
          <h2>11. Limitation de responsabilité</h2>
          <p>Dans la mesure maximale permise, Skyface, LLC ne sera pas responsable des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs, ni de la perte de profits, données ou goodwill, y compris perte d'accès au coffre si vous perdez votre mot de passe maître ou sauvegardes.</p>
          <h2>12. Modifications de ces Conditions</h2>
          <p>Nous pouvons mettre à jour ces Conditions ; la date « Dernière mise à jour » changera. L'utilisation continue vaut acceptation, là où permis par la loi.</p>
          <h2>13. Contact</h2>
          <p>Questions sur ces Conditions :<br />E-mail <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />Site <a href="https://skyface.com/">https://skyface.com/</a></p>`,
  legalTermsUpdated: "<em>Dernière mise à jour : 1 juin 2026</em>",
};
