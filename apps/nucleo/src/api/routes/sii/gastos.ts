import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  parseReceipt,
  fetchTasaDolar,
  fetchTasaEuro,
  PROVEEDORES,
  detectarProveedor,
} from "@enjambre/contable";
import type { GastoExtranjeroResult } from "@enjambre/contable";
import type { AppVariables } from "@/api/lib/middleware";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from "@/api/lib/ratelimit";
import { processGastoExtranjero } from "@/api/lib/fiscal/gasto-pipeline";
import { createFacturaCompraFromGasto } from "./helpers";

export const gastosRoutes = new Hono<{ Variables: AppVariables }>();

const GastoExtranjeroResultSchema = z.object({
  proveedorId: z.string().min(1),
  proveedorRut: z.string().min(1),
  proveedorNombre: z.string(),
  proveedorGiro: z.string(),
  montoOriginal: z.number(),
  monedaOriginal: z.enum(["CLP", "USD", "EUR"]),
  montoCLP: z.number(),
  tasaCambio: z.number(),
  montoNeto: z.number(),
  montoExento: z.number(),
  montoIva: z.number(),
  montoTotal: z.number(),
  fechaEmision: z.string().min(1),
  numeroDocumento: z.string(),
  concepto: z.string().min(1),
  detalle: z.string(),
});

const ProcesarGastoBodySchema = z
  .object({
    gasto: GastoExtranjeroResultSchema.optional(),
    receipt_text: z.string().min(10).optional(),
    proveedor_id: z.string().optional(),
    receipt_raw: z.string().optional(),
    emit_to_sii: z.boolean().optional(),
    sync_rcv: z.boolean().optional(),
  })
  .refine((body) => body.gasto || body.receipt_text, {
    message: "gasto o receipt_text es requerido",
  });

async function rateLimitMiddleware(
  c: {
    req: { header: (name: string) => string | undefined; ip?: string };
    json: (data: unknown, status: number) => Response;
    header: (name: string, value: string) => void;
  },
  config: { readonly limit: number; readonly window: `${number} ${"s" | "m" | "h" | "d"}` },
) {
  const identifier = getClientIdentifier(c);
  const result = await checkRateLimit({ identifier, ...config });

  c.header("X-RateLimit-Limit", String(result.limit));
  c.header("X-RateLimit-Remaining", String(result.remaining));
  c.header("X-RateLimit-Reset", String(result.reset));

  if (!result.success) {
    c.header("Retry-After", String(result.retryAfter || 60));
    return c.json({ code: "rate_limited", message: "Demasiadas solicitudes. Intenta de nuevo más tarde." }, 429);
  }

  return undefined;
}

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

gastosRoutes.post(
  "/procesar",
  zValidator("json", ProcesarGastoBodySchema),
  async (c) => {
    const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.api);
    if (rateLimitResult) return rateLimitResult;

    const body = c.req.valid("json");
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");

    let gasto: GastoExtranjeroResult;
    let receiptRaw = body.receipt_raw;

    if (body.gasto) {
      gasto = body.gasto;
    } else {
      const proveedorOverride = body.proveedor_id
        ? PROVEEDORES.find((p) => p.id === body.proveedor_id)
        : undefined;
      const detectado = detectarProveedor(body.receipt_text!);

      try {
        let tasaCambio = 1;
        if (detectado?.moneda === "USD" || proveedorOverride?.moneda === "USD") {
          tasaCambio = await fetchTasaDolar();
        } else if (detectado?.moneda === "EUR" || proveedorOverride?.moneda === "EUR") {
          tasaCambio = await fetchTasaEuro();
        }

        const parsed = parseReceipt(body.receipt_text!, proveedorOverride, tasaCambio);
        if (!parsed) {
          return c.json(
            {
              code: "receipt_parse_failed",
              message: "No se pudo detectar el proveedor o extraer datos",
              detectado: detectado?.id ?? null,
            },
            422,
          );
        }

        gasto = parsed;
        receiptRaw = receiptRaw ?? body.receipt_text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error obteniendo tasa de cambio";
        return c.json({ code: "tasa_cambio_failed", message }, 502);
      }
    }

    const result = await processGastoExtranjero(supabase, empresaId, {
      gasto,
      receiptRaw,
      emitToSii: body.emit_to_sii ?? true,
      syncRcv: body.sync_rcv ?? true,
    });

    if (!result.ok) {
      const status =
        result.code === "caf_exhausted" || result.code === "factura_create_failed" ? 400 :
        500;
      return c.json(
        { code: result.code, message: result.message, details: result.details },
        status,
      );
    }

    return c.json({ data: result }, result.alreadyProcessed ? 200 : 201);
  },
);

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
