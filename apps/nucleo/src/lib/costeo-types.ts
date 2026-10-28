import { z } from 'zod';

export const UNIDADES_BOM = ['g', 'kg', 'ml', 'l', 'unidad'] as const;
export type UnidadBOM = (typeof UNIDADES_BOM)[number];

export const ESTADOS_INSUMO = [
  'crudo',
  'procesado',
  'tostado',
  'molido',
  'fresco',
  'seco',
  'desecado',
] as const;
export type EstadoInsumo = (typeof ESTADOS_INSUMO)[number];

export const IngredientSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  unidad: z.enum(UNIDADES_BOM),
  estado_default: z.enum(ESTADOS_INSUMO),
  categoria: z.string().optional(),
  precio_ref: z.coerce.number().int().min(0, 'El precio debe ser positivo').optional(),
  proveedor_ref: z.string().uuid().optional().or(z.literal('')),
});

export type IngredientFormData = z.infer<typeof IngredientSchema>;

export const RecipeLineSchema = z.object({
  id: z.string().uuid().optional(),
  ingredient_id: z.string().uuid('Debes seleccionar un insumo'),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  unidad: z.enum(UNIDADES_BOM).optional(),
  estado: z.enum(ESTADOS_INSUMO),
  factor_conversion: z.coerce.number().positive().default(1.0),
  orden: z.coerce.number().int().min(0).default(0),
});

export type RecipeLineFormData = z.infer<typeof RecipeLineSchema>;

export const RecipeSchema = z.object({
  producto_id: z.string().uuid('Debes seleccionar un producto del catálogo'),
  rendimiento_frascos: z.coerce.number().int().positive('El rendimiento debe ser al menos 1'),
  formato_frasco: z.string().min(1, 'El formato o presentación es requerido'),
  merma_pct: z.coerce.number().min(0).max(100).default(0),
  costo_empaque: z.coerce.number().int().min(0).default(0),
  notas: z.string().optional(),
  lines: z.array(RecipeLineSchema).min(1, 'Debes agregar al menos un ingrediente a la receta'),
});

export type RecipeFormData = z.infer<typeof RecipeSchema>;

export const ProduccionLoteSchema = z.object({
  receta_id: z.string().uuid(),
  cantidad_lotes: z.coerce.number().int().positive().default(1),
  deducir_inventario: z.boolean().default(true),
  notas: z.string().optional(),
});

export type ProduccionLoteFormData = z.infer<typeof ProduccionLoteSchema>;

export interface MargenRow {
  recipe_id?: string;
  producto_id?: string;
  producto_nombre?: string;
  nombre_producto?: string;
  precio_venta?: number;
  precio?: number;
  formato?: string;
  version?: number;
  rendimiento_frascos?: number;
  merma_pct?: number;
  costo_empaque?: number;
  costo_frasco?: number | string;
  costo_total?: number | string;
  costo?: number;
  margen_frasco?: number | string;
  margen_bruto?: number;
  margen_clp?: number;
  margen_pct?: number | string;
  activa?: boolean;
}

export interface InsumoInventarioRef {
  id: string;
  nombre: string;
  clase: string;
  unidad: string;
  stock: number;
  stock_minimo: number;
  costo_unitario: number;
  proveedor_nota?: string | null;
  ingredient_id?: string | null;
}

export interface TerceroProveedorRef {
  id: string;
  nombre: string;
  rut?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface RecipeLineDetail {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  cantidad: number;
  unidad?: string | null;
  estado: EstadoInsumo;
  factor_conversion: number;
  orden: number;
  ingredients?: {
    id: string;
    nombre: string;
    unidad: string;
    precio_ref: number | null;
    categoria?: string | null;
    proveedor_ref?: string | null;
    terceros?: TerceroProveedorRef | null;
  } | null;
  inventario_item?: InsumoInventarioRef | null;
  costo_linea_estimado?: number;
}

export interface RecipeDetail {
  id: string;
  empresa_id: string;
  producto_id: string;
  version: number;
  rendimiento_frascos: number;
  formato_frasco: string;
  merma_pct: number;
  costo_empaque: number;
  activa: boolean;
  notas?: string | null;
  created_at: string;
  updated_at?: string | null;
  productos?: {
    id: string;
    nombre: string;
    formato?: string | null;
    precio: number;
    stock?: number | null;
  } | null;
  lines: RecipeLineDetail[];
  costo_calculado?: {
    costo_ingredientes: number;
    costo_merma: number;
    costo_empaque: number;
    costo_total_receta: number;
    rendimiento_frascos: number;
    costo_por_frasco: number;
    precio_venta: number;
    margen_por_frasco: number;
    margen_pct: number;
    detalle?: Array<{
      ingredient_id: string;
      nombre: string;
      cantidad_receta: number;
      unidad?: string;
      ing_unidad?: string;
      costo_linea: number;
      precio_ref: number;
    }>;
  };
}
