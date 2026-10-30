const CHILOE_CITIES: Record<string, { lat: number; lng: number }> = {
  castro: { lat: -42.48, lng: -73.76 },
  ancud: { lat: -41.87, lng: -73.83 },
  puqueldón: { lat: -42.62, lng: -73.67 },
  puqueldon: { lat: -42.62, lng: -73.67 },
  dalcahue: { lat: -42.38, lng: -73.65 },
  quemchi: { lat: -42.14, lng: -73.48 },
  chonchi: { lat: -42.62, lng: -73.77 },
  pureo: { lat: -42.48, lng: -73.72 },
  santiago: { lat: -33.45, lng: -70.65 },
  'puerto montt': { lat: -41.47, lng: -72.94 },
  valdivia: { lat: -39.81, lng: -73.24 },
  concepción: { lat: -36.83, lng: -73.05 },
  concepcion: { lat: -36.83, lng: -73.05 },
  'viña del mar': { lat: -33.02, lng: -71.55 },
  valparaíso: { lat: -33.05, lng: -71.62 },
  valparaiso: { lat: -33.05, lng: -71.62 },
  // Comunas del archipiélago y rutas trashumantes frecuentes
  quellón: { lat: -43.12, lng: -73.62 },
  quellon: { lat: -43.12, lng: -73.62 },
  queilen: { lat: -42.88, lng: -73.47 },
  queilén: { lat: -42.88, lng: -73.47 },
  'curaco de vélez': { lat: -42.44, lng: -73.6 },
  'curaco de velez': { lat: -42.44, lng: -73.6 },
  quinchao: { lat: -42.47, lng: -73.49 },
  achao: { lat: -42.47, lng: -73.49 },
  osorno: { lat: -40.57, lng: -73.13 },
  'puerto varas': { lat: -41.32, lng: -72.98 },
  frutillar: { lat: -41.13, lng: -73.05 },
  llanquihue: { lat: -41.26, lng: -73.02 },
  temuco: { lat: -38.74, lng: -72.59 },
  'los angeles': { lat: -37.47, lng: -72.35 },
  'los ángeles': { lat: -37.47, lng: -72.35 },
  chillán: { lat: -36.61, lng: -72.1 },
  talca: { lat: -35.43, lng: -71.67 },
  rancagua: { lat: -34.17, lng: -70.74 },
  curicó: { lat: -34.98, lng: -71.24 },
  curico: { lat: -34.98, lng: -71.24 },
  'san fernando': { lat: -34.59, lng: -70.99 },
  // Gran Santiago y comunas frecuentes
  providencia: { lat: -33.43, lng: -70.61 },
  'las condes': { lat: -33.41, lng: -70.56 },
  ñuñoa: { lat: -33.45, lng: -70.6 },
  nunoa: { lat: -33.45, lng: -70.6 },
  vitacura: { lat: -33.38, lng: -70.57 },
  'lo barnechea': { lat: -33.35, lng: -70.51 },
  'la reina': { lat: -33.44, lng: -70.54 },
  maipú: { lat: -33.51, lng: -70.76 },
  maipu: { lat: -33.51, lng: -70.76 },
  'la florida': { lat: -33.52, lng: -70.58 },
  'puente alto': { lat: -33.61, lng: -70.57 },
  peñalolén: { lat: -33.48, lng: -70.54 },
  penalolen: { lat: -33.48, lng: -70.54 },
  'san miguel': { lat: -33.49, lng: -70.65 },
  recoleta: { lat: -33.41, lng: -70.64 },
  independencia: { lat: -33.42, lng: -70.66 },
  huechuraba: { lat: -33.37, lng: -70.63 },
  chicureo: { lat: -33.28, lng: -70.68 },
  colina: { lat: -33.2, lng: -70.67 },
  // Valparaíso y Costa
  quilpué: { lat: -33.05, lng: -71.44 },
  quilpue: { lat: -33.05, lng: -71.44 },
  'villa alemana': { lat: -33.04, lng: -71.37 },
  concón: { lat: -32.92, lng: -71.52 },
  concon: { lat: -32.92, lng: -71.52 },
  quillota: { lat: -32.88, lng: -71.25 },
  'san antonio': { lat: -33.59, lng: -71.61 },
  // Norte y Centro
  'la serena': { lat: -29.9, lng: -71.25 },
  coquimbo: { lat: -29.95, lng: -71.34 },
  antofagasta: { lat: -23.65, lng: -70.4 },
  calama: { lat: -22.46, lng: -68.93 },
  copiapó: { lat: -27.37, lng: -70.33 },
  copiapo: { lat: -27.37, lng: -70.33 },
  arica: { lat: -18.47, lng: -70.3 },
  iquique: { lat: -20.21, lng: -70.14 },
  // Sur y Patagonia
  coyhaique: { lat: -45.57, lng: -72.07 },
  'punta arenas': { lat: -53.16, lng: -70.91 },
  'puerto natales': { lat: -51.72, lng: -72.5 },
  calbuco: { lat: -41.77, lng: -73.13 },
  'los muermos': { lat: -41.4, lng: -73.47 },
  maullín: { lat: -41.62, lng: -73.6 },
  maullin: { lat: -41.62, lng: -73.6 },
  fresia: { lat: -41.15, lng: -73.43 },
  pucón: { lat: -39.28, lng: -71.97 },
  pucon: { lat: -39.28, lng: -71.97 },
  villarrica: { lat: -39.28, lng: -72.23 },
  panguipulli: { lat: -39.64, lng: -72.33 },
};

/**
 * Resuelve coordenadas de una comuna/localidad (para trayectorias trashumantes
 * y georreferenciación de texto). Normaliza minúsculas y busca por substring.
 */
export function resolveComunaCoords(
  comuna?: string | null,
): { lat: number; lng: number } | null {
  if (!comuna) return null;
  const haystack = comuna.toLowerCase();
  for (const [city, coords] of Object.entries(CHILOE_CITIES)) {
    if (haystack.includes(city)) return coords;
  }
  return null;
}

export function resolveClienteCoords(
  notes?: string | null,
  direccion?: string | null,
  empresa?: string | null,
): { lat: number; lng: number } | null {
  if (notes) {
    try {
      const parsed = JSON.parse(notes) as Record<string, unknown>;
      if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        return { lat: parsed.lat, lng: parsed.lng };
      }
    } catch {
      // not JSON
    }
    const match = notes.match(/lat[:\s]+(-?\d+\.?\d*)[\s,;]+lng[:\s]+(-?\d+\.?\d*)/i);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
  }

  const haystack = `${direccion ?? ''} ${empresa ?? ''}`.toLowerCase();
  for (const [city, coords] of Object.entries(CHILOE_CITIES)) {
    if (haystack.includes(city)) return coords;
  }
  return null;
}