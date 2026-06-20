import { createHash } from 'crypto';
import type { GastoExtranjeroResult } from '@enjambre/contable';
import type { SupabaseClient } from '@supabase/supabase-js';

export function buildGastoIdempotencyKey(
  empresaId: string,
  gasto: Pick<
    GastoExtranjeroResult,
    'proveedorId' | 'numeroDocumento' | 'fechaEmision' | 'montoTotal'
  >,
): string {
  const payload = [
    empresaId,
    gasto.proveedorId,
    gasto.numeroDocumento || 'sin-numero',
    gasto.fechaEmision,
    String(Math.round(gasto.montoTotal)),
  ].join('|');
  return createHash('sha256').update(payload).digest('hex');
}

export type ExistingGastoMatch = {
  id: string;
  estado: string;
  factura_compra_id: string | null;
};

export async function findDuplicateGasto(
  supabase: SupabaseClient,
  empresaId: string,
  gasto: GastoExtranjeroResult,
): Promise<ExistingGastoMatch | null> {
  const idempotencyKey = buildGastoIdempotencyKey(empresaId, gasto);

  const { data: byKey } = await supabase
    .from('gastos_extranjeros')
    .select('id, estado, factura_compra_id')
    .eq('empresa_id', empresaId)
    .eq('idempotency_key', idempotencyKey)
    .neq('estado', 'rechazado_sii')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byKey) return byKey;

  let query = supabase
    .from('gastos_extranjeros')
    .select('id, estado, factura_compra_id')
    .eq('empresa_id', empresaId)
    .eq('proveedor_id', gasto.proveedorId)
    .eq('fecha_emision', gasto.fechaEmision)
    .eq('monto_total', gasto.montoTotal)
    .neq('estado', 'rechazado_sii')
    .order('created_at', { ascending: false })
    .limit(1);

  if (gasto.numeroDocumento) {
    query = query.eq('numero_documento', gasto.numeroDocumento);
  }

  const { data } = await query.maybeSingle();
  return data ?? null;
}