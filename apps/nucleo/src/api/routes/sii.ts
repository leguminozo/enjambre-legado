import {
  calcularIVA,
  calcularTotal,
  FacturaCompraInputSchema,
  parseReceipt,
  fetchTasaDolar,
  fetchTasaEuro,
  fetchTasaUF,
  PROVEEDORES,
  detectarProveedor,
  calcularPPM,
  calcularF29,
  calcularF22,
  buildDteXml,
  buildEnvioDteXml,
  RUT_EXTRANJERO_GENERICO,
  parsearEstadoRcv,
  type EmpresaRegimen,
  type F29Input,
  type F22Input,
  type DteDocumento,
  type RcvRegistroCompra,
  type RcvRegistroVenta,
  type RcvTipoRegistro,
  DTE_TIPO,
} from "@enjambre/contable";
import { signDteXml, stampDteXml, enviarDte, consultarEstado, getSiiToken, consultarRCV } from "@/api/lib/sii-client";
import type { GastoExtranjeroResult } from "@enjambre/contable";
import type { SupabaseClient } from "@supabase/supabase-js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware } from "@/api/lib/middleware";
import { tenantMiddleware } from "@/api/lib/middleware";

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

siiRoutes.get("/empresa", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("empresas")
    .select("id, rut, razon_social, giro, direccion, comuna, ciudad, regimen, acteco, sii_ambiente, fecha_inicio_actividades, ingresos_brutos_anio_anterior, sii_clave_encriptada")
    .eq("id", empresaId)
    .single();

  if (error || !data) {
    return c.json({ code: "empresa_not_found", message: "Empresa no encontrada" }, 404);
  }

  const row = data as Record<string, unknown>;
  const hasClave = !!row.sii_clave_encriptada;
  const { sii_clave_encriptada: _, ...rest } = row;
  return c.json({ data: { ...rest, has_clave_sii: hasClave } });
});

siiRoutes.patch("/empresa", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const body = await c.req.json<{
    regimen?: string;
    acteco?: number;
    sii_ambiente?: string;
    fecha_inicio_actividades?: string;
    ingresos_brutos_anio_anterior?: number;
  }>();

  const allowedRegimenes = ["pro_pyme_transparente", "pro_pyme_general", "semi_integrado", "general"];
  if (body.regimen && !allowedRegimenes.includes(body.regimen)) {
    return c.json({ code: "invalid_regimen", message: `Regimen debe ser uno de: ${allowedRegimenes.join(", ")}` }, 400);
  }

  const allowedAmbientes = ["certificacion", "produccion"];
  if (body.sii_ambiente && !allowedAmbientes.includes(body.sii_ambiente)) {
    return c.json({ code: "invalid_ambiente", message: "sii_ambiente debe ser 'certificacion' o 'produccion'" }, 400);
  }

  const update: Record<string, unknown> = {};
  if (body.regimen !== undefined) update.regimen = body.regimen;
  if (body.acteco !== undefined) update.acteco = body.acteco;
  if (body.sii_ambiente !== undefined) update.sii_ambiente = body.sii_ambiente;
  if (body.fecha_inicio_actividades !== undefined) update.fecha_inicio_actividades = body.fecha_inicio_actividades;
  if (body.ingresos_brutos_anio_anterior !== undefined) update.ingresos_brutos_anio_anterior = body.ingresos_brutos_anio_anterior;

  if (Object.keys(update).length === 0) {
    return c.json({ code: "no_fields", message: "No se enviaron campos para actualizar" }, 400);
  }

  const { data, error } = await supabase
    .from("empresas")
    .update(update)
    .eq("id", empresaId)
    .select("id, rut, razon_social, giro, regimen, acteco, sii_ambiente, fecha_inicio_actividades, ingresos_brutos_anio_anterior")
    .single();

  if (error) {
    return c.json({ code: "empresa_update_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

siiRoutes.put("/empresa/sii-clave", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const body = await c.req.json<{ clave: string }>();
  if (!body.clave || body.clave.length < 4) {
    return c.json({ code: "invalid_clave", message: "La clave SII debe tener al menos 4 caracteres" }, 400);
  }

  const encoder = new TextEncoder();
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const algoKey = await crypto.subtle.importKey("raw", encoder.encode(secretKey.slice(0, 32)), { name: "AES-GCM" }, false, ["encrypt"]);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, algoKey, encoder.encode(body.clave));
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  const encryptedBase64 = btoa(String.fromCharCode(...combined));

  const { error } = await supabase
    .from("empresas")
    .update({ sii_clave_encriptada: encryptedBase64 })
    .eq("id", empresaId);

  if (error) {
    return c.json({ code: "clave_save_failed", message: error.message }, 500);
  }

  return c.json({ data: { saved: true } });
});

siiRoutes.delete("/empresa/sii-clave", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const { error } = await supabase
    .from("empresas")
    .update({ sii_clave_encriptada: null })
    .eq("id", empresaId);

  if (error) {
    return c.json({ code: "clave_delete_failed", message: error.message }, 500);
  }

  return c.json({ data: { deleted: true } });
});

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

  return c.json({ data   });
});

siiRoutes.get("/f29/:anio/:mes", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const anio = Number(c.req.param("anio"));
  const mes = Number(c.req.param("mes"));

  if (anio < 2000 || mes < 1 || mes > 12) {
    return c.json({ code: "invalid_period", message: "Anio o mes invalido" }, 400);
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("regimen, fecha_inicio_actividades, ingresos_brutos_anio_anterior")
    .eq("id", empresaId)
    .single();

  if (!empresa) {
    return c.json({ code: "empresa_not_found", message: "Empresa no encontrada" }, 404);
  }

  const { data: periodo } = await supabase
    .from("periodos_contables")
    .select("id, remanente_cf_anterior")
    .eq("empresa_id", empresaId)
    .eq("anio", anio)
    .eq("mes", mes)
    .maybeSingle();

  const [facturasRes, gastosRes, honorariosRes, gastosDigitalesRes] = await Promise.all([
    supabase
      .from("facturas_emitidas")
      .select("monto_neto, monto_iva, monto_total, tipo_documento")
      .eq("empresa_id", empresaId)
      .eq("periodo_id", periodo?.id ?? ""),
    supabase
      .from("gastos")
      .select("monto_iva")
      .eq("empresa_id", empresaId)
      .eq("periodo_id", periodo?.id ?? ""),
    supabase
      .from("honorarios")
      .select("monto_retencion")
      .eq("empresa_id", empresaId)
      .eq("periodo_id", periodo?.id ?? ""),
    supabase
      .from("facturas_compra")
      .select("monto_iva")
      .eq("empresa_id", empresaId)
      .eq("estado_sii", "aceptado")
      .eq("source_type", "manual")
      .gte("fecha_emision", `${anio}-${String(mes).padStart(2, "0")}-01`)
      .lt("fecha_emision", `${anio}-${String(mes + 1).padStart(2, "0")}-01`),
  ]);

  const facturas = (facturasRes.data ?? []) as Record<string, unknown>[];
  const gastos = (gastosRes.data ?? []) as Record<string, unknown>[];
  const honorarios = (honorariosRes.data ?? []) as Record<string, unknown>[];

  const debitoFacturas = facturas
    .filter((f) => String(f.tipo_documento ?? "Factura") === "Factura")
    .reduce((a, f) => a + Number(f.monto_iva ?? 0), 0);
  const debitoBoletas = facturas
    .filter((f) => ["Boleta", "Boleta Exenta"].includes(String(f.tipo_documento ?? "")))
    .reduce((a, f) => a + Number(f.monto_iva ?? 0), 0);
  const creditoCompras = gastos.reduce((a, g) => a + Number(g.monto_iva ?? 0), 0);
  const creditoDigital = (gastosDigitalesRes.data ?? []).reduce((a, g) => a + Number(g.monto_iva ?? 0), 0);
  const retencionHonorarios = honorarios.reduce((a, h) => a + Number(h.monto_retencion ?? 0), 0);
  const ingresosBrutos = facturas.reduce((a, f) => a + Number(f.monto_total ?? 0), 0);

  const empresaRegimen: EmpresaRegimen = {
    regimen: (empresa as Record<string, unknown>).regimen as EmpresaRegimen["regimen"] ?? "pro_pyme_transparente",
    fechaInicioActividades: (empresa as Record<string, unknown>).fecha_inicio_actividades as string ?? null,
    ingresosBrutosAnioAnterior: Number((empresa as Record<string, unknown>).ingresos_brutos_anio_anterior ?? 0),
  };

  let valorUF = 40766;
  try {
    valorUF = await fetchTasaUF();
  } catch { /* fallback hardcoded */ }

  const ppmResult = calcularPPM(empresaRegimen, ingresosBrutos, valorUF);

  const f29Input: F29Input = {
    debitoFacturas,
    debitoBoletasAfectas: debitoBoletas,
    debitoNotasDebito: 0,
    creditoFacturasNacionales: creditoCompras,
    creditoFacturaCompraDigital: creditoDigital,
    remanenteCFAnteriorReajustado: Number((periodo as Record<string, unknown>)?.remanente_cf_anterior ?? 0),
    retencionHonorarios,
    ppmBase: ppmResult.baseCalculo,
    ppmTasa: ppmResult.tasa,
    ppmMonto: ppmResult.monto,
  };

  const f29 = calcularF29(f29Input);

  return c.json({ data: f29 });
});

siiRoutes.post("/f29/:anio/:mes/guardar", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const anio = Number(c.req.param("anio"));
  const mes = Number(c.req.param("mes"));

  if (anio < 2000 || mes < 1 || mes > 12) {
    return c.json({ code: "invalid_period", message: "Anio o mes invalido" }, 400);
  }

  const { data: periodo } = await supabase
    .from("periodos_contables")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("anio", anio)
    .eq("mes", mes)
    .maybeSingle();

  if (!periodo) {
    return c.json({ code: "no_periodo", message: "No existe periodo contable para ese anio/mes" }, 404);
  }

  const periodoId = (periodo as Record<string, unknown>).id as string;

  const { data: existing } = await supabase
    .from("declaraciones_f29")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("anio", anio)
    .eq("mes", mes)
    .maybeSingle();

  if (existing) {
    const { error: delError } = await supabase
      .from("declaraciones_f29")
      .delete()
      .eq("id", (existing as Record<string, unknown>).id);
    if (delError) {
      return c.json({ code: "f29_delete_failed", message: delError.message }, 500);
    }
  }

  const f29Data = await (async () => {
    const f29Res = await fetch(`${new URL(c.req.url).origin}/api/sii/f29/${anio}/${mes}`, {
      headers: { Authorization: c.req.header("Authorization") ?? "" },
    });
    if (!f29Res.ok) throw new Error("Error calculando F29");
    const json = await f29Res.json();
    return json.data as Record<string, unknown>;
  })();

  const { data, error } = await supabase
    .from("declaraciones_f29")
    .insert({
      empresa_id: empresaId,
      periodo_id: periodoId,
      anio,
      mes,
      lineas: f29Data,
      iva_pagar: Number(f29Data.ivaPagar ?? 0),
      remanente_proximo_periodo: Number(f29Data.remanenteCFSiguiente ?? 0),
      ppm_determinado: Number(f29Data.ppmMonto ?? 0),
      total_pagar: Number(f29Data.ivaPagar ?? 0) + Number(f29Data.ppmMonto ?? 0),
      estado: "borrador",
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "f29_save_failed", message: error.message }, 500);
  }

  return c.json({ data }, 201);
});

siiRoutes.get("/f22/:anio", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const anio = Number(c.req.param("anio"));

  if (anio < 2000) {
    return c.json({ code: "invalid_anio", message: "Anio invalido" }, 400);
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("regimen, fecha_inicio_actividades, ingresos_brutos_anio_anterior")
    .eq("id", empresaId)
    .single();

  if (!empresa) {
    return c.json({ code: "empresa_not_found", message: "Empresa no encontrada" }, 404);
  }

  const { data: periodos } = await supabase
    .from("periodos_contables")
    .select("id, anio, mes")
    .eq("empresa_id", empresaId)
    .eq("anio", anio);

  if (!periodos || periodos.length === 0) {
    return c.json({ code: "no_data", message: `No hay periodos contables para ${anio}` }, 404);
  }

  const periodoIds = periodos.map((p: Record<string, unknown>) => String(p.id));

  const [facturasRes, honorariosRes, ppmRes] = await Promise.all([
    supabase
      .from("facturas_emitidas")
      .select("monto_neto, monto_iva, monto_total")
      .eq("empresa_id", empresaId)
      .in("periodo_id", periodoIds),
    supabase
      .from("honorarios")
      .select("monto_retencion")
      .eq("empresa_id", empresaId)
      .in("periodo_id", periodoIds),
    supabase
      .from("declaraciones_f29")
      .select("ppm_monto, iva_pagar")
      .eq("empresa_id", empresaId)
      .eq("anio", anio),
  ]);

  const facturas = (facturasRes.data ?? []) as Record<string, unknown>[];
  const honorarios = (honorariosRes.data ?? []) as Record<string, unknown>[];
  const ppmRows = (ppmRes.data ?? []) as Record<string, unknown>[];

  const baseImponible = facturas.reduce((a, f) => a + Number(f.monto_total ?? 0), 0);
  const ivaDebito = facturas.reduce((a, f) => a + Number(f.monto_iva ?? 0), 0);
  const retencionesTotal = honorarios.reduce((a, h) => a + Number(h.monto_retencion ?? 0), 0);
  const ppmTotalPagado = ppmRows.reduce((a, p) => a + Number(p.ppm_monto ?? 0), 0);

  const empresaRegimen = (empresa as Record<string, unknown>).regimen as import("@enjambre/contable").RegimenTributario ?? "pro_pyme_transparente";

  const f22Input: F22Input = {
    anioComercial: anio,
    regimen: empresaRegimen,
    baseImponibleTransparente: baseImponible,
    idpcPagada: 0,
    ppmTotalPagado,
    retencionesHonorariosTotal: retencionesTotal,
    ivaDebitoAnual: ivaDebito,
    ivaCreditoAnual: 0,
  };

  const f22 = calcularF22(f22Input);

  return c.json({ data: f22 });
});

siiRoutes.get("/honorarios", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const periodoId = c.req.query("periodoId");

  let query = supabase
    .from("honorarios")
    .select("*, tercero:terceros(id, nombre, rut)")
    .eq("empresa_id", empresaId)
    .order("fecha", { ascending: false });

  if (periodoId) {
    query = query.eq("periodo_id", periodoId);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "honorarios_query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

siiRoutes.post("/honorarios", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const body = await c.req.json<{
    fecha: string;
    monto_bruto: number;
    tercero_id?: string;
    numero_bhe?: string;
    descripcion: string;
    tasa_retencion?: number;
  }>();

  if (!body.fecha || !body.monto_bruto || !body.descripcion) {
    return c.json({ code: "validation_error", message: "fecha, monto_bruto y descripcion son requeridos" }, 400);
  }

  const tasa = body.tasa_retencion ?? 0.1525;
  const montoRetencion = Math.round(body.monto_bruto * tasa);

  const fechaDate = new Date(body.fecha);
  const mes = fechaDate.getMonth() + 1;
  const anio = fechaDate.getFullYear();

  let { data: periodo } = await supabase
    .from("periodos_contables")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("mes", mes)
    .eq("anio", anio)
    .maybeSingle();

  if (!periodo) {
    const { data: newPeriodo } = await supabase
      .from("periodos_contables")
      .insert({ empresa_id: empresaId, mes, anio, estado: "abierto" })
      .select("id")
      .single();
    periodo = newPeriodo;
  }

  const { data, error } = await supabase
    .from("honorarios")
    .insert({
      empresa_id: empresaId,
      tercero_id: body.tercero_id ?? null,
      periodo_id: periodo?.id ?? null,
      fecha: body.fecha,
      monto_bruto: body.monto_bruto,
      monto_retencion: montoRetencion,
      tasa_retencion: tasa,
      numero_bhe: body.numero_bhe ?? null,
      descripcion: body.descripcion,
      estado: "pendiente",
    })
    .select("*, tercero:terceros(id, nombre, rut)")
    .single();

  if (error) {
    return c.json({ code: "honorario_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
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
      if (moneda === "uf") {
        const valor = await fetchTasaUF();
        return c.json({ data: { moneda: "UF", valor, fecha: new Date().toISOString().slice(0, 10) } });
      }
      return c.json({ code: "unsupported_currency", message: "Moneda no soportada. Usa: dolar, euro, uf" }, 400);
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

siiRoutes.post("/facturas-compra/:id/enviar-sii", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const facturaId = c.req.param("id");

  const { data: factura, error: facturaError } = await supabase
    .from("facturas_compra")
    .select("*")
    .eq("id", facturaId)
    .eq("empresa_id", empresaId)
    .single();

  if (facturaError || !factura) {
    return c.json({ code: "not_found", message: "Factura de compra no encontrada" }, 404);
  }

  if ((factura as Record<string, unknown>).estado_sii !== "pendiente") {
    return c.json({ code: "invalid_state", message: "La factura ya fue enviada al SII" }, 400);
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("rut, razon_social, giro, direccion, comuna, ciudad, acteco, sii_ambiente")
    .eq("id", empresaId)
    .single();

  if (!empresa) {
    return c.json({ code: "empresa_not_found", message: "Empresa no encontrada" }, 404);
  }

  const { data: cafRows } = await supabase
    .from("sii_caf")
    .select("id, tipo_dte, folio_desde, folio_hasta, folio_actual, fecha_autorizacion, firma_caf, private_key, public_key, nro_resol, fch_resol")
    .eq("empresa_id", empresaId)
    .eq("tipo_dte", 46)
    .eq("activo", true)
    .limit(1);

  if (!cafRows || cafRows.length === 0) {
    return c.json({ code: "no_caf", message: "No hay CAF activo para DTE 46" }, 400);
  }

  const caf = cafRows[0] as Record<string, unknown>;
  const emisor = empresa as Record<string, unknown>;

  const dteDoc: DteDocumento = {
    encabezado: {
      tipoDte: DTE_TIPO.FACTURA_COMPRA,
      folio: Number((factura as Record<string, unknown>).folio),
      fechaEmision: String((factura as Record<string, unknown>).fecha_emision),
      emisor: {
        rut: String(emisor.rut),
        razonSocial: String(emisor.razon_social),
        giro: String(emisor.giro ?? ""),
        direccion: String(emisor.direccion ?? ""),
        comuna: String(emisor.comuna ?? ""),
        ciudad: String(emisor.ciudad ?? ""),
        actividadEconomica: Number(emisor.acteco ?? 0),
      },
      receptor: {
        rut: RUT_EXTRANJERO_GENERICO,
        razonSocial: String((factura as Record<string, unknown>).receptor_razon_social ?? "PROVEEDOR EXTRANJERO"),
        giro: String((factura as Record<string, unknown>).receptor_giro ?? ""),
        direccion: "",
        comuna: "",
        ciudad: "",
      },
      montoNeto: Number((factura as Record<string, unknown>).monto_neto ?? 0),
      montoExento: Number((factura as Record<string, unknown>).monto_exento ?? 0),
      tasaIva: 0.19,
      montoIva: Number((factura as Record<string, unknown>).monto_iva ?? 0),
      montoTotal: Number((factura as Record<string, unknown>).monto_total ?? 0),
    },
    detalles: [{
      nombre: String((factura as Record<string, unknown>).descripcion ?? "SERVICIOS DIGITALES EXTRANJEROS"),
      cantidad: 1,
      precioUnitario: Number((factura as Record<string, unknown>).monto_neto ?? 0),
      montoItem: Number((factura as Record<string, unknown>).monto_total ?? 0),
    }],
  };

  try {
    const dteXml = buildDteXml(dteDoc);

    const { data: certRows } = await supabase
      .from("sii_certificados")
      .select("storage_path")
      .eq("empresa_id", empresaId)
      .eq("activo", true)
      .limit(1);

    const p12Base64 = process.env.SII_P12_BASE64 ?? "";
    const p12Password = process.env.SII_P12_PASSWORD ?? "";

    if (!p12Base64 || !p12Password) {
      return c.json({
        code: "no_certificado",
        message: "No hay certificado digital configurado. Configure SII_P12_BASE64 y SII_P12_PASSWORD.",
        xml: dteXml,
      }, 400);
    }

    const signedXml = signDteXml(dteXml, p12Base64, p12Password);

    const cafFolio: import("@enjambre/contable").CafFolio = {
      tipoDte: DTE_TIPO.FACTURA_COMPRA,
      desde: Number(caf.folio_desde),
      hasta: Number(caf.folio_hasta),
      fechaAutorizacion: String(caf.fecha_autorizacion),
      firma: String(caf.firma_caf),
      privateKey: String(caf.private_key),
      publicKey: String(caf.public_key),
    };

    const stampedXml = stampDteXml(signedXml, cafFolio, Number((factura as Record<string, unknown>).folio));

    const envioXml = buildEnvioDteXml(
      [stampedXml],
      String(emisor.rut),
      Number(caf.nro_resol ?? 0),
      String(caf.fch_resol ?? "2024-01-01"),
    );

    const ambienteRaw = String(emisor.sii_ambiente ?? "certificacion");
    const ambiente = (ambienteRaw.toUpperCase() === "PRODUCCION" ? "PRODUCCION" : "CERTIFICACION") as import("@enjambre/contable").SiiEnvironment;
    const token = await getSiiToken(ambiente, String(emisor.rut), p12Password);

    const envioResult = await enviarDte(ambiente, token.token, envioXml, String(emisor.rut));

    await supabase
      .from("facturas_compra")
      .update({
        estado_sii: envioResult.estado === "aceptado" ? "aceptado" : envioResult.estado === "rechazado" ? "rechazado" : "enviado",
        track_id: envioResult.trackId,
        sii_response: { estado: envioResult.estado, glosa: envioResult.glosa },
        sii_xml: stampedXml,
      })
      .eq("id", facturaId);

    return c.json({ data: { trackId: envioResult.trackId, estado: envioResult.estado, glosa: envioResult.glosa } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error enviando DTE al SII";
    return c.json({ code: "sii_send_failed", message }, 500);
  }
});

siiRoutes.get("/facturas-compra/:id/poll-sii", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const facturaId = c.req.param("id");

  const { data: factura } = await supabase
    .from("facturas_compra")
    .select("id, track_id, estado_sii, empresa_id")
    .eq("id", facturaId)
    .eq("empresa_id", empresaId)
    .single();

  if (!factura) {
    return c.json({ code: "not_found", message: "Factura de compra no encontrada" }, 404);
  }

  const f = factura as Record<string, unknown>;
  if (!f.track_id) {
    return c.json({ code: "no_track_id", message: "La factura no tiene track_id" }, 400);
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("rut, sii_ambiente")
    .eq("id", empresaId)
    .single();

  if (!empresa) {
    return c.json({ code: "empresa_not_found" }, 404);
  }

  const emisor = empresa as Record<string, unknown>;
  const p12Password = process.env.SII_P12_PASSWORD ?? "";
  const ambienteRaw = String(emisor.sii_ambiente ?? "certificacion");
  const ambiente = (ambienteRaw.toUpperCase() === "PRODUCCION" ? "PRODUCCION" : "CERTIFICACION") as import("@enjambre/contable").SiiEnvironment;

  try {
    const token = await getSiiToken(ambiente, String(emisor.rut), p12Password);
    const estadoResult = await consultarEstado(ambiente, token.token, String(f.track_id), String(emisor.rut));

    const nuevoEstado = estadoResult.aceptados > 0 ? "aceptado" :
      estadoResult.rechazados > 0 ? "rechazado" : String(f.estado_sii);

    await supabase
      .from("facturas_compra")
      .update({
        estado_sii: nuevoEstado,
        sii_response: {
          estado: estadoResult.estado,
          glosa: estadoResult.glosa,
          aceptados: estadoResult.aceptados,
          rechazados: estadoResult.rechazados,
          reparos: estadoResult.reparos,
        },
      })
      .eq("id", facturaId);

    return c.json({ data: estadoResult });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error consultando estado SII";
    return c.json({ code: "sii_poll_failed", message }, 500);
  }
});

siiRoutes.get("/rcv/:periodo", async (c) => {
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

siiRoutes.post("/rcv/:periodo/sync", async (c) => {
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

async function createFacturaCompraFromGasto(
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
