import { z } from 'zod';
import { ANON_COMMENT_MAX, CRISTALIZACION_OPCIONES, FAMILIAS_AROMATICAS } from './constants';

const ratingSchema = z.number().int().min(1).max(5);

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

export const ListResenasQuerySchema = z.object({
  producto_id: z.string().uuid(),
  modo: z.enum(['anonima', 'guardian', 'all']).optional().default('all'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type CreateResenaInput = z.infer<typeof CreateResenaSchema>;
export type ResenaAnonimaInput = z.infer<typeof ResenaAnonimaInputSchema>;
export type ResenaGuardianInput = z.infer<typeof ResenaGuardianInputSchema>;