import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  authMiddleware,
  requireProfileRole,
  type AppVariables,
} from "@/api/lib/middleware";
import { groqChatCompletion, isAiEnabled } from "@/api/lib/ai/groq";
import { BitacoraPayloadSchema, type BitacoraPayload, BitacoraEventoRowSchema } from "@/lib/bitacora-ledger-schema";

export const bitacoraLedgerRoutes = new Hono<{ Variables: AppVariables }>();

bitacoraLedgerRoutes.use("*", authMiddleware);

const ParseLedgerSchema = z.object({
  transcript_raw: z.string().min(10),
}).strict();

const PARSER_SYSTEM_PROMPT = `
Eres un experto apicultor extrayendo datos de campo (Bitácora de Patio).
Se te entregará la transcripción literal del dictado de un apicultor.
Debes devolver un JSON estrictamente mapeado al esquema requerido.

REGLAS DURAS:
1. "poblacion" = número de cuadros totales cubiertos por abejas (0 a 10).
2. "cria_sellada", "cria_abierta", "miel", "polen", "vacios_trabajados" = número de cuadros de cada tipo. Su suma NUNCA debe exceder "poblacion". Si no se menciona, es 0.
3. Para tratamiento, si es ácido oxálico, asume unidad "g/L" si es líquido o "g" si es panela, y "carencia_dias" debe inferirse o ponerse en 0 si es oxálico sin retiro.
4. "tipo_accion" DEBE ser una de: "INSPECCION", "ALIMENTACION", "TRATAMIENTO", "COSECHA", "TRANSICION".
5. Extrae cualquier nota contextual o comentario que no encaje en los números y ponlo en "notas_oficio".

Responde ÚNICAMENTE con el objeto JSON, sin markdown. Formato esperado:
{
  "tipo_accion": "INSPECCION",
  "data": { ... },
  "notas_oficio": "..."
}
`;

// FASE 1: Extraer y Validar (Sin Guardar - Embudo Determinista)
bitacoraLedgerRoutes.post(
  "/parse",
  requireProfileRole("admin", "apicultor", "territorial"),
  zValidator("json", ParseLedgerSchema),
  async (c) => {
    if (!isAiEnabled()) {
      return c.json({ code: "ai_disabled", message: "GROQ no configurado" }, 503);
    }

    const { transcript_raw } = c.req.valid("json");

    let aiResponseText = "";
    try {
      const { text } = await groqChatCompletion({
        messages: [
          { role: "system", content: PARSER_SYSTEM_PROMPT },
          { role: "user", content: `Transcripción:\n"${transcript_raw}"` }
        ],
        temperature: 0.0,
        response_format: { type: "json_object" },
      });
      aiResponseText = text;
    } catch (e) {
      return c.json({ error: "Fallo en la extracción semántica de IA" }, 502);
    }

    let parsedPayload: BitacoraPayload & { notas_oficio?: string };
    try {
      const rawJson = JSON.parse(aiResponseText);
      const strictPayload = BitacoraPayloadSchema.parse(rawJson);
      parsedPayload = {
        ...strictPayload,
        notas_oficio: rawJson.notas_oficio || undefined
      };
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ 
          code: "biological_invariant_violation", 
          message: "La IA extrajo datos que violan las reglas biológicas",
          issues: e.issues,
          raw_llm_output: aiResponseText
        }, 422);
      }
      return c.json({ error: "La IA no devolvió un JSON válido" }, 500);
    }

    // Retorna el payload propuesto para el Readback humano
    return c.json({
      data: {
        payload_extraido: parsedPayload
      }
    });
  }
);

const CommitLedgerSchema = z.object({
  apiario_id: z.string().uuid(),
  colmena_id: z.string().uuid(),
  transcript_raw: z.string(),
  client_request_id: z.string().uuid(),
  lat_lng: z.string().optional(),
  payload_extraido: BitacoraPayloadSchema,
  notas_oficio: z.string().optional()
});

import { reduceColmenaState } from "@/lib/bitacora-reducer";

// FASE 2: Sellar en el Ledger (Tras la confirmación humana)
bitacoraLedgerRoutes.post(
  "/commit",
  requireProfileRole("admin", "apicultor", "territorial"),
  zValidator("json", CommitLedgerSchema),
  async (c) => {
    const body = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");

    // 1. Inserción Inmutable
    const { data: insertedEvent, error: insertError } = await supabase
      .from("bitacora_eventos")
      .insert({
        id: body.client_request_id,
        colmena_id: body.colmena_id,
        apiario_id: body.apiario_id,
        tipo_accion: body.payload_extraido.tipo_accion,
        payload: body.payload_extraido.data,
        notas_oficio: body.notas_oficio,
        raw_transcript: body.transcript_raw,
        lat_lng: body.lat_lng,
        created_by: user.id
      })
      .select("id, event_hash, created_at, tipo_accion, payload")
      .single();

    if (insertError) {
      if (insertError.code === "23505") { 
        return c.json({ code: "idempotency_hit", message: "Este evento ya fue sellado" }, 200);
      }
      return c.json({ error: insertError.message }, 500);
    }

    // 2. Reconciliación CQRS (Proyección Mágica)
    // Extraemos toda la historia de la colmena (Ordenada cronológicamente)
    const { data: history } = await supabase
      .from("bitacora_eventos")
      .select("created_at, tipo_accion, payload")
      .eq("colmena_id", body.colmena_id)
      .order("created_at", { ascending: true });

    if (history) {
      const snapshot = reduceColmenaState(body.colmena_id, history);
      
      // Upsert al Read Model
      await supabase
        .from("bitacora_colmena_snapshots")
        .upsert({
          ...snapshot,
          updated_at: new Date().toISOString()
        }, { onConflict: "colmena_id" });
    }

    return c.json({
      data: {
        id: insertedEvent.id,
        hash: insertedEvent.event_hash,
      }
    });
  }
);
