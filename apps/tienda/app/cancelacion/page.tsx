import { getSiteContent, resolveLegalBody, resolveLegalLastUpdated, resolveLegalTitle } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

import { createPageMetadata } from '@/lib/shop/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('/cancelacion', {
    title: 'Política de Cancelación',
    description: 'Condiciones para anulación de compras antes del despacho logístico.',
  });
}

export default async function CancelacionPage({ searchParams }: { searchParams: Promise<{ cms_preview?: string }> }) {
  const draft = (await searchParams).cms_preview === "1";
  const contentData = await getSiteContent('legal_cancelacion', { draft });
  const item = contentData[0]?.content;
  const title = resolveLegalTitle(item, 'Política de Cancelación');
  const content = resolveLegalBody(item, `
<strong>Última actualización: 19 de mayo de 2026</strong>

Algunos artículos de nuestra tienda pueden ofrecerse como suscripción, pedido en preventa o probar antes de comprar. Esta política de cancelación establece cómo puedes cambiar o cancelar este tipo de compras.

<strong>1. Derecho a retracto (Ley 19.496 y DS 6/2021)</strong>

De conformidad con el artículo 3 bis de la Ley 19.496 sobre Protección de los Derechos de los Consumidores y el Decreto Supremo N° 6 de 2021 del Ministerio de Economía (Reglamento de Comercio Electrónico), tienes un plazo de 10 días corridos contados desde la recepción del producto para ejercer tu derecho a retracto en compras electrónicas, sin necesidad de justificar la decisión y sin penalización alguna. El retracto procede siempre que el producto conserve su precinto de inviolabilidad y su embalaje original no haya sido deteriorado de forma que impida su reventa.

Para ejercer el retracto, contacta a contacto@obrerayzangano.cl indicando tu número de pedido. Una vez validado, te proporcionaremos una etiqueta de envío de devolución sin costo y procederemos al reembolso según nuestra <a href="/reembolso">Política de Reembolso</a>.

<strong>2. Suscripciones</strong>

Al adquirir una suscripción (Club Legado del Bosque o Reposición Periódica), recibirás entregas repetidas basadas en la duración y frecuencia que selecciones. Tus datos de pago se almacenarán de forma segura en las pasarelas certificadas y se te cobrará por cada una de estas entregas, a menos que elijas pagar por adelantado.

Algunas suscripciones pueden renovarse de forma automática al término de su duración. Si no deseas renovar una suscripción, puedes pausarla o cancelarla en cualquier momento directamente desde tu perfil en el sitio o desde los enlaces incluidos en tus correos electrónicos de confirmación.

Conforme al artículo 12 B de la Ley 19.496 (incorporado por la Ley 21.398), la terminación o cancelación de una suscripción puede realizarse con la misma facilidad con que se contrató. No aplicamos penalizaciones ni cláusulas de permanencia forzada. Tras la cancelación, recibirás confirmación por correo electrónico dentro de 24 horas.

La cancelación tendrá efecto al final del período facturado. Para períodos ya pagados no utilizados, se emitirá reembolso proporcional si corresponde.

Consulta nuestra <a href="/reembolso">Política de Reembolso</a> para obtener más información sobre devoluciones y reembolsos.

<strong>3. Cancelación de pedidos</strong>

Puedes cancelar tu pedido sin costo dentro de las primeras 12 horas de realizado, siempre que no haya sido despachado. Una vez despachado, se aplica el proceso de retracto descrito en el punto 1.

<strong>4. Talleres y experiencias</strong>

Para cancelaciones de talleres presenciales, se requiere un aviso de 7 días para un reembolso completo. Pasado ese plazo, se retendrá el 50% del valor. Estas condiciones no afectan tu derecho a retracto si la compra se realizó en línea.

<strong>5. Preventas (pre-order)</strong>

Si cancelas un pedido en preventa antes de que el producto esté disponible, recibirás un reembolso completo. Una vez despachado el producto, aplica el derecho a retracto de 10 días.

<strong>6. Proceso de cancelación</strong>

Para iniciar una cancelación:
- Correo electrónico: contacto@obrerayzangano.cl
- WhatsApp: +56 9 4083 1358
- Desde tu perfil en el sitio

Indica siempre tu número de pedido. Te confirmaremos la recepción de tu solicitud dentro de 48 horas hábiles.

<strong>7. Política de envío</strong>

Para consultar detalles sobre los tiempos y costos de envío, revisa nuestra <a href="/envio">Política de Envío</a>.

<strong>8. Marco legal aplicable</strong>

- Ley 19.496 (Protección al Consumidor), modificada por Ley 21.398 (Ley Pro-Consumidor): derecho a retracto, facilidades de baja de suscripciones y garantía legal de 6 meses.
- Decreto Supremo N° 6 de 2021 del Ministerio de Economía: Reglamento de Comercio Electrónico.
- Ley 19.628 y Ley 21.719 (Protección de Datos Personales): tratamiento seguro de datos asociados a tu suscripción.

Para cualquier reclamo, puedes acudir al SERNAC (www.sernac.cl) o a la Agencia de Protección de Datos Personales una vez que entre en operación.
`);

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={resolveLegalLastUpdated(item, '19 de mayo de 2026')}
      sectionKey="legal_cancelacion"
    />
  );
}
