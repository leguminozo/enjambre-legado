import type { SupabaseClient } from '@supabase/supabase-js';
import { consultarEstado, getSiiToken } from '@/api/lib/sii-client';
import { resolveSiiAmbiente, resolveSiiCredentials } from '@/api/lib/sii-credentials';

export type PollFacturaCompraResult =
  | {
      ok: true;
      estadoSii: 'aceptado' | 'rechazado' | 'enviado' | 'pendiente';
      aceptados: number;
      rechazados: number;
      reparos: number;
      glosa?: string;
    }
  | { ok: false; code: string; message: string };

export async function pollFacturaCompraSii(
  supabase: SupabaseClient,
  empresaId: string,
  facturaId: string,
): Promise<PollFacturaCompraResult> {
  const { data: factura } = await supabase
    .from('facturas_compra')
    .select('id, track_id, estado_sii, empresa_id')
    .eq('id', facturaId)
    .eq('empresa_id', empresaId)
    .single();

  if (!factura) {
    return { ok: false, code: 'not_found', message: 'Factura de compra no encontrada' };
  }

  const row = factura as { track_id: string | null; estado_sii: string };
  if (!row.track_id) {
    return { ok: false, code: 'no_track_id', message: 'La factura no tiene track_id' };
  }

  if (row.estado_sii === 'aceptado' || row.estado_sii === 'rechazado') {
    return {
      ok: true,
      estadoSii: row.estado_sii,
      aceptados: row.estado_sii === 'aceptado' ? 1 : 0,
      rechazados: row.estado_sii === 'rechazado' ? 1 : 0,
      reparos: 0,
    };
  }

  const { data: empresa } = await supabase
    .from('empresas')
    .select('rut, sii_ambiente')
    .eq('id', empresaId)
    .single();

  if (!empresa) {
    return { ok: false, code: 'empresa_not_found', message: 'Empresa no encontrada' };
  }

  const credsResult = await resolveSiiCredentials(supabase, empresaId);
  if (!credsResult.ok) {
    return { ok: false, code: credsResult.code, message: credsResult.message };
  }

  const emisor = empresa as Record<string, unknown>;
  const ambiente = resolveSiiAmbiente(String(emisor.sii_ambiente ?? 'certificacion')) as import('@enjambre/contable').SiiEnvironment;

  const token = await getSiiToken(ambiente, String(emisor.rut), credsResult.credentials.p12Password);
  const estadoResult = await consultarEstado(ambiente, token.token, String(row.track_id), String(emisor.rut));

  const nuevoEstado =
    estadoResult.aceptados > 0 ? 'aceptado' :
    estadoResult.rechazados > 0 ? 'rechazado' :
    'enviado';

  await supabase
    .from('facturas_compra')
    .update({
      estado_sii: nuevoEstado,
      sii_response: {
        estado: estadoResult.estado,
        glosa: estadoResult.glosa,
        aceptados: estadoResult.aceptados,
        rechazados: estadoResult.rechazados,
        reparos: estadoResult.reparos,
      },
    })
    .eq('id', facturaId);

  return {
    ok: true,
    estadoSii: nuevoEstado,
    aceptados: estadoResult.aceptados,
    rechazados: estadoResult.rechazados,
    reparos: estadoResult.reparos,
    glosa: estadoResult.glosa,
  };
}