import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { Json } from "@enjambre/database/database.types";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, requireProfileRole, createSupabaseUserClient } from "@/api/lib/middleware";
import { revalidateTiendaCms } from "@/lib/revalidate-tienda";
import {
  extractCmsPaths,
  walkStorageList,
  KNOWN_STORAGE_BUCKETS,
  type ListedStorageFile,
} from "@/lib/cms-storage";
import { AUTO_PUBLISH_SECTIONS, CMS_SECTION_KEYS } from "@/lib/editor-tienda-sections";

/** Secciones editables. Retiradas (no consumidas por tienda): hero, footer_branding/nav/legal. */
const SECTION_KEYS = CMS_SECTION_KEYS;

const ContentItemSchema = z.object({
  section_key: z.enum(SECTION_KEYS),
  item_order: z.number().int().min(0).default(0),
  content: z.record(z.string(), z.unknown()),
  is_active: z.boolean().default(true),
  /** es|en (migración 1001). La tienda cae a es por item si falta la versión. */
  locale: z.enum(["es", "en"]).default("es"),
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
  const autoPublish = AUTO_PUBLISH_SECTIONS.has(input.section_key);

  const { data, error } = await supabase
    .from("site_content")
    .insert({
      section_key: input.section_key,
      item_order: input.item_order,
      content: (autoPublish ? input.content : {}) as Json,
      draft_content: autoPublish ? null : (input.content as Json),
      is_active: input.is_active,
      locale: input.locale as never,
    } as never)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "item_create_failed", message: error.message }, 400);
  }

  if (!autoPublish) {
    return c.json({ data, revalidated: false, revalidate_reason: "draft" }, 201);
  }

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
    .select("section_key, content")
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
    if (autoPublish) {
      payload.content = input.content as never;
      payload.draft_content = null as never;
      // Limpieza segura: solo acá lo publicado cambió al instante, así que las
      // imágenes que salieron del content ya no las referencia nadie (vivo).
      // locale-safe: otra fila (p.ej. EN) puede seguir usándolas.
      void removeRemovedImages(supabase, itemId, (existing as { content?: unknown } | null)?.content, input.content);
    } else payload.draft_content = input.content as never;
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
    const nextContent = draft.draft_content ?? draft.content;
    const { error } = await supabase
      .from("site_content")
      .update({
        content: nextContent as Json,
        draft_content: null,
        published_at: new Date().toISOString(),
      } as never)
      .eq("id", draft.id);
    if (error) {
      return c.json({ code: "publish_failed", message: error.message }, 400);
    }
    // Limpieza segura en el momento exacto en que lo publicado cambia:
    // imágenes que salieron del content ya no las referencia nadie (vivo).
    // locale-safe: la fila hermana de otra locale puede seguir usándolas.
    await removeRemovedImages(supabase, draft.id, draft.content, nextContent);
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

// ── Gestión de imágenes (bucket cms) ────────────────────────────────────────

/** Paths del bucket cms referenciados por CUALQUIER content/draft_content. */
async function collectReferencedPaths(
  supabase: ReturnType<typeof createSupabaseUserClient>,
): Promise<{ referenced: Set<string>; sectionsByPath: Map<string, string[]> }> {
  const referenced = new Set<string>();
  const sectionsByPath = new Map<string, string[]>();
  const { data: rows } = await supabase.from("site_content").select("*");
  for (const row of rows ?? []) {
    const sectionKey = String(row.section_key ?? "");
    const paths = new Set<string>();
    extractCmsPaths(
      (row as unknown as { content: unknown }).content,
      paths,
    );
    const draft = (row as unknown as { draft_content: unknown }).draft_content;
    if (draft != null) extractCmsPaths(draft, paths);
    for (const p of paths) {
      referenced.add(p);
      const sections = sectionsByPath.get(p) ?? [];
      if (!sections.includes(sectionKey)) sections.push(sectionKey);
      sectionsByPath.set(p, sections);
    }
  }
  return { referenced, sectionsByPath };
}

async function listBucketFiles(
  supabase: ReturnType<typeof createSupabaseUserClient>,
  bucket: string,
): Promise<ListedStorageFile[]> {
  return walkStorageList(async (prefix) => {
    const pageSize = 1000;
    const out: Array<{
      name: string;
      id?: string | null;
      metadata?: { size?: number } | null;
      created_at?: string | null;
    }> = [];
    let offset = 0;
    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, {
        limit: pageSize,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw error;
      const batch = data ?? [];
      out.push(...batch);
      if (batch.length < pageSize) break;
      offset += pageSize;
    }
    return out;
  });
}

/** Lista recursiva del bucket cms (cms/{seccion}/archivo, no solo un nivel). */
async function listCmsImages(
  supabase: ReturnType<typeof createSupabaseUserClient>,
): Promise<ListedStorageFile[]> {
  return listBucketFiles(supabase, "cms");
}

/**
 * Borra del bucket las imágenes que salieron del contenido (best-effort).
 * locale-safe: una fila hermana (p.ej. la versión EN del mismo item) puede
 * seguir referenciando el path — solo se borra lo que NINGUNA otra fila usa.
 */
async function removeRemovedImages(
  supabase: ReturnType<typeof createSupabaseUserClient>,
  itemId: string | null,
  oldContent: unknown,
  newContent: unknown,
): Promise<void> {
  const oldPaths = new Set<string>();
  const newPaths = new Set<string>();
  extractCmsPaths(oldContent, oldPaths);
  extractCmsPaths(newContent, newPaths);
  const removed = [...oldPaths].filter((p) => !newPaths.has(p));
  if (removed.length === 0) return;

  const { data: rows } = await supabase
    .from("site_content")
    .select("content, draft_content");
  const stillReferenced = new Set<string>();
  for (const row of (rows ?? []) as unknown as Array<{
    id: string;
    content: unknown;
    draft_content: unknown;
  }>) {
    if (itemId && row.id === itemId) continue;
    const paths = new Set<string>();
    extractCmsPaths((row as unknown as { content: unknown }).content, paths);
    const draft = (row as unknown as { draft_content: unknown }).draft_content;
    if (draft != null) extractCmsPaths(draft, paths);
    for (const p of paths) stillReferenced.add(p);
  }

  const toDelete = removed.filter((p) => !stillReferenced.has(p));
  if (toDelete.length > 0) {
    void supabase.storage.from("cms").remove(toDelete).catch(() => {});
  }
}

cmsRoutes.get("/images", async (c) => {
  const supabase = c.get("supabase");
  try {
    const [images, { referenced, sectionsByPath }, otherBuckets] = await Promise.all([
      listCmsImages(supabase),
      collectReferencedPaths(supabase),
      Promise.all(
        KNOWN_STORAGE_BUCKETS.filter((meta) => meta.id !== "cms").map(async (meta) => {
          try {
            const files = await listBucketFiles(supabase, meta.id);
            return { ...meta, files: files.length, error: null as string | null };
          } catch (err) {
            return {
              ...meta,
              files: 0,
              error: err instanceof Error ? err.message : "sin permiso o bucket ausente",
            };
          }
        }),
      ),
    ]);
    const cmsMeta = KNOWN_STORAGE_BUCKETS.find((b) => b.id === "cms")!;
    const buckets = [
      { ...cmsMeta, files: images.length, error: null as string | null },
      ...otherBuckets,
    ];
    const listed = new Set(images.map((img) => img.path));
    const merged = [...images];
    for (const path of referenced) {
      if (listed.has(path)) continue;
      merged.push({
        path,
        name: path.split("/").pop() ?? path,
        size: 0,
        created_at: null,
      });
    }
    const items = merged.map((img) => ({
      ...img,
      referenced: referenced.has(img.path),
      sections: sectionsByPath.get(img.path) ?? [],
    }));
    return c.json({
      data: items,
      orphans: items.filter((i) => !i.referenced).length,
      buckets,
    });
  } catch (err) {
    return c.json(
      { code: "images_list_failed", message: err instanceof Error ? err.message : "Error listando imágenes" },
      500,
    );
  }
});

const DeleteImagesSchema = z.object({
  paths: z.array(z.string()).optional(),
  orphansOnly: z.boolean().optional(),
});

cmsRoutes.delete("/images", zValidator("json", DeleteImagesSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  try {
    let paths = input.paths ?? [];
    if (input.orphansOnly) {
      const [images, { referenced }] = await Promise.all([
        listCmsImages(supabase),
        collectReferencedPaths(supabase),
      ]);
      paths = images.filter((img) => !referenced.has(img.path)).map((img) => img.path);
    }
    if (paths.length === 0) return c.json({ data: { removed: 0 } });
    const { error } = await supabase.storage.from("cms").remove(paths);
    if (error) {
      return c.json({ code: "images_delete_failed", message: error.message }, 400);
    }
    return c.json({ data: { removed: paths.length } });
  } catch (err) {
    return c.json(
      { code: "images_delete_failed", message: err instanceof Error ? err.message : "Error borrando imágenes" },
      500,
    );
  }
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
