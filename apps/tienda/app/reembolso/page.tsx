import { getSiteContent, resolveLegalBody, resolveLegalLastUpdated, resolveLegalTitle } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

import { createPageMetadata } from '@/lib/shop/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('/reembolso', {
    title: 'Política de Reembolso y Devolución',
    description: 'Procedimientos y plazos para devoluciones y reembolsos de compras en la tienda.',
  });
}

export default async function ReembolsoPage({ searchParams }: { searchParams: Promise<{ cms_preview?: string }> }) {
  const draft = (await searchParams).cms_preview === "1";
  const contentData = await getSiteContent('legal_reembolso', { draft });
  const item = contentData[0]?.content;
  const title = resolveLegalTitle(item, 'Política de Reembolso');
  const content = resolveLegalBody(item, `
<strong>Última actualización: 19 de mayo de 2026</strong>

<strong>1. Derecho a retracto (Ley 19.496 y DS 6/2021)</strong>

Conforme al artículo 3 bis de la Ley 19.496 sobre Protección de los Derechos de los Consumidores y el Decreto Supremo N° 6 de 2021 del Ministerio de Economía (Reglamento de Comercio Electrónico), dispones de 10 días corridos desde la recepción del producto para ejercer tu derecho a retracto en compras electrónicas, sin necesidad de justificación y sin penalización, siempre que el producto conserve su sello térmico de seguridad inviolado y su embalaje original.

<strong>2. Garantía legal (Ley 19.496, reformada por Ley 21.398)</strong>

De conformidad con los artículos 20 a 24 de la Ley 19.496 sobre Protección al Consumidor, reformados por la Ley 21.398, nuestros productos cuentan con una garantía legal de 6 meses contados desde la fecha de entrega. Si el producto presenta defectos de fabricación, vicios de calidad o no corresponde a lo ofrecido, tienes derecho a elegir libremente entre:
- La reparación gratuita del bien.
- El reemplazo del bien por uno igual o de similares características.
- La devolución del precio pagado, previa restitución del producto.

Para ejercer esta garantía, contacta a obrerayzangano@gmail.com dentro del plazo legal de 6 meses.

Consulta también nuestra <a href="/garantia">Política de Garantía</a> para más detalles.

<strong>3. Política de devolución de 30 días</strong>

Además de los derechos legales anteriores, ofrecemos una política de devolución extendida de 30 días desde la recepción del artículo. El artículo debe estar en el mismo estado en que lo recibiste, sin usar, con las etiquetas y en su embalaje original. Necesitarás el recibo o comprobante de compra.

<strong>4. Daños y problemas</strong>

Revisa tu pedido en cuanto lo recibas. Si el artículo está defectuoso, dañado durante el transporte o recibiste un artículo equivocado, contáctanos de inmediato a obrerayzangano@gmail.com para evaluar el problema y solucionarlo. La empresa responde directamente ante ti por cualquier contingencia durante el transporte (ver <a href="/envio">Política de Envío</a>).

<strong>5. Cambios</strong>

La forma más rápida de conseguir lo que buscas es devolver el artículo que tienes y, una vez aceptada la devolución, hacer una compra aparte del artículo nuevo.

<strong>6. Proceso de devolución</strong>

Para iniciar una devolución, contacta a obrerayzangano@gmail.com. Las devoluciones deberán enviarse a:

Blanco Encalada 154, Castro, Chiloé, Chile

Si se acepta la devolución, te enviaremos una etiqueta de envío para la devolución junto con las instrucciones sobre cómo y dónde enviar el paquete. No se aceptarán artículos devueltos sin haber solicitado previamente la devolución.

<strong>7. Condiciones para productos alimentarios</strong>

Debido a la naturaleza alimentaria de nuestros productos y a las exigencias del Reglamento Sanitario de los Alimentos (DTO 977/1996), no aceptamos devoluciones de frascos con sello de seguridad violado o abiertos, salvo por defectos de fabricación o vicio de calidad comprobable bajo la garantía legal.

<strong>8. Reembolsos</strong>

Te informaremos cuando hayamos recibido e inspeccionado tu devolución y te comunicaremos si se ha aprobado el reembolso o no. Si se aprueba, se te reembolsará de forma automática en tu forma de pago original en un plazo de 10 días hábiles.

Los reembolsos se procesan a través del mismo método de pago original:
- Tarjeta de crédito/débito: 5 a 10 días hábiles.
- Transbank / Flow: 5 a 10 días hábiles según tu banco emisor.
- Transferencia bancaria: 3 a 7 días hábiles.

Recuerda que el banco o la entidad emisora de la tarjeta de crédito pueden tardar algún tiempo en procesar y hacer efectivo el reembolso. Si han transcurrido más de 15 días hábiles desde que aprobamos tu devolución, contáctanos a obrerayzangano@gmail.com.

<strong>9. Marco legal aplicable</strong>

- Ley 19.496 (Protección al Consumidor), modificada por Ley 21.398 (Ley Pro-Consumidor): garantía legal de 6 meses y derecho de opción.
- Decreto Supremo N° 6 de 2021 del Ministerio de Economía: Reglamento de Comercio Electrónico y derecho a retracto.
- Reglamento Sanitario de los Alimentos (DTO 977/1996 del Ministerio de Salud): normas sanitarias aplicables a la manipulación y retorno de alimentos.

Para cualquier reclamo, puedes acudir al SERNAC (www.sernac.cl).

Consulta también: <a href="/cancelacion">Política de Cancelación</a> | <a href="/envio">Política de Envío</a> | <a href="/garantia">Política de Garantía</a>
`);

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={resolveLegalLastUpdated(item, '19 de mayo de 2026')}
      sectionKey="legal_reembolso"
    />
  );
}
