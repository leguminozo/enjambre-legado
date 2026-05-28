import { createClient } from '@/utils/supabase/server';
import { createClient as createAnonClient } from '@/utils/supabase/client';

export type SiteSectionItem = {
  id: string;
  section_key: string;
  content: Record<string, unknown>;
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

/**
 * Obtiene contenido CMS sin autenticación (para páginas estáticas legales).
 * Usa cliente anónimo para evitar cookies y permitir static generation.
 * @param sectionKey Clave de la sección
 */
export async function getSiteContentStatic(sectionKey: string): Promise<SiteSectionItem[]> {
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('section_key', sectionKey)
      .eq('is_active', true)
      .order('item_order', { ascending: true });

    if (error) {
      console.warn(`Error fetching static CMS content for ${sectionKey}:`, error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error(`Unexpected error fetching static CMS content for ${sectionKey}:`, err);
    return [];
  }
}
