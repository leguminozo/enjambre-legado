import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import { createAnonServerClient } from '@/utils/supabase/anon-server';

export type SiteSectionItem = {
  id: string;
  section_key: string;
  content: Record<string, unknown>;
  item_order: number;
  /** es|en (migración 1001); ausente en rows legacy → es */
  locale?: string;
};

/**
 * Fecha legal desde CMS.
 * Editor (LEGAL_DOC_TEMPLATE) escribe `last_updated`; páginas leían solo `updated_at` → fecha muerta.
 */
export function resolveLegalLastUpdated(
  content: Record<string, unknown> | null | undefined,
  fallback: string,
): string {
  if (!content) return fallback;
  const last = content.last_updated;
  if (typeof last === 'string' && last.trim()) return last.trim();
  const legacy = content.updated_at;
  if (typeof legacy === 'string' && legacy.trim()) return legacy.trim();
  return fallback;
}

/**
 * Idioma activo: cookie NEXT_LOCALE (next-intl), override explícito (preview
 * por locale), default es. getLocale() falla fuera de un request intl → es.
 */
async function resolveLocale(opts?: { locale?: string }): Promise<string> {
  if (opts?.locale) return opts.locale;
  try {
    return await getLocale();
  } catch {
    return 'es';
  }
}

/**
 * Bilingüe (migración 1001): por item_order prefiere el locale pedido y cae a
 * es cuando la versión no existe. El filtro vive en JS porque la DB remota
 * puede no tener aún la columna (supabase db push pendiente).
 */
function preferLocale(
  rows: Array<SiteSectionItem & { locale?: string }>,
  requested: string,
): SiteSectionItem[] {
  const byOrder = new Map<number, { item: SiteSectionItem; locale: string }>();
  for (const row of rows) {
    const locale = row.locale ?? 'es';
    const order = row.item_order ?? 0;
    const prev = byOrder.get(order);
    if (!prev) {
      byOrder.set(order, { item: row, locale });
    } else if (locale === requested && prev.locale !== requested) {
      byOrder.set(order, { item: row, locale });
    }
  }
  return [...byOrder.values()].map((v) => v.item);
}

export const getSiteContent = cache(async function getSiteContent(
  sectionKey: string,
  opts?: { draft?: boolean; locale?: string },
): Promise<SiteSectionItem[]> {
  try {
    const supabase = createAnonServerClient();
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('section_key', sectionKey)
      .eq('is_active', true)
      .order('item_order', { ascending: true });

    if (error) {
      console.warn(`Error fetching CMS content for ${sectionKey}:`, error.message);
      return [];
    }

    const requested = await resolveLocale(opts);
    const rows = preferLocale((data ?? []) as Array<SiteSectionItem & { locale?: string }>, requested);

    // Preview del editor (?cms_preview=1): muestra draft_content (borrador)
    // por encima de lo publicado. La tienda real sigue leyendo content.
    if (opts?.draft) {
      return rows.map((row) => {
        const draft = (row as unknown as { draft_content: Record<string, unknown> | null })
          .draft_content;
        return {
          ...row,
          content: draft != null ? draft : row.content,
        };
      });
    }

    return rows;
  } catch (err) {
    console.error(`Unexpected error fetching CMS content for ${sectionKey}:`, err);
    return [];
  }
});

/** Una query para varias secciones (landing). */
export const getSiteContentBatch = cache(async function getSiteContentBatch(
  sectionKeys: string[],
  opts?: { draft?: boolean; locale?: string },
): Promise<Record<string, SiteSectionItem[]>> {
  if (sectionKeys.length === 0) return {};
  try {
    const supabase = createAnonServerClient();
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .in('section_key', sectionKeys)
      .eq('is_active', true)
      .order('item_order', { ascending: true });

    if (error) {
      console.warn('Error fetching CMS batch:', error.message);
      return Object.fromEntries(sectionKeys.map((k) => [k, []]));
    }

    const requested = await resolveLocale(opts);
    const grouped: Record<string, SiteSectionItem[]> = Object.fromEntries(
      sectionKeys.map((k) => [k, []]),
    );
    const bySection = new Map<string, Array<SiteSectionItem & { locale?: string }>>();
    for (const row of data ?? []) {
      const key = row.section_key as string;
      if (!grouped[key]) continue;
      const list = bySection.get(key) ?? [];
      list.push(row as SiteSectionItem & { locale?: string });
      bySection.set(key, list);
    }
    for (const [key, rows] of bySection) {
      const preferred = preferLocale(rows, requested);
      let items = preferred;
      if (opts?.draft) {
        items = preferred.map((row) => {
          const draft = (row as unknown as { draft_content: Record<string, unknown> | null })
            .draft_content;
          return { ...row, content: draft != null ? draft : row.content };
        });
      }
      grouped[key] = items;
    }
    return grouped;
  } catch (err) {
    console.error('Unexpected error fetching CMS batch:', err);
    return Object.fromEntries(sectionKeys.map((k) => [k, []]));
  }
});
