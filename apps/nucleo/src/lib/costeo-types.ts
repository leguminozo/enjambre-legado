import { z } from 'zod';

export const IngredientSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  unidad: z.enum(['g', 'kg', 'ml', 'l', 'unidad']),
  estado_default: z.enum(['crudo', 'procesado', 'tostado', 'molido', 'fresco', 'seco', 'desecado']),
  categoria: z.string().optional(),
  precio_ref: z.coerce.number().int().min(0, 'El precio debe ser positivo').optional(),
  proveedor_ref: z.string().uuid().optional().or(z.literal('')),
});

export type IngredientFormData = z.infer<typeof IngredientSchema>;

export const RecipeLineSchema = z.object({
  ingredient_id: z.string().uuid('Debes seleccionar un insumo'),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  estado: z.enum(['crudo', 'procesado', 'tostado', 'molido', 'fresco', 'seco', 'desecado']),
  factor_conversion: z.coerce.number().positive().default(1.0),
  orden: z.coerce.number().int().min(0).default(0),
});

export type RecipeLineFormData = z.infer<typeof RecipeLineSchema>;

export const RecipeSchema = z.object({
  producto_id: z.string().uuid('Debes seleccionar un producto del catálogo'),
  rendimiento_frascos: z.coerce.number().int().positive('El rendimiento debe ser al menos 1'),
  formato_frasco: z.string().min(1, 'El formato es requerido'),
  merma_pct: z.coerce.number().min(0).max(100).default(0),
  costo_empaque: z.coerce.number().int().min(0).default(0),
  notas: z.string().optional(),
  lines: z.array(RecipeLineSchema).min(1, 'Debes agregar al menos un ingrediente a la receta'),
});

export type RecipeFormData = z.infer<typeof RecipeSchema>;
