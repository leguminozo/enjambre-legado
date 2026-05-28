import { getSiteContentStatic } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Cómo utilizamos cookies y tecnologías similares en La Obrera y el Zángano.',
};

export default async function CookiesPage() {
  const contentData = await getSiteContentStatic('legal_cookies');
  const item = contentData[0]?.content;
  const title = (item && typeof item === 'object' && 'title' in item ? String(item.title) : null) || 'Política de Cookies';
  const content = (item && typeof item === 'object' && 'body' in item ? String(item.body) : null) || `
<strong>Última actualización: 19 de mayo de 2026</strong>

Esta Política de Cookies explica cómo La Obrera y el Zángano (en adelante "nosotros" o "la Tienda") utiliza cookies y tecnologías similares en el sitio obrerayzangano.com, en cumplimiento de la Ley 19.628 sobre Protección de Datos de Carácter Personal y la Ley 21.719 que reforma dicha normativa.

<strong>1. ¿Qué son las cookies?</strong>

Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (ordenador, tableta o móvil) cuando visita un sitio web. Permiten que el sitio recuerde sus acciones y preferencias durante un período de tiempo, para que no tenga que volver a configurarlos cada vez que visita el sitio o navega entre sus páginas.

<strong>2. Tipos de cookies que utilizamos</strong>

<strong>2.1. Cookies esenciales (técnicas)</strong>

Son necesarias para el funcionamiento del sitio web. No requieren su consentimiento.

| Cookie | Proveedor | Finalidad | Duración | Tipo |
|--------|-----------|-----------|----------|------|
| __next_hmr_refresh | Propia (Next.js) | Hot module replacement en desarrollo | Sesión | Primera parte |
| sb-<project>-auth-token | Supabase | Sesión de autenticación del usuario | 1 año | Primera parte |
| preference-consent | Propia | Almacena su elección de consentimiento de cookies | 1 año | Primera parte |

<strong>2.2. Cookies de funcionalidad y preferencias</strong>

Permiten recordar sus preferencias (idioma, región, diseño). Requieren consentimiento.

| Cookie | Proveedor | Finalidad | Duración | Tipo |
|--------|-----------|-----------|----------|------|
| locale | Propia | Preferencia de idioma | 1 año | Primera parte |

<strong>2.3. Cookies analíticas o estadísticas</strong>

Nos ayudan a comprender cómo los visitantes interactúan con el sitio. Requieren consentimiento.

| Cookie | Proveedor | Finalidad | Duración | Tipo |
|--------|-----------|-----------|----------|------|
| _ga | Google Analytics | Distinguir usuarios | 2 años | Tercera parte |
| _ga_<id> | Google Analytics | Mantener estado de sesión | 2 años | Tercera parte |
| _gid | Google Analytics | Distinguir usuarios | 24 horas | Tercera parte |

<strong>2.4. Cookies publicitarias o de marketing</strong>

Se utilizan para mostrar anuncios relevantes y medir la efectividad de campañas. Requieren consentimiento.

| Cookie | Proveedor | Finalidad | Duración | Tipo |
|--------|-----------|-----------|----------|------|
| _fbp | Meta (Facebook Pixel) | Remarketing, seguimiento de conversiones | 3 meses | Tercera parte |
| _gcl_au | Google Ads | Seguimiento de conversiones | 3 meses | Tercera parte |

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

Algunas cookies de terceros (Google Analytics, Meta Pixel) pueden implicar la transferencia de datos a servidores fuera de Chile. Estos proveedores cumplen con cláusulas contractuales estándar y marcos de privacidad reconocidos.

<strong>6. Actualizaciones</strong>

Podemos actualizar esta Política de Cookies cuando incorporemos nuevas herramientas o servicios. La versión vigente estará siempre disponible con su fecha de actualización.

<strong>7. Contacto</strong>

Para consultas sobre nuestras cookies, escriba a: contacto@obrerayzangano.com

Consulta también: <a href="/privacidad">Política de Privacidad</a> | <a href="/terminos">Términos del Servicio</a>
`;

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={(item && typeof item === 'object' && 'updated_at' in item ? String(item.updated_at) : null) || '19 de mayo de 2026'}
    />
  );
}
