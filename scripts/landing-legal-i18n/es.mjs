/** Spanish legal copy. */
export default {
  metaTitlePrivacy: "Política de privacidad — My Password Vault",
  metaDescriptionPrivacy:
    "Política de privacidad de My Password Vault de Skyface, LLC — cifrado local-first, sync solo texto cifrado y qué nunca almacenamos.",
  metaTitleTerms: "Términos de uso — My Password Vault",
  metaDescriptionTerms:
    "Términos de uso de My Password Vault de Skyface, LLC — cuentas, compras, uso aceptable y responsabilidad.",
  legalPrivacyEyebrow: "Política de privacidad",
  legalPrivacyTitle: "Política de privacidad de My Password Vault",
  legalPrivacyIntro_html:
    'Se aplica a <strong>My Password Vault</strong> (el «Producto»), incluida su aplicación web y clientes complementarios distribuidos por <strong>Skyface, LLC</strong> («nosotros»).',
  legalPrivacyBody_html: `<h2>Resumen</h2>
        <p>
          My Password Vault está diseñado como <strong>una caja fuerte local‑primero</strong>: sus entradas se cifran en su dispositivo antes de salir de su control. La sincronización en la nube opcional almacena <strong>solo texto cifrado</strong> vinculado a su inicio de sesión; diseñamos el sistema intencionalmente para que <strong>no podamos leer sus contraseñas descifradas</strong>.
        </p>
        <p>
          Esta Política explica qué categorías de información existen, dónde residen, en qué socios confiamos y los límites de nuestra responsabilidad, para que sepa qué respaldamos y qué permanece con usted por diseño o por ley.
        </p>
        <h2>1. Datos que tratamos (y finalidad)</h2>
        <ul>
          <li><strong>Cuenta e inicio de sesión:</strong> Al crear una cuenta (correo y contraseña y/o inicio con Google), tratamos identificadores como ID de usuario, correo y metadatos del método de acceso para autenticarle y operar su cuenta.</li>
          <li><strong>Cargas cifradas del cofre:</strong> Con sincronización en la nube, almacenamos bloques cifrados y metadatos gruesos para reconciliar versiones (p. ej. marcas de tiempo y recuentos)—no contraseñas en claro ni secretos TOTP.</li>
          <li><strong>Licencia y compras:</strong> Si adquiere la mejora PRO permanente, guardamos estado de licencia, fecha, referencia de sesión de Stripe Checkout e importe vinculados a su correo. <strong>Stripe</strong> procesa pagos con tarjeta; no recibimos ni almacenamos números completos de tarjeta.</li>
          <li><strong>Correo transaccional:</strong> Si usa inicio por correo o restablecimiento de contraseña, nuestro proveedor de correo envía mensajes a la dirección que indique.</li>
          <li><strong>Operaciones y soporte:</strong> Si nos escribe a <a href="mailto:contact@skyface.com">contact@skyface.com</a>, tratamos el contenido para responder y mejorar el Producto.</li>
          <li><strong>Registros técnicos:</strong> Socios de alojamiento, base de datos y pagos pueden conservar telemetría estándar (IP, marcas de tiempo, registros de error).</li>
        </ul>
        <h2>2. Qué permanece en su dispositivo y qué no tenemos</h2>
        <p>El Producto deriva claves de cifrado localmente a partir de su contraseña maestra. <strong>No recopilamos, almacenamos ni recibimos su contraseña maestra en claro.</strong> Tampoco recibimos claves de descifrado para leer entradas almacenadas en el dispositivo.</p>
        <p>Los campos protegidos —incluidas contraseñas y secretos TOTP— se cifran en su hardware con <strong>AES‑GCM‑256</strong> y derivación PBKDF2‑SHA‑256 en el cliente. Con sincronización, <strong>el servidor refleja texto cifrado</strong>; sin sus secretos, no puede descifrar el cofre de forma significativa.</p>
        <h2>3. Servicios de terceros</h2>
        <ul>
          <li><strong>Autenticación y base de datos (Supabase):</strong> Inicio de sesión y almacenamiento de registros cifrados y metadatos de licencia.</li>
          <li><strong>Google:</strong> Si elige inicio con Google, aplican sus términos de privacidad a ese flujo.</li>
          <li><strong>Pagos (Stripe):</strong> Checkout y procesamiento del pago único PRO; aplican la política de Stripe a los datos de pago.</li>
          <li><strong>Correo (Resend):</strong> Entrega de mensajes transaccionales como inicio de sesión y restablecimiento de contraseña.</li>
          <li><strong>Infraestructura/hosting/CDN:</strong> El Producto puede entregarse mediante redes de alojamiento y borde (p. ej. Vercel).</li>
        </ul>
        <p>Estos proveedores tratan datos limitados como encargados o subencargados; también aplican sus propios términos.</p>
        <h2>4. Análisis, publicidad y venta de datos</h2>
        <p><strong>No vendemos información personal</strong> y <strong>no</strong> mostramos publicidad de terceros dentro del cofre. No compramos ni vendemos listas de credenciales: sus contraseñas son suyas.</p>
        <h2>5. Copias de seguridad y exportaciones</h2>
        <p>Las copias locales opcionales (exportaciones JSON sin conexión) están bajo su control. Si las adjunta a correo o nubes, asume ese perfil de riesgo; no podemos asegurar copias que usted copie voluntariamente en otro lugar.</p>
        <h2>6. Conservación y eliminación de cuenta</h2>
        <p>Conservamos cuenta, texto cifrado y licencia mientras la cuenta esté activa, salvo obligación legal limitada (p. ej. prevención de fraude). Los socios de pago pueden conservar registros de facturación según sus políticas.</p>
        <p>Puede eliminar permanentemente su cuenta desde <strong>Configuración → Cuenta → Eliminar cuenta</strong>. Eso elimina la copia cifrada en la nube, el registro de licencia y su cuenta de acceso. Los datos locales se borran en el dispositivo donde confirme la eliminación. Si no puede completarla en la app, contacte <a href="mailto:contact@skyface.com">contact@skyface.com</a>.</p>
        <h2>7. Sus derechos de privacidad</h2>
        <p>Según su jurisdicción, puede tener derechos de acceso, rectificación, supresión o limitación. Como no podemos descifrar su cofre, solo podemos ayudar con datos a nivel de cuenta que realmente conservamos. Envíe solicitudes a <a href="mailto:contact@skyface.com">contact@skyface.com</a>; podemos verificar su identidad.</p>
        <h2>8. Privacidad de menores</h2>
        <p>El Producto <strong>no está dirigido a menores de 13 años</strong> (o la edad mínima local aplicable). No recopilamos a sabiendas información personal de menores.</p>
        <h2>9. Seguridad y sus responsabilidades</h2>
        <p>La seguridad es en capas: criptografía en el navegador, TLS en tránsito (con HTTPS) y controles de acceso en bases de datos. <strong>Ningún sistema es perfecto.</strong></p>
        <p>Sus responsabilidades incluyen una contraseña maestra fuerte, proteger dispositivos, salvaguardar exportaciones, verificar autenticadores tras pérdidas y conciencia ante phishing. <strong>Configuración incorrecta, malware, phishing, contraseñas reutilizadas, pérdida de autenticador/copias</strong> o <strong>sitios HTTP</strong> pueden vulnerar buenos diseños—riesgos fuera de nuestro control una vez que los datos salen de las protecciones predeterminadas.</p>
        <h2>10. Garantías y exclusiones de Skyface (resumen)</h2>
        <p><strong>Nos comprometemos con la transparencia y salvaguardas estándar del sector</strong>, incluido el cifrado en el cliente y conocimiento mínimo del servidor.</p>
        <ul>
          <li><strong>No garantizamos</strong> disponibilidad ininterrumpida o libre de errores, ni inmunidad ante vulnerabilidades no divulgadas en navegadores, SO, bibliotecas criptográficas, proveedores o uso indebido.</li>
          <li><strong>En la máxima medida permitida por la ley,</strong> excluimos responsabilidad por daños indirectos, incidentales, especiales, consecuentes o punitivos, y por accesos no autorizados tras comprometer credenciales o exportaciones en sus dispositivos.</li>
          <li><strong>Excepciones jurisdiccionales:</strong> Algunas regiones no permiten ciertas exclusiones; donde esté prohibido, los límites aplican solo en la medida permitida.</li>
        </ul>
        <p>Consulte nuestros <a href="./terms.html">Términos de uso</a> para límites adicionales de garantía y responsabilidad.</p>
        <h2>11. Usuarios internacionales</h2>
        <p>Los servidores y procesadores pueden estar en Estados Unidos u otras jurisdicciones. Al usar funciones en la nube, acepta transferencias transfronterizas necesarias bajo salvaguardas contractuales estándar de los procesadores.</p>
        <h2>12. Cambios</h2>
        <p>Podemos actualizar materialmente esta Política; publicaremos cambios aquí con una fecha revisada de «Última actualización». El uso continuado tras cambios implica aceptación donde la ley lo permita.</p>
        <h2>13. Contacto</h2>
        <p>Preguntas sobre privacidad o ejercicio de derechos:<br />Correo <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />Web <a href="https://skyface.com/">https://skyface.com/</a></p>`,
  legalPrivacyUpdated: "<em>Última actualización: 1 de junio de 2026</em>",
  legalTermsEyebrow: "Legal",
  legalTermsTitle: "Términos de uso",
  legalTermsIntro_html:
    'Estos Términos de uso («Términos») rigen su acceso a <strong>My Password Vault</strong> (el «Producto»), incluido este sitio, la aplicación web, la sincronización en la nube y las compras, y su relación con <strong>Skyface, LLC</strong> («nosotros»). Las tiendas de aplicaciones u otros canales pueden imponer términos adicionales.',
  legalTermsBody_html: `<h2>1. Acuerdo y privacidad</h2>
          <p>Al crear una cuenta, iniciar sesión o usar el Producto, acepta estos Términos y nuestra <a href="./privacy.html">Política de privacidad</a>. Si no está de acuerdo, no use el Producto.</p>
          <h2>2. No es asesoramiento profesional</h2>
          <p>Los materiales sobre el Producto describen conceptos de seguridad en términos generales. <strong>No constituyen asesoramiento legal, financiero ni de cumplimiento</strong>. <strong>Usted</strong> es responsable de cómo usa el Producto (incluida la protección de su contraseña maestra, clave de acceso y materiales de recuperación) y de determinar si el Producto satisface sus necesidades personales u organizativas y las obligaciones regulatorias que le apliquen. <strong>Nosotros</strong> (Skyface, LLC) seleccionamos, contratamos y seguimos siendo responsables de la infraestructura de terceros que utilizamos para operar el Producto (autenticación, sincronización en la nube, pagos y alojamiento), con sujeción a los límites de estos Términos.</p>
          <h2>3. Elegibilidad y cuentas</h2>
          <p>Debe tener al menos <strong>13 años</strong> (o la edad mínima local) para usar el Producto. Es responsable de la actividad en su cuenta, de mantener confidenciales sus credenciales y una contraseña maestra fuerte. Notifíquenos en <a href="mailto:contact@skyface.com">contact@skyface.com</a> si sospecha acceso no autorizado.</p>
          <h2>4. Planes, pagos y reembolsos</h2>
          <p>El plan gratuito incluye un número limitado de entradas. Una mejora <strong>única</strong> desbloquea entradas ilimitadas; el precio se muestra en el Producto (actualmente <strong>4,99 USD</strong> salvo cambio en la página de precios). Los pagos los procesa <strong>Stripe</strong>; no almacenamos números completos de tarjeta. Las compras son generalmente <strong>sin suscripción</strong> y finales salvo obligación legal o reembolso aprobado a nuestra discreción. Solicitudes a <a href="mailto:contact@skyface.com">contact@skyface.com</a>.</p>
          <h2>5. Uso aceptable</h2>
          <p>Use el Producto solo para gestión legal de contraseñas personales o internas. No puede hacer un uso indebido—incluido acceso no autorizado, interferencia con otros usuarios, scraping, ingeniería inversa para eludir seguridad o violar la ley. Podemos suspender o terminar el acceso cuando sea razonablemente necesario.</p>
          <h2>6. Sus datos y responsabilidades de seguridad</h2>
          <p>El Producto es un <strong>cofre cifrado local‑primero</strong>. No podemos recuperar su contraseña maestra ni descifrar entradas sin ella. Usted es responsable de la seguridad del dispositivo, copias y exportaciones externas. Vea la <a href="./privacy.html">Política de privacidad</a>.</p>
          <h2>7. Eliminación de cuenta</h2>
          <p>Puede eliminar permanentemente su cuenta desde <strong>Configuración → Cuenta → Eliminar cuenta</strong>, lo que elimina copia en la nube, licencia y cuenta de acceso según la Política de privacidad. Los datos locales se borran en el dispositivo donde confirme.</p>
          <h2>8. Disponibilidad y cambios del servicio</h2>
          <p>Podemos cambiar, suspender o discontinuar partes del Producto o sitio en cualquier momento. No garantizamos disponibilidad ininterrumpida ni operación libre de errores. Funciones, límites y precios pueden cambiar; publicaremos cambios materiales de precio cuando sea práctico.</p>
          <h2>9. Propiedad intelectual</h2>
          <p>Marca, textos y activos visuales del Producto y sitio pertenecen a Skyface, LLC o licenciantes salvo indicación contraria. No puede copiarlos con fines comerciales sin permiso. El contenido de su cofre sigue siendo suyo.</p>
          <h2>10. Exclusión de garantías</h2>
          <p>El sitio y Producto se proporcionan <strong>«tal cual»</strong> en la máxima medida permitida. Excluimos garantías implícitas de comerciabilidad, idoneidad y no infracción donde se permita.</p>
          <h2>11. Limitación de responsabilidad</h2>
          <p>En la máxima medida permitida, Skyface, LLC no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, ni por pérdida de beneficios, datos o reputación, incluida la pérdida de acceso al cofre si pierde su contraseña maestra o copias.</p>
          <h2>12. Cambios a estos Términos</h2>
          <p>Podemos actualizar estos Términos; la fecha de «Última actualización» cambiará. El uso continuado implica aceptación donde la ley lo permita.</p>
          <h2>13. Contacto</h2>
          <p>Preguntas sobre estos Términos:<br />Correo <a href="mailto:contact@skyface.com">contact@skyface.com</a><br />Web <a href="https://skyface.com/">https://skyface.com/</a></p>`,
  legalTermsUpdated: "<em>Última actualización: 1 de junio de 2026</em>",
};
