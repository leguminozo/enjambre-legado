import type { SupabaseClient } from "@supabase/supabase-js";
import type { GastoExtranjeroResult } from "@enjambre/contable";

type CafFolioResult = {
  folio: number;
  folio_hasta: number;
  caf_id: string;
  nro_resol: number;
  fch_resol: string;
};

export async function createFacturaCompraFromGasto(
  empresaId: string,
  supabase: SupabaseClient,
  gasto: GastoExtranjeroResult,
) {
  const { data: cafRows, error: cafError } = await supabase.rpc(
    "sii_caf_next_folio",
    { p_empresa_id: empresaId, p_tipo_dte: 46 },
  );

  if (cafError || !cafRows || !Array.isArray(cafRows) || cafRows.length === 0) {
    throw new Error(cafError ? String(cafError) : "No hay CAF activo para Factura de Compra (tipo 46)");
  }

  const caf = (cafRows as CafFolioResult[])[0]!;

  const payload = {
    empresa_id: empresaId,
    tipo_dte: 46,
    folio: caf.folio,
    fecha_emision: gasto.fechaEmision,
    receptor_rut: gasto.proveedorRut,
    receptor_razon_social: gasto.proveedorNombre,
    receptor_giro: gasto.proveedorGiro,
    monto_neto: gasto.montoNeto,
    monto_exento: gasto.montoExento,
    monto_iva: gasto.montoIva,
    monto_total: gasto.montoTotal,
    estado_sii: "pendiente" as const,
    descripcion: gasto.concepto,
    source_type: gasto.proveedorId as string,
    source_raw: {
      montoOriginal: gasto.montoOriginal,
      monedaOriginal: gasto.monedaOriginal,
      tasaCambio: gasto.tasaCambio,
      montoCLP: gasto.montoCLP,
      numeroDocumento: gasto.numeroDocumento,
      detalle: gasto.detalle,
    },
  };

  const { data, error } = await supabase
    .from("facturas_compra")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Error insertando factura: ${String(error)}`);
  }

  return { data, gasto };
}
