import { getNucleoApiUrl } from "@/lib/shop/nucleo-url";

export interface FloracionViva {
  id: string;
  lat: number;
  lng: number;
  fecha: string | null;
  fase: string | null;
  especie: string | null;
}

export interface LoteFloracion {
  id: string;
  nombre_lote: string | null;
  variedad_floral: string | null;
  fecha_envasado: string | null;
  relato_publico: string | null;
}

async function fetchBff<T>(path: string): Promise<T | null> {
  const base = getNucleoApiUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}${path}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T };
    return json.data ?? null;
  } catch {
    return null;
  }
}

/** Observaciones recientes de floración (agregadas y anonimizadas por el BFF). */
export async function fetchFloracionesVivas(): Promise<FloracionViva[]> {
  const data = await fetchBff<{ floraciones?: FloracionViva[] }>("/api/mapa-publico/chiloe");
  const lista = data?.floraciones ?? [];
  return lista.filter(
    (f): f is FloracionViva =>
      typeof f.lat === "number" &&
      typeof f.lng === "number" &&
      Number.isFinite(f.lat) &&
      Number.isFinite(f.lng),
  );
}

/** Lotes públicos para vincular frasco ↔ floración. */
export async function fetchLotesFloracion(): Promise<LoteFloracion[]> {
  const data = await fetchBff<LoteFloracion[]>("/api/lotes-publicos?limit=40");
  return Array.isArray(data) ? data : [];
}
