import type { RcvRegistroCompra, RcvRegistroVenta, RcvTipoRegistro } from '@enjambre/contable';
import type { SupabaseClient } from '@supabase/supabase-js';
import { consultarRCV, getSiiToken } from '@/api/lib/sii-client';
import { resolveSiiAmbiente, resolveSiiCredentials } from '@/api/lib/sii-credentials';

const DTE_TIPO_LABELS: Record<number, string> = {
  33: 'Factura',
  34: 'Factura Exenta',
  39: 'Boleta',
  41: 'Boleta Exenta',
  46: 'Factura de Compra',
  52: 'Guia de Despacho',
  56: 'Nota de Debito',
  61: 'Nota de Credito',
};

export { periodoFromFecha } from '@enjambre/fiscal';

async function reconciliarRcv(
  supabase: SupabaseClient,
  empresaId: string,
  syncId: string,
  tipo: RcvTipoRegistro,
): Promise<void> {
  const { data: registros } = await supabase
    .from('rcv_registros')
    .select('id, tipo_dte, folio, estado_rcv')
    .eq('rcv_sync_id', syncId)
    .eq('reconciliado', false);

  if (!registros?.length) return;

  for (const reg of registros) {
    const r = reg as Record<string, unknown>;
    let facturaId: string | null = null;

    if (tipo === 'compras') {
      const { data: factura } = await supabase
        .from('facturas_compra')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('tipo_dte', Number(r.tipo_dte))
        .eq('folio', Number(r.folio))
        .maybeSingle();
      facturaId = factura?.id ?? null;
    } else {
      const tipoDocumentoLabel = DTE_TIPO_LABELS[Number(r.tipo_dte)] ?? String(r.tipo_dte);
      const { data: emitida } = await supabase
        .from('facturas_emitidas')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('tipo_documento', tipoDocumentoLabel)
        .eq('folio', Number(r.folio))
        .maybeSingle();
      facturaId = emitida?.id ?? null;
    }

    const update: Record<string, unknown> = { reconciliado: facturaId !== null };
    if (tipo === 'compras' && facturaId) {
      update.factura_compra_id = facturaId;
    }

    await supabase.from('rcv_registros').update(update).eq('id', r.id);

    if (tipo === 'compras' && facturaId && r.estado_rcv === 'aceptado') {
      await supabase.from('facturas_compra').update({ estado_sii: 'aceptado' }).eq('id', facturaId);

      await supabase
        .from('gastos_extranjeros')
        .update({ estado: 'aceptado_sii' })
        .eq('factura_compra_id', facturaId)
        .eq('empresa_id', empresaId);
    }
  }
}

export type SyncRcvResult =
  | { ok: true; syncId: string; reconciledCount: number }
  | { ok: false; code: string; message: string };

export async function syncRcvPeriod(
  supabase: SupabaseClient,
  empresaId: string,
  periodo: string,
  tipo: RcvTipoRegistro = 'compras',
): Promise<SyncRcvResult> {
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
  const rcvResumen = await consultarRCV(ambiente, token.token, String(emisor.rut), periodo, tipo);

  const { data: sync, error: syncError } = await supabase
    .from('rcv_sync')
    .upsert({
      empresa_id: empresaId,
      periodo,
      tipo_registro: tipo,
      total_documentos: rcvResumen.totalDocumentos,
      total_neto: rcvResumen.totalNeto,
      total_iva: rcvResumen.totalIva,
      total_exento: rcvResumen.totalExento,
      total_total: rcvResumen.totalTotal,
      sii_response: rcvResumen,
      ultimo_sync: new Date().toISOString(),
      estado: 'sincronizado',
    }, { onConflict: 'empresa_id,periodo,tipo_registro' })
    .select('id')
    .single();

  if (syncError || !sync) {
    return { ok: false, code: 'rcv_sync_failed', message: syncError?.message ?? 'Error RCV' };
  }

  const syncId = sync.id as string;

  await supabase.from('rcv_registros').delete().eq('rcv_sync_id', syncId);

  if (rcvResumen.registros.length > 0) {
    const registrosPayload = rcvResumen.registros.map((r) => {
      const isCompra = tipo === 'compras';
      const compra = isCompra ? (r as RcvRegistroCompra) : null;
      const venta = !isCompra ? (r as RcvRegistroVenta) : null;
      return {
        empresa_id: empresaId,
        rcv_sync_id: syncId,
        tipo_dte: r.tipoDte,
        folio: r.folio,
        fecha_emision: r.fechaEmision,
        rut_contraparte: isCompra ? (compra?.rutProveedor ?? '') : (venta?.rutReceptor ?? ''),
        razon_social_contraparte: isCompra ? (compra?.razonSocialProveedor ?? '') : (venta?.razonSocialReceptor ?? ''),
        monto_neto: r.montoNeto,
        monto_exento: r.montoExento,
        monto_iva: r.montoIva,
        monto_total: r.montoTotal,
        estado_rcv: r.estadoRcv,
        reconciliado: false,
        metadata: isCompra
          ? { fechaRecepcion: compra?.fechaRecepcion, acuseRecibo: compra?.acuseRecibo }
          : {},
      };
    });

    await supabase.from('rcv_registros').insert(registrosPayload);
  }

  await reconciliarRcv(supabase, empresaId, syncId, tipo);

  const { count } = await supabase
    .from('rcv_registros')
    .select('id', { count: 'exact', head: true })
    .eq('rcv_sync_id', syncId)
    .eq('reconciliado', true);

  if (tipo === 'compras') {
    const { data: reconciled } = await supabase
      .from('rcv_registros')
      .select('factura_compra_id')
      .eq('rcv_sync_id', syncId)
      .eq('reconciliado', true)
      .not('factura_compra_id', 'is', null);

    for (const row of reconciled ?? []) {
      if (row.factura_compra_id) {
        await supabase
          .from('gastos_extranjeros')
          .update({ estado: 'aceptado_sii' })
          .eq('factura_compra_id', row.factura_compra_id)
          .eq('empresa_id', empresaId);
      }
    }
  }

  return { ok: true, syncId, reconciledCount: count ?? 0 };
}