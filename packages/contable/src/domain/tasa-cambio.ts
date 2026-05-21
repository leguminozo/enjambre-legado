export interface TasaCambio {
  moneda: string;
  valor: number;
  fecha: string;
  fuente: string;
}

const MINDICADOR_BASE = "https://mindicador.cl/api";

type TasaCacheEntry = { tasa: TasaCambio; expiresAt: number };

const cache = new Map<string, TasaCacheEntry>();
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;

export async function fetchTasaCambio(
  moneda: string = "dolar",
  fecha?: string,
): Promise<TasaCambio> {
  const cacheKey = `${moneda}_${fecha ?? "latest"}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.tasa;
  }

  const url = fecha
    ? `${MINDICADOR_BASE}/${moneda}/${fecha}`
    : `${MINDICADOR_BASE}/${moneda}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error obteniendo tasa de cambio: ${response.status}`);
  }

  const data = await response.json() as {
    codigo: string;
    nombre: string;
    serie: Array<{ fecha: string; valor: number }>;
  };

  if (!data.serie || data.serie.length === 0) {
    throw new Error(`No hay datos de tasa para ${moneda}`);
  }

  const latest = data.serie[0];
  const tasa: TasaCambio = {
    moneda: data.codigo,
    valor: latest.valor,
    fecha: latest.fecha.slice(0, 10),
    fuente: "mindicador.cl",
  };

  cache.set(cacheKey, { tasa, expiresAt: Date.now() + CACHE_TTL_MS });

  return tasa;
}

export async function fetchTasaDolar(fecha?: string): Promise<number> {
  const tasa = await fetchTasaCambio("dolar", fecha);
  return tasa.valor;
}

export async function fetchTasaEuro(fecha?: string): Promise<number> {
  const tasa = await fetchTasaCambio("euro", fecha);
  return tasa.valor;
}
