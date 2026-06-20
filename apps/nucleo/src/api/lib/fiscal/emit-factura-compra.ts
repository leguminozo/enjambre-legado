import {
  DTE_TIPO,
  RUT_EXTRANJERO_GENERICO,
  buildDteXml,
  buildEnvioDteXml,
  type DteDocumento,
} from '@enjambre/contable';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  signDteXml,
  stampDteXml,
  enviarDte,
  getSiiToken,
} from '@/api/lib/sii-client';
import { resolveSiiAmbiente, resolveSiiCredentials } from '@/api/lib/sii-credentials';
import { assertCafAvailable } from './caf-guard';

export type FacturaCompraRow = {
  id: string;
  folio: number;
  fecha_emision: string;
  receptor_rut: string | null;
  receptor_razon_social: string | null;
  receptor_giro: string | null;
  monto_neto: number | null;
  monto_exento: number | null;
  monto_iva: number | null;
  monto_total: number | null;
  descripcion: string | null;
  estado_sii: string;
};

export type EmitFacturaCompraResult =
  | {
      ok: true;
      trackId: string;
      estado: string;
      glosa?: string;
      estadoSii: 'aceptado' | 'rechazado' | 'enviado';
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

function mapEnvioEstado(estado: string): 'aceptado' | 'rechazado' | 'enviado' {
  if (estado === 'aceptado') return 'aceptado';
  if (estado === 'rechazado') return 'rechazado';
  return 'enviado';
}

export async function emitFacturaCompraToSii(
  supabase: SupabaseClient,
  empresaId: string,
  facturaId: string,
): Promise<EmitFacturaCompraResult> {
  const { data: factura, error: facturaError } = await supabase
    .from('facturas_compra')
    .select('*')
    .eq('id', facturaId)
    .eq('empresa_id', empresaId)
    .single();

  if (facturaError || !factura) {
    return { ok: false, code: 'not_found', message: 'Factura de compra no encontrada' };
  }

  const row = factura as FacturaCompraRow;
  if (row.estado_sii !== 'pendiente') {
    return { ok: false, code: 'invalid_state', message: 'La factura ya fue enviada al SII' };
  }

  try {
    await assertCafAvailable(supabase, empresaId, DTE_TIPO.FACTURA_COMPRA);
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'caf_exhausted') {
      const cafErr = err as { tipoDte: number; foliosRestantes: number };
      return {
        ok: false,
        code: 'caf_exhausted',
        message: `CAF insuficiente para tipo 46 (${cafErr.foliosRestantes} folios restantes)`,
      };
    }
    throw err;
  }

  const { data: empresa } = await supabase
    .from('empresas')
    .select('rut, razon_social, giro, direccion, comuna, ciudad, acteco, sii_ambiente')
    .eq('id', empresaId)
    .single();

  if (!empresa) {
    return { ok: false, code: 'empresa_not_found', message: 'Empresa no encontrada' };
  }

  const { data: cafRows } = await supabase
    .from('sii_caf')
    .select('id, tipo_dte, folio_desde, folio_hasta, folio_actual, fecha_autorizacion, firma_caf, private_key, public_key, nro_resol, fch_resol')
    .eq('empresa_id', empresaId)
    .eq('tipo_dte', DTE_TIPO.FACTURA_COMPRA)
    .eq('activo', true)
    .limit(1);

  if (!cafRows?.length) {
    return { ok: false, code: 'no_caf', message: 'No hay CAF activo para DTE 46' };
  }

  const caf = cafRows[0] as Record<string, unknown>;
  const emisor = empresa as Record<string, unknown>;

  const dteDoc: DteDocumento = {
    encabezado: {
      tipoDte: DTE_TIPO.FACTURA_COMPRA,
      folio: Number(row.folio),
      fechaEmision: String(row.fecha_emision),
      emisor: {
        rut: String(emisor.rut),
        razonSocial: String(emisor.razon_social),
        giro: String(emisor.giro ?? ''),
        direccion: String(emisor.direccion ?? ''),
        comuna: String(emisor.comuna ?? ''),
        ciudad: String(emisor.ciudad ?? ''),
        actividadEconomica: Number(emisor.acteco ?? 0),
      },
      receptor: {
        rut: RUT_EXTRANJERO_GENERICO,
        razonSocial: String(row.receptor_razon_social ?? 'PROVEEDOR EXTRANJERO'),
        giro: String(row.receptor_giro ?? ''),
        direccion: '',
        comuna: '',
        ciudad: '',
      },
      montoNeto: Number(row.monto_neto ?? 0),
      montoExento: Number(row.monto_exento ?? 0),
      tasaIva: 0.19,
      montoIva: Number(row.monto_iva ?? 0),
      montoTotal: Number(row.monto_total ?? 0),
    },
    detalles: [{
      nombre: String(row.descripcion ?? 'SERVICIOS DIGITALES EXTRANJEROS'),
      cantidad: 1,
      precioUnitario: Number(row.monto_neto ?? 0),
      montoItem: Number(row.monto_total ?? 0),
    }],
  };

  const credsResult = await resolveSiiCredentials(supabase, empresaId);
  if (!credsResult.ok) {
    return { ok: false, code: credsResult.code, message: credsResult.message };
  }

  const { p12Base64, p12Password } = credsResult.credentials;
  const signedXml = signDteXml(buildDteXml(dteDoc), p12Base64, p12Password);

  const cafFolio = {
    tipoDte: DTE_TIPO.FACTURA_COMPRA,
    desde: Number(caf.folio_desde),
    hasta: Number(caf.folio_hasta),
    fechaAutorizacion: String(caf.fecha_autorizacion),
    firma: String(caf.firma_caf),
    privateKey: String(caf.private_key),
    publicKey: String(caf.public_key),
  };

  const stampedXml = stampDteXml(signedXml, cafFolio, Number(row.folio));
  const envioXml = buildEnvioDteXml(
    [stampedXml],
    String(emisor.rut),
    Number(caf.nro_resol ?? 0),
    String(caf.fch_resol ?? '2024-01-01'),
  );

  const ambiente = resolveSiiAmbiente(String(emisor.sii_ambiente ?? 'certificacion')) as import('@enjambre/contable').SiiEnvironment;
  const token = await getSiiToken(ambiente, String(emisor.rut), p12Password);
  const envioResult = await enviarDte(ambiente, token.token, envioXml, String(emisor.rut));

  const estadoSii = mapEnvioEstado(envioResult.estado);

  await supabase
    .from('facturas_compra')
    .update({
      estado_sii: estadoSii,
      track_id: envioResult.trackId,
      sii_response: { estado: envioResult.estado, glosa: envioResult.glosa },
      sii_xml: stampedXml,
    })
    .eq('id', facturaId);

  return {
    ok: true,
    trackId: envioResult.trackId,
    estado: envioResult.estado,
    glosa: envioResult.glosa,
    estadoSii,
  };
}