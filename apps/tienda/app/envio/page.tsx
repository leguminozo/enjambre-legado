import { getSiteContent } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Envío',
  description: 'Detalles sobre la logística y tiempos de despacho.',
};

export default async function EnvioPage() {
  const contentData = await getSiteContent('legal_envio');
  const item = contentData[0]?.content;
  const title = (item && typeof item === 'object' && 'title' in item ? String(item.title) : null) || 'Política de Envío';
  const content = (item && typeof item === 'object' && 'body' in item ? String(item.body) : null) || `
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

Ofrecemos envío gratuito en pedidos superiores a un monto específico (ver condiciones vigentes en la tienda).

Los aranceles, impuestos, tasas u otras sumas generadas por el envío no están incluidos en el porte y se cobrarán de forma independiente si aplican.

<strong>4. Seguimiento</strong>

Una vez despachado, recibirás un número de orden de servicio y enlace de seguimiento vía correo electrónico. Puedes rastrear tu pedido en www.bluex.cl ingresando el número de orden de servicio.

<strong>5. Recepción y responsabilidad del transportista</strong>

La responsabilidad de Blue Express comienza con la recepción del envío por personal autorizado y se extiende hasta la entrega al consignatario o persona que reciba en su nombre en el domicilio de destino. La recepción en conformidad (nombre y RUT del receptor) extingue la responsabilidad del transportista, salvo que el consignatario presente reclamo dentro de 3 días hábiles.

El monto máximo de responsabilidad de Blue Express asciende a $85.000 CLP por orden de servicio. Si el valor del bien excede ese monto, puedes adquirir cobertura de riesgo adicional. Si no la adquieres, aceptas que la indemnización máxima será de $85.000 CLP.

<strong>6. Envíos no aceptados</strong>

Blue Express rechaza como envío:
- Artículos restringidos o prohibidos por IATA o ICAO.
- Embalajes defectuosos o cerrados incorrectamente.
- Envíos sin documentación indispensable.
- Productos con prohibición fitosanitaria vigente del SAG.
- Todo aquello que no pueda transportarse de forma segura y eficiente.

Conforme a la Ley 20.393, queda estrictamente prohibido encomendar objetos o mercaderías ilícitas o cuyo transporte sea ilícito.

<strong>7. Mercancías peligrosas</strong>

Si el envío requiere transporte aéreo y contiene mercancías clasificadas como peligrosas (Norma Chilena N° 382 Of 89), el expedidor debe identificar, clasificar, embalar, etiquetar y documentar el envío según la reglamentación. Si el producto no cumple con la normativa aérea, debe marcarse como VÍA TERRESTRE. El periodo de revisión en aeropuerto puede ser de 12 a 24 horas adicionales.

<strong>8. Reclamos</strong>

Todo reclamo por daño, extravío, robo, demora o entrega errónea debe ingresarse completando el formulario web dentro del portal de clientes Blue, dentro de un plazo máximo de 45 días hábiles posteriores a la fecha promesa de entrega. Reclamos fuera de plazo serán rechazados.

<strong>9. Desistimiento del envío</strong>

Puedes desistir del envío en cualquier momento antes de la entrega al consignatario:
- Antes de que salga de la ciudad de origen: pagas el porte total.
- Una vez partido hacia destino: pagas el porte total de ida y de regreso, y haremos lo posible por retener la entrega.

<strong>10. Envíos no entregados y no retirados</strong>

Si el envío no puede entregarse por direcciones insuficientes, rechazo del consignatario o imposibilidad de ubicación, será devuelto al origen siendo de tu responsabilidad el rastreo. El porte total es de cargo del remitente.

Envíos no reclamados dentro de 6 meses desde la fecha supuesta de arribo se considerarán abandonados a favor de Blue Express S.A.

<strong>11. Envíos internacionales</strong>

Para envíos fuera de Chile, contáctanos directamente a comunidad@obrerayzangano.com para coordinar logística especializada. Los aranceles, impuestos aduaneros y tasas aplicables en el país de destino son responsabilidad del comprador.

<strong>12. Peso y dimensiones máximas</strong>

Cada bulto no puede exceder los 100 kg, 1 m³ de volumen, 1.2 m de ancho y 0.86 m de alto para carga aérea. Para bultos superiores, coordina con anticipación.

<strong>13. Marco legal aplicable</strong>

- Ley 21.315 (Comercio Electrónico): obligación de informar costos de envío antes de completar la compra.
- Ley 19.496 (Protección al Consumidor): derechos ante entregas tardías o deficientes.
- Términos y Condiciones del Servicio de Blue Express S.A.
- Competencia: Tribunales Ordinarios de Justicia de Santiago, Chile.

Consulta también nuestra <a href="/reembolso">Política de Reembolso</a> y <a href="/cancelacion">Política de Cancelación</a>.

Para cualquier consulta sobre envíos, escríbenos a comunidad@obrerayzangano.com.
`;

  return (
    <LegalContent
      title={title}
      content={content}
      lastUpdated={(item && typeof item === 'object' && 'updated_at' in item ? String(item.updated_at) : null) || '19 de mayo de 2026'}
    />
  );
}
