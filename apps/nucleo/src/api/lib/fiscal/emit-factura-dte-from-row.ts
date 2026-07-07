import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildDteXml,
  buildEnvioDteXml,
  calcularIVA,
  formatDateSii,
  formatRutSii,
  type DteTipo,
  type SiiEnvironment,
} from '@enjambre/contable';
import { enviarDte, getSiiToken, signDteXml, stampDteXml } from '@/api/lib/sii-client';
import { resolveSiiCredentials } from '@/api/lib/sii-credentials';

type EmitResult = { ok: true } | { ok: false; code: string; message?: string };

type FacturaRow = {
  id: string;
  fecha_emision: string;
  monto_neto: number;
  monto_exento: number;
  monto_iva: number;
  monto_total: number;
  descripcion: string | null;
  tercero_id: string | null;
  tercero: {
    nombre: string;
    rut: string;
    giro: string | null;
    direccion: string | null;
  } | null;
};

/** Emite DTE SII y actualiza la fila existente en facturas_emitidas (no inserta duplicado). */
export async function emitFacturaDteFromRow(
  supabase: SupabaseClient,
  empresaId: string,
  facturaId: string,
  tipoDte: number,
): Promise<EmitResult> {
  if (tipoDte !== 33) {
    return { ok: false, code: 'tipo_dte_no_automatizado' };
  }

  const { data: factura, error: facturaError } = await supabase
    .from('facturas_emitidas')
    .select(
      'id, fecha_emision, monto_neto, monto_exento, monto_iva, monto_total, descripcion, tercero_id, tercero:terceros!facturas_emitidas_tercero_id_fkey(nombre, rut, giro, direccion)',
    )
    .eq('id', facturaId)
    .eq('empresa_id', empresaId)
    .single();

  if (facturaError || !factura) {
    return { ok: false, code: 'factura_no_encontrada' };
  }

  const rawTercero = factura.tercero as FacturaRow['tercero'] | FacturaRow['tercero'][] | null;
  const tercero = Array.isArray(rawTercero) ? rawTercero[0] ?? null : rawTercero;
  const row: FacturaRow = { ...(factura as Omit<FacturaRow, 'tercero'>), tercero };
  if (!row.tercero?.rut) {
    return { ok: false, code: 'tercero_sin_rut' };
  }

  const { data: empresaData, error: empresaError } = await supabase
    .from('empresas')
    .select('rut, razon_social, giro, direccion, comuna, ciudad, acteco, sii_ambiente')
    .eq('id', empresaId)
    .single();

  if (empresaError || !empresaData) {
    return { ok: false, code: 'empresa_no_encontrada' };
  }

  const { data: cafData, error: cafError } = await supabase
    .from('sii_caf')
    .select('id, tipo_dte, folio_desde, folio_hasta, folio_actual, fecha_autorizacion, firma_caf, private_key, public_key, nro_resol, fch_resol')
    .eq('empresa_id', empresaId)
    .eq('tipo_dte', tipoDte)
    .eq('activo', true)
    .single();

  if (cafError || !cafData) {
    return { ok: false, code: 'sin_caf_activo' };
  }

  const credsResult = await resolveSiiCredentials(supabase, empresaId);
  if (!credsResult.ok) {
    return { ok: false, code: credsResult.code, message: credsResult.message };
  }

  const empresa = empresaData as {
    rut: string;
    razon_social: string;
    giro: string | null;
    direccion: string | null;
    comuna: string | null;
    ciudad: string | null;
    acteco: string | null;
    sii_ambiente: string;
  };

  const caf = cafData as {
    id: string;
    tipo_dte: number;
    folio_desde: number;
    folio_hasta: number;
    folio_actual: number;
    fecha_autorizacion: string;
    firma_caf: string;
    private_key: string;
    public_key: string;
    nro_resol: number | null;
    fch_resol: string;
  };

  const montoNeto = Number(row.monto_neto);
  const montoExento = Number(row.monto_exento ?? 0);
  const montoIva = Number(row.monto_iva) || calcularIVA(montoNeto);
  const montoTotal = Number(row.monto_total) || montoNeto + montoIva + montoExento;
  const descripcion = row.descripcion ?? 'Factura emitida';

  const dteDoc = {
    encabezado: {
      tipoDte: tipoDte as DteTipo,
      folio: caf.folio_actual,
      fechaEmision: formatDateSii(row.fecha_emision),
      emisor: {
        rut: formatRutSii(empresa.rut),
        razonSocial: empresa.razon_social ?? '',
        giro: empresa.giro ?? '',
        direccion: empresa.direccion ?? '',
        comuna: empresa.comuna ?? '',
        ciudad: empresa.ciudad ?? '',
        actividadEconomica: Number(empresa.acteco) || 0,
      },
      receptor: {
        rut: formatRutSii(row.tercero.rut),
        razonSocial: row.tercero.nombre,
        giro: row.tercero.giro ?? '',
        direccion: row.tercero.direccion ?? '',
        comuna: '',
        ciudad: '',
      },
      montoNeto,
      montoExento,
      tasaIva: 0.19,
      montoIva,
      montoTotal,
    },
    detalles: [
      {
        nombre: descripcion,
        cantidad: 1,
        precioUnitario: montoNeto,
        montoItem: montoNeto,
      },
    ],
  };

  const dteXml = buildDteXml(dteDoc);
  const signedXml = signDteXml(dteXml, credsResult.credentials.p12Base64, credsResult.credentials.p12Password);
  const stampedXml = stampDteXml(
    signedXml,
    {
      tipoDte: caf.tipo_dte as DteTipo,
      desde: caf.folio_desde,
      hasta: caf.folio_hasta,
      fechaAutorizacion: caf.fecha_autorizacion,
      firma: caf.firma_caf,
      privateKey: caf.private_key,
      publicKey: caf.public_key,
    },
    caf.folio_actual,
  );

  const envioXml = buildEnvioDteXml(
    [stampedXml],
    formatRutSii(empresa.rut),
    caf.nro_resol ?? 0,
    caf.fch_resol ?? '2024-01-01',
  );

  const ambienteRaw = empresa.sii_ambiente ?? 'certificacion';
  const ambiente = (ambienteRaw.toUpperCase() === 'PRODUCCION' ? 'PRODUCCION' : 'CERTIFICACION') as SiiEnvironment;
  const token = await getSiiToken(ambiente, empresa.rut, credsResult.credentials.p12Password);
  const envioResult = await enviarDte(ambiente, token.token, envioXml, formatRutSii(empresa.rut));

  const estadoSii =
    envioResult.estado === 'aceptado' ? 'aceptado' :
    envioResult.estado === 'rechazado' ? 'rechazado' : 'enviado';

  const { error: updateError } = await supabase
    .from('facturas_emitidas')
    .update({
      tipo_dte: tipoDte,
      folio: caf.folio_actual,
      folio_caf: caf.folio_actual,
      caf_id: caf.id,
      estado_sii: estadoSii,
      track_id: envioResult.trackId,
      sii_xml: stampedXml,
      sii_response: {
        estado: envioResult.estado,
        glosa: envioResult.glosa,
        auto_emit: 'factura_hook',
        emitted_at: new Date().toISOString(),
      },
    })
    .eq('id', facturaId);

  if (updateError) {
    return { ok: false, code: 'update_failed', message: updateError.message };
  }

  await supabase
    .from('sii_caf')
    .update({ folio_actual: caf.folio_actual + 1 })
    .eq('id', caf.id);

  return { ok: true };
}