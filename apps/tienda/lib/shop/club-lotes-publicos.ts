import { getNucleoApiUrl } from './nucleo-url';
import type { LotePublicoResumen } from './club-cosecha';

/**
 * Trae lotes con pasaporte público desde Núcleo (BFF).
 * Fail-soft: si Núcleo no responde, el club sigue sin vitrina de lotes.
 */
export async function fetchLotesPublicosForClub(
  limit = 24,
): Promise<LotePublicoResumen[]> {
  const base = getNucleoApiUrl();
  if (!base) return [];

  try {
    const url = `${base.replace(/\/$/, '')}/api/lotes-publicos?limit=${limit}`;
    const res = await fetch(url, {
      next: { revalidate: 120 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { lotes?: LotePublicoResumen[] };
    };
    return Array.isArray(json.data?.lotes) ? json.data!.lotes! : [];
  } catch {
    return [];
  }
}

export function pasaporteLoteUrl(nucleoBase: string | null, loteId: string): string | null {
  if (!nucleoBase) return null;
  return `${nucleoBase.replace(/\/$/, '')}/lote/${loteId}`;
}
