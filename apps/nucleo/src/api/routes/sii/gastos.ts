import { Hono } from "hono";
import {
  parseReceipt,
  fetchTasaDolar,
  fetchTasaEuro,
  PROVEEDORES,
  detectarProveedor,
} from "@enjambre/contable";
import type { GastoExtranjeroResult } from "@enjambre/contable";
import type { AppVariables } from "@/api/lib/middleware";
import { createFacturaCompraFromGasto } from "./helpers";

export const gastosRoutes = new Hono<{ Variables: AppVariables }>();

gastosRoutes.post("/parse", async (c) => {
  const body = await c.req.json<{ receipt_text: string; proveedor_id?: string }>();
  if (!body.receipt_text) {
    return c.json(
      { code: "missing_receipt_text", message: "receipt_text es requerido" },
      400,
    );
  }

  const proveedorOverride = body.proveedor_id
    ? PROVEEDORES.find((p) => p.id === body.proveedor_id)
    : undefined;

  const detectado = detectarProveedor(body.receipt_text);

  try {
    let tasaCambio = 1;
    if (detectado?.moneda === "USD" || proveedorOverride?.moneda === "USD") {
      tasaCambio = await fetchTasaDolar();
    } else if (detectado?.moneda === "EUR" || proveedorOverride?.moneda === "EUR") {
      tasaCambio = await fetchTasaEuro();
    }

    const parsed = parseReceipt(body.receipt_text, proveedorOverride, tasaCambio);

    if (!parsed) {
      return c.json(
        {
          code: "receipt_parse_failed",
          message: "No se pudo detectar el proveedor o extraer datos",
          detectado: detectado?.id ?? null,
          disponibles: PROVEEDORES.map((p) => ({ id: p.id, nombre: p.nombre, keywords: p.keywords })),
        },
        422,
      );
    }

    return c.json({ data: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error obteniendo tasa de cambio";
    return c.json({ code: "tasa_cambio_failed", message }, 502);
  }
});

gastosRoutes.post("/facturar", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const body = await c.req.json<{ gasto: GastoExtranjeroResult }>();
  if (!body.gasto) {
    return c.json(
      { code: "missing_gasto", message: "gasto es requerido" },
      400,
    );
  }

  try {
    const result = await createFacturaCompraFromGasto(empresaId, supabase, body.gasto);
    return c.json(result, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error creando factura";
    return c.json({ code: "gasto_facturar_failed", message }, 400);
  }
});

gastosRoutes.get("/proveedores", (c) => {
  return c.json({ data: PROVEEDORES });
});

gastosRoutes.get("/", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const limite = Math.min(Number(c.req.query("limit") ?? 100), 500);
  const offset = Number(c.req.query("offset") ?? 0);
  const estado = c.req.query("estado");

  let query = supabase
    .from("gastos_extranjeros")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("fecha_emision", { ascending: false })
    .range(offset, offset + limite - 1);

  if (estado) {
    query = query.eq("estado", estado);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "gastos_query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

gastosRoutes.get("/:id", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const gastoId = c.req.param("id");

  const { data, error } = await supabase
    .from("gastos_extranjeros")
    .select("*")
    .eq("id", gastoId)
    .eq("empresa_id", empresaId)
    .single();

  if (error || !data) {
    return c.json({ code: "not_found", message: "Gasto extranjero no encontrado" }, 404);
  }

  return c.json({ data });
});

gastosRoutes.post("/guardar", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const body = await c.req.json<{
    proveedor_id: string;
    proveedor_rut: string;
    proveedor_nombre: string;
    monto_original: number;
    moneda_original: string;
    monto_clp: number;
    tasa_cambio: number;
    monto_neto: number;
    monto_exento: number;
    monto_iva: number;
    monto_total: number;
    fecha_emision: string;
    numero_documento?: string;
    concepto: string;
    detalle?: string;
    receipt_raw?: string;
  }>();

  if (!body.proveedor_id || !body.proveedor_rut || !body.concepto) {
    return c.json(
      { code: "missing_fields", message: "proveedor_id, proveedor_rut y concepto son requeridos" },
      400,
    );
  }

  const { data, error } = await supabase
    .from("gastos_extranjeros")
    .insert({
      empresa_id: empresaId,
      proveedor_id: body.proveedor_id,
      proveedor_rut: body.proveedor_rut,
      proveedor_nombre: body.proveedor_nombre,
      monto_original: body.monto_original,
      moneda_original: body.moneda_original ?? "USD",
      monto_clp: body.monto_clp,
      tasa_cambio: body.tasa_cambio,
      monto_neto: body.monto_neto,
      monto_exento: body.monto_exento ?? 0,
      monto_iva: body.monto_iva ?? 0,
      monto_total: body.monto_total,
      fecha_emision: body.fecha_emision,
      numero_documento: body.numero_documento ?? null,
      concepto: body.concepto,
      detalle: body.detalle ?? null,
      receipt_raw: body.receipt_raw ?? null,
      estado: "parseado",
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "gasto_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

gastosRoutes.patch("/:id/estado", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const gastoId = c.req.param("id");

  const body = await c.req.json<{
    estado: "parseado" | "facturado" | "enviado_sii" | "aceptado_sii" | "rechazado_sii";
    factura_compra_id?: string;
  }>();

  if (!body.estado) {
    return c.json({ code: "missing_estado", message: "estado es requerido" }, 400);
  }

  const update: Record<string, unknown> = { estado: body.estado };
  if (body.factura_compra_id) {
    update.factura_compra_id = body.factura_compra_id;
  }

  const { data, error } = await supabase
    .from("gastos_extranjeros")
    .update(update as any)
    .eq("id", gastoId)
    .eq("empresa_id", empresaId)
    .select("*")
    .single();

  if (error || !data) {
    return c.json({ code: "gasto_update_failed", message: error?.message ?? "No encontrado" }, 400);
  }

  return c.json({ data });
});
