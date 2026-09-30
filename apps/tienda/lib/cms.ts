import { cache } from 'react';
import { headers } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { parseLegalDoc } from '@/lib/shop/store-chrome';
import { createAnonServerClient } from '@/utils/supabase/anon-server';

export type SiteSectionItem = {
  id: string;
  section_key: string;
  content: Record<string, unknown>;
  item_order: number;
  /** es|en (migración 1001); ausente en rows legacy → es */
  locale?: string;
};

export type SiteContentRow = SiteSectionItem;

/**
 * Fecha legal desde CMS.
 * Editor (LEGAL_DOC_TEMPLATE) escribe `last_updated`; páginas leían solo `updated_at` → fecha muerta.
 */
export function resolveLegalLastUpdated(
  content: Record<string, unknown> | null | undefined,
  fallback: string,
): string {
  const parsed = parseLegalDoc(content);
  return parsed.last_updated || fallback;
}

/** Título CMS; vacío / solo espacios = título del repo. */
export function resolveLegalTitle(
  content: Record<string, unknown> | null | undefined,
  fallback: string,
): string {
  return parseLegalDoc(content).title || fallback;
}

/**
 * Cuerpo CMS. Vacío / whitespace no pisa el fallback del repo
 * (un body publicado sí — el Editor de Tienda lo avisa).
 */
export function resolveLegalBody(
  content: Record<string, unknown> | null | undefined,
  fallback: string,
): string {
  return parseLegalDoc(content).body || fallback;
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
export function preferLocale(
  rows: Array<SiteSectionItem & { locale?: string }>,
  requested: string,
): SiteSectionItem[] {
  const byOrder = new Map<number, Array<SiteSectionItem & { locale?: string }>>();
  for (const row of rows) {
    const order = row.item_order ?? 0;
    const list = byOrder.get(order);
    if (!list) {
      byOrder.set(order, [row]);
    } else {
      list.push(row);
    }
  }

  const result: SiteSectionItem[] = [];
  for (const group of byOrder.values()) {
    // Si el grupo contiene variantes de idioma (es y en) para la misma posición,
    // prefiere la variante solicitada y cae a 'es'.
    const esRows = group.filter((r) => (r.locale ?? 'es') === 'es');
    const enRows = group.filter((r) => r.locale === 'en');

    if (group.length > 1 && esRows.length === 1 && enRows.length === 1) {
      result.push(requested === 'en' ? enRows[0] : esRows[0]);
    } else {
      // Si son ítems distintos que comparten item_order en el mismo idioma,
      // conserva los ítems sin descartar contenido.
      const match = group.filter((r) => (r.locale ?? 'es') === requested);
      if (match.length > 0) {
        result.push(...match);
      } else {
        result.push(...group);
      }
    }
  }
  return result;
}

/** El middleware marca x-cms-preview=1 solo con token de preview válido. */
export async function isCmsPreviewRequest(): Promise<boolean> {
  try {
    const h = await headers();
    return h.get('x-cms-preview') === '1';
  } catch {
    return false;
  }
}

import { unstable_cache } from 'next/cache';

async function fetchBatchFromSupabase(
  sectionKeys: string[],
  requestedLocale: string,
  draft: boolean,
): Promise<Record<string, SiteSectionItem[]>> {
  if (sectionKeys.length === 0) return {};
  try {
    const supabase = createAnonServerClient();
    // draft_content es JSONB pesado y solo se usa en modo borrador (preview);
    // la vía pública pide columnas explícitas para no arrastrarlo en cada hit.
    // Literales (no ternario): el parser de tipos de supabase-js no infiere uniones.
    const { data, error } = draft
      ? await supabase
          .from('site_content')
          .select('id, section_key, content, draft_content, item_order, locale')
          .in('section_key', sectionKeys)
          .eq('is_active', true)
          .order('item_order', { ascending: true })
      : await supabase
          .from('site_content')
          .select('id, section_key, content, item_order, locale')
          .in('section_key', sectionKeys)
          .eq('is_active', true)
          .order('item_order', { ascending: true });

    if (error) {
      console.warn('Error fetching CMS batch:', error.message);
      return Object.fromEntries(sectionKeys.map((k) => [k, []]));
    }

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
      const preferred = preferLocale(rows, requestedLocale);
      let items = preferred;
      if (draft) {
        items = preferred.map((row) => {
          const draftContent = (row as unknown as { draft_content: Record<string, unknown> | null })
            .draft_content;
          return { ...row, content: draftContent != null ? draftContent : row.content };
        });
      }
      grouped[key] = items;
    }
    return grouped;
  } catch (err) {
    console.error('Unexpected error fetching CMS batch:', err);
    return Object.fromEntries(sectionKeys.map((k) => [k, []]));
  }
}

const getCachedSiteContentBatch = unstable_cache(
  async (keysStr: string, locale: string) => {
    const keys = keysStr.split(',').filter(Boolean);
    return fetchBatchFromSupabase(keys, locale, false);
  },
  ['site_content_batch'],
  // TTL de 1h: frescura garantizada vía revalidateTag('site_content') on-demand
  // desde el Editor de Tienda (api/revalidate). TTL corto multiplicaba hits a
  // Postgres por cada permutación de secciones × locale (Disk IO Budget).
  { revalidate: 3600, tags: ['site_content'] },
);

/** Una query para varias secciones (landing). */
export const getSiteContentBatch = cache(async function getSiteContentBatch(
  sectionKeys: string[],
  opts?: { draft?: boolean; locale?: string },
): Promise<Record<string, SiteSectionItem[]>> {
  if (sectionKeys.length === 0) return {};
  const requested = await resolveLocale(opts);
  if (opts?.draft) {
    // Defensa central: aunque la página pida borrador por query param, solo se
    // sirven si el middleware validó el token de preview (header x-cms-preview).
    // Sin token, se degrada a contenido publicado.
    const allowed = await isCmsPreviewRequest();
    return fetchBatchFromSupabase(sectionKeys, requested, allowed);
  }
  const sortedKeys = [...sectionKeys].sort().join(',');
  // Desarrollo/test: sin caché de datos para que el CMS se refleje al
  // recargar (en producción rige ISR 300s + revalidación bajo demanda).
  if (process.env.NODE_ENV !== 'production') {
    return fetchBatchFromSupabase(sectionKeys, requested, false);
  }
  return getCachedSiteContentBatch(sortedKeys, requested);
});

export const getSiteContent = cache(async function getSiteContent(
  sectionKey: string,
  opts?: { draft?: boolean; locale?: string },
): Promise<SiteSectionItem[]> {
  const batch = await getSiteContentBatch([sectionKey], opts);
  return batch[sectionKey] ?? [];
});
