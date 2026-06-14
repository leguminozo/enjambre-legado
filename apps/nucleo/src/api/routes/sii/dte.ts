import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { 
  calcularIVA, 
  calcularTotal,
  DTE_TIPO,
  buildDteXml,
  buildEnvioDteXml,
  formatDateSii,
  formatRutSii,
  escapeXml,
  type DteTipo
} from "@enjambre/contable";
import {
  signDteXml,
  stampDteXml,
  enviarDte,
  consultarEstado,
  getSiiToken,
} from "@/api/lib/sii-client";
import type { AppVariables } from "@/api/lib/middleware";
import { createClient } from "@supabase/supabase-js";

const DteDetalleSchema = z.object({
  nombre: z.string(),
  cantidad: z.number().positive(),
  precio_unitario: z.number().nonnegative(),
  codigo: z.string().optional(),
  unidad_medida: z.string().optional(),
  dimenciones: z.string().optional(),
});

// Esquemas de validación para diferentes tipos de DTE
const DteBaseSchema = z.object({
  tipo_dte: z.union([
    z.literal(33),
    z.literal(34),
    z.literal(39),
    z.literal(41),
    z.literal(46),
    z.literal(52),
    z.literal(56),
    z.literal(61),
    z.literal(66),
  ]),
  fecha_emision: z.string().datetime(),
  monto_neto: z.number().nonnegative(),
  monto_exento: z.number().nonnegative().default(0),
  descripcion: z.string().optional(),
  receptor_rut: z.string(),
  receptor_razon_social: z.string(),
  receptor_giro: z.string().optional(),
  receptor_direccion: z.string().optional(),
  receptor_comuna: z.string().optional(),
  receptor_ciudad: z.string().optional(),
  detalles: z.array(DteDetalleSchema).optional(),
  tercero_id: z.string().uuid().optional(),
});

// Esquema para facturas (con detalles)
const FacturaSchema = DteBaseSchema.extend({
  detalles: z.array(DteDetalleSchema).min(1),
});

// Esquema para boletas (sin detalles, monto total directo)
const BoletaSchema = DteBaseSchema.extend({
  monto_total: z.number().nonnegative(),
});

// Esquema para guías de despacho
const GuiaSchema = DteBaseSchema.extend({
  destino_direccion: z.string(),
  destino_comuna: z.string(),
  destino_ciudad: z.string(),
  motivo_traslado: z.string(),
  detalles: z.array(
    DteDetalleSchema.extend({
      unidad_medida: z.string().default("UNIT"),
    })
  ).min(1),
});

// Esquema para notas de crédito/débito
const NotaSchema = DteBaseSchema.extend({
  // Referencia al documento original
  tipo_documento_referencia: z.union([
    z.literal(33),
    z.literal(34),
    z.literal(39),
    z.literal(41),
  ]),
  folio_referencia: z.number().positive(),
  fecha_referencia: z.string().datetime(),
  razon: z.string(), // Razón de la nota
});

// Union de todos los esquemas
const DteUnionSchema = z.discriminatedUnion("tipo_dte", [
  FacturaSchema.extend({ tipo_dte: z.literal(33) }), // Factura electrónica
  FacturaSchema.extend({ tipo_dte: z.literal(34) }), // Factura exenta
  BoletaSchema.extend({ tipo_dte: z.literal(39) }), // Boleta electrónica
  BoletaSchema.extend({ tipo_dte: z.literal(41) }), // Boleta exenta
  FacturaSchema.extend({ tipo_dte: z.literal(46) }), // Factura de compra
  GuiaSchema.extend({ tipo_dte: z.literal(52) }),   // Guía de despacho
  NotaSchema.extend({ tipo_dte: z.literal(56) }),   // Nota de débito
  NotaSchema.extend({ tipo_dte: z.literal(61) }),   // Nota de crédito
  FacturaSchema.extend({ tipo_dte: z.literal(66) }), // Boleta de honorarios
]);

export const dteRoutes = new Hono<{ Variables: AppVariables }>();

/**
 * Emitir DTE al SII
 * Soporta todos los tipos de documentos electrónicos
 */
dteRoutes.post(
  "/emitir",
  zValidator("json", DteUnionSchema),
  async (c) => {
    try {
      const input = c.req.valid("json");
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      // 1. Obtener datos de la empresa
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresas")
        .select("rut, razon_social, giro, direccion, comuna, ciudad, actividad_economica, sii_ambiente")
        .eq("id", empresaId)
        .single();

      if (empresaError || !empresaData) {
        return c.json({ code: "empresa_not_found", message: "Empresa no encontrada" }, 404);
      }

      const empresa = empresaData as {
        rut: string;
        razon_social: string;
        giro: string | null;
        direccion: string | null;
        comuna: string | null;
        ciudad: string | null;
        actividad_economica: number | null;
        sii_ambiente: string;
      };

      // 2. Obtener CAF activo para el tipo de DTE
      const { data: cafData, error: cafError } = await supabase
        .from("sii_caf")
        .select("id, tipo_dte, folio_desde, folio_hasta, folio_actual, fecha_autorizacion, firma_caf, private_key, public_key, nro_resol, fch_resol")
        .eq("empresa_id", empresaId)
        .eq("tipo_dte", input.tipo_dte)
        .eq("activo", true)
        .single();

      if (cafError || !cafData) {
        console.error('[SII DTE] No CAF activo', { empresaId, tipo_dte: input.tipo_dte, cafError });
        return c.json({ 
          code: "no_caf_activo", 
          message: `No hay CAF activo para tipo DTE ${input.tipo_dte}. Solicite uno al SII.` 
        }, 400);
      }

      const caf = cafData as {
        id: string;
        tipo_dte: number;
        folio_desde: number;
        folio_hasta: number;
        folio_actual: number;
        fecha_autorizacion: string;
        firma_caf: string;
        private_key: string;
        public_key: string;
        nro_resol: number | null;
        fch_resol: string;
      };

      // 3. Obtener certificado digital de la empresa
      const { data: certData, error: certError } = await supabase
        .from("sii_certificados")
        .select("storage_path, nombre")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .single();

      if (certError || !certData) {
        console.error('[SII DTE] No certificado digital activo', { empresaId, certError });
        return c.json({ 
          code: "no_certificado_digital", 
          message: "No hay certificado digital activo para la empresa. Configure uno en SII Certificados." 
        }, 400);
      }

      // 4. Leer el certificado P12 desde storage
      let p12Base64 = "";
      if (certData?.storage_path) {
        try {
          const { data: fileData, error: downloadError } = await supabase
            .storage
            .from("sii-certificados")
            .download(certData.storage_path);

          if (!downloadError && fileData) {
            const buffer = await fileData.arrayBuffer();
            p12Base64 = Buffer.from(buffer).toString("base64");
          } else if (downloadError) {
            console.warn("[SII DTE Emisión] Fallo descarga de storage, usando fallback:", downloadError.message);
          }
        } catch (storageErr) {
          console.warn("[SII DTE Emisión] Error leyendo certificado de storage:", storageErr);
        }
      }

      if (!p12Base64) {
        p12Base64 = process.env.SII_P12_BASE64 ?? "";
      }
      const p12Password = process.env.SII_P12_PASSWORD ?? "";

      if (!p12Base64 || !p12Password) {
        return c.json({ 
          code: "no_credenciales_sii", 
          message: "Credenciales SII no configuradas. Suba un certificado a Supabase Storage o defina SII_P12_BASE64 y SII_P12_PASSWORD en variables de entorno." 
        }, 500);
      }

      // 5. Construir el documento DTE según el tipo
      let dteDoc: any;
      let montoIva: number = 0;
      let montoTotal: number = 0;

      // Calcular IVA si corresponde (solo para tipos afectos)
      const esAfecto = ![34, 41].includes(input.tipo_dte); // Exentas no tienen IVA
      if (esAfecto) {
        montoIva = calcularIVA(input.monto_neto);
      }

      switch (input.tipo_dte) {
        case 33: // Factura electrónica
        case 34: // Factura exenta
        case 46: // Factura de compra
        case 61: // Nota de crédito
        case 56: // Nota de débito
        case 66: // Boleta de honorarios
          {
            montoTotal = input.monto_neto + montoIva + (input.monto_exento ?? 0);
            
            dteDoc = {
              encabezado: {
                tipoDte: input.tipo_dte,
                folio: caf.folio_actual, // Usaremos el folio actual y luego lo incrementaremos
                fechaEmision: formatDateSii(input.fecha_emision),
                emisor: {
                  rut: formatRutSii(empresa.rut),
                  razonSocial: empresa.razon_social ?? "",
                  giro: empresa.giro ?? "",
                  direccion: empresa.direccion ?? "",
                  comuna: empresa.comuna ?? "",
                  ciudad: empresa.ciudad ?? "",
                  actividadEconomica: empresa.actividad_economica ?? 0,
                },
                receptor: {
                  rut: formatRutSii(input.receptor_rut),
                  razonSocial: input.receptor_razon_social,
                  giro: input.receptor_giro ?? "",
                  direccion: input.receptor_direccion ?? "",
                  comuna: input.receptor_comuna ?? "",
                  ciudad: input.receptor_ciudad ?? "",
                },
                montoNeto: input.monto_neto,
                montoExento: input.monto_exento ?? 0,
                tasaIva: esAfecto ? 0.19 : 0,
                montoIva: montoIva,
                montoTotal: montoTotal,
              },
              detalles: input.detalles?.map((det, index) => ({
                nombre: det.nombre,
                cantidad: det.cantidad,
                precioUnitario: det.precio_unitario,
                montoItem: Math.round(det.cantidad * det.precio_unitario),
              })) || [],
            };
            break;
          }
        case 39: // Boleta electrónica
        case 41: // Boleta exenta
          {
            // Para boletas, el monto total viene directo
            montoTotal = input.monto_total ?? (input.monto_neto + montoIva + (input.monto_exento ?? 0));
            
            dteDoc = {
              encabezado: {
                tipoDte: input.tipo_dte,
                folio: caf.folio_actual,
                fechaEmision: formatDateSii(input.fecha_emision),
                emisor: {
                  rut: formatRutSii(empresa.rut),
                  razonSocial: empresa.razon_social ?? "",
                  giro: empresa.giro ?? "",
                  direccion: empresa.direccion ?? "",
                  comuna: empresa.comuna ?? "",
                  ciudad: empresa.ciudad ?? "",
                  actividadEconomica: empresa.actividad_economica ?? 0,
                },
                receptor: {
                  rut: formatRutSii(input.receptor_rut),
                  razonSocial: input.receptor_razon_social,
                  giro: input.receptor_giro ?? "",
                  direccion: input.receptor_direccion ?? "",
                  comuna: input.receptor_comuna ?? "",
                  ciudad: input.receptor_ciudad ?? "",
                },
                montoNeto: input.monto_neto,
                montoExento: input.monto_exento ?? 0,
                tasaIva: esAfecto ? 0.19 : 0,
                montoIva: montoIva,
                montoTotal: montoTotal,
              },
              // Las boletas pueden no tener detalles o tener un solo detalle
              detalles: input.detalles ? 
                input.detalles.map((det, index) => ({
                  nombre: det.nombre,
                  cantidad: det.cantidad,
                  precioUnitario: det.precio_unitario,
                  montoItem: Math.round(det.cantidad * det.precio_unitario),
                })) : 
                [{
                  nombre: input.descripcion || "VENTA EFECTIVA",
                  cantidad: 1,
                  precioUnitario: montoTotal,
                  montoItem: montoTotal,
                }],
            };
            break;
          }
        case 52: // Guía de despacho
          {
            // Las guías no tienen monto total necesario para DTE, pero sí pueden tener valor
            montoTotal = input.monto_neto + (input.monto_exento ?? 0); // Las guías normalmente no tienen IVA
            
            dteDoc = {
              encabezado: {
                tipoDte: input.tipo_dte,
                folio: caf.folio_actual,
                fechaEmision: formatDateSii(input.fecha_emision),
                emisor: {
                  rut: formatRutSii(empresa.rut),
                  razonSocial: empresa.razon_social ?? "",
                  giro: empresa.giro ?? "",
                  direccion: empresa.direccion ?? "",
                  comuna: empresa.comuna ?? "",
                  ciudad: empresa.ciudad ?? "",
                  actividadEconomica: empresa.actividad_economica ?? 0,
                },
                receptor: {
                  rut: formatRutSii(input.receptor_rut),
                  razonSocial: input.receptor_razon_social,
                  giro: input.receptor_giro ?? "",
                  direccion: input.receptor_direccion ?? "",
                  comuna: input.receptor_comuna ?? "",
                  ciudad: input.receptor_ciudad ?? "",
                },
                montoNeto: input.monto_neto,
                montoExento: input.monto_exento ?? 0,
                tasaIva: 0, // Guías normalmente no tienen IVA
                montoIva: 0,
                montoTotal: montoTotal,
              },
              // Detalles de la guía (productos siendo trasladados)
              detalles: input.detalles.map((det, index) => ({
                nombre: det.nombre,
                cantidad: det.cantidad,
                codigo: det.codigo ?? "",
                unidadMedida: det.unidad_medida ?? "UNIT",
                dimenciones: det.dimenciones ?? "",
                valorUnitario: det.precio_unitario,
                montoItem: Math.round(det.cantidad * det.precio_unitario),
              })),
            };
            break;
          }
      }

      // 6. Generar XML DTE
      const dteXml = buildDteXml(dteDoc);

      // 7. Firmar el XML con el certificado
      const signedXml = signDteXml(dteXml, p12Base64, p12Password);

      // 8. Timbrar con el CAF
      const stampedXml = stampDteXml(signedXml, {
        tipoDte: caf.tipo_dte as DteTipo,
        desde: caf.folio_desde,
        hasta: caf.folio_hasta,
        fechaAutorizacion: caf.fecha_autorizacion,
        firma: caf.firma_caf,
        privateKey: caf.private_key,
        publicKey: caf.public_key,
      }, caf.folio_actual);

      // 9. Construir XML de envío
      const envioXml = buildEnvioDteXml(
        [stampedXml],
        formatRutSii(empresa.rut),
        caf.nro_resol ?? 0,
        caf.fch_resol ?? "2024-01-01"
      );

      // 10. Determinar ambiente SII
      const ambienteRaw = empresa.sii_ambiente ?? "certificacion";
      const ambiente = (ambienteRaw.toUpperCase() === "PRODUCCION" ? "PRODUCCION" : "CERTIFICACION") as any;

      // 11. Obtener token SII
      const token = await getSiiToken(ambiente, empresa.rut, p12Password);

      // 12. Enviar DTE al SII
      const envioResult = await enviarDte(ambiente, token.token, envioXml, formatRutSii(empresa.rut));

      // 13. Preparar datos para actualización según tipo de documento
      let updateData: any = {
        estado_sii: envioResult.estado === "aceptado" ? "aceptado" : 
                   envioResult.estado === "rechazado" ? "rechazado" : "enviado",
        track_id: envioResult.trackId,
        sii_response: {
          estado: envioResult.estado,
          glosa: envioResult.glosa,
        },
        sii_xml: stampedXml,
        folio: caf.folio_actual, // Guardar el folio usado
        fecha_emision: input.fecha_emision, // Aseguramos que esté guardada
      };

      // 14. Actualizar el registro correspondiente según el tipo de DTE
      let updatedRecord: any = null;
      let tableName = "";
      
      switch (input.tipo_dte) {
        case 33: // Factura electrónica
        case 34: // Factura exenta
          tableName = "facturas_emitidas";
          updateData = {
            ...updateData,
            tipo_dte: input.tipo_dte,
            monto_neto: input.monto_neto,
            monto_exento: input.monto_exento ?? 0,
            monto_iva: montoIva,
            monto_total: montoTotal,
            descripcion: input.descripcion,
            tercero_id: input.tercero_id, // Asumiendo que viene en el input
            cafe_id: caf.id,
            folio_caf: caf.folio_actual,
          };
          
          const { data: facturaData, error: facturaError } = await supabase
            .from("facturas_emitidas")
            .insert(updateData)
            .select()
            .single();
            
          if (facturaError) throw facturaError;
          updatedRecord = facturaData;
          break;
          
        case 39: // Boleta electrónica
        case 41: // Boleta exenta
          // Similar to facturas but for boletas
          tableName = "facturas_emitidas"; // Las boletas también se almacenan aquí por ahora
          updateData = {
            ...updateData,
            tipo_dte: input.tipo_dte,
            monto_neto: input.monto_neto,
            monto_exento: input.monto_exento ?? 0,
            monto_iva: montoIva,
            monto_total: montoTotal,
            descripcion: input.descripcion,
            tercero_id: input.tercero_id,
            cafe_id: caf.id,
            folio_caf: caf.folio_actual,
          };
          
          const { data: boletaData, error: boletaError } = await supabase
            .from("facturas_emitidas")
            .insert(updateData)
            .select()
            .single();
            
          if (boletaError) throw boletaError;
          updatedRecord = boletaData;
          break;
          
        case 46: // Factura de compra
          tableName = "facturas_compra";
          updateData = {
            ...updateData,
            tipo_dte: input.tipo_dte,
            folio: caf.folio_actual,
            monto_neto: input.monto_neto,
            monto_exento: input.monto_exento ?? 0,
            monto_iva: montoIva,
            monto_total: montoTotal,
            descripcion: input.descripcion,
            receptor_rut: input.receptor_rut,
            receptor_razon_social: input.receptor_razon_social,
            receptor_giro: input.receptor_giro,
          };
          
          const { data: compraData, error: compraError } = await supabase
            .from("facturas_compra")
            .insert(updateData)
            .select()
            .single();
            
          if (compraError) throw compraError;
          updatedRecord = compraData;
          break;
          
        case 52: // Guía de despacho
          // Las guías podrían estar en una tabla específica o en facturas_emitidas
          // Por ahora, las ponemos en facturas_emitidas con tipo 52
          tableName = "facturas_emitidas";
          updateData = {
            ...updateData,
            tipo_dte: input.tipo_dte,
            folio: caf.folio_actual,
            monto_neto: input.monto_neto,
            monto_exento: input.monto_exento ?? 0,
            monto_iva: 0, // Guías no tienen IVA
            monto_total: montoTotal,
            descripcion: input.descripcion,
            tercero_id: input.tercero_id,
            cafe_id: caf.id,
            folio_caf: caf.folio_actual,
          };
          
          const { data: guiaData, error: guiaError } = await supabase
            .from("facturas_emitidas")
            .insert(updateData)
            .select()
            .single();
            
          if (guiaError) throw guiaError;
          updatedRecord = guiaData;
          break;
          
        case 56: // Nota de débito
        case 61: // Nota de crédito
          tableName = "facturas_emitidas"; // Las notas también van aquí por ahora
          updateData = {
            ...updateData,
            tipo_dte: input.tipo_dte,
            folio: caf.folio_actual,
            monto_neto: input.monto_neto,
            monto_exento: input.monto_exento ?? 0,
            monto_iva: montoIva,
            monto_total: montoTotal,
            descripcion: input.descripcion,
            tercero_id: input.tercero_id,
            cafe_id: caf.id,
            folio_caf: caf.folio_actual,
            // Para notas, también guardar referencia al documento original
            // Esto requeriría columnas adicionales en facturas_emitidas
          };
          
          const { data: notaData, error: notaError } = await supabase
            .from("facturas_emitidas")
            .insert(updateData)
            .select()
            .single();
            
          if (notaError) throw notaError;
          updatedRecord = notaData;
          break;
          
        case 66: // Boleta de honorarios
          tableName = "facturas_emitidas";
          updateData = {
            ...updateData,
            tipo_dte: input.tipo_dte,
            folio: caf.folio_actual,
            monto_neto: input.monto_neto,
            monto_exento: input.monto_exento ?? 0,
            monto_iva: montoIva,
            monto_total: montoTotal,
            descripcion: input.descripcion,
            tercero_id: input.tercero_id,
            cafe_id: caf.id,
            folio_caf: caf.folio_actual,
          };
          
          const { data: honorarioData, error: honorarioError } = await supabase
            .from("facturas_emitidas")
            .insert(updateData)
            .select()
            .single();
            
          if (honorarioError) throw honorarioError;
          updatedRecord = honorarioData;
          break;
      }

      // 15. Incrementar el folio actual del CAF para el próximo uso
      await supabase
        .from("sii_caf")
        .update({ folio_actual: caf.folio_actual + 1 })
        .eq("id", caf.id);

      // 16. Responder con éxito
      return c.json({
        success: true,
        message: "DTE emitido correctamente",
        data: {
          tipo_dte: input.tipo_dte,
          folio: caf.folio_actual,
          dte_xml: dteXml,
          signed_xml: signedXml,
          stamped_xml: stampedXml,
          envio_xml: envioXml,
          track_id: envioResult.trackId,
          estado_sii: updateData.estado_sii,
          sii_response: updateData.sii_response,
          registro_id: updatedRecord?.id,
          tabla: tableName,
        }
      }, 201);

    } catch (error) {
      // Detailed error context for SII DTE (visible in local terminal via build:ci:nucleo and vercel dev, like Trama).
      // Avoid referencing 'input' here due to control-flow / scope in large emission try (pre-existing during logging improvements).
      console.error("[SII DTE Emisión] Error:", error, { empresaId: c.get("empresaId") });
      return c.json({ 
        code: "dte_emision_failed", 
        message: error instanceof Error ? error.message : "Error inesperado al emitir DTE" 
      }, 500);
    }
  }
);

/**
 * Consultar estado de un DTE enviado (por track_id)
 */
dteRoutes.get(
  "/consultar-estado/:track_id",
  async (c) => {
    try {
      const track_id = c.req.param("track_id");
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      // 1. Obtener datos de la empresa para credenciales
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresas")
        .select("rut, sii_ambiente")
        .eq("id", empresaId)
        .single();

      if (empresaError || !empresaData) {
        return c.json({ code: "empresa_not_found", message: "Empresa no encontrada" }, 404);
      }

      const empresa = empresaData as { rut: string; sii_ambiente: string };

      // 2. Obtener certificado y credenciales
      const { data: certData } = await supabase
        .from("sii_certificados")
        .select("storage_path")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .maybeSingle();

      let p12Base64 = "";
      if (certData?.storage_path) {
        try {
          const { data: fileData, error: downloadError } = await supabase
            .storage
            .from("sii-certificados")
            .download(certData.storage_path);

          if (!downloadError && fileData) {
            const buffer = await fileData.arrayBuffer();
            p12Base64 = Buffer.from(buffer).toString("base64");
          }
        } catch (storageErr) {
          console.warn("[SII Consultar Estado] Error leyendo certificado de storage:", storageErr);
        }
      }

      if (!p12Base64) {
        p12Base64 = process.env.SII_P12_BASE64 ?? "";
      }
      const p12Password = process.env.SII_P12_PASSWORD ?? "";

      if (!p12Base64 || !p12Password) {
        return c.json({ 
          code: "no_credenciales_sii", 
          message: "Credenciales SII no configuradas" 
        }, 500);
      }

      // 3. Determinar ambiente
      const ambienteRaw = empresa.sii_ambiente ?? "certificacion";
      const ambiente = (ambienteRaw.toUpperCase() === "PRODUCCION" ? "PRODUCCION" : "CERTIFICACION") as any;

      // 4. Obtener token
      const token = await getSiiToken(ambiente, empresa.rut, p12Password);

      // 5. Consultar estado en SII
      const estadoResult = await consultarEstado(ambiente, token.token, track_id, empresa.rut);

      // 6. Actualizar registro si lo encontramos por track_id
      // Buscar en facturas_emitidas y facturas_compra
      let updated = false;
      
      // Primero buscar en facturas_emitidas
      const { data: facturaData, error: facturaError } = await supabase
        .from("facturas_emitidas")
        .select("id, tipo_dte, folio, estado_sii")
        .eq("track_id", track_id)
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (!facturaError && facturaData) {
        const nuevoEstado = estadoResult.aceptados > 0 ? "aceptado" :
                           estadoResult.rechazados > 0 ? "rechazado" : facturaData.estado_sii;
                           
        await supabase
          .from("facturas_emitidas")
          .update({ 
            estado_sii: nuevoEstado,
            sii_response: {
              estado: estadoResult.estado,
              glosa: estadoResult.glosa,
              aceptados: estadoResult.aceptados,
              rechazados: estadoResult.rechazados,
              reparos: estadoResult.reparos,
            }
          })
          .eq("id", facturaData.id);
          
        updated = true;
      }

      // Si no se encontró en facturas_emitidas, buscar en facturas_compra
      if (!updated) {
        const { data: compraData, error: compraError } = await supabase
          .from("facturas_compra")
          .select("id, tipo_dte, folio, estado_sii")
          .eq("track_id", track_id)
          .eq("empresa_id", empresaId)
          .maybeSingle();

        if (!compraError && compraData) {
          const nuevoEstado = estadoResult.aceptados > 0 ? "aceptado" :
                             estadoResult.rechazados > 0 ? "rechazado" : compraData.estado_sii;
                             
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
              }
            })
            .eq("id", compraData.id);
            
          updated = true;
        }
      }

      return c.json({
        success: true,
        data: estadoResult,
        actualizado: updated
      });

    } catch (error) {
      // Safe logging for SII consultar (track_id declared as snake_case at top of try).
      // Prevents TS "no value in scope" for shorthand and ensures error details surface
      // in local terminal (build:ci / vercel dev) for debugging DTE flows.
      console.error("[SII Consultar Estado] Error:", error, { trackId: track_id, empresaId });
      return c.json({ 
        code: "sii_consulta_failed", 
        message: error instanceof Error ? error.message : "Error al consultar estado" 
      }, 500);
    }
  }
);

// Named export only, no default export
