import { getSiteContent, resolveLegalBody, resolveLegalLastUpdated, resolveLegalTitle } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

import { createPageMetadata } from '@/lib/shop/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('/privacidad', {
    title: 'Política de Privacidad',
    description: 'Tratamiento de datos personales y seguridad de la información conforme a la legislación chilena.',
  });
}

export default async function PrivacidadPage({ searchParams }: { searchParams: Promise<{ cms_preview?: string }> }) {
  const draft = (await searchParams).cms_preview === "1";
  const contentData = await getSiteContent('legal_privacidad', { draft });
  const item = contentData[0]?.content;
  const title = resolveLegalTitle(item, 'Política de Privacidad');
  const content = resolveLegalBody(item, `
<strong>Última actualización: 19 de mayo de 2026</strong>

Esta Política de Privacidad explica cómo La Obrera y el Zángano (en adelante "nosotros", "el Responsable" o "la Tienda"), titular del sitio obrerayzangano.cl, recopila, usa, almacena y protege su información personal, en cumplimiento de la Ley 19.628 sobre Protección de Datos de Carácter Personal y la Ley 21.719 que reforma dicha normativa.

<strong>Responsable del tratamiento de datos personales</strong>

- Razón social: La Obrera y el Zángano
- Correo electrónico: contacto@obrerayzangano.cl
- Dirección: Pureo Lt D, Comuna de Queilén, Región de Los Lagos, Chile
- Teléfono: +56 9 4083 1358

Al acceder o utilizar nuestro sitio web usted acepta las prácticas descritas en esta Política.

<strong>1. Información que recopilamos</strong>

<strong>Directamente de usted:</strong> nombre, correo electrónico, teléfono, dirección de envío y facturación, datos de pago, información de cuenta, reseñas y comunicaciones de atención al cliente.

<strong>Automáticamente:</strong> datos de navegación (dirección IP, tipo de dispositivo, navegador, páginas visitadas) mediante cookies y tecnologías similares. Para más detalle, consulta nuestra <a href="/cookies">Política de Cookies</a>.

<strong>De terceros:</strong> el proveedor de alojamiento del sitio, el proveedor de cuenta e inicio de sesión, Transbank y Flow.cl (pagos), Blue Express (envíos), y —solo si aceptas cookies no esenciales— herramientas de analítica o publicidad (Google, Meta). Un servicio de diagnóstico de errores puede recibir reportes técnicos del sitio, sin datos de tarjeta.

<strong>2. Bases legales y finalidades</strong>

Tratamos sus datos conforme a la Ley 19.628 y Ley 21.719:

- <strong>Ejecución de contrato:</strong> procesar y enviar pedidos, gestionar pagos y entregas.
- <strong>Consentimiento:</strong> envío de newsletter, marketing y cookies no esenciales.
- <strong>Interés legítimo:</strong> mejorar el sitio, seguridad, prevención de fraude y análisis estadísticos.
- <strong>Obligación legal:</strong> cumplir con normativa tributaria (Ley sobre Impuesto a las Ventas y Servicios), protección al consumidor (Ley 19.496) y obligaciones contables.

<strong>3. Cookies</strong>

Utilizamos cookies esenciales para el correcto funcionamiento del sitio y cookies opcionales para analítica y publicidad. Puede configurarlas en el banner de cookies que aparece al entrar al sitio o en cualquier momento desde nuestra <a href="/cookies">Política de Cookies</a>.

<strong>4. Compartir y transferir información (Cláusulas Contractuales Tipo)</strong>

Operamos bajo el estándar de protección exigido por la Ley 19.628 y la Ley 21.719. Para la prestación y seguridad de nuestros servicios, compartimos datos personales mediante transferencias nacionales e internacionales formalizadas mediante <strong>Cláusulas Contractuales Tipo (CCT)</strong> conformes a los modelos aprobados por la autoridad chilena:

- <strong>Transferencias Responsable a Encargado (CCT Controller-to-Processor):</strong>
  • <em>Alojamiento y red de entrega de contenidos (CDN):</em> Vercel, Inc. (EE.UU.), entrega del sitio web con cifrado HTTPS.
  • <em>Base de datos, autenticación y almacenamiento:</em> Supabase, Inc. (EE.UU.), con políticas estrictas de aislamiento de datos por usuario y cifrado en reposo.
  • <em>Diagnóstico técnico y monitoreo de incidentes:</em> Functional Software, Inc. / Sentry (EE.UU.), limitado a trazas de errores técnicos sin datos de pago ni contraseñas.
  • <em>Transcripción de voz en bitácora apícola (exclusivo panel Núcleo):</em> Groq, Inc. (EE.UU.), para transcribir notas de voz del operador de patio, sin retención de audio para entrenamiento. No opera en la tienda pública.

- <strong>Transferencias Responsable a Responsable (CCT Controller-to-Controller):</strong>
  • <em>Procesamiento de pagos:</em> Transbank S.A. y Flow.cl (Chile). Los datos de tarjetas bancarias se procesan directamente en plataformas certificadas PCI DSS sin transitar por nuestros servidores.
  • <em>Operación logística y envíos:</em> Blue Express S.A. (Chile), con acceso exclusivo a los datos indispensables para la entrega física (nombre, dirección y teléfono del destinatario).
  • <em>Analítica y publicidad digital:</em> Google LLC y Meta Platforms, Inc., activados única y exclusivamente si otorgas consentimiento previo en el panel de cookies no esenciales.

Nuestra gobernanza técnica y jurídica aplica estas garantías contractuales y técnicas de forma proactiva, resguardando la integridad de tus datos conforme al régimen de la Ley 21.719.

<strong>5. Conservación de los datos</strong>

- <strong>Datos de pedidos y facturación:</strong> hasta 10 años (obligaciones legales tributarias, Ley sobre Impuesto a las Ventas y Servicios, Código de Comercio).
- <strong>Datos de marketing y cookies:</strong> hasta que retire su consentimiento.
- <strong>Datos de navegación:</strong> máximo 2-3 años.
- <strong>Datos de suscripciones canceladas:</strong> se conservan durante 1 año posterior a la cancelación para efectos contables y legales, luego se eliminan salvo obligación legal de conservación.

<strong>6. Sus derechos (ARCO + portabilidad)</strong>

Según la Ley 19.628 y Ley 21.719 tiene derecho a:

- <strong>Acceder:</strong> saber qué datos personales tenemos sobre usted.
- <strong>Rectificar:</strong> corregir datos inexactos o incompletos.
- <strong>Cancelar:</strong> solicitar la eliminación de sus datos cuando ya no sean necesarios.
- <strong>Oponerse:</strong> oponerse al tratamiento de sus datos para fines específicos.
- <strong>Portar:</strong> solicitar la transferencia de sus datos a otro responsable en formato estructurado.
- <strong>Limitar:</strong> solicitar la limitación del tratamiento de sus datos.

<strong>Canales para el ejercicio de sus derechos:</strong>

<ul>
  <li><strong>Portabilidad automatizada (JSON estructurado):</strong> Si dispones de una cuenta activa, puedes descargar una copia íntegra de tus datos personales directamente mediante <a href="/api/usuario/exportar">Descargar mis datos (/api/usuario/exportar)</a> o desde la sección de privacidad en tu <a href="/perfil">Panel de Perfil</a>.</li>
  <li><strong>Supresión y derecho al olvido:</strong> Puedes solicitar y ejecutar el borrado instantáneo de tu perfil desde tu <a href="/perfil">Panel de Perfil</a>. Tus datos personales se anonimizan de inmediato y se revocan tus accesos; los registros de compras previas se disocian del titular para dar estricto cumplimiento a la obligación legal de conservación tributaria del SII (Arts. 17 y 200 Código Tributario).</li>
  <li><strong>Solicitud formal por correo:</strong> Para cualquier consulta, rectificación u oposición, puedes escribir a <strong>contacto@obrerayzangano.cl</strong> con el asunto <em>"Derechos ARCO — Ley 21.719"</em>. Responderemos en un plazo máximo de 30 días corridos.</li>
</ul>

<strong>7. Seguridad y brechas</strong>

Aplicamos medidas razonables de seguridad: conexión cifrada (HTTPS), cifrado de datos en reposo, acceso restringido por rol y registro de accesos sensibles.

En caso de una brecha de seguridad que pueda afectarlo, le notificaremos a usted y a la Agencia de Protección de Datos Personales dentro de los plazos que establezca la ley (72 horas una vez operativa la APD), según lo exija la Ley 21.719.

<strong>8. Datos de niños y adolescentes</strong>

Nuestro sitio no está dirigido a menores de 18 años y no recopilamos intencionalmente sus datos. Si detectamos que hemos recopilado datos de un menor sin consentimiento parental verificable, los eliminaremos de inmediato.

<strong>9. Decisiones automatizadas y perfiles</strong>

No utilizamos decisiones automatizadas con efectos jurídicos o significativos para el usuario. Podemos usar herramientas de analítica para mejorar la experiencia del sitio, las cuales no generan perfiles con efectos legales.

<strong>10. Cambios en esta Política</strong>

Podemos actualizarla en cualquier momento. La versión vigente estará siempre disponible en el sitio con su fecha de actualización. Notificaremos cambios sustanciales por correo electrónico o mediante aviso visible en el sitio. El uso continuado del sitio tras la publicación de cambios implica aceptación de dichos cambios.

<strong>11. Contacto y reclamos</strong>

- Correo electrónico: contacto@obrerayzangano.cl
- Dirección: Pureo Lt D 8560, Queilén, Región de Los Lagos, Chile
- Teléfono: +56 9 4083 1358

Una vez que la Agencia de Protección de Datos Personales (APD) esté operativa, también podrá presentar reclamos ante ella conforme a la Ley 21.719. Actualmente, puede acudir al SERNAC (www.sernac.cl) por materias de protección al consumidor.

Consulta también: <a href="/cookies">Política de Cookies</a> | <a href="/terminos">Términos del Servicio</a> | <a href="/cancelacion">Política de Cancelación</a>
`);

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={resolveLegalLastUpdated(item, '19 de mayo de 2026')}
      sectionKey="legal_privacidad"
    />
  );
}
