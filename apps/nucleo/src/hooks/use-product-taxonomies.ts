'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_PRODUCT_FORMATS,
  DEFAULT_PRODUCT_CATEGORIES,
  DEFAULT_SENSORY_FAMILIES,
  type ProductFormatOption,
  type ProductSensoryFamilyOption,
  extractGramajeFromFormato,
} from '@/lib/product-types';

export interface ProductTaxonomies {
  formats: ProductFormatOption[];
  categories: ProductFormatOption[];
  sensoryFamilies: ProductSensoryFamilyOption[];
}

/**
 * Opciones de formato/categoría/familias sensoriales para los selects de producto.
 * La fuente canónica son las tablas `product_formats`, `product_categories` y
 * `product_sensory_families` (gestionadas en Mercado → Taxonomías).
 * Los DEFAULT_* son solo el fallback mientras carga o si la consulta falla — nunca dejan el selector vacío.
 *
 * El panel de gestión invalida la key `product-taxonomies` tras cada cambio.
 */
export function useProductTaxonomies() {
  return useQuery({
    queryKey: ['product-taxonomies'],
    queryFn: async (): Promise<ProductTaxonomies> => {
      const [formatsRes, categoriesRes, sensoryRes] = await Promise.all([
        supabase.from('product_formats').select('*').order('sort_order', { ascending: true }),
        supabase.from('product_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('product_sensory_families').select('*').order('sort_order', { ascending: true }),
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

      const toSensoryOptions = (
        rows: { value: string; label: string; description?: string | null; active: boolean }[] | null,
        fallback: ProductSensoryFamilyOption[],
      ): ProductSensoryFamilyOption[] => {
        if (!rows) return fallback;
        const active = rows.filter((r) => r.active).map((r) => ({
          value: r.value,
          label: r.label,
          description: r.description ?? null,
        }));
        return active.length > 0 ? active : fallback;
      };

      return {
        formats: toFormatOptions(formatsRes.data as never, DEFAULT_PRODUCT_FORMATS),
        categories: toCategoryOptions(categoriesRes.data, DEFAULT_PRODUCT_CATEGORIES),
        sensoryFamilies: toSensoryOptions(sensoryRes.data, DEFAULT_SENSORY_FAMILIES),
      };
    },
    staleTime: 60_000,
  });
}
