import { z } from 'zod';
import {
  ANON_COMMENT_MAX,
  CRISTALIZACION_OPCIONES,
  FAMILIAS_AROMATICAS,
  MOMENTO_RECOLECCION_OPCIONES,
} from './constants';

const ratingSchema = z.number().int().min(1).max(7);

export const ResenaAnonimaInputSchema = z.object({
  modo: z.literal('anonima'),
  producto_id: z.string().uuid(),
  rating: ratingSchema,
  comentario_corto: z.string().trim().min(3).max(ANON_COMMENT_MAX),
  display_name: z.string().trim().min(2).max(40).optional(),
});

export const ResenaGuardianInputSchema = z.object({
  modo: z.literal('guardian'),
  producto_id: z.string().uuid(),
  rating: ratingSchema,
  venta_id: z.string().min(1).optional(),
  lote_id: z.string().uuid().optional(),
  cristalizacion_percibida: z.enum(CRISTALIZACION_OPCIONES),
  familia_aromatica: z.enum(FAMILIAS_AROMATICAS),
  intensidad_fondo: z.number().int().min(1).max(10),
  notas_personales: z.string().trim().min(10).max(600),
  momento_consumo: z.string().trim().max(120).optional(),
  maridaje: z.string().trim().max(200).optional(),
  comentario_corto: z.string().trim().max(ANON_COMMENT_MAX).optional(),
});

export const ResenaFloracionInputSchema = z
  .object({
    modo: z.literal('floracion'),
    floracion_slug: z.string().min(2).max(80),
    temporada: z
      .string()
      .regex(/^\d{4}-[a-z-]+$/, 'Formato esperado: "2026-ulmo"')
      .optional(),
    producto_id: z.string().uuid().optional(),
    lote_id: z.string().uuid().optional(),
    rating: ratingSchema,
    cristalizacion_percibida: z.enum(CRISTALIZACION_OPCIONES),
    familia_aromatica: z.enum(FAMILIAS_AROMATICAS),
    intensidad_fondo: z.number().int().min(1).max(10),
    notas_personales: z.string().trim().min(10).max(800),
    momento_recoleccion: z.enum(MOMENTO_RECOLECCION_OPCIONES).optional(),
    cosecha_fresca: z.boolean().optional(),
    pairing_botanico: z.string().trim().max(200).optional(),
    momento_consumo: z.string().trim().max(120).optional(),
    comentario_corto: z.string().trim().max(ANON_COMMENT_MAX).optional(),
    tipo_evaluador: z
      .enum(['consumidor', 'semi_entrenado'])
      .optional()
      .default('consumidor'),
  })
  .refine(
    (d) => d.producto_id !== undefined || d.floracion_slug.length > 0,
    { message: 'Se requiere producto_id o floracion_slug', path: ['floracion_slug'] },
  );

export const CreateResenaSchema = z.discriminatedUnion('modo', [
  ResenaAnonimaInputSchema,
  ResenaGuardianInputSchema,
  ResenaFloracionInputSchema,
]);

export const ModerarResenaSchema = z.object({
  estado: z.enum(['aprobada', 'rechazada', 'oculta']),
});

export const ClaimResenaSchema = z.object({
  token: z.string().min(32).max(128),
});

export const ListResenasQuerySchema = z.object({
  producto_id: z.string().uuid().optional(),
  floracion_slug: z.string().min(2).max(80).optional(),
  temporada: z.string().optional(),
  modo: z.enum(['anonima', 'guardian', 'floracion', 'all']).optional().default('all'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
}).refine(
  (d) => d.producto_id !== undefined || d.floracion_slug !== undefined,
  { message: 'Se requiere producto_id o floracion_slug', path: ['producto_id'] },
);

export type CreateResenaInput = z.infer<typeof CreateResenaSchema>;
export type ResenaAnonimaInput = z.infer<typeof ResenaAnonimaInputSchema>;
export type ResenaGuardianInput = z.infer<typeof ResenaGuardianInputSchema>;
export type ResenaFloracionInput = z.infer<typeof ResenaFloracionInputSchema>;
export type ListResenasQuery = z.infer<typeof ListResenasQuerySchema>;