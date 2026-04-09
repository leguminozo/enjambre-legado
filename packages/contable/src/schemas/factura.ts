import { z } from "zod";

export const FacturaEmitidaInputSchema = z.object({
  tercero_id: z.string().uuid(),
  numero: z.coerce.number().int().positive(),
  fecha_emision: z.iso.datetime(),
  monto_neto: z.coerce.number().positive(),
  descripcion: z.string().trim().max(500).optional(),
  idempotency_key: z.string().trim().min(8).max(120).optional(),
});

export const FacturaEmitidaOutputSchema = z.object({
  id: z.string().uuid(),
  empresa_id: z.string().uuid(),
  tercero_id: z.string().uuid(),
  numero: z.number().int().positive(),
  fecha_emision: z.string(),
  monto_neto: z.number(),
  monto_iva: z.number(),
  monto_total: z.number(),
  created_at: z.string(),
});

export type FacturaEmitidaInput = z.infer<typeof FacturaEmitidaInputSchema>;
export type FacturaEmitidaOutput = z.infer<typeof FacturaEmitidaOutputSchema>;
