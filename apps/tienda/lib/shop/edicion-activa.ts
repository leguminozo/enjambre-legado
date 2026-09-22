import { getNucleoApiUrl } from "@/lib/shop/nucleo-url";

export interface EdicionActiva {
  id: string;
  producto_id: string;
  nombre: string;
  abre_at: string;
  cierra_at: string;
  cupo_max: number;
  cupo_usado: number;
  precio_early_bird: number;
}

/** Edición abierta para un producto (BFF público, fail-soft para ISR). */
export async function fetchEdicionActiva(productoId: string): Promise<EdicionActiva | null> {
  const base = getNucleoApiUrl();
  if (!base) return null;
  try {
    const res = await fetch(
      `${base}/api/ediciones/activas?producto_id=${productoId}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: EdicionActiva[] };
    const lista = json.data ?? [];
    const ahora = new Date().toISOString();
    return (
      lista.find((e) => e.abre_at <= ahora && e.cierra_at > ahora && e.cupo_usado < e.cupo_max) ?? null
    );
  } catch {
    return null;
  }
}
