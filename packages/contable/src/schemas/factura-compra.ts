import { z } from "zod";
import { DTE_TIPO } from "../domain/sii-dte";
import { validarRUT } from "../domain/rut";

export const FacturaCompraInputSchema = z.object({
  tercero_id: z.string().uuid(),
  folio: z.coerce.number().int().positive(),
  fecha_emision: z.iso.datetime(),
  monto_neto: z.coerce.number().nonnegative(),
  monto_exento: z.coerce.number().nonnegative().default(0),
  descripcion: z.string().trim().max(500).optional(),
  receptor_rut: z.string().trim().min(7).max(12).refine(validarRUT, "RUT invalido"),
  receptor_razon_social: z.string().trim().min(1).max(200),
  receptor_giro: z.string().trim().max(200).optional(),
  referencias: z
    .array(
      z.object({
        tipoDocumento: z.coerce.number().int(),
        folio: z.coerce.number().int().positive(),
        fecha: z.string().trim(),
        razonReferencia: z.string().trim().max(200),
      }),
    )
    .optional(),
});

export const FacturaCompraOutputSchema = z.object({
  id: z.string().uuid(),
  empresa_id: z.string().uuid(),
  tercero_id: z.string().uuid(),
  tipo_dte: z.literal(DTE_TIPO.FACTURA_COMPRA),
  folio: z.number().int().positive(),
  fecha_emision: z.string(),
  monto_neto: z.number(),
  monto_exento: z.number(),
  monto_iva: z.number(),
  monto_total: z.number(),
  estado_sii: z.enum(["pendiente", "enviado", "aceptado", "rechazado"]),
  track_id: z.string().nullable(),
  descripcion: z.string().nullable(),
  created_at: z.string(),
});

export type FacturaCompraInput = z.infer<typeof FacturaCompraInputSchema>;
export type FacturaCompraOutput = z.infer<typeof FacturaCompraOutputSchema>;
