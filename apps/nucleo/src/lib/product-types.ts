import { z } from 'zod';

export const productFormSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  descripcion_regenerativa: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  precio: z.coerce.number().int().positive('Precio debe ser mayor a 0'),
  stock: z.coerce.number().int().min(0, 'Stock no puede ser negativo'),
  formato: z.string().min(1, 'Formato es requerido'),
  visible: z.boolean(),
  trazabilidad_qr: z.boolean(),
  slug: z.string().optional().or(z.literal('')),
  video_url: z.string().url().optional().or(z.literal('')),
  fotos: z.array(z.string()).optional(),
  categoria: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  descripcion_corta: z.string().optional(),
  peso_neto_g: z.coerce.number().optional(),
  ingredientes: z.string().optional(),
  origen_apicola: z.string().optional(),
  sustituye_azucar_g: z.coerce.number().optional(),
  co2_evitado_kg: z.coerce.number().optional(),
  irr_referencia: z.coerce.number().optional(),
  lote_id: z.string().uuid().optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

export interface Product {
  id: string;
  nombre: string;
  descripcion_regenerativa: string;
  precio: number;
  stock: number;
  formato: string;
  visible: boolean;
  trazabilidad_qr: boolean;
  slug?: string;
  video_url?: string;
  fotos?: string[];
  created_at: string;
  updated_at?: string;
  categoria?: string;
  tags?: string[];
  descripcion_corta?: string;
  peso_neto_g?: number;
  ingredientes?: string;
  origen_apicola?: string;
  sustituye_azucar_g?: number;
  co2_evitado_kg?: number;
  irr_referencia?: number;
  lote_id?: string;
}

export interface ProductVariant {
  id: string;
  producto_id: string;
  nombre: string;
  precio: number;
  stock: number;
  sku?: string;
  created_at: string;
}

export const PRODUCT_FORMATS = [
  { value: '500g', label: '500g - Frasco tradicional' },
  { value: '250g', label: '250g - Frasco pequeño' },
  { value: '1kg', label: '1kg - Frasco familiar' },
  { value: '30x15g', label: '30x15g - Sachets individual' },
  { value: '10x15g', label: '10x15g - Sachets pack' },
  { value: 'Panal', label: 'Panal natural' },
  { value: 'Cofre', label: 'Cofre regalo' },
  { value: 'Kit', label: 'Kit degustación' },
] as const;

export const PRODUCT_CATEGORIES = [
  { value: 'miel', label: 'Miel' },
  { value: 'polen', label: 'Polen' },
  { value: 'propoleo', label: 'Propóleo' },
  { value: 'jalea', label: 'Jalea Real' },
  { value: 'ceras', label: 'Ceras' },
  { value: 'cofres', label: 'Cofres' },
  { value: 'accesorios', label: 'Accesorios' },
] as const;

export const PRODUCT_TAGS = [
  'monofloral',
  'multifloral',
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