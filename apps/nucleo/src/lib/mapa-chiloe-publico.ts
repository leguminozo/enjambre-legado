/**
 * Capa pública del mapa apícola de Chiloé (mov. 11).
 * Anonimiza: sin nombres, RUP, contactos ni GPS exacto.
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
  /** Banda, no número exacto (anti-fingerprinting). */
  colmenas_banda: ColmenasBanda;
  /** Solo trashumantes: comuna de origen (sin actor). */
  comuna_origen?: string | null;
  estado?: string | null;
};

export type AlertaPublica = {
  id: string;
  comuna: string;
  zona: string;
  lat: number;
  lng: number;
  radio_km: number;
  /** Tipo genérico; no se publica el nombre comercial del producto. */
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
  apiarios_externos: number;
  alertas_activas: number;
};

export type MapaChiloePublico = {
  version: string;
  territorio: string;
  privacidad: {
    nivel: 'publico_anonimizado';
    nota: string;
    precision_coords: string;
  };
  centro: { lat: number; lng: number; zoom: number };
  apiarios: PuntoApiarioPublico[];
  alertas: AlertaPublica[];
  floraciones: FloracionPublica[];
  comunas: ComunaResumen[];
  generado_en: string;
};

export const MAPA_CHILOE_PUBLICO_VERSION = '2026.08.1';

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
  const apiarios: PuntoApiarioPublico[] = [];

  for (const a of input.apiariosExternos) {
    const coords = publicCoords(a.lat_aproximada, a.lng_aproximada);
    if (!coords) continue;
    apiarios.push({
      id: `ext-${a.id}`,
      tipo: 'externo',
      comuna: a.comuna_destino?.trim() || 'Chiloé',
      zona: a.zona_destino?.trim() || null,
      lat: coords.lat,
      lng: coords.lng,
      colmenas_banda: bandNColmenas(a.n_colmenas),
      comuna_origen: a.comuna_origen?.trim() || null,
      estado: a.estado ?? null,
    });
  }

  for (const p of input.predios) {
    if (p.activo === false) continue;
    const coords = publicCoords(p.lat_aproximada, p.lng_aproximada);
    if (!coords) continue;
    apiarios.push({
      id: `pre-${p.id}`,
      tipo: 'predio',
      comuna: p.comuna?.trim() || 'Chiloé',
      zona: p.zona?.trim() || null,
      lat: coords.lat,
      lng: coords.lng,
      colmenas_banda: 's/d',
    });
  }

  for (const r of input.apiariosRegistro ?? []) {
    if (r.activo === false) continue;
    const coords = publicCoords(r.lat_aproximada, r.lng_aproximada);
    if (!coords) continue;
    apiarios.push({
      id: `reg-${r.id}`,
      tipo: 'local',
      comuna: r.comuna?.trim() || 'Chiloé',
      zona: r.zona?.trim() || null,
      lat: coords.lat,
      lng: coords.lng,
      colmenas_banda: bandNColmenas(r.n_colmenas),
    });
  }

  const alertas: AlertaPublica[] = [];
  for (const al of input.alertas) {
    if (al.estado && al.estado !== 'activa' && al.estado !== 'programada') continue;
    const coords = publicCoords(al.lat_aproximada, al.lng_aproximada);
    if (!coords) continue;
    alertas.push({
      id: al.id,
      comuna: al.comuna?.trim() || 'Chiloé',
      zona: al.zona?.trim() || '—',
      lat: coords.lat,
      lng: coords.lng,
      radio_km:
        typeof al.radio_km === 'number' && al.radio_km > 0 ? Number(al.radio_km) : 3,
      tipo_producto: al.tipo_producto?.trim() || null,
      fecha_programada: al.fecha_programada || '',
      estado: al.estado || 'activa',
    });
  }

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

  // Resumen por comuna
  const map = new Map<string, ComunaResumen>();
  const bump = (comuna: string, key: keyof Omit<ComunaResumen, 'comuna'>) => {
    const c = comuna.trim() || 'Chiloé';
    const row = map.get(c) ?? {
      comuna: c,
      actores_activos: 0,
      apiarios_externos: 0,
      alertas_activas: 0,
    };
    row[key] += 1;
    map.set(c, row);
  };

  for (const a of input.actores ?? []) {
    if (a.estado && a.estado !== 'activo') continue;
    if (a.comuna) bump(a.comuna, 'actores_activos');
  }
  for (const a of apiarios.filter((x) => x.tipo === 'externo')) {
    bump(a.comuna, 'apiarios_externos');
  }
  for (const al of alertas) {
    bump(al.comuna, 'alertas_activas');
  }

  return {
    version: MAPA_CHILOE_PUBLICO_VERSION,
    territorio: 'Archipiélago de Chiloé · Región de Los Lagos',
    privacidad: {
      nivel: 'publico_anonimizado',
      nota:
        'Sin nombres de actores, RUP, contactos ni GPS exacto. Coordenadas redondeadas ~1 km. Colmenas en bandas. Alertas muestran tipo de producto, no marca comercial.',
      precision_coords: `±~1 km (${COORD_DECIMALS_PUBLIC} decimales)`,
    },
    centro: { lat: -42.48, lng: -73.76, zoom: 9 },
    apiarios,
    alertas,
    floraciones,
    comunas: [...map.values()].sort((a, b) => a.comuna.localeCompare(b.comuna, 'es')),
    generado_en: (input.now ?? new Date()).toISOString(),
  };
}
