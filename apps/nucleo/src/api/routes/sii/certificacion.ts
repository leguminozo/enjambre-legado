import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getCafMinFolios } from "@enjambre/fiscal";
import {
  buildDteXml,
  buildDteSetPruebas,
  buildSetPruebasEnvio,
  assertRutsReceptorDistintos,
  buildIevVentasXml,
  buildIevComprasXml,
  buildIevResumen,
  formatRutSii,
} from "@enjambre/contable";
import type { DteEmisor, DteTipo } from "@enjambre/contable";
import type { AppVariables } from "@/api/lib/middleware";
import { hasSiiEncryptionMaterial, isValidChileanRut } from "@/api/lib/sii-crypto";
import {
  signDteXml,
  stampDteXml,
  signEnvioDteXml,
  signNode,
  enviarDte,
  getSiiToken,
  getSiiTokenWs,
} from "@/api/lib/sii-client";
import { resolveSiiAmbiente, resolveSiiCredentials } from "@/api/lib/sii-credentials";

export const certificacionRoutes = new Hono<{ Variables: AppVariables }>();

type ChecklistFase = "certificacion" | "go-live" | "operacion";

type ChecklistItem = {
  id: string;
  categoria: string;
  titulo: string;
  cumplido: boolean;
  critico: boolean;
  /** Items de fase go-live no bloquean listoCertificacion (sí listoProduccion). */
  fase: ChecklistFase;
  detalle?: string;
};

const CAF_TIPOS_CRITICOS: { tipo: number; id: string; titulo: string }[] = [
  { tipo: 39, id: "caf-39", titulo: "CAF activo boleta electrónica (39) con folios" },
  { tipo: 33, id: "caf-33", titulo: "CAF activo factura electrónica (33) con folios" },
  { tipo: 46, id: "caf-46", titulo: "CAF activo factura de compra (46) con folios" },
];

const CAF_TIPOS_OPCIONALES: { tipo: number; id: string; titulo: string }[] = [
  { tipo: 41, id: "caf-41", titulo: "CAF activo boleta exenta (41) con folios" },
];

function foliosDeCaf(
  rows: Array<{ tipo_dte: number | string; folio_actual: number | string; folio_hasta: number | string }>,
  tipo: number,
): number {
  const match = rows.find((r) => Number(r.tipo_dte) === tipo);
  if (!match) return 0;
  return Math.max(0, Number(match.folio_hasta) - Number(match.folio_actual));
}

function emisorIdentityDetail(emp: {
  rut?: string | null;
  razon_social?: string | null;
  giro?: string | null;
  direccion?: string | null;
  comuna?: string | null;
  acteco?: string | number | null;
}): { ok: boolean; detalle: string } {
  const missing: string[] = [];
  const rut = emp.rut?.trim() ?? "";
  if (!rut || !isValidChileanRut(rut)) missing.push("RUT válido");
  if (!emp.razon_social?.trim()) missing.push("razón social");
  if (!emp.giro?.trim()) missing.push("giro");
  if (!emp.direccion?.trim()) missing.push("dirección");
  if (!emp.comuna?.trim()) missing.push("comuna");
  if (emp.acteco === null || emp.acteco === undefined || String(emp.acteco).trim() === "") {
    missing.push("acteco");
  }
  if (missing.length === 0) {
    return { ok: true, detalle: `${rut} · ${String(emp.razon_social).trim().slice(0, 40)}` };
  }
  return { ok: false, detalle: `Falta: ${missing.join(", ")} (Settings SII → Emisor)` };
}

certificacionRoutes.get("/checklist", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const minFolios = getCafMinFolios();

  const [cafRes, certRes, fcRes, dteVentaRes, empresaRes, jobsOpenRes, dtePendRes, deadLetterRes] =
    await Promise.all([
      supabase
        .from("sii_caf")
        .select("id, tipo_dte, folio_actual, folio_hasta, activo")
        .eq("empresa_id", empresaId)
        .eq("activo", true),
      supabase
        .from("sii_certificados")
        .select("id, vigencia_fin, activo, p12_password_encriptada, storage_path")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .maybeSingle(),
      supabase
        .from("facturas_compra")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("estado_sii", "aceptado"),
      supabase
        .from("facturas_emitidas")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("estado_sii", "aceptado")
        .in("tipo_dte", [33, 39, 41]),
      supabase
        .from("empresas")
        .select(
          "sii_ambiente, sii_clave_encriptada, rut, razon_social, giro, direccion, comuna, acteco",
        )
        .eq("id", empresaId)
        .single(),
      supabase
        .from("sii_document_jobs")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .in("status", ["pending", "failed", "dead_letter", "processing"]),
      supabase
        .from("facturas_emitidas")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("estado_sii", "pendiente")
        .in("tipo_dte", [33, 39, 41]),
      supabase
        .from("sii_document_jobs")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("status", "dead_letter"),
    ]);

  const cafRows = (cafRes.data ?? []) as Array<{
    tipo_dte: number | string;
    folio_actual: number | string;
    folio_hasta: number | string;
  }>;

  const cert = certRes.data as {
    id: string;
    vigencia_fin: string;
    activo: boolean;
    p12_password_encriptada?: string | null;
    storage_path?: string | null;
  } | null;

  const certVigente = cert && new Date(String(cert.vigencia_fin)) >= new Date();
  const hasP12Password =
    Boolean(cert?.p12_password_encriptada?.trim()) ||
    Boolean(process.env.SII_P12_PASSWORD?.trim());
  const hasP12Material =
    Boolean(cert?.storage_path?.trim()) || Boolean(process.env.SII_P12_BASE64?.trim());

  const empresa = (empresaRes.data ?? {}) as {
    sii_ambiente?: string | null;
    sii_clave_encriptada?: string | null;
    rut?: string | null;
    razon_social?: string | null;
    giro?: string | null;
    direccion?: string | null;
    comuna?: string | null;
    acteco?: string | number | null;
  };

  const ambiente = String(empresa.sii_ambiente ?? "certificacion");
  const hasClave = Boolean(empresa.sii_clave_encriptada);
  const hasEncryption = hasSiiEncryptionMaterial();
  const identity = emisorIdentityDetail(empresa);
  const fcAceptadas = fcRes.count ?? 0;
  const dteVentaAceptadas = dteVentaRes.count ?? 0;
  const deadLetter = deadLetterRes.count ?? 0;
  const jobsOpen = jobsOpenRes.count ?? 0;

  const cafItems: ChecklistItem[] = [
    ...CAF_TIPOS_CRITICOS.map(({ tipo, id, titulo }) => {
      const folios = foliosDeCaf(cafRows, tipo);
      return {
        id,
        categoria: "folios",
        titulo,
        cumplido: folios >= minFolios,
        critico: true,
        fase: "certificacion" as const,
        detalle:
          folios > 0
            ? `${folios} folios restantes (mín. ${minFolios})`
            : `Sin CAF ${tipo} activo`,
      };
    }),
    ...CAF_TIPOS_OPCIONALES.map(({ tipo, id, titulo }) => {
      const folios = foliosDeCaf(cafRows, tipo);
      return {
        id,
        categoria: "folios",
        titulo,
        cumplido: folios >= minFolios,
        critico: false,
        fase: "certificacion" as const,
        detalle:
          folios > 0
            ? `${folios} folios restantes`
            : `Sin CAF ${tipo} (opcional si no emites exentas)`,
      };
    }),
  ];

  const items: ChecklistItem[] = [
    {
      id: "emisor-identidad",
      categoria: "emisor",
      titulo: "Identidad emisor completa (RUT, razón social, giro, domicilio, acteco)",
      cumplido: identity.ok,
      critico: true,
      fase: "certificacion",
      detalle: identity.detalle,
    },
    ...cafItems,
    {
      id: "cert-p12",
      categoria: "certificado",
      titulo: "Certificado digital P12 vigente",
      cumplido: Boolean(certVigente),
      critico: true,
      fase: "certificacion",
      detalle: cert
        ? `Vigencia hasta ${String(cert.vigencia_fin).slice(0, 10)}`
        : "Sin certificado activo",
    },
    {
      id: "cert-credenciales",
      categoria: "certificado",
      titulo: "Material P12 + contraseña resolvibles (DB cifrada o env)",
      cumplido: hasP12Material && hasP12Password,
      critico: true,
      fase: "certificacion",
      detalle:
        hasP12Material && hasP12Password
          ? hasP12Password && cert?.p12_password_encriptada
            ? "P12 en storage + clave cifrada"
            : "Credenciales vía env (SII_P12_*) o storage"
          : [
              !hasP12Material ? "falta archivo P12 (upload o SII_P12_BASE64)" : null,
              !hasP12Password ? "falta contraseña (upload o SII_P12_PASSWORD)" : null,
            ]
              .filter(Boolean)
              .join("; "),
    },
    {
      id: "clave-sii",
      categoria: "credenciales",
      titulo: "Clave portal SII guardada (cifrada)",
      cumplido: hasClave,
      critico: true,
      fase: "certificacion",
      detalle: hasClave ? "Configurada en empresa" : "Falta PUT /empresa/sii-clave",
    },
    {
      id: "encryption-key",
      categoria: "credenciales",
      titulo: "Material de cifrado SII en runtime (≥32 chars)",
      cumplido: hasEncryption,
      critico: true,
      fase: "certificacion",
      detalle: hasEncryption
        ? "SII_CLAVE_ENCRYPTION_KEY | FISCAL_ENCRYPTION_KEY | SERVICE_ROLE"
        : "Set SII_CLAVE_ENCRYPTION_KEY en Vercel (preferido)",
    },
    {
      id: "dte-venta-aceptada",
      categoria: "pruebas",
      titulo: "Al menos un DTE de venta (33/39/41) aceptado por SII",
      cumplido: dteVentaAceptadas > 0,
      critico: true,
      fase: "certificacion",
      detalle: `${dteVentaAceptadas} aceptado(s) en facturas_emitidas`,
    },
    {
      id: "fc-aceptada",
      categoria: "pruebas",
      titulo: "Al menos una FC46 aceptada (gastos / factura compra)",
      cumplido: fcAceptadas > 0,
      critico: true,
      fase: "certificacion",
      detalle: `${fcAceptadas} aceptada(s) en facturas_compra`,
    },
    {
      id: "ambiente-prod",
      categoria: "go-live",
      titulo: "Empresa configurada en ambiente producción (Palena)",
      cumplido: ambiente === "produccion",
      critico: true,
      fase: "go-live",
      detalle: `Ambiente actual: ${ambiente}`,
    },
    {
      id: "cron-fiscal",
      categoria: "operacion",
      titulo: "Cron fiscal activo (poll + jobs + alerta CAF)",
      cumplido: Boolean(
        process.env.CRON_SECRET ||
          process.env.FISCAL_WORKER_SECRET ||
          process.env.INTEGRATIONS_CRON_SECRET,
      ),
      critico: false,
      fase: "operacion",
      detalle:
        process.env.CRON_SECRET ||
        process.env.FISCAL_WORKER_SECRET ||
        process.env.INTEGRATIONS_CRON_SECRET
          ? "Secret de cron presente · schedule /api/cron/fiscal */15"
          : "Set CRON_SECRET en Vercel + schedule /api/cron/fiscal",
    },
    {
      id: "auto-emit-boleta",
      categoria: "operacion",
      titulo: "Auto-emisión boleta post-checkout (SII_AUTO_EMIT_BOLETA)",
      cumplido: process.env.SII_AUTO_EMIT_BOLETA === "true",
      critico: false,
      fase: "operacion",
      detalle:
        process.env.SII_AUTO_EMIT_BOLETA === "true"
          ? "Activo — ventas web emiten DTE 39"
          : "Desactivado — set SII_AUTO_EMIT_BOLETA=true en Vercel para go-live D2C",
    },
    {
      id: "jobs-cola",
      categoria: "operacion",
      titulo: "Cola de jobs de emisión saludable",
      cumplido: jobsOpen < 50 && deadLetter === 0,
      critico: false,
      fase: "operacion",
      detalle: `${jobsOpen} abiertos · ${deadLetter} dead_letter · ${dtePendRes.count ?? 0} DTE pendientes de envío`,
    },
  ];

  const certCriticosPendientes = items.filter(
    (i) => i.critico && i.fase === "certificacion" && !i.cumplido,
  ).length;
  const prodCriticosPendientes = items.filter((i) => i.critico && !i.cumplido).length;

  const listoCertificacion = certCriticosPendientes === 0;
  const listoProduccion =
    listoCertificacion && ambiente === "produccion" && prodCriticosPendientes === 0;

  return c.json({
    data: {
      listoCertificacion,
      listoProduccion,
      certCriticosPendientes,
      criticosPendientes: prodCriticosPendientes,
      minFolios,
      items,
      ambiente,
    },
  });
});

const CasoSetPruebasSchema = z.object({
  /** Número del caso tal como lo entrega el SII (ej. "4256-1"). */
  numero: z.string().min(1),
  tipo_dte: z.union([
    z.literal(33), z.literal(34), z.literal(39), z.literal(41),
    z.literal(46), z.literal(52), z.literal(56), z.literal(61), z.literal(66),
  ]),
  fecha_emision: z.string(),
  receptor: z.object({
    rut: z.string(),
    razon_social: z.string(),
    giro: z.string().optional().default(""),
    direccion: z.string().optional().default(""),
    comuna: z.string().optional().default(""),
    ciudad: z.string().optional().default(""),
  }),
  /** Glosa exacta, cantidad y precio unitario indicados en el caso (en orden). */
  detalles: z.array(z.object({
    nombre: z.string(),
    cantidad: z.number(),
    precio_unitario: z.number(),
  })).min(1),
  monto_exento: z.number().optional().default(0),
  referencias_adicionales: z.array(z.object({
    tipo_documento: z.union([z.number(), z.string()]),
    folio: z.number().optional(),
    fecha: z.string().optional(),
    razon: z.string(),
  })).optional(),
});

const SetPruebasSchema = z.object({
  casos: z.array(CasoSetPruebasSchema).min(1),
  /** Enviar el EnvioDTE al SII (certificación). Default: true. */
  enviar: z.boolean().optional().default(true),
});

/**
 * Genera los DTEs del Set de Pruebas de certificación a partir de los casos
 * entregados por el SII: referencia SET/CASO xxxxx-x en línea 1, folios del
 * CAF en orden, RUTs de receptor distintos (facturas), un solo EnvioDTE en
 * el orden entregado, firmado y timbrado. Opcionalmente envía al SII.
 */
certificacionRoutes.post(
  "/set-pruebas",
  zValidator("json", SetPruebasSchema),
  async (c) => {
    const input = c.req.valid("json");
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");

    try {
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresas")
        .select("rut, razon_social, giro, direccion, comuna, ciudad, acteco, sii_ambiente")
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
        acteco: string | null;
        sii_ambiente: string;
      };

      // CAFs activos para los tipos de documento del set
      const tipos = [...new Set(input.casos.map((caso) => caso.tipo_dte))];
      const { data: cafRows, error: cafError } = await supabase
        .from("sii_caf")
        .select("id, tipo_dte, folio_desde, folio_hasta, folio_actual, fecha_autorizacion, firma_caf, private_key, public_key, nro_resol, fch_resol")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .in("tipo_dte", tipos);

      if (cafError) throw cafError;
      const cafPorTipo = new Map<number, (typeof cafRows)[number]>();
      for (const row of cafRows ?? []) {
        cafPorTipo.set(Number(row.tipo_dte), row);
      }

      const emisor: DteEmisor = {
        rut: formatRutSii(empresa.rut),
        razonSocial: empresa.razon_social ?? "",
        giro: empresa.giro ?? "",
        direccion: empresa.direccion ?? "",
        comuna: empresa.comuna ?? "",
        ciudad: empresa.ciudad ?? "",
        actividadEconomica: Number(empresa.acteco) || 0,
      };

      // Folios por tipo: se asignan secuencialmente desde el folio_actual de cada CAF
      const folioActualPorTipo = new Map<number, number>();
      for (const caso of input.casos) {
        const caf = cafPorTipo.get(caso.tipo_dte);
        if (!caf) {
          return c.json({
            code: "no_caf_activo",
            message: `No hay CAF activo para tipo DTE ${caso.tipo_dte} (caso ${caso.numero})`,
          }, 400);
        }
        const folioActual = folioActualPorTipo.get(caso.tipo_dte) ?? Number(caf.folio_actual);
        if (folioActual > Number(caf.folio_hasta)) {
          return c.json({
            code: "caf_sin_folios",
            message: `CAF ${caso.tipo_dte} sin folios disponibles (caso ${caso.numero})`,
          }, 400);
        }
        folioActualPorTipo.set(caso.tipo_dte, folioActual + 1);
      }

      const credsResult = await resolveSiiCredentials(supabase, empresaId);
      if (!credsResult.ok) {
        return c.json({ code: credsResult.code, message: credsResult.message }, 400);
      }
      const { p12Base64, p12Password } = credsResult.credentials;

      const dtesTimbrados: string[] = [];
      const documentos: Array<{ numero: string; tipo_dte: number; folio: number }> = [];

      for (const caso of input.casos) {
        const caf = cafPorTipo.get(caso.tipo_dte)!;
        const folio = folioActualPorTipo.get(caso.tipo_dte)! - 1;
        const doc = buildDteSetPruebas(
          {
            numero: caso.numero,
            tipoDte: caso.tipo_dte as DteTipo,
            folio,
            fechaEmision: caso.fecha_emision,
            receptor: {
              rut: caso.receptor.rut,
              razonSocial: caso.receptor.razon_social,
              giro: caso.receptor.giro,
              direccion: caso.receptor.direccion,
              comuna: caso.receptor.comuna,
              ciudad: caso.receptor.ciudad,
            },
            detalles: caso.detalles.map((d) => ({
              nombre: d.nombre,
              cantidad: d.cantidad,
              precioUnitario: d.precio_unitario,
              montoItem: Math.round(d.cantidad * d.precio_unitario),
            })),
            montoExento: caso.monto_exento,
            referenciasAdicionales: caso.referencias_adicionales?.map((r) => ({
              tipoDocumento: r.tipo_documento,
              folio: r.folio,
              fecha: r.fecha,
              razonReferencia: r.razon,
            })),
          },
          emisor,
        );

        const dteXml = buildDteXml(doc);
        const signedXml = signDteXml(dteXml, p12Base64, p12Password);
        const stampedXml = stampDteXml(signedXml, {
          tipoDte: caso.tipo_dte as DteTipo,
          desde: Number(caf.folio_desde),
          hasta: Number(caf.folio_hasta),
          fechaAutorizacion: caf.fecha_autorizacion,
          firma: caf.firma_caf,
          privateKey: caf.private_key,
          publicKey: caf.public_key,
        }, folio);

        dtesTimbrados.push(stampedXml);
        documentos.push({ numero: caso.numero, tipo_dte: caso.tipo_dte, folio });
      }

      // RUTs de receptor distintos entre facturas del set (instrucción del SII)
      const docsParaCheck = input.casos.filter((caso) => caso.tipo_dte === 33 || caso.tipo_dte === 34);
      if (docsParaCheck.length > 1) {
        const duplicados = new Map<string, string>();
        for (const caso of docsParaCheck) {
          const rut = formatRutSii(caso.receptor.rut);
          const previo = duplicados.get(rut);
          if (previo) {
            return c.json({
              code: "rut_receptor_repetido",
              message: `RUT receptor ${rut} repetido en los casos ${previo} y ${caso.numero} (use RUT distintos por factura)`,
            }, 400);
          }
          duplicados.set(rut, caso.numero);
        }
      }

      const primerCaf = cafPorTipo.get(input.casos[0]!.tipo_dte)!;
      const envioXml = buildSetPruebasEnvio(dtesTimbrados, formatRutSii(empresa.rut), Number(primerCaf.nro_resol ?? 0), primerCaf.fch_resol ?? "2024-01-01", {
        rutEnvia: formatRutSii(empresa.rut),
      });
      const envioFirmado = signEnvioDteXml(envioXml, p12Base64, p12Password);

      // Actualizar folios consumidos por tipo
      for (const [tipoDte, siguiente] of folioActualPorTipo) {
        await supabase
          .from("sii_caf")
          .update({ folio_actual: siguiente })
          .eq("id", cafPorTipo.get(tipoDte)!.id);
      }

      let envioResult: import("@enjambre/contable").SiiEnvioResult | null = null;
      if (input.enviar) {
        const ambiente = resolveSiiAmbiente(empresa.sii_ambiente) as import("@enjambre/contable").SiiEnvironment;
        let token: string;
        try {
          token = (await getSiiTokenWs(ambiente, p12Base64, p12Password)).token;
        } catch {
          token = (await getSiiToken(ambiente, empresa.rut, credsResult.credentials.siiClave)).token;
        }
        envioResult = await enviarDte(ambiente, token, envioFirmado, formatRutSii(empresa.rut));
      }

      return c.json({
        success: true,
        message: input.enviar ? "Set de Pruebas enviado al SII" : "Set de Pruebas generado (sin enviar)",
        data: {
          documentos,
          envio_xml: envioFirmado,
          track_id: envioResult?.trackId ?? null,
          estado_sii: envioResult?.estado ?? "generado",
          sii_response: envioResult ? { estado: envioResult.estado, glosa: envioResult.glosa } : null,
        },
      }, 201);
    } catch (error) {
      console.error("[SII Set de Pruebas] Error:", error, { empresaId });
      return c.json({
        code: "set_pruebas_failed",
        message: error instanceof Error ? error.message : "Error al generar el Set de Pruebas",
      }, 500);
    }
  }
);

const IevDocumentoSchema = z.object({
  tipo_doc: z.number(),
  folio: z.number(),
  fecha_emision: z.string(),
  rut_doc: z.string(),
  razon_social_doc: z.string(),
  monto_exento: z.number().optional().default(0),
  monto_neto: z.number(),
  monto_iva: z.number(),
  tasa_iva: z.number(),
  monto_total: z.number(),
});

const IevSchema = z.object({
  tipo: z.enum(["ventas", "compras"]),
  /** Período tributario YYYY-MM (todos los documentos del set deben ser del mismo período). */
  periodo_tributario: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM"),
  documentos: z.array(IevDocumentoSchema).min(1),
  nro_resol: z.number().optional(),
  fch_resol: z.string().optional(),
});

/**
 * Genera la Información Electrónica de Ventas (libro ESPECIAL, envío TOTAL,
 * FolioNotificacion 1) o de Compras (FolioNotificacion 2) con los documentos
 * del Set de Pruebas, firmada con el certificado digital.
 */
certificacionRoutes.post(
  "/iev",
  zValidator("json", IevSchema),
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

      // Resolución por defecto: la del primer CAF de la empresa (0 en certificación)
      const { data: cafRow, error: cafError } = await supabase
        .from("sii_caf")
        .select("nro_resol, fch_resol")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .limit(1)
        .maybeSingle();

      if (cafError) throw cafError;

      const credsResult = await resolveSiiCredentials(supabase, empresaId);
      if (!credsResult.ok) {
        return c.json({ code: credsResult.code, message: credsResult.message }, 400);
      }
      const { p12Base64, p12Password } = credsResult.credentials;

      const caratula = {
        rutEmisor: empresaData.rut,
        nroResol: input.nro_resol ?? Number(cafRow?.nro_resol ?? 0),
        fchResol: input.fch_resol ?? cafRow?.fch_resol ?? "2024-01-01",
        periodoTributario: input.periodo_tributario,
        folioNotificacion: (input.tipo === "ventas" ? 1 : 2) as 1 | 2,
      };

      const resumen = buildIevResumen(
        input.documentos.map((d) => ({
          tipoDoc: d.tipo_doc,
          montoExento: d.monto_exento,
          montoNeto: d.monto_neto,
          montoIva: d.monto_iva,
          montoTotal: d.monto_total,
        })),
      );
      const xmlSinFirmar = input.tipo === "ventas"
        ? buildIevVentasXml(
            caratula,
            resumen,
            input.documentos.map((d) => ({
              tipoDoc: d.tipo_doc,
              folio: d.folio,
              fechaEmision: d.fecha_emision,
              rutDoc: d.rut_doc,
              razonSocialDoc: d.razon_social_doc,
              montoExento: d.monto_exento,
              montoNeto: d.monto_neto,
              montoIva: d.monto_iva,
              tasaIva: d.tasa_iva,
              montoTotal: d.monto_total,
            })),
          )
        : buildIevComprasXml(
            caratula,
            resumen,
            input.documentos.map((d) => ({
              tipoDoc: d.tipo_doc,
              folio: d.folio,
              fechaEmision: d.fecha_emision,
              rutDoc: d.rut_doc,
              razonSocialDoc: d.razon_social_doc,
              montoExento: d.monto_exento,
              montoNeto: d.monto_neto,
              montoIva: d.monto_iva,
              tasaIva: d.tasa_iva,
              montoTotal: d.monto_total,
            })),
          );

      const rootTag = input.tipo === "ventas" ? "LibroVentaElectronico" : "LibroCompraElectronico";
      const xmlFirmado = signNode(xmlSinFirmar, rootTag, p12Base64, p12Password);

      return c.json({
        success: true,
        data: {
          tipo: input.tipo,
          periodo_tributario: input.periodo_tributario,
          resumen,
          xml: xmlFirmado,
        },
      }, 201);
    } catch (error) {
      console.error("[SII IEV] Error:", error, { empresaId });
      return c.json({
        code: "iev_failed",
        message: error instanceof Error ? error.message : "Error al generar la Información Electrónica",
      }, 500);
    }
  }
);
