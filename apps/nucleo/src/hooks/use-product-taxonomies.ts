'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_PRODUCT_FORMATS,
  DEFAULT_PRODUCT_CATEGORIES,
  type ProductFormatOption,
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

      const toOptions = (
        rows: { value: string; label: string; active: boolean }[] | null,
        fallback: ProductFormatOption[],
      ): ProductFormatOption[] => {
        if (!rows) return fallback;
        const active = rows.filter((r) => r.active).map((r) => ({ value: r.value, label: r.label }));
        return active.length > 0 ? active : fallback;
      };

      return {
        formats: toOptions(formatsRes.data, DEFAULT_PRODUCT_FORMATS),
        categories: toOptions(categoriesRes.data, DEFAULT_PRODUCT_CATEGORIES),
      };
    },
    staleTime: 60_000,
  });
}
