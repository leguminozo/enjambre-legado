import { gddHistoricoAcumulado, gddPronostico, proyectarFloracion } from '../../src/api/lib/fenologia';

async function main() {
  const LAT = -41.86, LNG = -73.82;
  const historico = await gddHistoricoAcumulado(LAT, LNG, new Date(), 5);
  const pronostico = await gddPronostico(LAT, LNG, 16, 5);
  console.log('GDD histórico acumulado (desde 1-jul):', historico?.acumulado, '| días:', historico?.serie.length);
  console.log('GDD pronóstico 16d:', pronostico?.acumulado);

  const especies = [
    { id: '1', nombre_cientifico: 'Eucryphia cordifolia', nombre_comun: 'Ulmo', tbase_c: 5, gdd_umbral: 1384.1, ventana_ini: 2, ventana_fin: 2 },
    { id: '2', nombre_cientifico: 'Tepualia stipularis', nombre_comun: 'Tepú', tbase_c: 5, gdd_umbral: 1068.4, ventana_ini: 1, ventana_fin: 1 },
    { id: '3', nombre_cientifico: 'Embothrium coccineum', nombre_comun: 'Notro', tbase_c: 5, gdd_umbral: 564.8, ventana_ini: 10, ventana_fin: 12 },
    { id: '4', nombre_cientifico: 'Luma apiculata', nombre_comun: 'Arrayán', tbase_c: 5, gdd_umbral: 1373.4, ventana_ini: 2, ventana_fin: 2 },
  ];
  for (const esp of especies) {
    const r = proyectarFloracion(esp, historico, pronostico);
    console.log(`${r.nombreComun}: ${r.gddActual}/${r.gddUmbral} GDD → ${r.enFloracion ? '✨ EN FLORACIÓN' : r.diasEstimados != null ? `~${r.diasEstimados} días` : 'fuera de horizonte'} | ventana: ${r.enVentana ? 'sí' : 'no'}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
