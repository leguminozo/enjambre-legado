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