import { getNucleoApiUrl } from "@/lib/shop/nucleo-url";

export interface AnalisisPublico {
  id: string;
  fecha: string;
  laboratorio: string;
  humedad_pct: number | null;
  hmf_mgkg: number | null;
  diastasa: number | null;
  cenizas_pct: number | null;
  conductividad_ms: number | null;
}

/** Último análisis formal del lote (BFF público, fail-soft para ISR). */
export async function fetchAnalisisLote(loteId: string): Promise<AnalisisPublico | null> {
  const base = getNucleoApiUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/analisis-laboratorio/publico/lote/${loteId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { lote?: { bloqueado_calidad?: boolean }; analisis?: AnalisisPublico | null };
    };
    if (json.data?.lote?.bloqueado_calidad) return null;
    return json.data?.analisis ?? null;
  } catch {
    return null;
  }
}
