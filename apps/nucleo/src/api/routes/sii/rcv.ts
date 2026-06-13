import { Hono } from "hono";
import { parsearEstadoRcv } from "@enjambre/contable";
import type { RcvTipoRegistro, RcvRegistroCompra, RcvRegistroVenta } from "@enjambre/contable";
import { getSiiToken, consultarRCV } from "@/api/lib/sii-client";
import type { AppVariables } from "@/api/lib/middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

const DTE_TIPO_LABELS: Record<number, string> = {
  33: "Factura",
  34: "Factura Exenta",
  39: "Boleta",
  41: "Boleta Exenta",
  46: "Factura de Compra",
  52: "Guia de Despacho",
  56: "Nota de Debito",
  61: "Nota de Credito",
};

export const rcvRoutes = new Hono<{ Variables: AppVariables }>();

rcvRoutes.get("/:periodo", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const periodo = c.req.param("periodo");
  const tipo = (c.req.query("tipo") ?? "compras") as RcvTipoRegistro;

  if (!/^\d{6}$/.test(periodo)) {
    return c.json({ code: "invalid_period", message: "Periodo debe ser YYYYMM (ej: 202606)" }, 400);
  }

  if (tipo !== "compras" && tipo !== "ventas") {
    return c.json({ code: "invalid_tipo", message: "tipo debe ser 'compras' o 'ventas'" }, 400);
  }

  const { data: existing } = await supabase
    .from("rcv_sync")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("periodo", periodo)
    .eq("tipo_registro", tipo)
    .maybeSingle();

  if (existing) {
    const { data: registros } = await supabase
      .from("rcv_registros")
      .select("*")
      .eq("rcv_sync_id", (existing as Record<string, unknown>).id)
      .order("fecha_emision", { ascending: false });

    return c.json({ data: { sync: existing, registros: registros ?? [] } });
  }

  return c.json({ data: { sync: null, registros: [] } });
});

rcvRoutes.post("/:periodo/sync", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const periodo = c.req.param("periodo");
  const tipo = (c.req.query("tipo") ?? "compras") as RcvTipoRegistro;

  if (!/^\d{6}$/.test(periodo)) {
    return c.json({ code: "invalid_period", message: "Periodo debe ser YYYYMM (ej: 202606)" }, 400);
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("rut, sii_ambiente")
    .eq("id", empresaId)
    .single();

  if (!empresa) {
    return c.json({ code: "empresa_not_found", message: "Empresa no encontrada" }, 404);
  }

  const emisor = empresa as Record<string, unknown>;
  const p12Password = process.env.SII_P12_PASSWORD ?? "";
  const ambienteRaw = String(emisor.sii_ambiente ?? "certificacion");
  const ambiente = (ambienteRaw.toUpperCase() === "PRODUCCION" ? "PRODUCCION" : "CERTIFICACION") as import("@enjambre/contable").SiiEnvironment;

  try {
    const token = await getSiiToken(ambiente, String(emisor.rut), p12Password);
    const rcvResumen = await consultarRCV(ambiente, token.token, String(emisor.rut), periodo, tipo);

    const syncPayload = {
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
      estado: "sincronizado" as const,
    };

    const { data: sync, error: syncError } = await supabase
      .from("rcv_sync")
      .upsert(syncPayload, { onConflict: "empresa_id,periodo,tipo_registro" })
      .select("*")
      .single();

    if (syncError) {
      return c.json({ code: "rcv_sync_failed", message: syncError.message }, 500);
    }

    const syncId = (sync as Record<string, unknown>).id as string;

    await supabase
      .from("rcv_registros")
      .delete()
      .eq("rcv_sync_id", syncId);

    if (rcvResumen.registros.length > 0) {
      const registrosPayload = rcvResumen.registros.map((r) => {
        const isCompra = tipo === "compras";
        const compra = isCompra ? (r as RcvRegistroCompra) : null;
        const venta = !isCompra ? (r as RcvRegistroVenta) : null;
        return {
          empresa_id: empresaId,
          rcv_sync_id: syncId,
          tipo_dte: r.tipoDte,
          folio: r.folio,
          fecha_emision: r.fechaEmision,
          rut_contraparte: isCompra ? (compra?.rutProveedor ?? "") : (venta?.rutReceptor ?? ""),
          razon_social_contraparte: isCompra ? (compra?.razonSocialProveedor ?? "") : (venta?.razonSocialReceptor ?? ""),
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

      await supabase
        .from("rcv_registros")
        .insert(registrosPayload);
    }

    await reconciliarRcv(supabase, empresaId, syncId, tipo);

    const { data: registros } = await supabase
      .from("rcv_registros")
      .select("*")
      .eq("rcv_sync_id", syncId)
      .order("fecha_emision", { ascending: false });

    return c.json({ data: { sync, registros: registros ?? [] } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error sincronizando RCV";
    return c.json({ code: "rcv_sync_failed", message }, 500);
  }
});

async function reconciliarRcv(
  supabase: SupabaseClient,
  empresaId: string,
  syncId: string,
  tipo: RcvTipoRegistro,
): Promise<void> {
  const { data: registros } = await supabase
    .from("rcv_registros")
    .select("id, tipo_dte, folio, estado_rcv")
    .eq("rcv_sync_id", syncId)
    .eq("reconciliado", false);

  if (!registros || registros.length === 0) return;

  for (const reg of registros) {
    const r = reg as Record<string, unknown>;
    let facturaId: string | null = null;

    if (tipo === "compras") {
      const { data: factura } = await supabase
        .from("facturas_compra")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("tipo_dte", Number(r.tipo_dte))
        .eq("folio", Number(r.folio))
        .maybeSingle();
      facturaId = (factura as Record<string, unknown> | null)?.id as string ?? null;
    } else {
      const tipoDocumentoLabel = DTE_TIPO_LABELS[Number(r.tipo_dte)] ?? String(r.tipo_dte);
      const { data: emitida } = await supabase
        .from("facturas_emitidas")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("tipo_documento", tipoDocumentoLabel)
        .eq("folio", Number(r.folio))
        .maybeSingle();
      facturaId = (emitida as Record<string, unknown> | null)?.id as string ?? null;
    }

    const update: Record<string, unknown> = { reconciliado: facturaId !== null };
    if (tipo === "compras" && facturaId) {
      update.factura_compra_id = facturaId;
    }

    await supabase
      .from("rcv_registros")
      .update(update)
      .eq("id", r.id);

    if (tipo === "compras" && facturaId && r.estado_rcv === "aceptado") {
      await supabase
        .from("facturas_compra")
        .update({ estado_sii: "aceptado" })
        .eq("id", facturaId);
    }
  }
}
