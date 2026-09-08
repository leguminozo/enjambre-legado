'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_PRODUCT_FORMATS,
  DEFAULT_PRODUCT_CATEGORIES,
  type ProductFormatOption,
  extractGramajeFromFormato,
} from '@/lib/product-types';

export interface ProductTaxonomies {
  formats: ProductFormatOption[];
  categories: ProductFormatOption[];
}

/**
 * Opciones de formato/categoría para los selects de producto. La fuente
 * canónica son las tablas `product_formats`/`product_categories` (gestionadas
 * en Mercado → Productos → Formatos y Categorías); los DEFAULT_* son solo el
 * fallback mientras carga o si la consulta falla (ej. migración aún no aplicada
 * en la base remota) — nunca dejan el select vacío.
 *
 * El panel de gestión invalida la key `product-taxonomies` tras cada cambio.
 */
export function useProductTaxonomies() {
  return useQuery({
    queryKey: ['product-taxonomies'],
    queryFn: async (): Promise<ProductTaxonomies> => {
      const [formatsRes, categoriesRes] = await Promise.all([
        supabase.from('product_formats').select('*').order('sort_order', { ascending: true }),
        supabase.from('product_categories').select('*').order('sort_order', { ascending: true }),
      ]);

      const toFormatOptions = (
        rows: (Record<string, unknown> & { value: string; label: string; active: boolean; peso_neto_g?: number | null })[] | null,
        fallback: ProductFormatOption[],
      ): ProductFormatOption[] => {
        if (!rows) return fallback;
        const active = rows.filter((r) => r.active).map((r) => {
          const rawWeight = typeof r.peso_neto_g === 'number' && r.peso_neto_g > 0 ? r.peso_neto_g : null;
          return {
            value: r.value,
            label: r.label,
            peso_neto_g: rawWeight ?? extractGramajeFromFormato(r.value),
          };
        });
        return active.length > 0 ? active : fallback;
      };

      const toCategoryOptions = (
        rows: { value: string; label: string; active: boolean }[] | null,
        fallback: ProductFormatOption[],
      ): ProductFormatOption[] => {
        if (!rows) return fallback;
        const active = rows.filter((r) => r.active).map((r) => ({ value: r.value, label: r.label }));
        return active.length > 0 ? active : fallback;
      };

      return {
        formats: toFormatOptions(formatsRes.data as never, DEFAULT_PRODUCT_FORMATS),
        categories: toCategoryOptions(categoriesRes.data, DEFAULT_PRODUCT_CATEGORIES),
      };
    },
    staleTime: 60_000,
  });
}
