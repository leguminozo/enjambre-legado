import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";

export const certificacionRoutes = new Hono<{ Variables: AppVariables }>();

type ChecklistItem = {
  id: string;
  categoria: string;
  titulo: string;
  cumplido: boolean;
  critico: boolean;
  detalle?: string;
};

certificacionRoutes.get("/checklist", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");

  const [cafRes, certRes, fcRes, ambienteRes] = await Promise.all([
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
    supabase.from("empresas").select("sii_ambiente").eq("id", empresaId).single(),
  ]);

  const caf46 = (cafRes.data ?? []).find((r) => Number(r.tipo_dte) === 46);
  const folios46 = caf46
    ? Math.max(0, Number(caf46.folio_hasta) - Number(caf46.folio_actual))
    : 0;
  const certVigente =
    certRes.data &&
    new Date(String(certRes.data.vigencia_fin)) >= new Date();
  const ambiente = String(ambienteRes.data?.sii_ambiente ?? "certificacion");

  const items: ChecklistItem[] = [
    {
      id: "caf-46",
      categoria: "folios",
      titulo: "CAF activo tipo 46 con folios disponibles",
      cumplido: folios46 >= 10,
      critico: true,
      detalle: folios46 > 0 ? `${folios46} folios restantes` : "Sin CAF 46",
    },
    {
      id: "cert-p12",
      categoria: "certificado",
      titulo: "Certificado digital P12 vigente",
      cumplido: Boolean(certVigente),
      critico: true,
    },
    {
      id: "fc-aceptada",
      categoria: "pruebas",
      titulo: "Al menos una FC46 aceptada en certificación",
      cumplido: (fcRes.count ?? 0) > 0,
      critico: true,
      detalle: `${fcRes.count ?? 0} aceptadas`,
    },
    {
      id: "ambiente-prod",
      categoria: "go-live",
      titulo: "Empresa configurada en ambiente producción",
      cumplido: ambiente === "produccion",
      critico: true,
      detalle: `Ambiente actual: ${ambiente}`,
    },
    {
      id: "cron-fiscal",
      categoria: "operacion",
      titulo: "Cron fiscal activo (poll + jobs + alerta CAF)",
      cumplido: Boolean(process.env.CRON_SECRET),
      critico: false,
    },
    {
      id: "storage-docs",
      categoria: "documentos",
      titulo: "Bucket sii-documents con RLS por empresa",
      cumplido: true,
      critico: false,
      detalle: "Migración 63",
    },
  ];

  const criticosPendientes = items.filter((i) => i.critico && !i.cumplido).length;

  return c.json({
    data: {
      listoProduccion: criticosPendientes === 0,
      criticosPendientes,
      items,
      ambiente,
    },
  });
});