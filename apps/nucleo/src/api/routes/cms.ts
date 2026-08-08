import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { Json } from "@enjambre/database/database.types";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, requireProfileRole } from "@/api/lib/middleware";
import { revalidateTiendaCms } from "@/lib/revalidate-tienda";

/** Secciones editables. Retiradas (no consumidas por tienda): hero, footer_branding/nav/legal. */
const SECTION_KEYS = [
  "talleres",
  "colecciones",
  "nosotros",
  "galeria",
  "contacto",
  "ciencia",
  "menu_settings",
  "menu_links",
  "theme_settings",
  "typography_settings",
  "announcement_settings",
  "announcement_slides",
  "footer_settings",
  "footer_social",
  "pwa_nav_settings",
  "pwa_nav_items",
  "brand_assets",
  "landing_layout",
  "catalog_settings",
  "pdp_settings",
  "seo_defaults",
  "contact_settings",
  "campaign_banners",
  "seasonal_settings",
  "conservation_content",
  "media_items",
  "video_settings",
  "map_settings",
  "products_settings",
  "legal_terminos",
  "legal_privacidad",
  "legal_cookies",
  "legal_envio",
  "legal_reembolso",
  "legal_cancelacion",
  "legal_garantia",
] as const;

const ContentItemSchema = z.object({
  section_key: z.enum(SECTION_KEYS),
  item_order: z.number().int().min(0).default(0),
  content: z.record(z.string(), z.unknown()),
  is_active: z.boolean().default(true),
});

const UpdateContentItemSchema = z.object({
  item_order: z.number().int().min(0).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
});

const ReorderItemSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      item_order: z.number().int().min(0),
    })
  ),
});

const PublishSchema = z.object({
  /** Publica una sección completa o un item puntual (id). Vacío = todo. */
  section_key: z.string().optional(),
  id: z.string().uuid().optional(),
});

const DiscardSchema = z.object({
  id: z.string().uuid().optional(),
  section_key: z.string().optional(),
});

/**
 * Secciones de diseño/chrome que se publican SOLAS (PATCH escribe `content`
 * directo): la tienda las lee en el layout (loadStoreChrome) y su preview no
 * es por página. El resto del contenido pasa por borrador (draft_content) y
 * se publica con POST /api/cms/publish.
 */
const AUTO_PUBLISH_SECTIONS = new Set<string>([
  "theme_settings",
  "typography_settings",
  "announcement_settings",
  "announcement_slides",
  "footer_settings",
  "footer_social",
  "pwa_nav_settings",
  "pwa_nav_items",
  "brand_assets",
  "catalog_settings",
  "pdp_settings",
  "seo_defaults",
  "contact_settings",
  "campaign_banners",
  "seasonal_settings",
  "menu_settings",
  "menu_links",
]);

export const cmsRoutes = new Hono<{
  Variables: AppVariables;
}>();

// UI / ROUTE_ROLE_GUARDS: /editor-tienda solo admin. BFF alineado fail-closed.
// site_content es global (sin empresa_id): no exigir tenantMiddleware —
// admin sin fila en usuarios_empresas veía 403 y el editor “roto”.
cmsRoutes.use("*", authMiddleware, requireProfileRole("admin"));

cmsRoutes.get("/sections", async (c) => {
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .order("section_key", { ascending: true })
    .order("item_order", { ascending: true });

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  const grouped: Record<string, typeof data> = {};
  for (const item of data ?? []) {
    const key = item.section_key as string;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  return c.json({ data: grouped, sections: SECTION_KEYS });
});

cmsRoutes.get("/sections/:key", async (c) => {
  const supabase = c.get("supabase");
  const key = c.req.param("key");

  if (!SECTION_KEYS.includes(key as (typeof SECTION_KEYS)[number])) {
    return c.json({ code: "invalid_section", message: `Unknown section key: ${key}` }, 400);
  }

  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("section_key", key)
    .order("item_order", { ascending: true });

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

cmsRoutes.post("/items", zValidator("json", ContentItemSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("site_content")
    .insert({
      section_key: input.section_key,
      item_order: input.item_order,
      content: input.content as Json,
      is_active: input.is_active,
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "item_create_failed", message: error.message }, 400);
  }

// Await: el editor refresca el iframe al recibir 200; ISR debe estar invalidado
  const revalidate = await revalidateTiendaCms();

  return c.json({ data, revalidated: revalidate.ok, revalidate_reason: revalidate.reason ?? null }, 201);
});

cmsRoutes.patch("/items/:id", zValidator("json", UpdateContentItemSchema), async (c) => {
  const itemId = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  // Secciones auto-publish (chrome) escriben `content` (live); el resto escribe
  // draft_content (borrador) — la tienda sigue leyendo content hasta publicar.
  const { data: existing } = await supabase
    .from("site_content")
    .select("section_key")
    .eq("id", itemId)
    .single();
  const autoPublish = existing
    ? AUTO_PUBLISH_SECTIONS.has(existing.section_key as string)
    : false;

  const payload: {
    item_order?: number;
    is_active?: boolean;
    updated_at: string;
    // draft_content llega con la migración 1000; los tipos generados aún no lo
    // conocen (la DB remota lo aplica con supabase db push).
    content?: never;
    draft_content?: never;
  } = {
    updated_at: new Date().toISOString(),
  };
  if (input.item_order !== undefined) payload.item_order = input.item_order;
  if (input.is_active !== undefined) payload.is_active = input.is_active;
  if (input.content !== undefined) {
    if (autoPublish) payload.content = input.content as never;
    else payload.draft_content = input.content as never;
  }

  const { data, error } = await supabase
    .from("site_content")
    .update(payload as never)
    .eq("id", itemId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  // El borrador NO revalida la tienda (la página publicada no cambió);
  // el iframe de preview la recarga igual con ?cms_preview=1.
  if (!autoPublish && input.content !== undefined) {
    return c.json({ data, revalidated: false, revalidate_reason: "draft" });
  }

  const revalidate = await revalidateTiendaCms();

  return c.json({ data, revalidated: revalidate.ok, revalidate_reason: revalidate.reason ?? null });
});

cmsRoutes.post("/publish", zValidator("json", PublishSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  // Supabase update() no asigna columna-a-columna (content = draft_content) y
  // los tipos generados aún no tienen draft_content (migración 1000): traemos
  // todo y filtramos en JS (admin, volumen bajo).
  interface DraftRow {
    id: string;
    section_key: string;
    content: unknown;
    draft_content: unknown;
  }

  const { data: rows, error: fetchErr } = await supabase
    .from("site_content")
    .select("*");
  if (fetchErr) {
    return c.json({ code: "publish_failed", message: fetchErr.message }, 400);
  }

  const drafts = (rows ?? [])
    .map((r) => r as unknown as DraftRow)
    .filter((r) => r.draft_content != null)
    .filter((r) => !input.section_key || r.section_key === input.section_key)
    .filter((r) => !input.id || r.id === input.id);

  let published = 0;
  for (const draft of drafts) {
    const { error } = await supabase
      .from("site_content")
      .update({
        content: (draft.draft_content ?? draft.content) as Json,
        draft_content: null,
        published_at: new Date().toISOString(),
      } as never)
      .eq("id", draft.id);
    if (error) {
      return c.json({ code: "publish_failed", message: error.message }, 400);
    }
    published += 1;
  }

  const revalidate = await revalidateTiendaCms();
  return c.json({
    data: { published },
    revalidated: revalidate.ok,
    revalidate_reason: revalidate.reason ?? null,
  });
});

cmsRoutes.post("/discard", zValidator("json", DiscardSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  interface DraftRow {
    id: string;
    section_key: string;
    draft_content: unknown;
  }

  const { data: rows, error: fetchErr } = await supabase
    .from("site_content")
    .select("*");
  if (fetchErr) {
    return c.json({ code: "discard_failed", message: fetchErr.message }, 400);
  }

  const ids = (rows ?? [])
    .map((r) => r as unknown as DraftRow)
    .filter((r) => r.draft_content != null)
    .filter((r) => !input.section_key || r.section_key === input.section_key)
    .filter((r) => !input.id || r.id === input.id)
    .map((r) => r.id);

  if (ids.length > 0) {
    const { error } = await supabase
      .from("site_content")
      .update({ draft_content: null } as never)
      .in("id", ids);
    if (error) {
      return c.json({ code: "discard_failed", message: error.message }, 400);
    }
  }

  // Descartar no cambia la tienda publicada: sin revalidar.
  return c.json({ data: { discarded: ids.length } });
});

cmsRoutes.delete("/items/:id", async (c) => {
  const itemId = c.req.param("id");
  const supabase = c.get("supabase");

  const { error } = await supabase
    .from("site_content")
    .delete()
    .eq("id", itemId);

  if (error) {
    return c.json({ code: "delete_failed", message: error.message }, 400);
  }

  const revalidate = await revalidateTiendaCms();

  return c.json({
    data: { deleted: true },
    revalidated: revalidate.ok,
    revalidate_reason: revalidate.reason ?? null,
  });
});

cmsRoutes.post("/reorder", zValidator("json", ReorderItemSchema), async (c) => {
  const { items } = c.req.valid("json");
  const supabase = c.get("supabase");

  const updates = items.map(({ id, item_order }) =>
    supabase
      .from("site_content")
      .update({ item_order, updated_at: new Date().toISOString() })
      .eq("id", id)
  );

  const results = await Promise.all(updates);
  const failed = results.filter((r) => r.error);

  if (failed.length > 0) {
    return c.json({
      code: "reorder_partial_failure",
      message: `${failed.length} of ${items.length} updates failed`,
    }, 207);
  }

  const revalidate = await revalidateTiendaCms();

  return c.json({
    data: { reordered: items.length },
    revalidated: revalidate.ok,
    revalidate_reason: revalidate.reason ?? null,
  });
});
