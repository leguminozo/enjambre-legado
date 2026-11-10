import { Hono } from "hono";
import { z } from "zod";
import type { Json } from "@enjambre/database";
import { authMiddleware, tenantMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { revalidateTiendaLayout, revalidateTiendaCms } from "@/lib/revalidate-tienda";
import { buildPagosGoLiveChecklist } from "@/api/lib/payments/go-live-checklist";

export const adminSystemRoutes = new Hono<{ Variables: AppVariables }>();

adminSystemRoutes.use("*", authMiddleware);
adminSystemRoutes.use("*", tenantMiddleware);
adminSystemRoutes.use("*", requireProfileRole("admin"));

// ---------------------------------------------------------------------------
// POST /api/admin-system/purge-cache
// Invalida el cache on-demand de la tienda (layout + páginas CMS).
// Vive dentro del BFF para heredar JWT + CSRF + rate-limit + rol admin.
// Delega en revalidateTiendaLayout y revalidateTiendaCms (lib).
// ---------------------------------------------------------------------------

adminSystemRoutes.post("/purge-cache", async (c) => {
  const [layoutResult, cmsResult] = await Promise.allSettled([
    revalidateTiendaLayout(),
    revalidateTiendaCms(),
  ]);

  const layout = layoutResult.status === "fulfilled" ? layoutResult.value : { ok: false, reason: "network" as const };
  const cms = cmsResult.status === "fulfilled" ? cmsResult.value : { ok: false, reason: "network" as const };

  if (!layout.ok && !cms.ok) {
    return c.json(
      { error: `Tienda revalidate falló: ${layout.reason || cms.reason}${layout.status ? ` (${layout.status})` : ""}` },
      500,
    );
  }
  return c.json({ success: true, layout: layout.ok, cms: cms.ok });
});

// ---------------------------------------------------------------------------
// GET /api/admin-system/integrations
// Estado data-driven de `integrations` (enabled) + presencia de secretos desde
// la tienda (GET /api/integrations/status, Bearer interno). Solo booleanos:
// los secretos viven en env de la tienda y nunca se exponen.
// ---------------------------------------------------------------------------

const IntegrationUpdateSchema = z
  .object({
    enabled: z.boolean().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => data.enabled !== undefined || data.config !== undefined, {
    message: "Debe proveer enabled o config",
  });

function tiendaBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_URL_TIENDA ||
    process.env.NEXT_PUBLIC_TIENDA_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "");
}

function tiendaInternalSecret(): string {
  return (
    process.env.CMS_REVALIDATE_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    ""
  );
}

type TiendaIntegrationsStatus = {
  presence?: Record<string, boolean>;
  metaAds?: { hasPixelId: boolean; mode: "live" | "stub" };
  googleAds?: { hasAdsId: boolean; hasPurchaseLabel: boolean; mode: "live" | "stub" };
};

async function fetchTiendaIntegrationsStatus(): Promise<TiendaIntegrationsStatus | null> {
  const base = tiendaBaseUrl();
  if (!base) return null;
  const secret = tiendaInternalSecret();
  try {
    const res = await fetch(`${base}/api/integrations/status`, {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as TiendaIntegrationsStatus & { ok?: boolean };
    return data.ok ? data : null;
  } catch (err) {
    console.warn("[admin-system] fetch tienda integrations status failed", err);
    return null;
  }
}

adminSystemRoutes.get("/integrations", async (c) => {
  const supabase = c.var.supabase;
  const empresaId = c.var.empresaId;

  const [integrationsResult, sumupResult, bancoResult, certResult, cafResult] = await Promise.allSettled([
    supabase.from("integrations").select("key, name, enabled, config").order("key"),
    supabase.from("sumup_config").select("enabled, environment, last_sync, merchant_code").eq("empresa_id", empresaId).maybeSingle(),
    supabase.from("banco_chile_config").select("enabled, environment, last_sync, client_id").eq("empresa_id", empresaId).maybeSingle(),
    supabase.from("sii_certificados").select("id, activo").eq("empresa_id", empresaId).eq("activo", true).maybeSingle(),
    supabase.from("sii_caf").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId),
  ]);

  const rows = integrationsResult.status === "fulfilled" && !integrationsResult.value.error ? integrationsResult.value.data ?? [] : [];
  const sumupConfig = sumupResult.status === "fulfilled" && !sumupResult.value.error ? sumupResult.value.data : null;
  const bancoConfig = bancoResult.status === "fulfilled" && !bancoResult.value.error ? bancoResult.value.data : null;
  const certRow = certResult.status === "fulfilled" && !certResult.value.error ? certResult.value.data : null;
  const cafCount = cafResult.status === "fulfilled" && !cafResult.value.error ? cafResult.value.count : null;

  // 1. Diagnóstico de salud real de pasarelas de pago y finanzas
  const checklist = buildPagosGoLiveChecklist();
  const webpayOperativo = checklist.listoPasarela;
  const sumupOperativo = Boolean(sumupConfig?.enabled && sumupConfig?.merchant_code);
  const bancoOperativo = Boolean(bancoConfig?.enabled && bancoConfig?.client_id);

  const gateways = [
    {
      key: "webpay",
      name: checklist.provider === "transbank" ? "Transbank Webpay" : "Flow Pagos Web",
      subtitle: "Checkout Tienda Online",
      status: webpayOperativo ? ("operational" as const) : ("missing_credentials" as const),
      statusLabel: webpayOperativo ? "Operativo" : "Sin credenciales",
      environment: checklist.isProduction ? "Producción" : "Integración / Pruebas",
      active: webpayOperativo,
      href: "/pagos",
      details: webpayOperativo
        ? "Credenciales activas en plataforma"
        : `Falta configurar credenciales de ${checklist.provider === "transbank" ? "Transbank" : "Flow"}`,
    },
    {
      key: "sumup",
      name: "SumUp POS",
      subtitle: "Punto de Venta POS Feria",
      status: sumupOperativo
        ? ("operational" as const)
        : sumupConfig
          ? ("inactive" as const)
          : ("missing_credentials" as const),
      statusLabel: sumupOperativo ? "Conectado" : sumupConfig ? "Inactivo" : "Sin credenciales",
      environment: sumupConfig?.environment ?? "sandbox",
      active: sumupOperativo,
      lastSync: sumupConfig?.last_sync ?? null,
      href: "/pagos",
      details: sumupOperativo
        ? "Terminales vinculados y listos para cobro"
        : sumupConfig
          ? "Configuración guardada pero terminal inactivo"
          : "Falta vincular credenciales en Terminales POS",
    },
    {
      key: "banco_chile",
      name: "Banco de Chile",
      subtitle: "API Conciliación Bancaria",
      status: bancoOperativo
        ? ("operational" as const)
        : bancoConfig
          ? ("inactive" as const)
          : ("missing_credentials" as const),
      statusLabel: bancoOperativo ? "Autenticado" : bancoConfig ? "Inactivo" : "Sin credenciales",
      environment: bancoConfig?.environment ?? "sandbox",
      active: bancoOperativo,
      lastSync: bancoConfig?.last_sync ?? null,
      href: "/banco",
      details: bancoOperativo
        ? "Conexión bancaria activa para conciliación de cuentas"
        : bancoConfig
          ? "Configuración guardada pero sincronización inactiva"
          : "Falta configurar credenciales bancarias",
    },
  ];

  // 2. Diagnóstico de servicios del ecosistema (SII y Correos)
  const siiOperativo = Boolean(certRow || (typeof cafCount === "number" && cafCount > 0));
  const notifOperativo = Boolean(process.env.RESEND_API_KEY?.trim());

  const services = [
    {
      key: "sii",
      name: "Servicio de Impuestos Internos (SII)",
      subtitle: "Emisión de DTE, RCV y folios CAF",
      configured: siiOperativo,
      statusLabel: siiOperativo ? "Operativo" : "Requiere certificados / CAF",
      href: "/sii",
    },
    {
      key: "notificaciones",
      name: "Mensajería & Correos",
      subtitle: "Notificaciones transaccionales a clientes y equipo",
      configured: notifOperativo,
      statusLabel: notifOperativo ? "Operativo" : "Sin proveedor de correo",
      href: "/configuracion/correos",
    },
  ];

  const tiendaStatus = await fetchTiendaIntegrationsStatus();

  return c.json({
    gateways,
    cache: {
      tiendaConfigured: Boolean(tiendaBaseUrl()),
      secretConfigured: Boolean(tiendaInternalSecret()),
    },
    services,
    integrations: (rows ?? []).map((row) => {
      const isMeta = row.key === "meta_ads";
      const isGoogle = row.key === "google_ads";
      const rowCfg = (row.config as Record<string, unknown> | null) ?? {};

      const dbPixelId = typeof rowCfg.pixel_id === "string" ? rowCfg.pixel_id.trim() : "";
      const dbHasCapiToken = typeof rowCfg.capi_token === "string" && rowCfg.capi_token.trim().length > 0;
      const dbTestEventCode = typeof rowCfg.test_event_code === "string" ? rowCfg.test_event_code.trim() : "";
      const dbAdsId = typeof rowCfg.ads_id === "string" ? rowCfg.ads_id.trim() : "";
      const dbPurchaseLabel = typeof rowCfg.purchase_label === "string" ? rowCfg.purchase_label.trim() : "";

      const hasPixelId = Boolean(dbPixelId || tiendaStatus?.metaAds?.hasPixelId);
      const hasCapiToken = Boolean(dbHasCapiToken || tiendaStatus?.presence?.meta_ads);
      const hasAdsId = Boolean(dbAdsId || tiendaStatus?.googleAds?.hasAdsId);
      const hasPurchaseLabel = Boolean(dbPurchaseLabel || tiendaStatus?.googleAds?.hasPurchaseLabel);

      const isConfigured = isMeta
        ? Boolean(hasPixelId && hasCapiToken)
        : isGoogle
          ? Boolean(hasAdsId)
          : row.key === "sii"
            ? siiOperativo
            : row.key === "notificaciones"
              ? notifOperativo
              : row.key === "banco_chile" || row.key === "bancos"
                ? bancoOperativo
                : Boolean(tiendaStatus?.presence?.[row.key]);

      const mode = isMeta
        ? (row.enabled && hasPixelId && hasCapiToken ? "live" : "stub")
        : isGoogle
          ? (row.enabled && hasAdsId ? "live" : "stub")
          : (tiendaStatus?.presence?.[row.key] ? "live" : "stub");

      return {
        key: row.key,
        name: row.name,
        enabled: row.enabled,
        configured: isConfigured,
        mode,
        ...(isMeta
          ? {
              pixelId: dbPixelId,
              hasPixelId,
              hasCapiToken,
              testEventCode: dbTestEventCode,
            }
          : {}),
        ...(isGoogle
          ? {
              adsId: dbAdsId,
              hasAdsId,
              purchaseLabel: dbPurchaseLabel,
              hasPurchaseLabel,
            }
          : {}),
      };
    }),
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin-system/integrations/:key  — toggle `enabled` y configuración.
// Upsert por key (RLS is_gerente/is_admin cubre insert/update).
// ---------------------------------------------------------------------------

adminSystemRoutes.patch("/integrations/:key", async (c) => {
  const key = c.req.param("key");
  if (!key || key.length > 50) {
    return c.json({ error: "Invalid key" }, 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const parsed = IntegrationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Payload inválido. Debe proveer enabled y/o config" }, 400);
  }

  const supabase = c.var.supabase;
  const { data: existing } = await supabase
    .from("integrations")
    .select("key, name, enabled, config")
    .eq("key", key)
    .maybeSingle();

  const existingConfig = (existing?.config as Record<string, unknown> | null) ?? {};
  let nextConfig = { ...existingConfig };

  if (parsed.data.config) {
    if (key === "meta_ads") {
      const p = parsed.data.config;
      if (typeof p.pixel_id === "string") nextConfig.pixel_id = p.pixel_id.trim();
      // Solo actualiza capi_token si viene provisto y no vacío; si viene vacío no sobreescribe
      if (typeof p.capi_token === "string" && p.capi_token.trim().length > 0) {
        nextConfig.capi_token = p.capi_token.trim();
      }
      if (typeof p.test_event_code === "string") {
        nextConfig.test_event_code = p.test_event_code.trim();
      }
    } else if (key === "google_ads") {
      const p = parsed.data.config;
      if (typeof p.ads_id === "string") nextConfig.ads_id = p.ads_id.trim();
      if (typeof p.purchase_label === "string") nextConfig.purchase_label = p.purchase_label.trim();
    } else {
      nextConfig = { ...nextConfig, ...parsed.data.config };
    }
  }

  const nextEnabled = parsed.data.enabled !== undefined ? parsed.data.enabled : (existing?.enabled ?? false);

  if (existing) {
    const { error } = await supabase
      .from("integrations")
      .update({
        enabled: nextEnabled,
        config: nextConfig as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key);
    if (error) {
      console.error("[admin-system] integrations update failed", error);
      return c.json({ error: "Failed to update integration" }, 500);
    }
  } else {
    const defaultName = key === "meta_ads"
      ? "Meta Ads (pixel + CAPI)"
      : key === "google_ads"
        ? "Google Ads (gtag + conversión)"
        : key;

    const { error } = await supabase
      .from("integrations")
      .insert({
        key,
        name: defaultName,
        enabled: nextEnabled,
        config: nextConfig as unknown as Json,
      });
    if (error) {
      console.error("[admin-system] integrations insert failed", error);
      return c.json({ error: "Failed to create integration" }, 500);
    }
  }

  // Notificar a la tienda para invalidar caché y recargar configuración
  void revalidateTiendaLayout().catch((err) => {
    console.warn("[admin-system] revalidateTiendaLayout failed after integration update", err);
  });

  return c.json({ ok: true, key, enabled: nextEnabled });
});

