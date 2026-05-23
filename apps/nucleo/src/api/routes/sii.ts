import {
  calcularIVA,
  calcularTotal,
  FacturaCompraInputSchema,
  parseReceipt,
  fetchTasaDolar,
  fetchTasaEuro,
  PROVEEDORES,
  detectarProveedor,
} from "@enjambre/contable";
import type { GastoExtranjeroResult } from "@enjambre/contable";
import type { SupabaseClient } from "@supabase/supabase-js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware } from "@/api/lib/middleware";
import { tenantMiddleware } from "@/api/lib/middleware";

type CafFolioResult = {
  folio: number;
  folio_hasta: number;
  caf_id: string;
  nro_resol: number;
  fch_resol: string;
};

export const siiRoutes = new Hono<{
  Variables: AppVariables;
}>();

siiRoutes.use("*", authMiddleware, tenantMiddleware);

siiRoutes.get("/facturas-compra", async (c) => {
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

siiRoutes.post(
  "/facturas-compra",
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

siiRoutes.post("/facturas-compra/uber", async (c) => {
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

siiRoutes.post("/gastos-extranjero/parse", async (c) => {
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

siiRoutes.post("/gastos-extranjero/facturar", async (c) => {
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

siiRoutes.get("/gastos-extranjero/proveedores", (c) => {
  return c.json({ data: PROVEEDORES });
});

siiRoutes.get("/gastos-extranjero", async (c) => {
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

siiRoutes.get("/gastos-extranjero/:id", async (c) => {
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

siiRoutes.post("/gastos-extranjero/guardar", async (c) => {
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

siiRoutes.patch("/gastos-extranjero/:id/estado", async (c) => {
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
    .update(update)
    .eq("id", gastoId)
    .eq("empresa_id", empresaId)
    .select("*")
    .single();

  if (error || !data) {
    return c.json({ code: "gasto_update_failed", message: error?.message ?? "No encontrado" }, 400);
  }

  return c.json({ data });
});

siiRoutes.get("/tasa-cambio", async (c) => {
  const moneda = c.req.query("moneda") ?? "dolar";

  try {
    if (moneda === "dolar") {
      const valor = await fetchTasaDolar();
      return c.json({ data: { moneda: "USD", valor, fecha: new Date().toISOString().slice(0, 10) } });
    }
    if (moneda === "euro") {
      const valor = await fetchTasaEuro();
      return c.json({ data: { moneda: "EUR", valor, fecha: new Date().toISOString().slice(0, 10) } });
    }
    return c.json({ code: "unsupported_currency", message: "Moneda no soportada. Usa: dolar, euro" }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error obteniendo tasa";
    return c.json({ code: "tasa_cambio_failed", message }, 502);
  }
});

siiRoutes.get("/facturas-compra/:id/estado", async (c) => {
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

siiRoutes.get("/caf", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("sii_caf")
    .select("id, tipo_dte, folio_desde, folio_hasta, folio_actual, activo, fecha_autorizacion, nro_resol, fch_resol")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    return c.json(
      { code: "caf_query_failed", message: error.message },
      500,
    );
  }

  return c.json({ data: data ?? [] });
});

siiRoutes.get("/dashboard", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const [comprasRes, pendientesRes] = await Promise.all([
    supabase
      .from("facturas_compra")
      .select("monto_neto, monto_iva, monto_total")
      .eq("empresa_id", empresaId),
    supabase
      .from("facturas_compra")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("estado_sii", "pendiente"),
  ]);

  if (comprasRes.error) {
    return c.json(
      { code: "sii_dashboard_failed", message: comprasRes.error.message },
      500,
    );
  }

  const compras = comprasRes.data ?? [];
  const totalComprasNeto = compras.reduce(
    (acc: number, item: { monto_neto: number | null }) =>
      acc + Number(item.monto_neto ?? 0),
    0,
  );
  const totalComprasIva = compras.reduce(
    (acc: number, item: { monto_iva: number | null }) =>
      acc + Number(item.monto_iva ?? 0),
    0,
  );
  const totalCompras = compras.reduce(
    (acc: number, item: { monto_total: number | null }) =>
      acc + Number(item.monto_total ?? 0),
    0,
  );

  return c.json({
    data: {
      totalComprasNeto,
      totalComprasIva,
      totalCompras,
      totalFacturasCompra: compras.length,
      pendientesEnvio: pendientesRes.data?.length ?? 0,
    },
  });
});

async function createFacturaCompraFromGasto(
  empresaId: string,
  supabase: SupabaseClient,
  gasto: GastoExtranjeroResult,
) {
  const { data: cafRows, error: cafError } = await supabase.rpc(
    "sii_caf_next_folio",
    { p_empresa_id: empresaId, p_tipo_dte: 46 },
  );

  if (cafError || !cafRows || (cafRows as unknown[]).length === 0) {
    throw new Error(cafError ? String(cafError) : "No hay CAF activo para Factura de Compra (tipo 46)");
  }

  const caf = (cafRows as unknown as CafFolioResult[])[0]!;

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
