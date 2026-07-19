import { Hono } from "hono";
import { getCafMinFolios } from "@enjambre/fiscal";
import type { AppVariables } from "@/api/lib/middleware";
import { hasSiiEncryptionMaterial } from "@/api/lib/sii-crypto";

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

certificacionRoutes.get("/checklist", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const minFolios = getCafMinFolios();

  const [cafRes, certRes, fcRes, dteVentaRes, empresaRes] = await Promise.all([
    supabase
      .from("sii_caf")
      .select("id, tipo_dte, folio_actual, folio_hasta, activo")
      .eq("empresa_id", empresaId)
      .eq("activo", true),
    supabase
      .from("sii_certificados")
      .select("id, vigencia_fin, activo")
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
      .select("sii_ambiente, sii_clave_encriptada")
      .eq("id", empresaId)
      .single(),
  ]);

  const cafRows = (cafRes.data ?? []) as Array<{
    tipo_dte: number | string;
    folio_actual: number | string;
    folio_hasta: number | string;
  }>;

  const certVigente =
    certRes.data &&
    new Date(String(certRes.data.vigencia_fin)) >= new Date();
  const ambiente = String(empresaRes.data?.sii_ambiente ?? "certificacion");
  const hasClave = Boolean(empresaRes.data?.sii_clave_encriptada);
  const hasEncryption = hasSiiEncryptionMaterial();
  const fcAceptadas = fcRes.count ?? 0;
  const dteVentaAceptadas = dteVentaRes.count ?? 0;

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
    ...cafItems,
    {
      id: "cert-p12",
      categoria: "certificado",
      titulo: "Certificado digital P12 vigente",
      cumplido: Boolean(certVigente),
      critico: true,
      fase: "certificacion",
      detalle: certRes.data
        ? `Vigencia hasta ${String(certRes.data.vigencia_fin).slice(0, 10)}`
        : "Sin certificado activo",
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
      cumplido: Boolean(process.env.CRON_SECRET),
      critico: false,
      fase: "operacion",
      detalle: process.env.CRON_SECRET
        ? "CRON_SECRET presente"
        : "Set CRON_SECRET en Vercel + schedule /api/cron/fiscal",
    },
  ];

  const certCriticosPendientes = items.filter(
    (i) => i.critico && i.fase === "certificacion" && !i.cumplido,
  ).length;
  const prodCriticosPendientes = items.filter(
    (i) => i.critico && !i.cumplido,
  ).length;

  const listoCertificacion = certCriticosPendientes === 0;
  const listoProduccion = listoCertificacion && ambiente === "produccion" && prodCriticosPendientes === 0;

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
