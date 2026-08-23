import { getSiteContent, resolveLegalBody, resolveLegalLastUpdated, resolveLegalTitle } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Cómo tratamos tus datos en La Obrera y el Zángano.',
};

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
- Correo electrónico: obrerayzangano@gmail.com
- Dirección: Pureo Lt D, Comuna de Quellón, Región de Los Lagos, Chile
- Teléfono: +56 9 408 31 358

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

<strong>4. Compartir y transferir información</strong>

Compartimos datos con los siguientes encargados de tratamiento:

- <strong>Alojamiento del sitio:</strong> Vercel, Inc. (entrega del sitio web).
- <strong>Cuenta e inicio de sesión:</strong> Supabase, Inc. (cuenta, sesión y almacenamiento asociado), servidores en región americana.
- <strong>Transbank / Flow.cl:</strong> procesamiento de pagos. Los datos de tarjeta no pasan por nuestros servidores; se procesan en su plataforma certificada PCI DSS.
- <strong>Blue Express:</strong> logística y envíos (nombre, dirección, teléfono del destinatario).
- <strong>Diagnóstico de errores:</strong> Functional Software, Inc. (Sentry), solo fallos técnicos del sitio.
- <strong>Asistente de patio (solo Núcleo):</strong> Groq, Inc., para transcribir audio de bitácora apícola que tú grabas. No opera en la tienda pública.
- <strong>Analítica y publicidad:</strong> Google y Meta, únicamente si otorgas consentimiento de cookies no esenciales.

Realizamos transferencias internacionales (Europa y América). Esos encargados aplican medidas de seguridad y cláusulas contractuales estándar conforme a la Ley 21.719.

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

Para ejercer estos derechos escriba a: obrerayzangano@gmail.com
Responderemos en un plazo máximo de 30 días, conforme a la Ley 21.719.

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

- Correo electrónico: obrerayzangano@gmail.com
- Dirección: Pureo Lt D 8560, Quellón, Región de Los Lagos, Chile
- Teléfono: +56 9 408 31 358

Una vez que la Agencia de Protección de Datos Personales (APD) esté operativa, también podrá presentar reclamos ante ella conforme a la Ley 21.719. Actualmente, puede acudir al SERNAC (www.sernac.cl) por materias de protección al consumidor.

Consulta también: <a href="/cookies">Política de Cookies</a> | <a href="/terminos">Términos del Servicio</a> | <a href="/cancelacion">Política de Cancelación</a>
`);

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={resolveLegalLastUpdated(item, '19 de mayo de 2026')}
    />
  );
}
