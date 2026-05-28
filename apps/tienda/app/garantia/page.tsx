import { getSiteContentStatic } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Garantía',
  description: 'Garantía legal y voluntaria de nuestros productos conforme a la Ley 19.496.',
};

export default async function GarantiaPage() {
  const contentData = await getSiteContentStatic('legal_garantia');
  const item = contentData[0]?.content;
  const title = (item && typeof item === 'object' && 'title' in item ? String(item.title) : null) || 'Política de Garantía';
  const content = (item && typeof item === 'object' && 'body' in item ? String(item.body) : null) || `
<strong>Última actualización: 19 de mayo de 2026</strong>

En La Obrera y el Zángano, respaldamos la calidad de nuestros productos. Esta política describe la garantía legal y voluntaria que ofrecemos, conforme a la Ley 19.496 sobre Protección al Consumidor.

<strong>1. Garantía legal (Ley 19.496, artículos 20-24)</strong>

Todo producto nuevo que comercializamos cuenta con una garantía legal de 3 meses contados desde la fecha de entrega al consumidor.

Si durante ese período el producto presenta defectos de fabricación, vicios de calidad o no corresponde a lo ofrecido, usted tiene derecho a elegir entre:

- <strong>Reparación gratuita</strong> del bien.
- <strong>Reemplazo</strong> del bien por uno igual o de similares características.
- <strong>Devolución del precio pagado</strong>, bonificado según tabla del artículo 24 de la Ley 19.496.

<strong>2. Condiciones para ejercer la garantía legal</strong>

- El defecto no debe ser producto de un uso incorrecto o negligente.
- Debe presentar el comprobante de compra (boleta o factura).
- Debe comunicar el problema dentro del plazo de 3 meses desde la entrega.
- El producto debe ser devuelto con sus embalajes originales cuando sea posible.

<strong>3. Procedimiento</strong>

Para hacer efectiva la garantía:

1. Contáctenos a comunidad@obrerayzangano.com o al +56 9 408 31 358 indicando su número de pedido y describiendo el problema.
2. Le solicitaremos evidencia fotográfica del defecto cuando corresponda.
3. Coordinaremos el retiro del producto o le enviaremos una etiqueta de envío de devolución.
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
- Daños posteriores a la apertura del producto por causas ajenas a defectos de fabricación.

<strong>6. Productos en promoción o liquidación</strong>

Los productos en promoción o liquidación mantienen la garantía legal de 3 meses. Si el producto ha sido adquirido con descuento por defectos conocidos, dichos defectos estarán excluidos de la garantía y se informarán expresamente al momento de la compra.

<strong>7. Exclusiones</strong>

La garantía no cubre:

- Daños causados por uso indebido, almacenamiento incorrecto o negligencia.
- Productos alterados después de la entrega.
- Daños derivados de fuerza mayor o caso fortuito.
- Desgaste normal del producto.

<strong>8. Derecho a retracto</strong>

Esta garantía es independiente del derecho a retracto de 10 días establecido en la Ley 21.315 para compras electrónicas. Consulte nuestra <a href="/cancelacion">Política de Cancelación</a> para más detalles.

<strong>9. Reclamos y SERNAC</strong>

Si no queda satisfecho con la resolución de su garantía, puede presentar un reclamo ante el Servicio Nacional del Consumidor (SERNAC) a través de www.sernac.cl o al 600 700 4000.

<strong>10. Marco legal aplicable</strong>

- Ley 19.496 (Protección al Consumidor), artículos 20-24: garantía legal.
- Ley 21.315 (Comercio Electrónico): derecho a retracto.
- Normas sanitarias del SAG y resolución sanitarias aplicables a productos alimentarios.

Consulta también: <a href="/reembolso">Política de Reembolso</a> | <a href="/cancelacion">Política de Cancelación</a> | <a href="/envio">Política de Envío</a> | <a href="/terminos">Términos del Servicio</a>

Para consultas: comunidad@obrerayzangano.com | +56 9 408 31 358
`;

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={(item && typeof item === 'object' && 'updated_at' in item ? String(item.updated_at) : null) || '19 de mayo de 2026'}
    />
  );
}
