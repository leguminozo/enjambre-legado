import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  calcularIVA,
  calcularTotal,
  FacturaCompraInputSchema,
  parseReceipt,
  fetchTasaDolar,
} from "@enjambre/contable";
import { emitFacturaCompraToSii } from "@/api/lib/fiscal/emit-factura-compra";
import { pollFacturaCompraSii } from "@/api/lib/fiscal/poll-factura-compra";
import type { AppVariables } from "@/api/lib/middleware";
import { createFacturaCompraFromGasto } from "./helpers";

export const facturasRoutes = new Hono<{ Variables: AppVariables }>();

facturasRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("facturas_compra")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("fecha_emision", { ascending: false })
    .limit(100);

  if (error) {
    return c.json(
      {
        code: "facturas_compra_query_failed",
        message: "No fue posible obtener facturas de compra",
        details: error.message,
      },
      500,
    );
  }

  return c.json({ data: data ?? [] });
});

facturasRoutes.post(
  "/",
  zValidator("json", FacturaCompraInputSchema),
  async (c) => {
    const input = c.req.valid("json");
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");

    const montoIva = calcularIVA(input.monto_neto);
    const montoTotal = calcularTotal(input.monto_neto, montoIva);

    const payload = {
      empresa_id: empresaId,
      tercero_id: input.tercero_id,
      tipo_dte: 46,
      folio: input.folio,
      fecha_emision: input.fecha_emision,
      receptor_rut: input.receptor_rut,
      receptor_razon_social: input.receptor_razon_social,
      receptor_giro: input.receptor_giro ?? null,
      monto_neto: input.monto_neto,
      monto_exento: input.monto_exento,
      monto_iva: montoIva,
      monto_total: montoTotal,
      estado_sii: "pendiente" as const,
      descripcion: input.descripcion ?? null,
      source_type: "manual" as const,
    };

    const { data, error } = await supabase
      .from("facturas_compra")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return c.json(
        {
          code: "factura_compra_create_failed",
          message: "No fue posible crear la factura de compra",
          details: error.message,
        },
        400,
      );
    }

    return c.json({ data }, 201);
  },
);

facturasRoutes.post("/uber", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const body = await c.req.json<{ receipt_text: string }>();
  if (!body.receipt_text) {
    return c.json(
      { code: "missing_receipt_text", message: "receipt_text es requerido" },
      400,
    );
  }

  try {
    const tasaDolar = await fetchTasaDolar();
    const parsed = parseReceipt(body.receipt_text, undefined, tasaDolar);

    if (!parsed) {
      return c.json(
        {
          code: "receipt_parse_failed",
          message: "No se pudo extraer datos del recibo. Intenta con /gastos-extranjero/parse",
        },
        422,
      );
    }

    const result = await createFacturaCompraFromGasto(empresaId, supabase, parsed);
    return c.json(result, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error procesando recibo";
    return c.json({ code: "uber_process_failed", message }, 400);
  }
});

facturasRoutes.get("/:id/estado", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const facturaId = c.req.param("id");

  const { data, error } = await supabase
    .from("facturas_compra")
    .select("id, estado_sii, track_id, sii_response")
    .eq("empresa_id", empresaId)
    .eq("id", facturaId)
    .single();

  if (error || !data) {
    return c.json(
      { code: "not_found", message: "Factura de compra no encontrada" },
      404,
    );
  }

  return c.json({ data });
});

facturasRoutes.post("/:id/enviar-sii", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const facturaId = c.req.param("id");

  const result = await emitFacturaCompraToSii(supabase, empresaId, facturaId);

  if (!result.ok) {
    const status =
      result.code === "not_found" ? 404 :
      result.code === "invalid_state" || result.code === "no_caf" || result.code === "caf_exhausted" || result.code === "no_certificado" ? 400 :
      500;
    return c.json({ code: result.code, message: result.message }, status);
  }

  return c.json({
    data: {
      trackId: result.trackId,
      estado: result.estado,
      glosa: result.glosa,
      estadoSii: result.estadoSii,
    },
  });
});

facturasRoutes.get("/:id/poll-sii", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const facturaId = c.req.param("id");

  const result = await pollFacturaCompraSii(supabase, empresaId, facturaId);

  if (!result.ok) {
    const status = result.code === "not_found" ? 404 : result.code === "no_track_id" ? 400 : 500;
    return c.json({ code: result.code, message: result.message }, status);
  }

  if (result.estadoSii === "aceptado") {
    await supabase
      .from("gastos_extranjeros")
      .update({ estado: "aceptado_sii" })
      .eq("factura_compra_id", facturaId)
      .eq("empresa_id", empresaId);
  } else if (result.estadoSii === "rechazado") {
    await supabase
      .from("gastos_extranjeros")
      .update({ estado: "rechazado_sii" })
      .eq("factura_compra_id", facturaId)
      .eq("empresa_id", empresaId);
  }

  return c.json({
    data: {
      estadoSii: result.estadoSii,
      aceptados: result.aceptados,
      rechazados: result.rechazados,
      reparos: result.reparos,
      glosa: result.glosa,
    },
  });
});