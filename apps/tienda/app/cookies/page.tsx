import { getSiteContent, resolveLegalBody, resolveLegalLastUpdated, resolveLegalTitle } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Cómo utilizamos cookies y tecnologías similares en La Obrera y el Zángano.',
};

export default async function CookiesPage({ searchParams }: { searchParams: Promise<{ cms_preview?: string }> }) {
  const draft = (await searchParams).cms_preview === "1";
  const contentData = await getSiteContent('legal_cookies', { draft });
  const item = contentData[0]?.content;
  const title = resolveLegalTitle(item, 'Política de Cookies');
  const content = resolveLegalBody(item, `
<strong>Última actualización: 15 de agosto de 2026</strong>

Esta Política de Cookies explica cómo La Obrera y el Zángano (en adelante "nosotros" o "la Tienda") utiliza cookies y tecnologías similares en el sitio obrerayzangano.cl, en cumplimiento de la Ley 19.628 sobre Protección de Datos de Carácter Personal y la Ley 21.719 que reforma dicha normativa.

<strong>1. ¿Qué son las cookies?</strong>

Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (ordenador, tableta o móvil) cuando visita un sitio web. Permiten que el sitio recuerde sus acciones y preferencias durante un período de tiempo, para que no tenga que volver a configurarlos cada vez que visita el sitio o navega entre sus páginas.

<strong>2. Tipos de cookies que utilizamos</strong>

<strong>2.1. Cookies esenciales (técnicas)</strong>

Son necesarias para el funcionamiento del sitio web. No requieren su consentimiento.

| Cookie | Proveedor | Finalidad | Duración | Tipo |
|--------|-----------|-----------|----------|------|
| Sesión de cuenta | Propia | Mantenerte conectado de forma segura | Hasta 1 año | Primera parte |
| preference-consent | Propia | Recuerda tu elección de cookies | 1 año | Primera parte |

<strong>2.2. Cookies de funcionalidad y preferencias</strong>

Permiten recordar sus preferencias (idioma, región, diseño). Requieren consentimiento.

| Cookie | Proveedor | Finalidad | Duración | Tipo |
|--------|-----------|-----------|----------|------|
| locale | Propia | Preferencia de idioma | 1 año | Primera parte |

<strong>2.3. Cookies analíticas o estadísticas</strong>

Hoy no instalamos Google Analytics ni otra herramienta de medición de audiencia. Esta categoría existe en el banner por si más adelante incorporamos analítica; sin tu consentimiento no se cargará ninguna cookie de este tipo.

<strong>2.4. Cookies publicitarias o de marketing</strong>

Se utilizan para medir campañas y remarketing. Requieren consentimiento de marketing. El script (Meta Pixel o gtag de Google Ads) solo se inyecta si además hay ID configurado en el servidor.

| Cookie | Proveedor | Finalidad | Duración | Tipo |
|--------|-----------|-----------|----------|------|
| _fbp | Meta (Facebook Pixel) | Remarketing y conversiones | 3 meses | Tercera parte |
| _fbc | Meta (Facebook Pixel) | Atribución de clic (si llegas desde un anuncio) | 3 meses | Tercera parte |
| _gcl_au | Google Ads | Conversiones de campañas | 3 meses | Tercera parte |

<strong>2.5. Cookies de terceros</strong>

Algunos contenidos integrados en el sitio (videos, botones sociales, widgets) pueden establecer cookies de terceros. No controlamos estas cookies y su uso se rige por las políticas de privacidad de dichos terceros.

<strong>3. ¿Cómo gestionar las cookies?</strong>

Al acceder por primera vez a nuestro sitio, se mostrará un banner de cookies con las siguientes opciones:

- <strong>Aceptar todas:</strong> acepta todas las categorías de cookies.
- <strong>Rechazar no esenciales:</strong> solo se instalarán cookies esenciales.
- <strong>Configurar:</strong> le permite seleccionar individualmente qué categorías de cookies acepta.

Puede cambiar sus preferencias en cualquier momento a través del enlace "Configurar cookies" en el pie de página del sitio.

También puede gestionar o eliminar cookies directamente desde la configuración de su navegador:

- Google Chrome: Configuración > Privacidad y seguridad > Cookies
- Mozilla Firefox: Opciones > Privacidad y seguridad > Cookies
- Safari: Preferencias > Privacidad > Cookies y datos de sitios web
- Microsoft Edge: Configuración > Cookies y permisos del sitio

Tenga en cuenta que la eliminación o bloqueo de cookies puede afectar la funcionalidad del sitio.

<strong>4. ¿Qué ocurre si desactivo las cookies?</strong>

Si desactiva las cookies esenciales, el sitio puede no funcionar correctamente (por ejemplo, no podrá iniciar sesión ni completar compras). Si desactiva las cookies analíticas o publicitarias, el sitio seguirá funcionando pero no podremos mejorar la experiencia ni mostrar contenido relevante.

<strong>5. Transferencias internacionales</strong>

Algunas cookies de terceros (Meta Pixel, Google Ads) pueden implicar la transferencia de datos a servidores fuera de Chile. Estos proveedores aplican cláusulas contractuales estándar y marcos de privacidad reconocidos.

<strong>6. Actualizaciones</strong>

Podemos actualizar esta Política de Cookies cuando incorporemos nuevas herramientas o servicios. La versión vigente estará siempre disponible con su fecha de actualización.

<strong>7. Contacto</strong>

Para consultas sobre nuestras cookies, escriba a: obrerayzangano@gmail.com

Consulta también: <a href="/privacidad">Política de Privacidad</a> | <a href="/terminos">Términos del Servicio</a>
`);

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={resolveLegalLastUpdated(item, '15 de agosto de 2026')}
      sectionKey="legal_cookies"
    />
  );
}
