import { z } from 'zod';

export const CartLineInputSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().max(99),
});

export const CartAbandonmentBodySchema = z.object({
  items: z.array(CartLineInputSchema).min(1).max(50),
});

export type CartAbandonmentBody = z.infer<typeof CartAbandonmentBodySchema>;