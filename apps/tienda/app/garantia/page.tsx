import { getSiteContent, resolveLegalBody, resolveLegalLastUpdated, resolveLegalTitle } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

import { createPageMetadata } from '@/lib/shop/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('/garantia', {
    title: 'Garantía Legal',
    description: 'Garantía legal de 6 meses y estándar de calidad de origen conforme a la Ley del Consumidor.',
  });
}

export default async function GarantiaPage({ searchParams }: { searchParams: Promise<{ cms_preview?: string }> }) {
  const draft = (await searchParams).cms_preview === "1";
  const contentData = await getSiteContent('legal_garantia', { draft });
  const item = contentData[0]?.content;
  const title = resolveLegalTitle(item, 'Política de Garantía');
  const content = resolveLegalBody(item, `
<strong>Última actualización: 19 de mayo de 2026</strong>

En La Obrera y el Zángano, respaldamos la calidad de nuestros productos. Esta política describe la garantía legal y voluntaria que ofrecemos, conforme a la Ley 19.496 sobre Protección al Consumidor.

<strong>1. Garantía legal (Ley 19.496, artículos 20-24, reformada por Ley 21.398)</strong>

Todo producto nuevo que comercializamos cuenta con una garantía legal de 6 meses contados desde la fecha de entrega al consumidor, de conformidad con el artículo 21 de la Ley 19.496 sobre Protección de los Derechos de los Consumidores.

Si durante ese período el producto presenta defectos de fabricación, vicios de calidad o no corresponde a lo ofrecido, usted tiene derecho a elegir libremente entre:

- <strong>Reparación gratuita</strong> del bien.
- <strong>Reemplazo</strong> del bien por uno igual o de similares características.
- <strong>Devolución del precio pagado</strong>, previa restitución del producto.

<strong>2. Condiciones para ejercer la garantía legal</strong>

- El defecto no debe ser producto de un uso incorrecto o negligente.
- Debe presentar el comprobante de compra (boleta o factura).
- Debe comunicar el problema dentro del plazo legal de 6 meses desde la entrega.
- El producto debe ser devuelto con sus embalajes originales cuando sea posible.

<strong>3. Procedimiento</strong>

Para hacer efectiva la garantía:

1. Contáctenos a obrerayzangano@gmail.com o al +56 9 408 31 358 indicando su número de pedido y describiendo el problema.
2. Le solicitaremos evidencia fotográfica del defecto cuando corresponda.
3. Coordinaremos el retiro del producto o le enviaremos una etiqueta de envío de devolución sin costo para usted.
4. Evaluaremos el caso dentro de un plazo máximo de 15 días hábiles desde la recepción del producto.
5. Le comunicaremos la resolución y procederemos con la reparación, reemplazo o devolución según su elección.

<strong>4. Garantía voluntaria adicional</strong>

Además de la garantía legal, ofrecemos una garantía voluntaria extendida de 30 días desde la recepción del producto para defectos de calidad comprobables. Esta garantía no reemplaza ni limita la garantía legal; se suma a ella.

<strong>5. Productos alimentarios</strong>

Dada la naturaleza de nuestros productos (miel y derivados apícolas), los defectos cubiertos incluyen:

- Cristalización anormal o contaminación visible.
- Sello de seguridad roto al recibir el producto.
- Envase dañado que comprometa la integridad del producto.
- Producto que no corresponde al solicitado (error de despacho).
- Fecha de vencimiento vencida al momento de la entrega.

No se consideran defectos cubiertos:

- Cambios naturales en la textura o color de la miel (la cristalización es un proceso natural).
- Daños posteriores a la apertura del producto por causas ajenas a defectos de fabricación o mal almacenamiento imputable al consumidor.

<strong>6. Productos en promoción o liquidación</strong>

Los productos en promoción o liquidación mantienen la garantía legal de 6 meses. Si el producto ha sido adquirido con descuento por defectos informados previamente, dichos defectos estarán excluidos de la garantía y se comunicarán expresamente al momento de la compra.

<strong>7. Exclusiones</strong>

La garantía no cubre:

- Daños causados por uso indebido, almacenamiento incorrecto o negligencia del usuario.
- Productos alterados después de la entrega.
- Daños derivados de fuerza mayor o caso fortuito.
- Desgaste normal del producto.

<strong>8. Derecho a retracto</strong>

Esta garantía legal es independiente del derecho a retracto de 10 días establecido en el artículo 3 bis de la Ley 19.496 para compras electrónicas. Consulte nuestra <a href="/cancelacion">Política de Cancelación</a> para más detalles.

<strong>9. Reclamos y SERNAC</strong>

Si no queda satisfecho con la resolución de su garantía, puede presentar un reclamo ante el Servicio Nacional del Consumidor (SERNAC) a través de www.sernac.cl o al 600 700 4000.

<strong>10. Marco legal aplicable</strong>

- Ley 19.496 (Protección al Consumidor), modificada por Ley 21.398 (Ley Pro-Consumidor): garantía legal de 6 meses y derecho de opción irrenunciable.
- Decreto Supremo N° 6 de 2021 del Ministerio de Economía: Reglamento de Comercio Electrónico.
- Normas sanitarias del SAG y Reglamento Sanitario de los Alimentos (DTO 977/1996) aplicables a productos alimentarios.

Consulta también: <a href="/reembolso">Política de Reembolso</a> | <a href="/cancelacion">Política de Cancelación</a> | <a href="/envio">Política de Envío</a> | <a href="/terminos">Términos del Servicio</a>

Para consultas: obrerayzangano@gmail.com | +56 9 408 31 358
`);

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={resolveLegalLastUpdated(item, '19 de mayo de 2026')}
      sectionKey="legal_garantia"
    />
  );
}
