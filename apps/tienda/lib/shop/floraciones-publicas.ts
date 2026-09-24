import { getNucleoApiUrl } from './nucleo-url';

export type EspecieBotanica = {
  slug: string;
  nombre_comun: string;
  nombre_cientifico: string;
  familia: string | null;
  ventana_ini: number | null;
  ventana_fin: number | null;
  fuente: string;
};

/**
 * Biblioteca de Floraciones (especies_fenologicas activas) desde Núcleo (BFF).
 * Fuente única de dato botánico para el club: nombre común, científico y
 * ventana de floración. Fail-soft: si Núcleo no responde, el club usa su
 * fallback editorial y el dato se actualiza solo al volver el BFF.
 */
export async function fetchEspeciesBotanicas(): Promise<EspecieBotanica[]> {
  const base = getNucleoApiUrl();
  if (!base) return [];

  try {
    const url = `${base.replace(/\/$/, '')}/api/floraciones-publicas`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { especies?: EspecieBotanica[] };
    };
    const lista = json.data?.especies;
    if (!Array.isArray(lista)) return [];
    return lista.filter(
      (e): e is EspecieBotanica =>
        typeof e?.slug === 'string' &&
        typeof e?.nombre_comun === 'string' &&
        typeof e?.nombre_cientifico === 'string',
    );
  } catch {
    return [];
  }
}
