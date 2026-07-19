import { Hono } from "hono";
import { getCafMinFolios } from "@enjambre/fiscal";
import type { AppVariables } from "@/api/lib/middleware";
import { hasSiiEncryptionMaterial, isValidChileanRut } from "@/api/lib/sii-crypto";

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
