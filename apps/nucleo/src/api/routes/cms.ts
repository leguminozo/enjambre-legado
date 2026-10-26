import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@enjambre/database/database.types";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, requireProfileRole, createSupabaseUserClient } from "@/api/lib/middleware";
import { revalidateTiendaCms } from "@/lib/revalidate-tienda";
import {
  extractCmsObjectPath,
  extractCmsPaths,
  walkStorageList,
  KNOWN_STORAGE_BUCKETS,
  type ListedStorageFile,
} from "@/lib/cms-storage";
import {
  DEFAULT_B2B_SEGMENTS,
  type B2BSegmentSlug,
} from "@enjambre/shop-chrome";
import { AUTO_PUBLISH_SECTIONS, CMS_SECTION_KEYS } from "@/lib/editor-tienda-sections";
import {
  SCHEMA_SECTION_TEMPLATES,
  SETTINGS_SECTION_KEYS,
} from "@/lib/editor-tienda-schema";

/** Secciones editables. Retiradas (no consumidas por tienda): hero, footer_branding/nav/legal. */
const SECTION_KEYS = CMS_SECTION_KEYS;

const B2B_SEGMENT_EXPECTED_SLUG: Record<string, B2BSegmentSlug> = {
  b2b_cafeterias: "cafeterias",
  b2b_hoteles: "hoteles",
  b2b_tiendas_gourmet: "tiendas-gourmet",
  b2b_ferias: "ferias",
  b2b_revendedores: "revendedores",
};

const KNOWN_B2B_STORAGE_HERO_IMAGES: Record<string, string> = {
  b2b_cafeterias:
    "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_cafeterias/1edc4694-eff1-4b44-9718-4c5a4a9043cd.webp",
  b2b_hoteles:
    "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_hoteles/b5a4e451-35a5-4cd0-9ea3-a479d40fced3.webp",
  b2b_tiendas_gourmet:
    "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_tiendas_gourmet/baab6ecc-8801-4fe5-a257-9c813393c3e1.webp",
  b2b_ferias:
    "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_ferias/1441c92d-0e75-44fe-aef7-476ccb2aaf74.webp",
  b2b_revendedores:
    "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_revendedores/020189d4-756b-4ea3-995e-b3413ffef179.webp",
};

/** Rutas canónicas/semilla en Storage que NUNCA deben borrarse al reemplazar imágenes en el editor. */
const PROTECTED_STORAGE_PATHS = new Set<string>(
  Object.values(KNOWN_B2B_STORAGE_HERO_IMAGES)
    .map((url) => extractCmsObjectPath(url))
    .filter((p): p is string => Boolean(p)),
);

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
  /** Bloqueo optimista: si otro operador guardó después de esta marca, se devuelve 409. */
  expected_updated_at: z.string().min(1).optional(),
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

// ── Historial de versiones ──────────────────────────────────────────────────
// cms_content_versions llega con la migración 20260922111000; los tipos
// generados aún no la incluyen (mismo rezago documentado para draft_content).
// El cliente sin tipar se acota a este bloque con tipos locales explícitos.
const VERSIONS_KEEP = 20;

type CmsVersionSnapshot = {
  id: string;
  section_key: string;
  content: unknown;
  draft_content?: unknown;
};

type CmsVersionRow = {
  id: string;
  section_key: string;
  item_id: string | null;
  content: unknown;
  draft_content: unknown;
  changed_by: string | null;
  created_at: string;
};

function versionsTable(supabase: SupabaseClient<Database>) {
  return (supabase as unknown as SupabaseClient).from("cms_content_versions");
}

/** Guarda el estado previo; fire-and-forget: el guardado nunca falla por el historial. */
async function snapshotCmsVersion(
  supabase: SupabaseClient<Database>,
  row: CmsVersionSnapshot,
  changedBy: string | undefined,
): Promise<void> {
  try {
    const table = versionsTable(supabase);
    const { error } = await table.insert({
      section_key: row.section_key,
      item_id: row.id,
      content: row.content as Json,
      draft_content: (row.draft_content ?? null) as Json,
      changed_by: changedBy ?? null,
    });
    if (error) {
      console.warn("[cms] version snapshot failed:", error.message);
      return;
    }
    const { data: overflow } = await table
      .select("id")
      .eq("item_id", row.id)
      .order("created_at", { ascending: false })
      .range(VERSIONS_KEEP, VERSIONS_KEEP + 100);
    const ids = (Array.isArray(overflow) ? overflow : [] as Array<{ id: string }>).map((r) => r.id);
    if (ids.length > 0) {
      await table.delete().in("id", ids);
    }
  } catch (err) {
    console.warn("[cms] version snapshot failed:", err instanceof Error ? err.message : err);
  }
}

type SiteContentRow = Database["public"]["Tables"]["site_content"]["Row"];

/**
 * Autosanación idempotente del CMS:
 * 1) Deduplica cualquier sección singleton (`SETTINGS_SECTION_KEYS`) que tenga >1 fila
 *    conservando la fila más reciente (`updated_at DESC`, mayor número de claves como desempate).
 * 2) Repara filas `perfil_*_settings` inicializadas como `{}` o con defaults en español
 *    filtrados a campos `*_en` por el antiguo template vacío.
 * 3) Si una fila `b2b_*` tiene `content.slug` distinto a su segmento canónico,
 *    recupera su versión limpia desde otra fila `b2b_*`, `cms_content_versions`,
 *    o la plantilla canónica `DEFAULT_B2B_SEGMENTS` con su hero de Storage.
 */
async function healContaminatedB2BSegments(
  supabase: SupabaseClient<Database>,
  rows: SiteContentRow[],
): Promise<SiteContentRow[]> {
  try {
    let cleanedRows = rows;
    const nowIso = new Date().toISOString();

    // 1. Deduplicación universal de secciones singleton (SETTINGS_SECTION_KEYS)
    const rowsBySingletonKey = new Map<string, SiteContentRow[]>();
    for (const r of cleanedRows) {
      if (!SETTINGS_SECTION_KEYS.has(r.section_key)) continue;
      const list = rowsBySingletonKey.get(r.section_key) ?? [];
      list.push(r);
      rowsBySingletonKey.set(r.section_key, list);
    }

    const duplicateIdsToDelete: string[] = [];
    for (const [, group] of rowsBySingletonKey) {
      if (group.length <= 1) continue;
      const sorted = [...group].sort((a, b) => {
        const tsA = Date.parse(a.updated_at ?? a.created_at ?? "") || 0;
        const tsB = Date.parse(b.updated_at ?? b.created_at ?? "") || 0;
        if (tsB !== tsA) return tsB - tsA;
        const keysA =
          a.content && typeof a.content === "object" && !Array.isArray(a.content)
            ? Object.keys(a.content).length
            : 0;
        const keysB =
          b.content && typeof b.content === "object" && !Array.isArray(b.content)
            ? Object.keys(b.content).length
            : 0;
        return keysB - keysA;
      });
      for (const dup of sorted.slice(1)) {
        duplicateIdsToDelete.push(dup.id);
      }
    }

    if (duplicateIdsToDelete.length > 0) {
      await supabase.from("site_content").delete().in("id", duplicateIdsToDelete);
      const dupSet = new Set(duplicateIdsToDelete);
      cleanedRows = cleanedRows.filter((r) => !dupSet.has(r.id));
    }

    // 2. Reparación de filas perfil_*_settings vacías ({}) o con español copiado en *_en
    for (const row of cleanedRows) {
      if (!row.section_key.startsWith("perfil_") || !row.section_key.endsWith("_settings")) {
        continue;
      }
      const tmpl = SCHEMA_SECTION_TEMPLATES[row.section_key];
      if (!tmpl) continue;
      const content =
        row.content && typeof row.content === "object" && !Array.isArray(row.content)
          ? ({ ...(row.content as Record<string, unknown>) })
          : {};
      let changed = false;

      if (Object.keys(content).length === 0) {
        Object.assign(content, tmpl);
        changed = true;
      } else {
        for (const [k, tmplVal] of Object.entries(tmpl)) {
          if (!k.endsWith("_en") || typeof tmplVal !== "string") continue;
          const baseKey = k.slice(0, -3);
          const esDefault = tmpl[baseKey];
          const currentEn = content[k];
          if (
            typeof esDefault === "string" &&
            esDefault.length > 0 &&
            esDefault !== tmplVal &&
            currentEn === esDefault
          ) {
            content[k] = tmplVal;
            changed = true;
          }
        }
      }

      if (changed) {
        await supabase
          .from("site_content")
          .update({
            content: content as Json,
            draft_content: null,
            updated_at: nowIso,
          } as never)
          .eq("id", row.id);
        row.content = content as Json;
        (row as { draft_content?: unknown }).draft_content = null;
        row.updated_at = nowIso;
      }
    }

    // 3. Sanación de segmentos B2B contaminados entre pestañas
    const contaminated = cleanedRows.filter((r) => {
      const expectedSlug = B2B_SEGMENT_EXPECTED_SLUG[r.section_key];
      if (!expectedSlug) return false;
      const content = r.content as Record<string, unknown> | null;
      const slug = typeof content?.slug === "string" ? content.slug.trim() : "";
      return Boolean(slug && slug !== expectedSlug);
    });

    if (contaminated.length > 0) {
      // Captura de payloads actuales por slug antes de sobrescribir (por si hubo swap entre filas).
      const displacedBySlug = new Map<string, Record<string, unknown>>();
      for (const r of cleanedRows) {
        if (!B2B_SEGMENT_EXPECTED_SLUG[r.section_key]) continue;
        const content = r.content as Record<string, unknown> | null;
        const slug = typeof content?.slug === "string" ? content.slug.trim() : "";
        if (slug && !displacedBySlug.has(slug) && content) {
          displacedBySlug.set(slug, { ...content });
        }
      }

      // Buscar también en cms_content_versions por si un segmento fue sobrescrito sin quedar en otra fila.
      const contaminatedIds = contaminated.map((r) => r.id);
      const versionBySlug = new Map<string, Record<string, unknown>>();
      try {
        const { data: verRows } = await versionsTable(supabase)
          .select("item_id, section_key, content, created_at")
          .in("item_id", contaminatedIds)
          .order("created_at", { ascending: false })
          .limit(60);
        if (Array.isArray(verRows)) {
          for (const v of verRows as Array<{ content?: unknown }>) {
            const cObj =
              v.content && typeof v.content === "object" && !Array.isArray(v.content)
                ? (v.content as Record<string, unknown>)
                : null;
            const vSlug = typeof cObj?.slug === "string" ? cObj.slug.trim() : "";
            if (vSlug && !versionBySlug.has(vSlug) && cObj) {
              versionBySlug.set(vSlug, { ...cObj });
            }
          }
        }
      } catch {
        // Si cms_content_versions no está disponible, se usa displacedBySlug + template canónico.
      }

      for (const row of contaminated) {
        const expectedSlug = B2B_SEGMENT_EXPECTED_SLUG[row.section_key];
        if (!expectedSlug) continue;
        const defaultSeg = DEFAULT_B2B_SEGMENTS[expectedSlug];
        const strat = defaultSeg.commercial_strategy;
        const restored: Record<string, unknown> =
          versionBySlug.get(expectedSlug) ??
          displacedBySlug.get(expectedSlug) ?? {
            ...defaultSeg,
            slug: expectedSlug,
            hero_image:
              KNOWN_B2B_STORAGE_HERO_IMAGES[row.section_key] ?? defaultSeg.hero_image,
            strategy_title: strat?.titulo ?? "",
            strategy_title_en: strat?.titulo_en ?? "",
            strategy_summary: strat?.bajada ?? "",
            strategy_summary_en: strat?.bajada_en ?? "",
            strategy_ticket_boost: strat?.aumento_ticket ?? "",
            strategy_ticket_boost_en: strat?.aumento_ticket_en ?? "",
            strategy_key_tool: strat?.herramienta_clave ?? "",
            strategy_key_tool_en: strat?.herramienta_clave_en ?? "",
            strategy_steps: strat?.mecanica_ventas ?? [],
          };

        restored.slug = expectedSlug;
        if (
          KNOWN_B2B_STORAGE_HERO_IMAGES[row.section_key] &&
          (typeof restored.hero_image !== "string" ||
            !restored.hero_image.includes(`/cms/${row.section_key}/`))
        ) {
          restored.hero_image = KNOWN_B2B_STORAGE_HERO_IMAGES[row.section_key];
        }

        await supabase
          .from("site_content")
          .update({
            content: restored as Json,
            draft_content: null,
            updated_at: nowIso,
          } as never)
          .eq("id", row.id);

        row.content = restored as Json;
        (row as { draft_content?: unknown }).draft_content = null;
        row.updated_at = nowIso;
      }
    }

    // 4. Sanación de imágenes en b2b_hub_settings
    const hubRow = cleanedRows.find((r) => r.section_key === "b2b_hub_settings");
    if (hubRow && hubRow.content && typeof hubRow.content === "object" && !Array.isArray(hubRow.content)) {
      const hubContent = { ...(hubRow.content as Record<string, unknown>) };
      let hubChanged = false;
      const hubImageMap: Record<string, string> = {
        hero_image: KNOWN_B2B_STORAGE_HERO_IMAGES.b2b_cafeterias,
        seg_cafeterias_image: KNOWN_B2B_STORAGE_HERO_IMAGES.b2b_cafeterias,
        seg_hoteles_image: KNOWN_B2B_STORAGE_HERO_IMAGES.b2b_hoteles,
        seg_tiendas_gourmet_image: KNOWN_B2B_STORAGE_HERO_IMAGES.b2b_tiendas_gourmet,
        seg_ferias_image: KNOWN_B2B_STORAGE_HERO_IMAGES.b2b_ferias,
        seg_revendedores_image: KNOWN_B2B_STORAGE_HERO_IMAGES.b2b_revendedores,
      };
      for (const [key, canonicalUrl] of Object.entries(hubImageMap)) {
        const val = hubContent[key];
        if (
          typeof val === "string" &&
          (val.startsWith("/images/b2b/") ||
            val.startsWith("/assets/editorial/b2b-") ||
            val.includes("814aaec5-330b-4ff2-8872-0c540b0e7825") ||
            val.includes("bd874e95-611d-4d04-ad3a-d28a7fd7d6f5") ||
            !val.startsWith("https://"))
        ) {
          hubContent[key] = canonicalUrl;
          hubChanged = true;
        }
      }
      if (
        typeof hubContent.seg_cafeterias_h3 === "string" &&
        hubContent.seg_cafeterias_h3.includes("fidelizacio") &&
        !hubContent.seg_cafeterias_h3.includes("fidelización")
      ) {
        hubContent.seg_cafeterias_h3 = hubContent.seg_cafeterias_h3.replace("fidelizacio", "fidelización");
        hubChanged = true;
      }
      if (hubChanged) {
        await supabase
          .from("site_content")
          .update({
            content: hubContent as Json,
            draft_content: null,
            updated_at: nowIso,
          } as never)
          .eq("id", hubRow.id);
        hubRow.content = hubContent as Json;
        (hubRow as { draft_content?: unknown }).draft_content = null;
        hubRow.updated_at = nowIso;
      }
    }

    // 5. Sanación de hero_image en cada segmento b2b si está contaminado con otra categoría o ruta local
    for (const r of cleanedRows) {
      if (!B2B_SEGMENT_EXPECTED_SLUG[r.section_key]) continue;
      const canonicalHero = KNOWN_B2B_STORAGE_HERO_IMAGES[r.section_key];
      if (!canonicalHero) continue;
      const c =
        r.content && typeof r.content === "object" && !Array.isArray(r.content)
          ? { ...(r.content as Record<string, unknown>) }
          : null;
      if (!c) continue;
      const curHero = typeof c.hero_image === "string" ? c.hero_image : "";
      const isContaminated =
        !curHero ||
        curHero.startsWith("/images/b2b/") ||
        curHero.startsWith("/assets/editorial/b2b-") ||
        (r.section_key !== "b2b_cafeterias" && curHero.includes("/cms/b2b_cafeterias/")) ||
        curHero.includes("814aaec5-330b-4ff2-8872-0c540b0e7825") ||
        curHero.includes("bd874e95-611d-4d04-ad3a-d28a7fd7d6f5");
      if (isContaminated) {
        c.hero_image = canonicalHero;
        await supabase
          .from("site_content")
          .update({
            content: c as Json,
            draft_content: null,
            updated_at: nowIso,
          } as never)
          .eq("id", r.id);
        r.content = c as Json;
        (r as { draft_content?: unknown }).draft_content = null;
        r.updated_at = nowIso;
      }
    }

    return cleanedRows;
  } catch (err) {
    console.warn("[cms] healContaminatedB2BSegments warning:", err instanceof Error ? err.message : err);
    return rows;
  }
}

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

  const healed = await healContaminatedB2BSegments(supabase, data ?? []);

  const grouped: Record<string, typeof data> = {};
  for (const item of healed) {
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

  const healed = await healContaminatedB2BSegments(supabase, data ?? []);

  return c.json({ data: healed });
});

cmsRoutes.post("/items", zValidator("json", ContentItemSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const autoPublish = AUTO_PUBLISH_SECTIONS.has(input.section_key);

  const expectedB2BSlug = B2B_SEGMENT_EXPECTED_SLUG[input.section_key];
  const contentToSave = { ...input.content };
  if (expectedB2BSlug) {
    const incomingSlug = typeof contentToSave.slug === "string" ? contentToSave.slug.trim() : "";
    if (incomingSlug && incomingSlug !== expectedB2BSlug) {
      return c.json(
        {
          code: "cross_section_mismatch",
          message: "El contenido pertenece a otro segmento de Alianzas B2B y fue bloqueado para evitar sobrescritura cruzada.",
        },
        400,
      );
    }
    contentToSave.slug = expectedB2BSlug;
  }

  // Secciones singleton (SETTINGS_SECTION_KEYS): evitar duplicados si ya existe una fila.
  if (SETTINGS_SECTION_KEYS.has(input.section_key)) {
    const { data: existingRows } = await supabase
      .from("site_content")
      .select("*")
      .eq("section_key", input.section_key)
      .order("updated_at", { ascending: false });

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      const primary = existingRows[0];
      if (existingRows.length > 1) {
        await supabase
          .from("site_content")
          .delete()
          .in("id", existingRows.slice(1).map((r) => r.id));
      }
      const existingContent =
        primary.content && typeof primary.content === "object" && !Array.isArray(primary.content)
          ? (primary.content as Record<string, unknown>)
          : {};
      const mergedContent =
        Object.keys(existingContent).length > 0 ? existingContent : contentToSave;

      const { data: updated, error: updateError } = await supabase
        .from("site_content")
        .update({
          item_order: 0,
          content: (autoPublish ? mergedContent : existingContent) as Json,
          draft_content: autoPublish ? null : (mergedContent as Json),
          is_active: input.is_active,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", primary.id)
        .select("*")
        .single();

      if (updateError) {
        return c.json({ code: "item_create_failed", message: updateError.message }, 400);
      }

      if (!autoPublish) {
        return c.json({ data: updated, revalidated: false, revalidate_reason: "draft" }, 200);
      }

      const revalidate = await revalidateTiendaCms();
      return c.json(
        { data: updated, revalidated: revalidate.ok, revalidate_reason: revalidate.reason ?? null },
        200,
      );
    }
  }

  const { data, error } = await supabase
    .from("site_content")
    .insert({
      section_key: input.section_key,
      item_order: SETTINGS_SECTION_KEYS.has(input.section_key) ? 0 : input.item_order,
      content: (autoPublish ? contentToSave : {}) as Json,
      draft_content: autoPublish ? null : (contentToSave as Json),
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

  // Todo autopublica: PATCH escribe `content` vivo y limpia borrador.
  const { data: existing } = await supabase
    .from("site_content")
    .select("id, section_key, content, draft_content, updated_at")
    .eq("id", itemId)
    .single();
  if (
    input.expected_updated_at &&
    existing &&
    typeof (existing as { updated_at?: unknown }).updated_at === "string"
  ) {
    const serverTs = Date.parse((existing as { updated_at: string }).updated_at);
    const clientTs = Date.parse(input.expected_updated_at);
    if (Number.isFinite(serverTs) && Number.isFinite(clientTs) && serverTs !== clientTs) {
      return c.json(
        {
          code: "conflict",
          message: "Otro operador guardó esta sección mientras la editabas. Se recargó lo vigente: revisa y vuelve a guardar.",
          data: existing,
        },
        409,
      );
    }
  }
  const existingSectionKey = existing ? (existing.section_key as string) : "";
  const expectedB2BSlug = B2B_SEGMENT_EXPECTED_SLUG[existingSectionKey];
  let sanitizedContent = input.content;
  if (sanitizedContent !== undefined && expectedB2BSlug) {
    const incomingSlug =
      typeof sanitizedContent.slug === "string" ? sanitizedContent.slug.trim() : "";
    if (incomingSlug && incomingSlug !== expectedB2BSlug) {
      return c.json(
        {
          code: "cross_section_mismatch",
          message:
            "El contenido pertenece a otro segmento de Alianzas B2B y fue bloqueado para evitar sobrescritura cruzada.",
        },
        400,
      );
    }
    sanitizedContent = { ...sanitizedContent, slug: expectedB2BSlug };
  }

  const autoPublish = existingSectionKey
    ? AUTO_PUBLISH_SECTIONS.has(existingSectionKey)
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
  if (sanitizedContent !== undefined) {
    if (autoPublish) {
      payload.content = sanitizedContent as never;
      payload.draft_content = null as never;
    } else payload.draft_content = sanitizedContent as never;
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

  // Historial: conserva el estado previo cuando el contenido cambió, y recién
  // después limpia imágenes que ya no estén ni en vivo ni en el historial.
  if (input.content !== undefined && existing) {
    const prev = existing as unknown as CmsVersionSnapshot | null;
    if (prev) {
      const nextContent = input.content;
      void snapshotCmsVersion(
        supabase,
        {
          id: prev.id ?? itemId,
          section_key: prev.section_key,
          content: prev.content,
          draft_content: prev.draft_content,
        },
        c.get("user")?.id,
      ).then(() => {
        if (autoPublish) {
          return removeRemovedImages(supabase, itemId, prev.content, nextContent);
        }
      });
    }
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

  interface DraftRow {
    id: string;
    section_key: string;
    content: unknown;
    draft_content: unknown;
  }

  let query = supabase
    .from("site_content")
    .select("*")
    .not("draft_content", "is", null);

  if (input.section_key) query = query.eq("section_key", input.section_key);
  if (input.id) query = query.eq("id", input.id);

  const { data: rows, error: fetchErr } = await query;
  if (fetchErr) {
    return c.json({ code: "publish_failed", message: fetchErr.message }, 400);
  }

  const drafts = (rows ?? []) as unknown as DraftRow[];

  let published = 0;
  for (const draft of drafts) {
    const nextContent = draft.draft_content ?? draft.content;
    // Historial del vivo que se pisa (publicar es el overwrite más riesgoso).
    void snapshotCmsVersion(
      supabase,
      { id: draft.id, section_key: draft.section_key, content: draft.content, draft_content: draft.draft_content },
      c.get("user")?.id,
    );
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

  let fetchQuery = supabase
    .from("site_content")
    .select("id, section_key, content, draft_content")
    .not("draft_content", "is", null);

  if (input.section_key) fetchQuery = fetchQuery.eq("section_key", input.section_key);
  if (input.id) fetchQuery = fetchQuery.eq("id", input.id);

  const { data: doomed, error: fetchErr } = await fetchQuery;
  if (fetchErr) {
    return c.json({ code: "discard_failed", message: fetchErr.message }, 400);
  }

  // Descartar destruye trabajo: se conserva en el historial antes de borrar.
  const changedBy = c.get("user")?.id;
  for (const row of ((doomed ?? []) as unknown as CmsVersionSnapshot[])) {
    void snapshotCmsVersion(supabase, row, changedBy);
  }

  let query = supabase
    .from("site_content")
    .update({ draft_content: null } as never)
    .not("draft_content", "is", null);

  if (input.section_key) query = query.eq("section_key", input.section_key);
  if (input.id) query = query.eq("id", input.id);

  const { data, error } = await query.select("id");
  if (error) {
    return c.json({ code: "discard_failed", message: error.message }, 400);
  }

  // Descartar no cambia la tienda publicada: sin revalidar.
  return c.json({ data: { discarded: data?.length ?? 0 } });
});

// ── Historial de versiones: listar y restaurar ─────────────────────────────

const VersionsQuerySchema = z.object({
  section_key: z.string().optional(),
  item_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

cmsRoutes.get("/versions", zValidator("query", VersionsQuerySchema), async (c) => {
  const input = c.req.valid("query");
  const supabase = c.get("supabase");

  let query = versionsTable(supabase)
    .select("id, section_key, item_id, content, draft_content, changed_by, created_at")
    .order("created_at", { ascending: false })
    .limit(input.limit);

  if (input.section_key) query = query.eq("section_key", input.section_key);
  if (input.item_id) query = query.eq("item_id", input.item_id);

  const { data, error } = await query;
  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }
  return c.json({ data: (data ?? []) as CmsVersionRow[] });
});

cmsRoutes.post(
  "/versions/:id/restore",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const versionId = c.req.param("id");
    const supabase = c.get("supabase");

    const { data: version, error: fetchErr } = await versionsTable(supabase)
      .select("id, section_key, item_id, content, draft_content")
      .eq("id", versionId)
      .single();
    if (fetchErr || !version) {
      return c.json({ code: "version_not_found", message: "Versión no encontrada" }, 404);
    }
    const v = version as unknown as CmsVersionRow;
    if (!v.item_id) {
      return c.json({ code: "version_orphan", message: "La versión no tiene item asociado" }, 400);
    }

    const { data: current } = await supabase
      .from("site_content")
      .select("id, section_key, content, draft_content")
      .eq("id", v.item_id)
      .single();
    if (!current) {
      return c.json({ code: "item_not_found", message: "El item ya no existe" }, 404);
    }

    // El estado actual se conserva antes de restaurar (restaurar también es reversible).
    const prev = current as unknown as CmsVersionSnapshot;
    void snapshotCmsVersion(
      supabase,
      { id: prev.id ?? v.item_id, section_key: prev.section_key, content: prev.content, draft_content: prev.draft_content },
      c.get("user")?.id,
    );

    const { data, error } = await supabase
      .from("site_content")
      .update({
        content: v.content as Json,
        draft_content: (v.draft_content ?? null) as Json,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", v.item_id)
      .select("*")
      .single();
    if (error) {
      return c.json({ code: "restore_failed", message: error.message }, 400);
    }

    // Solo revalida si la restauración tocó contenido vivo (sección auto-publish).
    const revalidate = AUTO_PUBLISH_SECTIONS.has(v.section_key)
      ? await revalidateTiendaCms()
      : { ok: false as boolean, reason: "draft" as string | null };
    return c.json({ data, revalidated: revalidate.ok, revalidate_reason: revalidate.reason ?? null });
  },
);

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

  const [{ data: rows }, { data: versionRows }] = await Promise.all([
    supabase.from("site_content").select("id, content, draft_content"),
    versionsTable(supabase).select("content, draft_content"),
  ]);
  const stillReferenced = new Set<string>();
  for (const row of (rows ?? []) as unknown as Array<{
    id: string;
    content: unknown;
    draft_content: unknown;
  }>) {
    if (itemId && row.id === itemId) continue;
    const paths = new Set<string>();
    extractCmsPaths(row.content, paths);
    if (row.draft_content != null) extractCmsPaths(row.draft_content, paths);
    for (const p of paths) stillReferenced.add(p);
  }
  for (const vRow of (versionRows ?? []) as unknown as Array<{
    content: unknown;
    draft_content: unknown;
  }>) {
    const paths = new Set<string>();
    extractCmsPaths(vRow.content, paths);
    if (vRow.draft_content != null) extractCmsPaths(vRow.draft_content, paths);
    for (const p of paths) stillReferenced.add(p);
  }

  const toDelete = removed.filter(
    (p) => !stillReferenced.has(p) && !PROTECTED_STORAGE_PATHS.has(p),
  );
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
