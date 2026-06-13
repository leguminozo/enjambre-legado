import { getSiteContent } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cancelación',
  description: 'Información sobre cancelaciones de pedidos y suscripciones.',
};

export default async function CancelacionPage() {
  const contentData = await getSiteContent('legal_cancelacion');
  const item = contentData[0]?.content;
  const title = (item && typeof item === 'object' && 'title' in item ? String(item.title) : null) || 'Política de Cancelación';
  const content = (item && typeof item === 'object' && 'body' in item ? String(item.body) : null) || `
<strong>Última actualización: 19 de mayo de 2026</strong>

Algunos artículos de nuestra tienda pueden ofrecerse como suscripción, pedido en preventa o probar antes de comprar. Esta política de cancelación establece cómo puedes cambiar o cancelar este tipo de compras.

<strong>1. Derecho a retracto (Ley 21.315)</strong>

De conformidad con el artículo 3 bis de la Ley 21.315 sobre Comercio Electrónico, tienes un plazo de 10 días calendario contados desde la recepción del producto para ejercer tu derecho a retracto, sin necesidad de justificar la decisión y sin penalización alguna. El retracto procede siempre que el producto no haya sido usado, abierto o deteriorado de forma que impida su reventa.

Para ejercer el retracto, contacta a comunidad@obrerayzangano.com indicando tu número de pedido. Una vez validado, te proporcionaremos una etiqueta de envío de devolución y procederemos al reembolso según nuestra <a href="/reembolso">Política de Reembolso</a>.

<strong>2. Suscripciones</strong>

Al adquirir una suscripción, recibirás entregas repetidas basadas en la duración y frecuencia que selecciones. Tus datos de pago se almacenarán de forma segura y se te cobrará por cada una de estas entregas, a menos que elijas pagar por adelantado.

Algunas suscripciones pueden renovarse de forma automática al término de su duración. Si no deseas renovar una suscripción, puedes cancelarla en cualquier momento desde tu perfil o desde los enlaces incluidos en tus correos electrónicos de confirmación de pedido.

Conforme a la Ley 21.315, la cancelación de una suscripción debe ser tan sencilla como la suscripción misma. No aplicamos penalizaciones tras el período mínimo comprometido. Tras la cancelación, recibirás confirmación por correo electrónico dentro de 24 horas.

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
- Correo electrónico: comunidad@obrerayzangano.com
- WhatsApp: +56 9 408 31 358
- Desde tu perfil en el sitio

Indica siempre tu número de pedido. Te confirmaremos la recepción de tu solicitud dentro de 48 horas hábiles.

<strong>7. Política de envío</strong>

Para consultar detalles sobre los tiempos y costos de envío, revisa nuestra <a href="/envio">Política de Envío</a>.

<strong>8. Marco legal aplicable</strong>

- Ley 21.315 (Comercio Electrónico): derecho a retracto, condiciones de contratación electrónica.
- Ley 19.496 (Protección al Consumidor): garantía legal, prohibición de cláusulas abusivas.
- Ley 19.628 y Ley 21.719 (Protección de Datos): tratamiento de datos asociados a tu suscripción.

Para cualquier reclamo, puedes acudir al SERNAC (www.sernac.cl) o a la Agencia de Protección de Datos Personales una vez que entre en operación.
`;

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={(item && typeof item === 'object' && 'updated_at' in item ? String(item.updated_at) : null) || '19 de mayo de 2026'}
    />
  );
}
