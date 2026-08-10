/**
 * Schemas zod del body de tracking — compartidos entre el cliente
 * (payload construido en el navegador) y la ruta POST /api/tracking/events.
 * Nombres de campos en snake_case (formato CAPI de Meta).
 */

import { z } from 'zod';

export const MetaTrackBodySchema = z.object({
  eventName: z.enum(['ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase']),
  eventId: z.string().uuid(),
  value: z.number().int().nonnegative().optional(),
  currency: z.literal('CLP').optional(),
  contentIds: z.array(z.string().min(1).max(120)).max(20).optional(),
  contents: z
    .array(
      z.object({
        id: z.string().min(1).max(120),
        quantity: z.number().int().positive().max(99),
        item_price: z.number().int().nonnegative().optional(),
      }),
    )
    .max(20)
    .optional(),
  contentName: z.string().max(200).optional(),
  numItems: z.number().int().nonnegative().optional(),
  orderId: z.string().max(100).optional(),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(32).optional(),
  fbp: z.string().max(100).optional(),
  fbc: z.string().max(100).optional(),
  sourceUrl: z.string().url().max(500).optional(),
  testEventCode: z.string().max(50).optional(),
});

export type MetaTrackBody = z.infer<typeof MetaTrackBodySchema>;
