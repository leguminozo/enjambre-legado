/**
 * lib/meteo.ts
 * Pronóstico Open-Meteo servido por el proxy BFF (/api/meteo) y cálculos de
 * fenología (Grados-Día de Crecimiento - GDD). API Gratuita sin key.
 */

export interface MeteoData {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation: number[];
}

/**
 * Obtiene pronóstico hiper-local horario para el territorio (o Chiloé / Pureo por defecto).
 * Vía proxy server-side: inmune a adblockers/redes que bloquean
 * api.open-meteo.com y con caché (10 min) en el BFF.
 */
export async function fetchPronostico(
  coords?: { lat: number; lng: number } | null,
): Promise<MeteoData | null> {
  try {
    const query =
      coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)
        ? `?lat=${encodeURIComponent(coords.lat.toFixed(2))}&lng=${encodeURIComponent(coords.lng.toFixed(2))}`
        : '';
    const res = await fetch(`/api/meteo${query}`, { credentials: 'same-origin' });
    if (!res.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Meteo no disponible (${res.status})`);
      }
      return null;
    }
    const data = await res.json();
    return data.hourly ?? null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Meteo no disponible:', error);
    }
    return null;
  }
}

/**
 * Calcula los Grados-Día de Crecimiento (GDD) acumulados.
 * Umbral T_base para Ulmo/Tepú approx 5°C.
 */
export function calcularGDD(temperaturas_medias_diarias: number[], tBase = 5): number {
  return temperaturas_medias_diarias.reduce((acc, tMedia) => {
    return acc + Math.max(0, tMedia - tBase);
  }, 0);
}

/**
 * Determina si una hora específica es "volable" para las abejas
 */
export function esVolable(temp: number, hr: number, precipitacion: number, viento = 0): boolean {
  return temp >= 11 && hr < 85 && precipitacion < 0.2 && viento < 25;
}
