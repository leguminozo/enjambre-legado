/**
 * Capa pública del mapa apícola de Chiloé (mov. 11 & Arquitectura de Soberanía Territorial).
 * Principio de Defensa en Profundidad:
 * 1. La API pública NUNCA emite coordenadas GPS individuales de colmenas.
 * 2. Agrupa la presencia apícola en Zonas Comunales de Pecoreo Protegido (Ley 21.489).
 * 3. Las coordenadas exactas se resguardan exclusivamente en la capa privada/restringida.
 */

import { roundCoordsApprox, COORD_DECIMALS_PUBLIC } from './lote-pasaporte-publico';

export { COORD_DECIMALS_PUBLIC };

export type ColmenasBanda = '1-5' | '6-20' | '21-50' | '50+' | 's/d';

export function bandNColmenas(n: number | null | undefined): ColmenasBanda {
  if (n == null || !Number.isFinite(n) || n <= 0) return 's/d';
  if (n <= 5) return '1-5';
  if (n <= 20) return '6-20';
  if (n <= 50) return '21-50';
  return '50+';
}

export function publicCoords(
  lat: number | null | undefined,
  lng: number | null | undefined,
): { lat: number; lng: number } | null {
  if (
    lat == null ||
    lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    (lat === 0 && lng === 0)
  ) {
    return null;
  }
  return roundCoordsApprox(lat, lng, COORD_DECIMALS_PUBLIC);
}

export type PuntoApiarioPublico = {
  id: string;
  tipo: 'externo' | 'predio' | 'local';
  comuna: string;
  zona: string | null;
  lat: number;
  lng: number;
  colmenas_banda: ColmenasBanda;
  comuna_origen?: string | null;
  estado?: string | null;
};

export type ZonaComunalPublica = {
  id: string;
  comuna: string;
  lat: number;
  lng: number;
  radio_metros: number;
  asentamientos_protegidos: number;
  actores_activos: number;
  alertas_activas: number;
  floracion_dominante: string;
};

export type AlertaPublica = {
  id: string;
  comuna: string;
  zona: string;
  lat: number;
  lng: number;
  radio_km: number;
  tipo_producto: string | null;
  fecha_programada: string;
  estado: string;
};

export type FloracionPublica = {
  id: string;
  lat: number;
  lng: number;
  especie: string | null;
  fecha: string | null;
  fase: string | null;
};

export type ComunaResumen = {
  comuna: string;
  actores_activos: number;
  asentamientos_protegidos: number;
  apiarios_externos: number;
  alertas_activas: number;
};

export type MapaChiloePublico = {
  version: string;
  territorio: string;
  privacidad: {
    nivel: 'publico_anonimizado';
    modelo_defensa: 'agregacion_comunal_k_anonymity';
    nota: string;
    precision_coords: string;
  };
  centro: { lat: number; lng: number; zoom: number };
  zonas_comunales: ZonaComunalPublica[];
  /** @deprecated Vaciado por política de seguridad territorial para evitar triangulación de colmenas */
  apiarios: PuntoApiarioPublico[];
  alertas: AlertaPublica[];
  floraciones: FloracionPublica[];
  comunas: ComunaResumen[];
  generado_en: string;
};

export const MAPA_CHILOE_PUBLICO_VERSION = '2026.11.1';

/**
 * Centros geográficos y botánica dominante por comuna de Chiloé
 */
export const COMUNAS_CHILOE_CONFIG: Record<
  string,
  { center: [number, number]; radio_metros: number; floracion: string }
> = {
  Ancud: { center: [-41.87, -73.83], radio_metros: 9000, floracion: 'Ulmo, Tiaca y Huillipatagua' },
  Quemchi: { center: [-42.14, -73.48], radio_metros: 7500, floracion: 'Ulmo, Melí y Tepú' },
  Dalcahue: { center: [-42.38, -73.65], radio_metros: 8000, floracion: 'Bosque siempreverde y Tiaca' },
  'Curaco de Vélez': { center: [-42.44, -73.60], radio_metros: 5000, floracion: 'Flora costera nativa' },
  Quinchao: { center: [-42.47, -73.50], radio_metros: 6500, floracion: 'Bosque insular nativo' },
  Castro: { center: [-42.48, -73.77], radio_metros: 7000, floracion: 'Ulmo, Tiaca y Arrayán' },
  'Puqueldón': { center: [-42.59, -73.65], radio_metros: 6000, floracion: 'Bosque templado de Isla Lemuy' },
  Chonchi: { center: [-42.62, -73.77], radio_metros: 8500, floracion: 'Cuencas lacustres y Ulmo nativo' },
  'Queilén': { center: [-42.89, -73.47], radio_metros: 7000, floracion: 'Matorral costero y Tiaca' },
  'Quellón': { center: [-43.12, -73.61], radio_metros: 11000, floracion: 'Bosque austral prístino y Tiaca' },
};

export function buildMapaChiloePublico(input: {
  apiariosExternos: Array<{
    id: string;
    n_colmenas?: number | null;
    comuna_destino?: string | null;
    comuna_origen?: string | null;
    zona_destino?: string | null;
    lat_aproximada?: number | null;
    lng_aproximada?: number | null;
    estado?: string | null;
  }>;
  apiariosRegistro?: Array<{
    id: string;
    comuna?: string | null;
    zona?: string | null;
    lat_aproximada?: number | null;
    lng_aproximada?: number | null;
    n_colmenas?: number | null;
    activo?: boolean | null;
  }>;
  predios: Array<{
    id: string;
    comuna?: string | null;
    zona?: string | null;
    lat_aproximada?: number | null;
    lng_aproximada?: number | null;
    activo?: boolean | null;
  }>;
  alertas: Array<{
    id: string;
    comuna?: string | null;
    zona?: string | null;
    lat_aproximada?: number | null;
    lng_aproximada?: number | null;
    radio_km?: number | null;
    tipo_producto?: string | null;
    fecha_programada?: string | null;
    estado?: string | null;
  }>;
  floraciones?: Array<{
    id: string;
    lat?: number | null;
    lng?: number | null;
    fecha?: string | null;
    fase?: string | null;
    especie?: string | null;
  }>;
  actores?: Array<{ comuna?: string | null; estado?: string | null }>;
  now?: Date;
}): MapaChiloePublico {
  // Conteo agregado por comuna para el Atlas Territorial Soberano
  const mapaComunas = new Map<string, ComunaResumen>();

  const getOrInitComuna = (rawComuna: string | null | undefined): ComunaResumen => {
    const c = (rawComuna && rawComuna.trim()) || 'Chiloé';
    let row = mapaComunas.get(c);
    if (!row) {
      row = {
        comuna: c,
        actores_activos: 0,
        asentamientos_protegidos: 0,
        apiarios_externos: 0,
        alertas_activas: 0,
      };
      mapaComunas.set(c, row);
    }
    return row;
  };

  // 1. Actores registrados
  for (const a of input.actores ?? []) {
    if (a.estado && a.estado !== 'activo') continue;
    const row = getOrInitComuna(a.comuna);
    row.actores_activos += 1;
  }

  // 2. Apiarios locales del registro (asentamientos protegidos)
  for (const r of input.apiariosRegistro ?? []) {
    if (r.activo === false) continue;
    const row = getOrInitComuna(r.comuna);
    row.asentamientos_protegidos += 1;
  }

  // 3. Predios facilitadores
  for (const p of input.predios ?? []) {
    if (p.activo === false) continue;
    const row = getOrInitComuna(p.comuna);
    row.asentamientos_protegidos += 1;
  }

  // 4. Apiarios externos / trashumantes
  for (const ext of input.apiariosExternos ?? []) {
    const row = getOrInitComuna(ext.comuna_destino);
    row.apiarios_externos += 1;
  }

  // 5. Alertas públicas
  const alertas: AlertaPublica[] = [];
  for (const al of input.alertas ?? []) {
    if (al.estado && al.estado !== 'activa' && al.estado !== 'programada') continue;
    const coords = publicCoords(al.lat_aproximada, al.lng_aproximada);
    if (!coords) continue;

    const row = getOrInitComuna(al.comuna);
    row.alertas_activas += 1;

    alertas.push({
      id: al.id,
      comuna: al.comuna?.trim() || 'Chiloé',
      zona: al.zona?.trim() || 'Sector rural',
      lat: coords.lat,
      lng: coords.lng,
      radio_km:
        typeof al.radio_km === 'number' && al.radio_km > 0 ? Number(al.radio_km) : 3,
      tipo_producto: al.tipo_producto?.trim() || null,
      fecha_programada: al.fecha_programada || '',
      estado: al.estado || 'activa',
    });
  }

  // 6. Floraciones fenológicas
  const floraciones: FloracionPublica[] = [];
  for (const f of input.floraciones ?? []) {
    const coords = publicCoords(f.lat, f.lng);
    if (!coords) continue;
    floraciones.push({
      id: f.id,
      lat: coords.lat,
      lng: coords.lng,
      especie: f.especie ?? null,
      fecha: f.fecha ?? null,
      fase: f.fase ?? null,
    });
  }

  // 7. Generar Zonas Comunales para el mapa satelital soberano
  // Aseguramos que las 10 comunas de Chiloé siempre existan en el mapa si tienen configuración
  for (const [comuna] of Object.entries(COMUNAS_CHILOE_CONFIG)) {
    getOrInitComuna(comuna);
  }

  const zonas_comunales: ZonaComunalPublica[] = [];
  for (const [comuna, config] of Object.entries(COMUNAS_CHILOE_CONFIG)) {
    const datos = mapaComunas.get(comuna);
    zonas_comunales.push({
      id: `zona-${comuna.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      comuna,
      lat: config.center[0],
      lng: config.center[1],
      radio_metros: config.radio_metros,
      asentamientos_protegidos: datos?.asentamientos_protegidos ?? 0,
      actores_activos: datos?.actores_activos ?? 0,
      alertas_activas: datos?.alertas_activas ?? 0,
      floracion_dominante: config.floracion,
    });
  }

  return {
    version: MAPA_CHILOE_PUBLICO_VERSION,
    territorio: 'Archipiélago de Chiloé · Región de Los Lagos',
    privacidad: {
      nivel: 'publico_anonimizado',
      modelo_defensa: 'agregacion_comunal_k_anonymity',
      nota:
        'Soberanía y protección territorial: El mapa público presenta zonas agregadas por cuenca comunal (Ley 21.489). Se omiten deliberadamente coordenadas individuales, RUP y nombres de predios para evitar triangulación satelital o riesgos sanitarios.',
      precision_coords: 'Zonal / Macro-cuenca comunal (Sin coordenadas individuales de apiarios)',
    },
    centro: { lat: -42.48, lng: -73.76, zoom: 9 },
    zonas_comunales,
    // En la API pública no emitimos puntos individuales de colmenas
    apiarios: [],
    alertas,
    floraciones,
    comunas: [...mapaComunas.values()].sort((a, b) => a.comuna.localeCompare(b.comuna, 'es')),
    generado_en: (input.now ?? new Date()).toISOString(),
  };
}
