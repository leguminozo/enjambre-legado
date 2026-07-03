import { getSiteContent } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Reembolso',
  description: 'Garantía y devoluciones de nuestros productos.',
};

export default async function ReembolsoPage() {
  const contentData = await getSiteContent('legal_reembolso');
  const item = contentData[0]?.content;
  const title = (item && typeof item === 'object' && 'title' in item ? String(item.title) : null) || 'Política de Reembolso';
  const content = (item && typeof item === 'object' && 'body' in item ? String(item.body) : null) || `
<strong>Última actualización: 19 de mayo de 2026</strong>

<strong>1. Derecho a retracto (Ley 21.315)</strong>

Conforme al artículo 3 bis de la Ley 21.315, dispones de 10 días calendario desde la recepción del producto para ejercer tu derecho a retracto, sin necesidad de justificación y sin penalización. Este derecho aplica para todas las compras realizadas por medios electrónicos.

<strong>2. Garantía legal (Ley 19.496)</strong>

De conformidad con los artículos 20 a 24 de la Ley 19.496 sobre Protección al Consumidor, nuestros productos cuentan con una garantía legal de 3 meses contados desde la entrega. Si el producto presenta defectos de fabricación, vicios o no corresponde a lo ofrecido, tienes derecho a elegir entre:
- La reparación gratuita del bien.
- El reemplazo del bien por uno igual o de similares características.
- La devolución del precio pagado.

Para ejercer esta garantía, contacta a comunidad@obrerayzangano.com dentro del plazo indicado.

Consulta también nuestra <a href="/garantia">Política de Garantía</a> para más detalles.

<strong>3. Política de devolución de 30 días</strong>

Además de los derechos legales anteriores, ofrecemos una política de devolución extendida de 30 días desde la recepción del artículo. El artículo debe estar en el mismo estado en que lo recibiste, sin usar, con las etiquetas y en su embalaje original. Necesitarás el recibo o comprobante de compra.

<strong>4. Daños y problemas</strong>

Revisa tu pedido en cuanto lo recibas. Si el artículo está defectuoso, dañado durante el transporte o recibiste un artículo equivocado, contáctanos de inmediato a comunidad@obrerayzangano.com para evaluar el problema y solucionarlo. En caso de daño durante el transporte, el reclamo ante Blue Express debe realizarse dentro de los primeros 3 días hábiles (ver <a href="/envio">Política de Envío</a>).

<strong>5. Cambios</strong>

La forma más rápida de conseguir lo que buscas es devolver el artículo que tienes y, una vez aceptada la devolución, hacer una compra aparte del artículo nuevo.

<strong>6. Proceso de devolución</strong>

Para iniciar una devolución, contacta a comunidad@obrerayzangano.com. Las devoluciones deberán enviarse a:

Blanco Encalada 154, Castro, Chiloé, Chile

Si se acepta la devolución, te enviaremos una etiqueta de envío para la devolución junto con las instrucciones sobre cómo y dónde enviar el paquete. No se aceptarán artículos devueltos sin haber solicitado previamente la devolución.

<strong>7. Condiciones para productos alimentarios</strong>

Debido a la naturaleza alimentaria de nuestros productos, no aceptamos devoluciones de frascos abiertos, a menos que sea por un defecto de calidad comprobable. Esta restricción no afecta tu derecho a retracto ni la garantía legal.

<strong>8. Reembolsos</strong>

Te informaremos cuando hayamos recibido e inspeccionado tu devolución y te comunicaremos si se ha aprobado el reembolso o no. Si se aprueba, se te reembolsará de forma automática en tu forma de pago original en un plazo de 10 días hábiles.

Los reembolsos se procesan a través del mismo método de pago original:
- Tarjeta de crédito/débito: 5 a 10 días hábiles.
- Transbank / Flow: 5 a 10 días hábiles según tu banco emisor.
- Transferencia bancaria: 3 a 7 días hábiles.

Recuerda que el banco o la entidad emisora de la tarjeta de crédito pueden tardar algún tiempo en procesar y hacer efectivo el reembolso. Si han transcurrido más de 15 días hábiles desde que aprobamos tu devolución, contáctanos a comunidad@obrerayzangano.com.

<strong>9. Marco legal aplicable</strong>

- Ley 19.496 (Protección al Consumidor): garantía legal, derecho a elección entre reparación, reemplazo o devolución.
- Ley 21.315 (Comercio Electrónico): derecho a retracto de 10 días.
- Ley 18.046 y Normas del SAG: normas sanitarias aplicables a productos alimentarios.

Para cualquier reclamo, puedes acudir al SERNAC (www.sernac.cl).

Consulta también: <a href="/cancelacion">Política de Cancelación</a> | <a href="/envio">Política de Envío</a> | <a href="/garantia">Política de Garantía</a>
`;

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={(item && typeof item === 'object' && 'updated_at' in item ? String(item.updated_at) : null) || '19 de mayo de 2026'}
    />
  );
}
