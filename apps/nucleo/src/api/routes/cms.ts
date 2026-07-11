import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { Json } from "@enjambre/database/database.types";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import { revalidateTiendaCms } from "@/lib/revalidate-tienda";

const SECTION_KEYS = [
  "servicios",
  "talleres",
  "colecciones",
  "footer_branding",
  "footer_nav",
  "footer_legal",
  "hero",
  "nosotros",
  "galeria",
  "contacto",
  "menu_settings",
  "menu_links",
  "theme_settings",
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

const ImageUploadSchema = z.object({
  section_key: z.enum(SECTION_KEYS),
  field_name: z.string().min(1),
  item_id: z.string().uuid().optional(),
});

export const cmsRoutes = new Hono<{
  Variables: AppVariables;
}>();

cmsRoutes.use("*", authMiddleware, tenantMiddleware);

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
  await revalidateTiendaCms();

  return c.json({ data }, 201);
});

cmsRoutes.patch("/items/:id", zValidator("json", UpdateContentItemSchema), async (c) => {
  const itemId = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const payload: {
    item_order?: number;
    content?: Json;
    is_active?: boolean;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };
  if (input.item_order !== undefined) payload.item_order = input.item_order;
  if (input.content !== undefined) payload.content = input.content as Json;
  if (input.is_active !== undefined) payload.is_active = input.is_active;

  const { data, error } = await supabase
    .from("site_content")
    .update(payload)
    .eq("id", itemId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  await revalidateTiendaCms();

  return c.json({ data });
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

  await revalidateTiendaCms();

  return c.json({ data: { deleted: true } });
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

  await revalidateTiendaCms();

  return c.json({ data: { reordered: items.length } });
});

cmsRoutes.post("/upload-url", zValidator("json", ImageUploadSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const filePath = `cms/${input.section_key}/${user.id}/${Date.now()}`;

  const { data, error } = await supabase.storage
    .from("cms")
    .createSignedUploadUrl(filePath);

  if (error) {
    return c.json({ code: "upload_url_failed", message: error.message }, 400);
  }

  const { data: urlData } = supabase.storage.from("cms").getPublicUrl(filePath);

  return c.json({
    data: {
      path: filePath,
      signedUrl: data?.signedUrl ?? null,
      publicUrl: urlData?.publicUrl ?? null,
    },
  });
});
