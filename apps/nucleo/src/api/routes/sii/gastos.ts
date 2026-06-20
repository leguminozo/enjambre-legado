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
import { createAdminClient } from "@enjambre/auth/browser";
import { enqueueSiiDocumentJob, ingestFiscalDocument, loadFiscalDocumentText } from "@enjambre/fiscal";
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
    fiscal_document_id: z.string().uuid().optional(),
    proveedor_id: z.string().optional(),
    receipt_raw: z.string().optional(),
    emit_to_sii: z.boolean().optional(),
    sync_rcv: z.boolean().optional(),
  })
  .refine((body) => body.gasto || body.receipt_text || body.fiscal_document_id, {
    message: "gasto, receipt_text o fiscal_document_id es requerido",
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

gastosRoutes.post("/upload", async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.api);
  if (rateLimitResult) return rateLimitResult;

  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const body = await c.req.parseBody();
  const file = body.file;

  if (!file || typeof file === "string") {
    return c.json({ code: "missing_file", message: "Archivo file es requerido (multipart/form-data)" }, 400);
  }

  const uploadFile = file as File;
  const buffer = Buffer.from(await uploadFile.arrayBuffer());
  const mimeType = uploadFile.type || "application/octet-stream";

  const result = await ingestFiscalDocument(supabase, empresaId, {
    buffer,
    mimeType,
    fileName: uploadFile.name,
  });

  if (!result.ok) {
    const status =
      result.code === "unsupported_mime" || result.code === "file_too_large" ? 400 : 500;
    return c.json({ code: result.code, message: result.message }, status);
  }

  return c.json(
    {
      data: {
        id: result.document.id,
        sha256: result.document.sha256,
        mime_type: result.document.mime_type,
        storage_path: result.document.storage_path,
        proveedor_detectado: result.document.proveedor_detectado,
        extracted_text: result.extractedText,
        already_exists: result.alreadyExists,
      },
    },
    result.alreadyExists ? 200 : 201,
  );
});

gastosRoutes.get("/bandeja", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const limite = Math.min(Number(c.req.query("limit") ?? 50), 200);
  const offset = Number(c.req.query("offset") ?? 0);
  const estado = c.req.query("estado");

  let query = supabase
    .from("gastos_extranjeros")
    .select("*, fiscal_documents(id, storage_path, mime_type, sha256, proveedor_detectado)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limite - 1);

  if (estado) {
    query = query.eq("estado", estado);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "bandeja_query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
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
    let fiscalDocumentId = body.fiscal_document_id;

    let receiptText = body.receipt_text;

    if (body.gasto) {
      gasto = body.gasto;
    } else {
      if (body.fiscal_document_id && !receiptText) {
        const docResult = await loadFiscalDocumentText(supabase, empresaId, body.fiscal_document_id);
        if (!docResult.ok) {
          const status = docResult.code === "document_not_found" ? 404 : 422;
          return c.json({ code: docResult.code, message: docResult.message }, status);
        }
        fiscalDocumentId = docResult.document.id;
        receiptText = docResult.text;
      }

      if (!receiptText) {
        return c.json(
          { code: "missing_input", message: "receipt_text o fiscal_document_id con texto extraído es requerido" },
          400,
        );
      }
      const proveedorOverride = body.proveedor_id
        ? PROVEEDORES.find((p) => p.id === body.proveedor_id)
        : undefined;
      const detectado = detectarProveedor(receiptText);

      try {
        let tasaCambio = 1;
        if (detectado?.moneda === "USD" || proveedorOverride?.moneda === "USD") {
          tasaCambio = await fetchTasaDolar();
        } else if (detectado?.moneda === "EUR" || proveedorOverride?.moneda === "EUR") {
          tasaCambio = await fetchTasaEuro();
        }

        const parsed = parseReceipt(receiptText, proveedorOverride, tasaCambio);
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
        receiptRaw = receiptRaw ?? receiptText;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error obteniendo tasa de cambio";
        return c.json({ code: "tasa_cambio_failed", message }, 502);
      }
    }

    const result = await processGastoExtranjero(supabase, empresaId, {
      gasto,
      receiptRaw,
      fiscalDocumentId,
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

gastosRoutes.post("/ingest-email", async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.api);
  if (rateLimitResult) return rateLimitResult;

  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const body = await c.req.json<{
    from?: string;
    subject?: string;
    body_text: string;
    emit_to_sii?: boolean;
  }>();

  if (!body.body_text || body.body_text.length < 10) {
    return c.json({ code: "missing_body", message: "body_text es requerido" }, 400);
  }

  const receiptText = [body.subject, body.body_text].filter(Boolean).join("\n\n");
  const detectado = detectarProveedor(receiptText);

  try {
    let tasaCambio = 1;
    if (detectado?.moneda === "USD") tasaCambio = await fetchTasaDolar();
    else if (detectado?.moneda === "EUR") tasaCambio = await fetchTasaEuro();

    const parsed = parseReceipt(receiptText, undefined, tasaCambio);
    if (!parsed) {
      return c.json({ code: "receipt_parse_failed", message: "No se pudo parsear el email" }, 422);
    }

    const result = await processGastoExtranjero(supabase, empresaId, {
      gasto: parsed,
      receiptRaw: receiptText,
      emitToSii: body.emit_to_sii ?? false,
      syncRcv: false,
    });

    if (!result.ok) {
      return c.json({ code: result.code, message: result.message }, 400);
    }

    return c.json({ data: result }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error procesando email";
    return c.json({ code: "ingest_email_failed", message }, 500);
  }
});

gastosRoutes.post("/import-csv", async (c) => {
  const rateLimitResult = await rateLimitMiddleware(c, RATE_LIMIT_CONFIGS.api);
  if (rateLimitResult) return rateLimitResult;

  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const body = await c.req.json<{ csv_text: string; emit_to_sii?: boolean }>();
  if (!body.csv_text?.trim()) {
    return c.json({ code: "missing_csv", message: "csv_text es requerido" }, 400);
  }

  const lines = body.csv_text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 10 && !l.toLowerCase().startsWith("proveedor"));

  const results: Array<{ line: number; ok: boolean; gastoId?: string; error?: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const commaIdx = line.indexOf(",");
    let proveedorId: string | undefined;
    let receiptText = line;

    if (commaIdx > 0 && commaIdx < 40) {
      const maybeProveedor = line.slice(0, commaIdx).trim();
      if (PROVEEDORES.some((p) => p.id === maybeProveedor)) {
        proveedorId = maybeProveedor;
        receiptText = line.slice(commaIdx + 1).trim();
      }
    }

    try {
      const proveedorOverride = proveedorId
        ? PROVEEDORES.find((p) => p.id === proveedorId)
        : undefined;
      const detectado = detectarProveedor(receiptText);

      let tasaCambio = 1;
      if (detectado?.moneda === "USD" || proveedorOverride?.moneda === "USD") {
        tasaCambio = await fetchTasaDolar();
      } else if (detectado?.moneda === "EUR" || proveedorOverride?.moneda === "EUR") {
        tasaCambio = await fetchTasaEuro();
      }

      const parsed = parseReceipt(receiptText, proveedorOverride, tasaCambio);
      if (!parsed) {
        results.push({ line: i + 1, ok: false, error: "parse_failed" });
        continue;
      }

      const processed = await processGastoExtranjero(supabase, empresaId, {
        gasto: parsed,
        receiptRaw: receiptText,
        emitToSii: body.emit_to_sii ?? true,
        syncRcv: false,
      });

      if (!processed.ok) {
        results.push({ line: i + 1, ok: false, error: processed.message });
        continue;
      }

      results.push({ line: i + 1, ok: true, gastoId: processed.gastoId });
    } catch (err) {
      results.push({
        line: i + 1,
        ok: false,
        error: err instanceof Error ? err.message : "Error",
      });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  return c.json(
    {
      data: {
        total: lines.length,
        exitosos: okCount,
        fallidos: lines.length - okCount,
        results,
      },
    },
    201,
  );
});

gastosRoutes.post("/procesar/:id/reintentar", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const gastoId = c.req.param("id");

  const { data: gasto, error } = await supabase
    .from("gastos_extranjeros")
    .select("id, factura_compra_id, estado")
    .eq("id", gastoId)
    .eq("empresa_id", empresaId)
    .single();

  if (error || !gasto?.factura_compra_id) {
    return c.json({ code: "not_found", message: "Gasto sin factura de compra para reintentar" }, 404);
  }

  if (!["facturado", "rechazado_sii", "enviado_sii"].includes(gasto.estado)) {
    return c.json(
      { code: "invalid_state", message: `Estado ${gasto.estado} no admite reintento` },
      400,
    );
  }

  const jobInput = {
    empresaId,
    sourceType: "gasto_extranjero" as const,
    sourceId: gastoId,
    tipoDte: 46,
    idempotencyKey: `retry-fc46-${gasto.factura_compra_id}-${Date.now()}`,
    payload: { facturaCompraId: gasto.factura_compra_id },
  };

  let job = await enqueueSiiDocumentJob(supabase, jobInput);
  if (!job.ok) {
    job = await enqueueSiiDocumentJob(createAdminClient(), jobInput);
  }

  if (!job.ok) {
    return c.json({ code: "enqueue_failed", message: job.error }, 500);
  }

  return c.json({ data: { jobId: job.id, gastoId, facturaCompraId: gasto.factura_compra_id } }, 202);
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
