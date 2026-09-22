import { getSiteContent, resolveLegalBody, resolveLegalLastUpdated, resolveLegalTitle } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

import { createPageMetadata } from '@/lib/shop/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('/envio', {
    title: 'Política de Envío y Despachos',
    description: 'Tiempos de entrega, cobertura nacional y especificaciones de transporte con Blue Express.',
  });
}

export default async function EnvioPage({ searchParams }: { searchParams: Promise<{ cms_preview?: string }> }) {
  const draft = (await searchParams).cms_preview === "1";
  const contentData = await getSiteContent('legal_envio', { draft });
  const item = contentData[0]?.content;
  const title = resolveLegalTitle(item, 'Política de Envío');
  const content = resolveLegalBody(item, `
<strong>Última actualización: 19 de mayo de 2026</strong>

Nuestras mieles y productos viajan desde Chiloé y otros territorios remotos para llegar a tu mesa. A continuación se detallan los términos, condiciones y especificaciones del servicio de envío.

<strong>1. Operador logístico</strong>

Los envíos son gestionados a través de Blue Express S.A. El transporte se rige por los Términos y Condiciones del Servicio de Blue Express, los cuales se resumen a continuación y están disponibles íntegramente en www.bluex.cl.

<strong>2. Tiempos de despacho</strong>

Los pedidos se procesan en 24-48 horas hábiles. El tiempo de tránsito depende de tu ubicación:

- Región Metropolitana (servicio Priority): día siguiente antes de las 20:00 hrs.
- Ciudades base entre Copiapó y Puerto Montt (servicio Express): 2 días hábiles antes de las 20:00 hrs.
- Arica: 4 días hábiles.
- Iquique, Calama y Antofagasta: 3 días hábiles hacia el Sur.
- Coyhaique: 7 días hábiles.
- Punta Arenas: 9 días hábiles.
- Chiloé: Entrega local coordinada.

Los plazos pueden variar por condiciones meteorológicas o de fuerza mayor (numeral 10, Términos Blue Express).

<strong>3. Costos de envío</strong>

El costo se calcula en el checkout basándose en el peso y destino. El peso del envío se considera como el mayor entre el peso físico y el peso volumétrico (largo × ancho × alto en cm / 4.000), conforme a las tarifas de Blue Express.

Ofrecemos envío gratuito a todo Chile en compras sobre $45.000 CLP (o el umbral promocional vigente comunicado en la tienda y en el carrito).

Los aranceles, impuestos, tasas u otras sumas generadas por el envío no están incluidos en el porte y se cobrarán de forma independiente si aplican.

<strong>4. Seguimiento</strong>

Una vez despachado, recibirás un número de orden de servicio y enlace de seguimiento vía correo electrónico. Puedes rastrear tu pedido en www.bluex.cl ingresando el número de orden de servicio.

<strong>5. Recepción y responsabilidad en la entrega</strong>

La Obrera y el Zángano es directa e íntegramente responsable frente al consumidor por la entrega en perfecto estado, tiempo y forma de los productos adquiridos, conforme al artículo 43 de la Ley 19.496 y al Decreto Supremo N° 6 de 2021 del Ministerio de Economía (Reglamento de Comercio Electrónico).

Si el pedido sufre pérdidas, daños o extravíos durante el transporte a cargo de Blue Express, La Obrera y el Zángano procederá a la reposición inmediata del producto o a la devolución del 100% de lo pagado, sin trasladar límites de indemnización del transportista al comprador. Te solicitamos informarnos cualquier anomalía en la recepción dentro de los primeros días a través de obrerayzangano@gmail.com para agilizar la solución.

<strong>6. Envíos no aceptados</strong>

Blue Express rechaza como envío:
- Artículos restringidos o prohibidos por IATA o ICAO.
- Embalajes defectuosos o cerrados incorrectamente.
- Envíos sin documentación indispensable.
- Productos con prohibición fitosanitaria vigente del SAG.
- Todo aquello que no pueda transportarse de forma segura y eficiente.

Conforme a la Ley 20.393 y Ley 21.595, queda estrictamente prohibido encomendar objetos o mercaderías ilícitas o cuyo transporte sea ilícito.

<strong>7. Mercancías peligrosas</strong>

Si el envío requiere transporte aéreo y contiene mercancías clasificadas como peligrosas (Norma Chilena N° 382 Of 89), el expedidor debe identificar, clasificar, embalar, etiquetar y documentar el envío según la reglamentación. Si el producto no cumple con la normativa aérea, debe marcarse como VÍA TERRESTRE. El periodo de revisión en aeropuerto puede ser de 12 a 24 horas adicionales.

<strong>8. Reclamos</strong>

Todo reclamo por daño, extravío, robo, demora o entrega errónea puede comunicarse directamente a obrerayzangano@gmail.com o a través de nuestros canales de atención. Nuestro equipo gestionará la solución y las reclamaciones pertinentes con el operador logístico.

<strong>9. Desistimiento del envío</strong>

Puedes desistir del envío antes de su despacho de bodega sin costo alguno. Una vez entregado al courier, aplica el procedimiento del derecho a retracto legal tras la recepción del producto.

<strong>10. Envíos no entregados y no retirados</strong>

Si el envío no puede entregarse por direcciones insuficientes o imposibilidad reiterada de ubicación en el domicilio indicado, el paquete retornará a origen y coordinaremos contigo un nuevo despacho o el reembolso correspondiente.

<strong>11. Envíos internacionales</strong>

Para envíos fuera de Chile, contáctanos directamente a obrerayzangano@gmail.com para coordinar logística especializada. Los aranceles, impuestos aduaneros y tasas aplicables en el país de destino son responsabilidad del comprador.

<strong>12. Peso y dimensiones máximas</strong>

Cada bulto no puede exceder los 100 kg, 1 m³ de volumen, 1.2 m de ancho y 0.86 m de alto para carga aérea. Para bultos superiores, coordina con anticipación.

<strong>13. Marco legal aplicable</strong>

- Ley 19.496 (Protección al Consumidor), modificada por Ley 21.398: responsabilidad directa del proveedor por el cumplimiento del envío y deber de información precontractual veraz.
- Decreto Supremo N° 6 de 2021 del Ministerio de Economía: Reglamento de Comercio Electrónico.
- Términos y Condiciones del Servicio de Blue Express S.A.
- Competencia: Tribunales Ordinarios de Justicia de Chile.

Consulta también nuestra <a href="/reembolso">Política de Reembolso</a> y <a href="/cancelacion">Política de Cancelación</a>.

Para cualquier consulta sobre envíos, escríbenos a obrerayzangano@gmail.com.
`);

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={resolveLegalLastUpdated(item, '19 de mayo de 2026')}
      sectionKey="legal_envio"
    />
  );
}
