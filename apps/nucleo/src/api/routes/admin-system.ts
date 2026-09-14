import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, tenantMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { revalidateTiendaLayout, revalidateTiendaCms } from "@/lib/revalidate-tienda";

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

const IntegrationToggleSchema = z.object({ enabled: z.boolean() });

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

  const { data: rows, error } = await supabase
    .from("integrations")
    .select("key, name, enabled")
    .order("key");

  if (error) {
    console.error("[admin-system] integrations query failed", error);
    return c.json({ error: "Failed to load integrations" }, 500);
  }

  const tiendaStatus = await fetchTiendaIntegrationsStatus();

  return c.json({
    integrations: (rows ?? []).map((row) => {
      const isMeta = row.key === "meta_ads";
      const isGoogle = row.key === "google_ads";
      return {
        key: row.key,
        name: row.name,
        enabled: row.enabled,
        configured: Boolean(tiendaStatus?.presence?.[row.key]),
        ...(isMeta
          ? {
              hasPixelId: Boolean(tiendaStatus?.metaAds?.hasPixelId),
              mode: tiendaStatus?.metaAds?.mode ?? "stub",
            }
          : {}),
        ...(isGoogle
          ? {
              hasAdsId: Boolean(tiendaStatus?.googleAds?.hasAdsId),
              hasPurchaseLabel: Boolean(tiendaStatus?.googleAds?.hasPurchaseLabel),
              mode: tiendaStatus?.googleAds?.mode ?? "stub",
            }
          : {}),
      };
    }),
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin-system/integrations/:key  — toggle `enabled` (kill-switch).
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
  const parsed = IntegrationToggleSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Body debe ser { enabled: boolean }" }, 400);
  }

  const supabase = c.var.supabase;
  const { data: existing } = await supabase
    .from("integrations")
    .select("key")
    .eq("key", key)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("integrations")
      .update({ enabled: parsed.data.enabled, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) {
      console.error("[admin-system] integrations update failed", error);
      return c.json({ error: "Failed to update integration" }, 500);
    }
  } else {
    const { error } = await supabase
      .from("integrations")
      .insert({ key, name: key, enabled: parsed.data.enabled });
    if (error) {
      console.error("[admin-system] integrations insert failed", error);
      return c.json({ error: "Failed to create integration" }, 500);
    }
  }

  return c.json({ ok: true, key, enabled: parsed.data.enabled });
});

