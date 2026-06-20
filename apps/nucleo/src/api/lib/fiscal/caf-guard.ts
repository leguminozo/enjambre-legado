import type { SupabaseClient } from '@supabase/supabase-js';

export class CafExhaustedError extends Error {
  readonly code = 'caf_exhausted' as const;
  constructor(
    readonly tipoDte: number,
    readonly foliosRestantes: number,
  ) {
    super(`CAF tipo ${tipoDte}: solo quedan ${foliosRestantes} folios`);
    this.name = 'CafExhaustedError';
  }
}

export function getCafMinFolios(): number {
  const raw = process.env.SII_CAF_MIN_FOLIOS;
  const parsed = raw ? Number.parseInt(raw, 10) : 10;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

export function getCafAlertThreshold(): number {
  const raw = process.env.SII_CAF_ALERT_THRESHOLD;
  const parsed = raw ? Number.parseInt(raw, 10) : 50;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
}

export async function getFoliosRestantes(
  supabase: SupabaseClient,
  empresaId: string,
  tipoDte: number,
): Promise<number> {
  const { data, error } = await supabase
    .from('sii_caf')
    .select('folio_hasta, folio_actual')
    .eq('empresa_id', empresaId)
    .eq('tipo_dte', tipoDte)
    .eq('activo', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return 0;

  const hasta = Number(data.folio_hasta ?? 0);
  const actual = Number(data.folio_actual ?? 0);
  return Math.max(0, hasta - actual);
}

export async function assertCafAvailable(
  supabase: SupabaseClient,
  empresaId: string,
  tipoDte: number,
  minFolios = getCafMinFolios(),
): Promise<{ foliosRestantes: number }> {
  const restantes = await getFoliosRestantes(supabase, empresaId, tipoDte);
  if (restantes < minFolios) {
    throw new CafExhaustedError(tipoDte, restantes);
  }
  return { foliosRestantes: restantes };
}