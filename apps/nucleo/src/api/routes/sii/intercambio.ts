import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { buildRespuestaDteXml } from "@enjambre/contable";
import type { AppVariables } from "@/api/lib/middleware";
import { resolveSiiAmbiente, resolveSiiCredentials } from "@/api/lib/sii-credentials";
import { signNode } from "@/api/lib/sii-client";
import { fromLoose } from "@/api/lib/supabase-loose";

/**
 * Intercambio de información (etapa 3 de certificación): mensaje de
 * respuesta a DTE recibidos — acuse de recibo (RecepciónEnvio) o resultado
 * de revisión (ResultadoDTE), firmado con el certificado digital. El archivo
 * se envía por correo al emisor o a SII_dte_intercambio@sii.cl (el envío del
 * correo queda fuera de esta ruta).
 */

export const intercambioRoutes = new Hono<{ Variables: AppVariables }>();

const DocumentoRecepcionSchema = z.object({
  tipo_documento: z.number(),
  folio: z.number(),
  fecha_emision: z.string(),
  rut_emisor: z.string(),
  rut_receptor: z.string(),
  monto_total: z.number(),
  estado_recepcion_doc: z.number(),
  glosa_observacion: z.string(),
});

const RecepcionEnvioSchema = z.object({
  nombre_archivo: z.string(),
  fecha_recepcion: z.string(),
  codigo_envio: z.number(),
  id_envio: z.string(),
  digest_envio: z.string().optional(),
  rut_emisor: z.string(),
  rut_receptor: z.string(),
  estado_recepcion_envio: z.number(),
  glosa_estado_recepcion_envio: z.string(),
  documentos: z.array(DocumentoRecepcionSchema).optional(),
});

const ResultadoDteSchema = z.object({
  tipo_dte: z.number(),
  folio: z.number(),
  fecha_emision: z.string(),
  rut_emisor: z.string(),
  rut_receptor: z.string(),
  monto_total: z.number(),
  codigo_envio: z.string(),
  estado: z.number(),
  glosa: z.string(),
  codigo_motivo: z.number().optional(),
});

/** Construye y firma el mensaje de respuesta (excluyente: recepciones o resultados). */
intercambioRoutes.post(
  "/respuesta",
  zValidator(
    "json",
    z.object({
      rut_recibe: z.string(),
      nro_respuesta: z.number().optional(),
      contacto: z.string().optional(),
      telefono: z.string().optional(),
      correo: z.string().optional(),
      recepciones: z.array(RecepcionEnvioSchema).optional(),
      resultados: z.array(ResultadoDteSchema).optional(),
    }),
  ),
  async (c) => {
    const input = c.req.valid("json");
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");

    try {
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresas")
        .select("rut, sii_ambiente")
        .eq("id", empresaId)
        .single();
      if (empresaError || !empresaData) {
        return c.json({ code: "empresa_not_found", message: "Empresa no encontrada" }, 404);
      }

      const credsResult = await resolveSiiCredentials(supabase, empresaId);
      if (!credsResult.ok) {
        return c.json({ code: credsResult.code, message: credsResult.message }, 400);
      }

      const xmlSinFirmar = buildRespuestaDteXml(
        {
          rutResponde: empresaData.rut,
          rutRecibe: input.rut_recibe,
          nroRespuesta: input.nro_respuesta ?? Date.now() % 100000,
          contacto: input.contacto,
          telefono: input.telefono,
          correo: input.correo,
        },
        {
          recepciones: input.recepciones?.map((r) => ({
            nombreArchivo: r.nombre_archivo,
            fechaRecepcion: r.fecha_recepcion,
            codigoEnvio: r.codigo_envio,
            idEnvio: r.id_envio,
            digestEnvio: r.digest_envio,
            rutEmisor: r.rut_emisor,
            rutReceptor: r.rut_receptor,
            estadoRecepcionEnvio: r.estado_recepcion_envio,
            glosaEstadoRecepcionEnvio: r.glosa_estado_recepcion_envio,
            documentos: r.documentos?.map((d) => ({
              tipoDocumento: d.tipo_documento,
              folio: d.folio,
              fechaEmision: d.fecha_emision,
              rutEmisor: d.rut_emisor,
              rutReceptor: d.rut_receptor,
              montoTotal: d.monto_total,
              estadoRecepcionDoc: d.estado_recepcion_doc,
              glosaObservacion: d.glosa_observacion,
            })),
          })),
          resultados: input.resultados?.map((r) => ({
            tipoDte: r.tipo_dte,
            folio: r.folio,
            fechaEmision: r.fecha_emision,
            rutEmisor: r.rut_emisor,
            rutReceptor: r.rut_receptor,
            montoTotal: r.monto_total,
            codigoEnvio: r.codigo_envio,
            estado: r.estado,
            glosa: r.glosa,
            codigoMotivo: r.codigo_motivo,
          })),
        },
      );

      const xmlFirmado = signNode(xmlSinFirmar, "RespuestaDTE", credsResult.credentials.p12Base64, credsResult.credentials.p12Password);

      // Persistir (tabla sii_respuestas_intercambio, typegen pendiente)
      const tipo = input.recepciones && input.recepciones.length > 0 ? "recepcion" : "resultado";
      const { data: registro, error: insertError } = await fromLoose(supabase, "sii_respuestas_intercambio")
        .insert({
          empresa_id: empresaId,
          rut_responde: empresaData.rut,
          rut_recibe: input.rut_recibe,
          nro_respuesta: input.nro_respuesta ?? Date.now() % 100000,
          tipo,
          xml: xmlFirmado,
        })
        .select("id")
        .single();
      if (insertError) {
        console.error("[SII Intercambio] no se pudo persistir la respuesta", insertError.message);
      }

      return c.json({
        success: true,
        data: { id: registro?.id ?? null, tipo, xml: xmlFirmado },
      }, 201);
    } catch (error) {
      console.error("[SII Intercambio] Error:", error, { empresaId });
      return c.json({ code: "intercambio_failed", message: error instanceof Error ? error.message : "Error al generar la respuesta" }, 500);
    }
  },
);

/** Lista las respuestas de intercambio persistidas de la empresa. */
intercambioRoutes.get("/respuestas", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  try {
    const { data, error } = await fromLoose(supabase, "sii_respuestas_intercambio")
      .select("id, rut_responde, rut_recibe, nro_respuesta, tipo, created_at")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return c.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("[SII Intercambio list] Error:", error);
    return c.json({ code: "intercambio_list_failed", message: error instanceof Error ? error.message : "Error al listar respuestas" }, 500);
  }
});

// Named export only, no default export
