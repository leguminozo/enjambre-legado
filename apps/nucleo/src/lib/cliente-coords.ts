const CHILOE_CITIES: Record<string, { lat: number; lng: number }> = {
  castro: { lat: -42.48, lng: -73.76 },
  ancud: { lat: -41.87, lng: -73.83 },
  puqueldón: { lat: -42.62, lng: -73.67 },
  puqueldon: { lat: -42.62, lng: -73.67 },
  dalcahue: { lat: -42.38, lng: -73.65 },
  quemchi: { lat: -42.14, lng: -73.48 },
  chonchi: { lat: -42.08, lng: -73.78 },
  pureo: { lat: -42.48, lng: -73.72 },
  santiago: { lat: -33.45, lng: -70.65 },
};

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