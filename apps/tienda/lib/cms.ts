import { createClient } from '@/utils/supabase/server';

export type SiteSectionItem = {
  id: string;
  section_key: string;
  content: any;
  item_order: number;
};

/**
 * Obtiene el contenido de una sección específica del CMS.
 * @param sectionKey Clave de la sección (ej. 'servicios', 'talleres')
 */
export async function getSiteContent(sectionKey: string): Promise<SiteSectionItem[]> {
  try {
    const supabase = await createClient();
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
}
