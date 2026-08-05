/**
 * Pasaporte público del frasco (nivel 2).
 * Solo datos que un comprador necesita para verificar origen.
 * Nunca expone GPS exacto, bitácora, varroa, costos ni contactos.
 */

/** ~1.1 km a lat media; suficiente para “zona de pecoreo”, no para el patio. */
export const COORD_DECIMALS_PUBLIC = 2;

export function roundCoordsApprox(
  lat: number,
  lng: number,
  decimals: number = COORD_DECIMALS_PUBLIC,
): { lat: number; lng: number } {
  const f = 10 ** decimals;
  return {
    lat: Math.round(lat * f) / f,
    lng: Math.round(lng * f) / f,
  };
}

export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export interface OrigenCosechaInput {
  floracion?: string | null;
  fecha?: string | null;
  kg?: number | null;
  colmena_name?: string | null;
  apiario_name?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface OrigenPublico {
  /** Nombres de apiarios (sin IDs ni coords exactas). */
  apiarios: string[];
  /** Nombres de colmenas participantes (sin health/varroa). */
  colmenas: string[];
  floraciones: string[];
  fecha_recoleccion: string | null;
  n_colmenas: number;
  /** Zona referencial redondeada; null si no hay coords. */
  zona: { lat: number; lng: number; precision: 'approx_1km' } | null;
}

/**
 * Resume cosechas → origen público. Dedup de nombres; coords solo redondeadas.
 */
export function buildOrigenPublico(cosechas: OrigenCosechaInput[]): OrigenPublico {
  const apiarios = new Set<string>();
  const colmenas = new Set<string>();
  const floraciones = new Set<string>();
  let fechaMin: string | null = null;
  const lats: number[] = [];
  const lngs: number[] = [];

  for (const c of cosechas) {
    if (c.apiario_name?.trim()) apiarios.add(c.apiario_name.trim());
    if (c.colmena_name?.trim()) colmenas.add(c.colmena_name.trim());
    if (c.floracion?.trim()) floraciones.add(c.floracion.trim());
    if (c.fecha) {
      if (!fechaMin || c.fecha < fechaMin) fechaMin = c.fecha;
    }
    if (typeof c.lat === 'number' && Number.isFinite(c.lat) && typeof c.lng === 'number' && Number.isFinite(c.lng)) {
      // Ignorar (0,0) placeholder
      if (!(c.lat === 0 && c.lng === 0)) {
        lats.push(c.lat);
        lngs.push(c.lng);
      }
    }
  }

  let zona: OrigenPublico['zona'] = null;
  if (lats.length && lngs.length) {
    const lat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const lng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    const rounded = roundCoordsApprox(lat, lng);
    zona = { ...rounded, precision: 'approx_1km' };
  }

  return {
    apiarios: [...apiarios].sort(),
    colmenas: [...colmenas].sort(),
    floraciones: [...floraciones].sort(),
    fecha_recoleccion: fechaMin,
    n_colmenas: colmenas.size,
    zona,
  };
}

export interface ActorZonaInput {
  lat?: number | null;
  lng?: number | null;
}

/** Preferir zona de cosechas; si no, predio del actor redondeado; fallback Chiloé centro. */
export function resolveZonaPublica(
  origen: OrigenPublico,
  actorZona?: ActorZonaInput | null,
  fallback: { lat: number; lng: number } = { lat: -42.48, lng: -73.76 },
): { lat: number; lng: number; precision: 'approx_1km'; source: 'cosecha' | 'actor' | 'fallback' } {
  if (origen.zona) {
    return { lat: origen.zona.lat, lng: origen.zona.lng, precision: 'approx_1km', source: 'cosecha' };
  }
  if (
    typeof actorZona?.lat === 'number' &&
    typeof actorZona?.lng === 'number' &&
    Number.isFinite(actorZona.lat) &&
    Number.isFinite(actorZona.lng) &&
    !(actorZona.lat === 0 && actorZona.lng === 0)
  ) {
    const r = roundCoordsApprox(actorZona.lat, actorZona.lng);
    return { ...r, precision: 'approx_1km', source: 'actor' };
  }
  const r = roundCoordsApprox(fallback.lat, fallback.lng);
  return { ...r, precision: 'approx_1km', source: 'fallback' };
}

export type LotePasaportePublico = {
  id: string;
  nombre_lote: string | null;
  variedad_floral: string;
  metodo_extraccion: string | null;
  fecha_cosecha: string | null;
  fecha_envasado: string | null;
  analisis: {
    humedad: number | null;
    hmf: number | null;
    laboratorio: string | null;
    fecha_analisis: string | null;
  };
  relato: string | null;
  blockchain_hash: string | null;
  actor: {
    nombre: string;
    comuna: string;
    nivel_acreditacion: string | null;
    zona: { lat: number; lng: number; precision: 'approx_1km'; source: string };
  } | null;
  origen: OrigenPublico;
  /** Política de exposición explícita en el payload. */
  privacidad: {
    nivel: 'frasco';
    nota: string;
  };
};
