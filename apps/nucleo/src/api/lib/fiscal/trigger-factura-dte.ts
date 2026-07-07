import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSiiCredentials } from '@/api/lib/sii-credentials';
import { emitFacturaDteFromRow } from '@/api/lib/fiscal/emit-factura-dte-from-row';

const TIPO_DOC_TO_DTE: Record<string, number> = {
  Factura: 33,
  'Nota de Crédito': 61,
  'Nota de Débito': 56,
};

type TerceroRow = {
  id: string;
  nombre: string;
  rut: string;
  giro: string | null;
  direccion: string | null;
};

export type DteReadiness = {
  tipoDte: number | null;
  ready: boolean;
  reasons: string[];
};

export async function assessFacturaDteReadiness(
  supabase: SupabaseClient,
  empresaId: string,
  facturaId: string,
): Promise<DteReadiness> {
  const { data: factura, error } = await supabase
    .from('facturas_emitidas')
    .select(
      'id, tipo_documento, tercero_id, tercero:terceros!facturas_emitidas_tercero_id_fkey(id, nombre, rut, giro, direccion)',
    )
    .eq('id', facturaId)
    .eq('empresa_id', empresaId)
    .maybeSingle();

  if (error || !factura) {
    return { tipoDte: null, ready: false, reasons: ['factura_no_encontrada'] };
  }

  const tipoDte = TIPO_DOC_TO_DTE[factura.tipo_documento as string] ?? null;
  if (!tipoDte) {
    return { tipoDte: null, ready: false, reasons: ['tipo_documento_sin_dte'] };
  }

  const reasons: string[] = [];
  const rawTercero = factura.tercero as TerceroRow | TerceroRow[] | null;
  const tercero = Array.isArray(rawTercero) ? rawTercero[0] ?? null : rawTercero;
  if (!tercero?.rut) reasons.push('tercero_sin_rut');
  if (!tercero?.nombre) reasons.push('tercero_sin_nombre');

  if (tipoDte === 61 || tipoDte === 56) {
    reasons.push('notas_requieren_emision_manual');
  }

  const { data: caf } = await supabase
    .from('sii_caf')
    .select('id, folio_actual, folio_hasta')
    .eq('empresa_id', empresaId)
    .eq('tipo_dte', tipoDte)
    .eq('activo', true)
    .maybeSingle();

  if (!caf) reasons.push('sin_caf_activo');
  else if (Number(caf.folio_actual) >= Number(caf.folio_hasta)) reasons.push('caf_sin_folios');

  const creds = await resolveSiiCredentials(supabase, empresaId);
  if (!creds.ok) reasons.push(creds.code);

  return { tipoDte, ready: reasons.length === 0, reasons };
}

async function markFacturaDteDeferred(
  supabase: SupabaseClient,
  facturaId: string,
  tipoDte: number | null,
  reasons: string[],
) {
  await supabase
    .from('facturas_emitidas')
    .update({
      estado_sii: 'pendiente',
      ...(tipoDte ? { tipo_dte: tipoDte } : {}),
      sii_response: {
        auto_emit: 'deferred',
        reasons,
        checked_at: new Date().toISOString(),
      },
    })
    .eq('id', facturaId);
}

/** Hook post-creación: valida y emite DTE tipo 33 si el SII está listo; si no, deja trazabilidad en DB. */
export async function triggerFacturaDteEmission(
  supabase: SupabaseClient,
  empresaId: string,
  facturaId: string,
): Promise<void> {
  try {
    const readiness = await assessFacturaDteReadiness(supabase, empresaId, facturaId);

    if (!readiness.ready || !readiness.tipoDte) {
      await markFacturaDteDeferred(supabase, facturaId, readiness.tipoDte, readiness.reasons);
      return;
    }

    const result = await emitFacturaDteFromRow(supabase, empresaId, facturaId, readiness.tipoDte);
    if (!result.ok) {
      await markFacturaDteDeferred(supabase, facturaId, readiness.tipoDte, [result.code]);
    }
  } catch (err) {
    console.error('[SII] triggerFacturaDteEmission', err);
    await markFacturaDteDeferred(supabase, facturaId, null, ['emit_error']);
  }
}