import { z } from "zod";

/**
 * ESQUEMA DE BLINDAJE BIOLÓGICO (Zod)
 * Implementa las reglas duras descritas en docs/BLINDAJE_Y_AMENAZAS.md
 * Este esquema garantiza que el LLM (Groq) devuelva datos seguros antes
 * de anexarlos al ledger de Postgres.
 */

// ---------------------------------------------------------------------------
// 1. Invariantes Comunes
// ---------------------------------------------------------------------------

const CuadrosSchema = z
  .number()
  .min(0, "Población no puede ser negativa")
  .max(10, "Una cámara de cría Langstroth no supera los 10 cuadros");

const CuadrosNucleoSchema = z
  .number()
  .min(0)
  .max(5, "Un núcleo no puede superar los 5 cuadros sin ser transferido");

// ---------------------------------------------------------------------------
// 2. Payloads de Eventos Específicos
// ---------------------------------------------------------------------------

export const EventoInspeccionSchema = z.object({
  poblacion: CuadrosSchema,
  cria_sellada: CuadrosSchema,
  cria_abierta: CuadrosSchema,
  miel: CuadrosSchema,
  polen: CuadrosSchema,
  vacios_trabajados: CuadrosSchema,
  reina_vista: z.boolean(),
  varroa_visible: z.boolean(),
}).refine(
  (data) => 
    (data.cria_sellada + data.cria_abierta + data.miel + data.polen + data.vacios_trabajados) <= data.poblacion,
  { message: "La suma de cuadros específicos no puede superar la población total" }
);

export const EventoAlimentacionSchema = z.object({
  tipo: z.enum(["Líquida", "Pastosa", "Cremosa", "Dura"]),
  posicion: z.enum(["Interna", "Externa"]),
  producto: z.string().min(1),
  cantidad: z.number().positive(),
  unidad: z.enum(["L", "Kg", "g"]),
  retiro_vacios: z.number().nonnegative().optional(),
});

export const EventoTratamientoSchema = z.object({
  producto: z.string().min(1),
  dosis: z.number().positive(),
  unidad: z.enum(["g/L", "ml", "tiras", "g"]),
  // Blindaje Sanitario Crítico
  carencia_dias: z.number().nonnegative("La carencia no puede ser negativa"),
}).superRefine((data, ctx) => {
  // Hardcoded safety bounds (Ejemplo biológico: Oxálico no > 5g/L)
  if (data.producto.toLowerCase().includes("oxálico") && data.unidad === "g/L" && data.dosis > 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Dosis letal de Oxálico: supera el límite biológico seguro de 5g/L",
      path: ["dosis"]
    });
  }
});

export const EventoCosechaSchema = z.object({
  tipo_producto: z.enum(["Miel", "Miel en panal", "Polen", "Propóleos"]),
  alza_origen: z.number().min(1).max(5).optional(), // Máximo 5 alzas
  cantidad: z.number().positive(),
  unidad: z.enum(["cuadros", "frascos", "g", "Kg"]),
});

export const EventoTransicionSchema = z.object({
  tipo_transicion: z.enum(["NUCLEO_A_COLMENA", "CAMBIO_REINA", "REINA_ZANGANERA", "REINA_AUSENTE"]),
  origen_reina: z.string().optional(),
  alert_level: z.enum(["NONE", "ORANGE", "RED"]).default("NONE"),
});

// ---------------------------------------------------------------------------
// 3. Payload Master (Union Type)
// ---------------------------------------------------------------------------

export const BitacoraPayloadSchema = z.discriminatedUnion("tipo_accion", [
  z.object({ tipo_accion: z.literal("INSPECCION"), data: EventoInspeccionSchema }),
  z.object({ tipo_accion: z.literal("ALIMENTACION"), data: EventoAlimentacionSchema }),
  z.object({ tipo_accion: z.literal("TRATAMIENTO"), data: EventoTratamientoSchema }),
  z.object({ tipo_accion: z.literal("COSECHA"), data: EventoCosechaSchema }),
  z.object({ tipo_accion: z.literal("TRANSICION"), data: EventoTransicionSchema }),
]);

export type BitacoraPayload = z.infer<typeof BitacoraPayloadSchema>;
export type TipoAccionBitacora = BitacoraPayload["tipo_accion"];

// ---------------------------------------------------------------------------
// 4. Esquema del Evento Base (Lo que el BFF guarda en Postgres)
// ---------------------------------------------------------------------------

export const BitacoraEventoRowSchema = z.object({
  id: z.string().uuid(),
  colmena_id: z.string().uuid(),
  apiario_id: z.string().uuid(),
  schema_version: z.number().default(1),
  payload: BitacoraPayloadSchema,
  notas_oficio: z.string().optional(),
  override_reason: z.string().optional(),
  audio_path: z.string().url().optional(),
  raw_transcript: z.string().min(1),
  lat_lng: z.string().optional(), // String WKT para PostGIS
  created_at: z.string().datetime(),
  created_by: z.string().uuid(),
  prev_hash: z.string().nullable().optional(),
});

