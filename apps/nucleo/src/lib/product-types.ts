import { z } from 'zod';
import type { Database } from '@enjambre/database/database.types';

export const perfilSensorialSchema = z
  .object({
    intensidad: z.coerce.number().min(0).max(100).default(75),
    dulzor_acidez: z.coerce.number().min(0).max(100).default(60),
    textura: z.coerce.number().min(0).max(100).default(85),
    descriptores_intensidad: z
      .object({
        izq: z.string().default('Suave & Floral'),
        der: z.string().default('Robusto & Boscoso'),
      })
      .optional(),
    descriptores_dulzor: z
      .object({
        izq: z.string().default('Dulzor Cálido'),
        der: z.string().default('Acidez Silvestre'),
      })
      .optional(),
    descriptores_textura: z
      .object({
        izq: z.string().default('Líquida / Sedosa'),
        der: z.string().default('Cremosa / Untable'),
      })
      .optional(),
    notas_aromaticas: z.array(z.string()).default([]),
    maridajes: z
      .array(
        z.object({
          titulo: z.string(),
          detalle: z.string(),
        }),
      )
      .default([]),
    momento_consumo: z.string().optional(),
  })
  .nullable()
  .optional();

export type PerfilSensorial = z.infer<typeof perfilSensorialSchema>;

export interface ProductChannelOption {
  id: string;
  label: string;
  description: string;
  badge: string;
}

export const PRODUCT_CHANNELS: ProductChannelOption[] = [
  { id: 'tienda', label: 'Tienda Online D2C', description: 'Catálogo público general y despacho nacional', badge: 'Tienda' },
  { id: 'campo', label: 'Feria Apícola / POS Campo', description: 'Terminal de venta presencial en terreno', badge: 'Campo POS' },
  { id: 'club', label: 'Exclusivo Club Cosecha', description: 'Reservado para miembros del Club', badge: 'Club' },
  { id: 'b2b', label: 'Microcanales / Mayorista B2B', description: 'Hoteles, cafeterías y revendedores', badge: 'B2B' },
];

export const productFormSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  descripcion_regenerativa: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  precio: z.coerce.number().int().positive('Precio debe ser mayor a 0'),
  stock: z.coerce.number().int().min(0, 'Stock no puede ser negativo'),
  formato: z.string().min(1, 'Formato es requerido'),
  visible: z.boolean(),
  channels: z.array(z.string()).default(['tienda', 'campo']),
  trazabilidad_qr: z.boolean(),
  slug: z.string().optional().or(z.literal('')),
  video_url: z.string().url().optional().or(z.literal('')),
  fotos: z.array(z.string()).optional(),
  categoria: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  descripcion_corta: z.string().optional(),
  peso_neto_g: z.coerce.number().int().min(0).optional(),
  ingredientes: z.string().optional(),
  origen_apicola: z.string().optional(),
  sustituye_azucar_g: z.coerce.number().optional(),
  co2_evitado_kg: z.coerce.number().optional(),
  irr_referencia: z.coerce.number().optional(),
  lote_id: z.string().uuid().optional().or(z.literal('')),
  perfil_sensorial: perfilSensorialSchema,
});

export type ProductFormData = z.infer<typeof productFormSchema>;

export type Product = Database['public']['Tables']['productos']['Row'];

/**
 * Deduce el gramaje en gramos a partir de la convención de texto de un formato
 * (ej: '500g' => 500, '1kg' => 1000, '30x15g' => 450, '250 g' => 250).
 * Sirve como fallback inteligente si la tabla aún no tiene el peso registrado.
 */
export function extractGramajeFromFormato(formato: string | null | undefined): number | null {
  if (!formato) return null;
  const f = formato.trim().toLowerCase();
  if (f === '500g') return 500;
  if (f === '250g') return 250;
  if (f === '1kg' || f === '1000g') return 1000;
  if (f === '30x15g') return 450;
  if (f === '10x15g') return 150;
  if (f === 'panal') return 200;

  // Multiplicación tipo "30x15g" o "10x15"
  const multMatch = f.match(/^(\d+)\s*x\s*(\d+)\s*g?$/);
  if (multMatch) {
    return parseInt(multMatch[1], 10) * parseInt(multMatch[2], 10);
  }

  // Kilogramos tipo "1.5kg" o "2kg"
  const kgMatch = f.match(/^([\d.,]+)\s*kg$/);
  if (kgMatch) {
    return Math.round(parseFloat(kgMatch[1].replace(',', '.')) * 1000);
  }

  // Gramos tipo "320g" o "250 g"
  const gMatch = f.match(/^(\d+)\s*g$/);
  if (gMatch) {
    return parseInt(gMatch[1], 10);
  }

  return null;
}

/**
 * Taxonomías de producto gestionables desde Mercado → Productos → Formatos y
 * Categorías (tablas `product_formats` / `product_categories`). Estos arrays
 * son SOLO el fallback offline/mientras carga — el valor canónico vive en la DB
 * y lo consume `useProductTaxonomies()`.
 */
export type ProductFormat = Database['public']['Tables']['product_formats']['Row'] & {
  peso_neto_g?: number | null;
};
export type ProductCategory = Database['public']['Tables']['product_categories']['Row'];

export interface ProductFormatOption {
  value: string;
  label: string;
  peso_neto_g?: number | null;
}

export const DEFAULT_PRODUCT_FORMATS: ProductFormatOption[] = [
  { value: '500g', label: '500g - Frasco tradicional', peso_neto_g: 500 },
  { value: '250g', label: '250g - Frasco pequeño', peso_neto_g: 250 },
  { value: '1kg', label: '1kg - Frasco familiar', peso_neto_g: 1000 },
  { value: '30x15g', label: '30x15g - Sachets individual', peso_neto_g: 450 },
  { value: '10x15g', label: '10x15g - Sachets pack', peso_neto_g: 150 },
  { value: 'Panal', label: 'Panal natural', peso_neto_g: 200 },
  { value: 'Cofre', label: 'Cofre regalo', peso_neto_g: null },
  { value: 'Kit', label: 'Kit degustación', peso_neto_g: null },
];

export const DEFAULT_PRODUCT_CATEGORIES: ProductFormatOption[] = [
  { value: 'miel', label: 'Miel' },
  { value: 'polen', label: 'Polen' },
  { value: 'propoleo', label: 'Propóleo' },
  { value: 'jalea', label: 'Jalea Real' },
  { value: 'ceras', label: 'Ceras' },
  { value: 'cofres', label: 'Cofres' },
  { value: 'accesorios', label: 'Accesorios' },
];

export const PRODUCT_TAGS = [
  'monofloral',
  'multifloral',
  'bosque nativo',
  'ulmo',
  'quillay',
  'eucalipto',
  'orgánico',
  'regenerativo',
  'artesanal',
  'premium',
  'sin-azucar',
  'vegan',
  'sin-tacc',
] as const;