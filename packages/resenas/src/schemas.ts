import { z } from 'zod';
import {
  ANON_COMMENT_MAX,
  CATEGORIAS_SENSORIALES,
  COSMETICA_ABSORCIONES,
  CRISTALIZACION_OPCIONES,
  EXTRACTO_SENSACIONES,
  FAMILIAS_AROMATICAS,
  FORTIFICADA_TEXTURAS,
  FORTIFICANTES_CANONICOS,
  HIDROMIEL_EFERVESCENCIA,
  HIDROMIEL_ESTILOS,
  MOMENTO_RECOLECCION_OPCIONES,
} from './constants';

const ratingSchema = z.number().int().min(1).max(10);

// ── Atributos sensoriales especializados por familia de producto ────────────

export const AtributosMielSchema = z.object({
  tipo: z.literal('miel'),
  cristalizacion: z.enum(CRISTALIZACION_OPCIONES),
  familia_aromatica: z.enum(FAMILIAS_AROMATICAS),
  intensidad_fondo: z.number().int().min(1).max(10),
  momento_recoleccion: z.enum(MOMENTO_RECOLECCION_OPCIONES).optional(),
}).passthrough();

export const AtributosMielFortificadaSchema = z.object({
  tipo: z.literal('miel_fortificada'),
  fortificante: z.enum(FORTIFICANTES_CANONICOS),
  balance_inclusion: z.number().int().min(1).max(10), // 1: domina miel, 10: domina inclusión
  textura_inclusion: z.enum(FORTIFICADA_TEXTURAS),
  intensidad_fondo: z.number().int().min(1).max(10),
  familia_aromatica: z.enum(FAMILIAS_AROMATICAS).optional(),
}).passthrough();

export const AtributosHidromielSchema = z.object({
  tipo: z.literal('hidromiel'),
  estilo: z.enum(HIDROMIEL_ESTILOS),
  efervescencia: z.enum(HIDROMIEL_EFERVESCENCIA),
  acidez_viva: z.number().int().min(1).max(10),
  tanicidad: z.number().int().min(1).max(10),
}).passthrough();

export const AtributosExtractoSchema = z.object({
  tipo: z.literal('extracto'),
  percepcion_garganta: z.enum(EXTRACTO_SENSACIONES),
  concentracion_percibida: z.number().int().min(1).max(10),
}).passthrough();

export const AtributosCosmeticaSchema = z.object({
  tipo: z.literal('cosmetica'),
  absorcion_dermica: z.enum(COSMETICA_ABSORCIONES),
  sensacion_grasa: z.number().int().min(1).max(10),
}).passthrough();

export const AtributosInfusionSchema = z.object({
  tipo: z.literal('infusion'),
  intensidad_infusion: z.number().int().min(1).max(10),
  complejidad_herbal: z.number().int().min(1).max(10),
}).passthrough();

export const AtributosFortificacionesSchema = z.object({
  tipo: z.literal('fortificaciones'),
  tostado: z.number().int().min(1).max(10).optional(),
  molienda: z.string().optional(),
  untuosidad: z.number().int().min(1).max(10).optional(),
  intensidad_fondo: z.number().int().min(1).max(10).optional(),
}).passthrough();

export const AtributosDinamicosSchema = z.object({
  tipo: z.string(),
}).passthrough();

export const AtributosSensorialesSchema = z.union([
  AtributosMielSchema,
  AtributosMielFortificadaSchema,
  AtributosFortificacionesSchema,
  AtributosHidromielSchema,
  AtributosExtractoSchema,
  AtributosCosmeticaSchema,
  AtributosInfusionSchema,
  AtributosDinamicosSchema,
]);

// ── Reseñas por modo de ingesta ─────────────────────────────────────────────

export const ResenaAnonimaInputSchema = z.object({
  modo: z.literal('anonima'),
  producto_id: z.string().uuid(),
  variante_id: z.string().uuid().optional(),
  tipo_sensorial: z.string().min(1).optional().default('miel'),
  rating: ratingSchema,
  comentario_corto: z.string().trim().min(3).max(ANON_COMMENT_MAX),
  display_name: z.string().trim().min(2).max(40).optional(),
});

export const ResenaGuardianInputSchema = z
  .object({
    modo: z.literal('guardian'),
    producto_id: z.string().uuid(),
    variante_id: z.string().uuid().optional(),
    tipo_sensorial: z.string().min(1).optional().default('miel'),
    rating: ratingSchema,
    venta_id: z.string().min(1).optional(),
    lote_id: z.string().uuid().optional(),
    atributos: AtributosSensorialesSchema.optional(),
    // Compatibilidad retroactiva con columnas planas de miel
    cristalizacion_percibida: z.enum(CRISTALIZACION_OPCIONES).optional(),
    familia_aromatica: z.enum(FAMILIAS_AROMATICAS).optional(),
    intensidad_fondo: z.number().int().min(1).max(10).optional(),
    notas_personales: z.string().trim().min(10).max(600),
    momento_consumo: z.string().trim().max(120).optional(),
    maridaje: z.string().trim().max(200).optional(),
    comentario_corto: z.string().trim().max(ANON_COMMENT_MAX).optional(),
  })
  .refine(
    (d) =>
      d.atributos !== undefined ||
      d.cristalizacion_percibida !== undefined ||
      d.tipo_sensorial !== 'miel',
    {
      message: 'Se requieren atributos sensoriales o campos de cata',
      path: ['atributos'],
    },
  );

export const CreateResenaSchema = z.discriminatedUnion('modo', [
  ResenaAnonimaInputSchema,
  ResenaGuardianInputSchema,
]);

export const ModerarResenaSchema = z.object({
  estado: z.enum(['aprobada', 'rechazada', 'oculta']),
});

export const ClaimResenaSchema = z.object({
  token: z.string().min(32).max(128),
});

export const ListResenasQuerySchema = z
  .object({
    producto_id: z.string().uuid().optional(),
    variante_id: z.string().uuid().optional(),
    tipo_sensorial: z.string().min(1).optional(),
    modo: z.enum(['anonima', 'guardian', 'all']).optional().default('all'),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  })
  .refine(
    (d) => d.producto_id !== undefined,
    { message: 'Se requiere producto_id', path: ['producto_id'] },
  );

// ── Esquemas de Variantes de Producto ───────────────────────────────────────

export const ProductoVarianteSchema = z.object({
  id: z.string().uuid().optional(),
  producto_id: z.string().uuid(),
  sku: z.string().trim().min(2).max(50),
  nombre_variante: z.string().trim().min(2).max(120),
  tipo_variante: z.enum(['formato', 'fortificacion', 'edicion_especial', 'pack']),
  ingrediente_fortificante: z.enum(FORTIFICANTES_CANONICOS).optional().default('ninguno'),
  peso_neto_g: z.coerce.number().int().min(0).default(0),
  precio_override: z.coerce.number().int().positive().nullable().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  activo: z.boolean().default(true),
  perfil_sensorial_override: z.unknown().nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
  producto_vinculado_id: z.string().uuid().nullable().optional(),
  producto_vinculado: z
    .object({
      id: z.string(),
      nombre: z.string(),
      slug: z.string(),
      precio: z.number(),
      categoria: z.string().nullable().optional(),
      formato: z.string().nullable().optional(),
      peso_neto_g: z.number().nullable().optional(),
      stock: z.number().nullable().optional(),
      fotos: z.array(z.string()).nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type CreateResenaInput = z.infer<typeof CreateResenaSchema>;
export type ResenaAnonimaInput = z.infer<typeof ResenaAnonimaInputSchema>;
export type ResenaGuardianInput = z.infer<typeof ResenaGuardianInputSchema>;
export type ListResenasQuery = z.infer<typeof ListResenasQuerySchema>;
export type AtributosSensoriales = z.infer<typeof AtributosSensorialesSchema>;
export type ProductoVarianteInput = z.infer<typeof ProductoVarianteSchema>;
export type ProductoVariante = ProductoVarianteInput;