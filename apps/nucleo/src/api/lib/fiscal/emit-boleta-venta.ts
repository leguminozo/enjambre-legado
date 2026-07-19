import {
  DTE_TIPO,
  buildDteXml,
  buildEnvioDteXml,
  calcularIVA,
  formatDateSii,
  formatRutSii,
  type DteDocumento,
} from '@enjambre/contable';
import type { SupabaseClient } from '@supabase/supabase-js';
import { enviarDte, getSiiToken, signDteXml, stampDteXml } from '@/api/lib/sii-client';
import { resolveSiiAmbiente, resolveSiiCredentials } from '@/api/lib/sii-credentials';
import { assertCafAvailable } from './caf-guard';

const RUT_CONSUMIDOR_FINAL = '66666666-6';

type CafFolioRow = {
  folio: number;
  folio_hasta: number;
  caf_id: string;
  nro_resol: number;
  fch_resol: string;
};

export type EmitBoletaVentaInput = {
  facturaEmitidaId: string;
  ventaId: string;
  receptorNombre: string;
  receptorRut?: string;
  detalleLineas?: Array<{ nombre: string; cantidad: number; precioUnitario: number }>;
};

export type EmitBoletaVentaResult =
  | {
      ok: true;
      folio: number;
      trackId: string;
      estadoSii: 'aceptado' | 'rechazado' | 'enviado';
    }
  | { ok: false; code: string; message: string };

function mapEnvioEstado(estado: string): 'aceptado' | 'rechazado' | 'enviado' {
  if (estado === 'aceptado') return 'aceptado';
  if (estado === 'rechazado') return 'rechazado';
  return 'enviado';
}

export async function emitBoletaVentaToSii(
  supabase: SupabaseClient,
  empresaId: string,
  input: EmitBoletaVentaInput,
): Promise<EmitBoletaVentaResult> {
  const { data: factura, error: facturaError } = await supabase
    .from('facturas_emitidas')
    .select(
      'id, estado_sii, monto_neto, monto_iva, monto_total, monto_exento, fecha_emision, descripcion, folio, track_id',
    )
    .eq('id', input.facturaEmitidaId)
    .eq('empresa_id', empresaId)
    .single();

  if (facturaError || !factura) {
    return { ok: false, code: 'not_found', message: 'Boleta pendiente no encontrada' };
  }

  const row = factura as {
    estado_sii: string | null;
    monto_neto: number;
    monto_iva: number;
    monto_total: number;
    monto_exento: number;
    fecha_emision: string;
    descripcion: string | null;
    folio: number | null;
    track_id: string | null;
  };

  // Idempotent: job/cron retry after successful envío must complete job, not dead_letter
  const estadoExistente = row.estado_sii ?? '';
  if (estadoExistente === 'aceptado' || estadoExistente === 'enviado') {
    return {
      ok: true,
      folio: Number(row.folio ?? 0),
      trackId: String(row.track_id ?? ''),
      estadoSii: estadoExistente as 'aceptado' | 'enviado',
    };
  }
  if (estadoExistente && estadoExistente !== 'pendiente') {
    return {
      ok: false,
      code: 'invalid_state',
      message: `La boleta está en estado ${estadoExistente} y no se re-emite automáticamente`,
    };
  }

  try {
    await assertCafAvailable(supabase, empresaId, DTE_TIPO.BOLETA_ELECTRONICA);
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'caf_exhausted') {
      return { ok: false, code: 'caf_exhausted', message: err.message };
    }
    throw err;
  }

  const { data: cafRows, error: cafRpcError } = await supabase.rpc('sii_caf_next_folio', {
    p_empresa_id: empresaId,
    p_tipo_dte: DTE_TIPO.BOLETA_ELECTRONICA,
  });

  if (cafRpcError || !cafRows?.length) {
    return {
      ok: false,
      code: 'no_caf',
      message: cafRpcError?.message ?? 'No hay CAF activo para boleta electrónica (39)',
    };
  }

  const cafFolio = (cafRows as CafFolioRow[])[0]!;

  const { data: cafFull, error: cafLoadError } = await supabase
    .from('sii_caf')
    .select('firma_caf, private_key, public_key, fecha_autorizacion, folio_desde, folio_hasta')
    .eq('id', cafFolio.caf_id)
    .single();

  if (cafLoadError || !cafFull) {
    return { ok: false, code: 'caf_load_failed', message: 'No se pudo cargar el CAF para firma' };
  }

  const { data: empresa } = await supabase
    .from('empresas')
    .select('rut, razon_social, giro, direccion, comuna, ciudad, acteco, sii_ambiente')
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
  const fechaEmision = String(row.fecha_emision).slice(0, 10);
  const montoNeto = Number(row.monto_neto);
  const montoIva = Number(row.monto_iva ?? calcularIVA(montoNeto));
  const montoTotal = Number(row.monto_total);
  const receptorRut = input.receptorRut?.trim() || RUT_CONSUMIDOR_FINAL;

  const detalles =
    input.detalleLineas?.length
      ? input.detalleLineas.map((line) => ({
          nombre: line.nombre,
          cantidad: line.cantidad,
          precioUnitario: line.precioUnitario,
          montoItem: Math.round(line.cantidad * line.precioUnitario),
        }))
      : [{
          nombre: row.descripcion ?? `Venta web ${input.ventaId}`,
          cantidad: 1,
          precioUnitario: montoTotal,
          montoItem: montoTotal,
        }];

  const dteDoc: DteDocumento = {
    encabezado: {
      tipoDte: DTE_TIPO.BOLETA_ELECTRONICA,
      folio: cafFolio.folio,
      fechaEmision: formatDateSii(fechaEmision),
      emisor: {
        rut: formatRutSii(String(emisor.rut)),
        razonSocial: String(emisor.razon_social ?? ''),
        giro: String(emisor.giro ?? ''),
        direccion: String(emisor.direccion ?? ''),
        comuna: String(emisor.comuna ?? ''),
        ciudad: String(emisor.ciudad ?? ''),
        actividadEconomica: Number(emisor.acteco ?? 0),
      },
      receptor: {
        rut: formatRutSii(receptorRut),
        razonSocial: input.receptorNombre,
        giro: 'Particular',
        direccion: '',
        comuna: '',
        ciudad: '',
      },
      montoNeto,
      montoExento: Number(row.monto_exento ?? 0),
      tasaIva: 0.19,
      montoIva,
      montoTotal,
    },
    detalles,
  };

  const { p12Base64, p12Password } = credsResult.credentials;
  const signedXml = signDteXml(buildDteXml(dteDoc), p12Base64, p12Password);
  const caf = cafFull as Record<string, unknown>;

  const stampedXml = stampDteXml(signedXml, {
    tipoDte: DTE_TIPO.BOLETA_ELECTRONICA,
    desde: Number(caf.folio_desde),
    hasta: Number(caf.folio_hasta),
    fechaAutorizacion: String(caf.fecha_autorizacion),
    firma: String(caf.firma_caf),
    privateKey: String(caf.private_key),
    publicKey: String(caf.public_key),
  }, cafFolio.folio);

  const envioXml = buildEnvioDteXml(
    [stampedXml],
    formatRutSii(String(emisor.rut)),
    Number(cafFolio.nro_resol ?? 0),
    String(cafFolio.fch_resol ?? '2024-01-01'),
  );

  const ambiente = resolveSiiAmbiente(String(emisor.sii_ambiente ?? 'certificacion')) as import('@enjambre/contable').SiiEnvironment;
  const token = await getSiiToken(ambiente, String(emisor.rut), p12Password);
  const envioResult = await enviarDte(ambiente, token.token, envioXml, formatRutSii(String(emisor.rut)));

  const estadoSii = mapEnvioEstado(envioResult.estado);

  await supabase
    .from('facturas_emitidas')
    .update({
      tipo_dte: DTE_TIPO.BOLETA_ELECTRONICA,
      tipo_documento: 'Boleta',
      folio: cafFolio.folio,
      folio_caf: cafFolio.folio,
      caf_id: cafFolio.caf_id,
      estado_sii: estadoSii,
      estado: 'pagada',
      track_id: envioResult.trackId,
      sii_response: { estado: envioResult.estado, glosa: envioResult.glosa, venta_id: input.ventaId },
      sii_xml: stampedXml,
      numero: String(cafFolio.folio),
    })
    .eq('id', input.facturaEmitidaId);

  return {
    ok: true,
    folio: cafFolio.folio,
    trackId: envioResult.trackId,
    estadoSii,
  };
}