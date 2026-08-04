import { cache } from 'react';
import { createAnonServerClient } from '@/utils/supabase/anon-server';

export type SiteSectionItem = {
  id: string;
  section_key: string;
  content: Record<string, unknown>;
  item_order: number;
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

export const getSiteContent = cache(async function getSiteContent(
  sectionKey: string,
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

    return data || [];
  } catch (err) {
    console.error(`Unexpected error fetching CMS content for ${sectionKey}:`, err);
    return [];
  }
});

/** Una query para varias secciones (landing). */
export const getSiteContentBatch = cache(async function getSiteContentBatch(
  sectionKeys: string[],
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

    const grouped: Record<string, SiteSectionItem[]> = Object.fromEntries(
      sectionKeys.map((k) => [k, []]),
    );
    for (const row of data ?? []) {
      const key = row.section_key as string;
      if (grouped[key]) grouped[key].push(row as SiteSectionItem);
    }
    return grouped;
  } catch (err) {
    console.error('Unexpected error fetching CMS batch:', err);
    return Object.fromEntries(sectionKeys.map((k) => [k, []]));
  }
});
