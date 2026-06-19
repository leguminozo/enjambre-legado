import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  calcularIVA,
  calcularTotal,
  FacturaCompraInputSchema,
  parseReceipt,
  fetchTasaDolar,
  DTE_TIPO,
  RUT_EXTRANJERO_GENERICO,
  buildDteXml,
  buildEnvioDteXml,
} from "@enjambre/contable";
import {
  signDteXml,
  stampDteXml,
  enviarDte,
  consultarEstado,
  getSiiToken,
} from "@/api/lib/sii-client";
import { resolveSiiAmbiente, resolveSiiCredentials } from "@/api/lib/sii-credentials";
import type { AppVariables } from "@/api/lib/middleware";
import type { DteDocumento } from "@enjambre/contable";
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

    const credsResult = await resolveSiiCredentials(supabase, empresaId);
    if (!credsResult.ok) {
      return c.json({
        code: credsResult.code,
        message: credsResult.message,
        xml: dteXml,
      }, credsResult.code === "no_certificado" ? 400 : 500);
    }
    const { p12Base64, p12Password } = credsResult.credentials;

    const signedXml = signDteXml(dteXml, p12Base64, p12Password);

    const cafFolio = {
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

    const ambiente = resolveSiiAmbiente(String(emisor.sii_ambiente ?? "certificacion")) as import("@enjambre/contable").SiiEnvironment;
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

facturasRoutes.get("/:id/poll-sii", async (c) => {
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
