/**
 * IA Núcleo — Groq neocloud, solo registro del usuario autenticado.
 * docs/AI_NUCLEO.md
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  authMiddleware,
  requireProfileRole,
  type AppVariables,
} from "@/api/lib/middleware";
import {
  groqChatCompletion,
  groqTranscribeAudio,
  isAiEnabled,
  getGroqChatModel,
  getGroqSttModel,
} from "@/api/lib/ai/groq";
import {
  formatRegistryScopeForPrompt,
  loadUserRegistryScope,
  REGISTRY_ASK_SYSTEM,
} from "@/api/lib/ai/user-registry-scope";
import { resolveBitacoraStoragePath } from "@/api/lib/ai/bitacora-audio-path";

export const aiRoutes = new Hono<{ Variables: AppVariables }>();

aiRoutes.use("*", authMiddleware);

/** GET /api/ai/status — autenticado; no filtra la API key */
aiRoutes.get(
  "/status",
  requireProfileRole("admin", "apicultor", "territorial"),
  async (c) => {
    return c.json({
      data: {
        enabled: isAiEnabled(),
        provider: "groq",
        chat_model: isAiEnabled() ? getGroqChatModel() : null,
        stt_model: isAiEnabled() ? getGroqSttModel() : null,
        scope: "user_registry_only",
      },
    });
  },
);

const TranscribeSchema = z
  .object({
    captura_id: z.string().uuid(),
  })
  .strict();

/**
 * POST /api/ai/bitacora/transcribe
 * STT de captura propia → transcript_raw + estado transcrito.
 */
aiRoutes.post(
  "/bitacora/transcribe",
  requireProfileRole("admin", "apicultor", "territorial"),
  zValidator("json", TranscribeSchema),
  async (c) => {
    if (!isAiEnabled()) {
      return c.json(
        { code: "ai_disabled", message: "GROQ_API_KEY no configurada o AI_ENABLED=false" },
        503,
      );
    }

    const { captura_id } = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole") ?? "cliente";

    let query = supabase
      .from("voice_inspection_captures")
      .select("id, user_id, audio_url, transcript_raw, estado")
      .eq("id", captura_id);

    // Admin puede re-transcribir capturas propias; no cross-user en v1
    query = query.eq("user_id", user.id);

    const { data: captura, error } = await query.maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (!captura) {
      return c.json(
        { code: "not_found", message: "Captura no encontrada o no es tuya" },
        404,
      );
    }
    if (!captura.audio_url) {
      return c.json(
        {
          code: "sin_audio",
          message: "La captura no tiene audio_url. Usa transcripción manual o sube el audio primero.",
        },
        400,
      );
    }

    const storagePath = resolveBitacoraStoragePath(captura.audio_url);
    if (!storagePath) {
      return c.json(
        {
          code: "invalid_audio_url",
          message: "audio_url no es un path válido del bucket bitacora-audio",
        },
        400,
      );
    }

    const { data: fileData, error: dlError } = await supabase.storage
      .from("bitacora-audio")
      .download(storagePath);

    if (dlError || !fileData) {
      return c.json(
        {
          code: "audio_download_failed",
          message: dlError?.message ?? "No se pudo descargar el audio del bucket",
        },
        400,
      );
    }

    const bytes = await fileData.arrayBuffer();
    const ext = storagePath.split(".").pop() || "m4a";
    const filename = `${captura.id}.${ext}`;

    let text: string;
    let model: string;
    try {
      const result = await groqTranscribeAudio({
        bytes,
        filename,
        mime: fileData.type || undefined,
        language: "es",
        prompt:
          "Inspección apícola en Chiloé. Menciona colmenas por número, cría, miel, varroa, reina.",
      });
      text = result.text;
      model = result.model;
    } catch (e) {
      return c.json(
        {
          code: "stt_failed",
          message: e instanceof Error ? e.message : "Error STT Groq",
        },
        502,
      );
    }

    if (!text) {
      return c.json(
        { code: "empty_transcript", message: "Groq no devolvió texto" },
        422,
      );
    }

    const { data: updated, error: upError } = await supabase
      .from("voice_inspection_captures")
      .update({
        transcript_raw: text,
        estado: "transcrito",
        updated_at: new Date().toISOString(),
      })
      .eq("id", captura.id)
      .eq("user_id", user.id)
      .select("id, estado, transcript_raw")
      .maybeSingle();

    if (upError) return c.json({ error: upError.message }, 500);

    return c.json({
      data: {
        captura: updated,
        stt_model: model,
        profile_role: profileRole,
      },
    });
  },
);

const AskSchema = z
  .object({
    question: z.string().min(3).max(2000),
  })
  .strict();

/**
 * POST /api/ai/registry/ask
 * Pregunta solo sobre el registro del usuario (scope inyectado server-side).
 */
aiRoutes.post(
  "/registry/ask",
  requireProfileRole("admin", "apicultor", "territorial"),
  zValidator("json", AskSchema),
  async (c) => {
    if (!isAiEnabled()) {
      return c.json(
        { code: "ai_disabled", message: "GROQ_API_KEY no configurada o AI_ENABLED=false" },
        503,
      );
    }

    const { question } = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole") ?? "cliente";

    const scope = await loadUserRegistryScope(supabase, user.id, profileRole);
    const contextJson = formatRegistryScopeForPrompt(scope);

    try {
      const { text, model, usage } = await groqChatCompletion({
        messages: [
          { role: "system", content: REGISTRY_ASK_SYSTEM },
          {
            role: "system",
            content: `Contexto del registro del usuario (JSON):\n${contextJson}`,
          },
          { role: "user", content: question },
        ],
        temperature: 0.15,
        max_tokens: 900,
      });

      return c.json({
        data: {
          answer: text,
          model,
          usage,
          scope_meta: {
            colmenas: scope.colmenas.length,
            apiarios: scope.apiarios.length,
            has_actor: Boolean(scope.actor_territorial),
            profile_role: profileRole,
          },
        },
      });
    } catch (e) {
      return c.json(
        {
          code: "chat_failed",
          message: e instanceof Error ? e.message : "Error Groq chat",
        },
        502,
      );
    }
  },
);

import {
  parseApiculturalOntology,
  reconcileWithLlm,
} from "@/api/lib/apicultural-reconciler";

const PARSE_VOICE_SYSTEM = `Eres un experto apícola de campo en Chiloé para la extracción estructurada de dictados de inspección.
Dado el discurso de terreno del apicultor, extrae un objeto JSON estricto con las siguientes claves:
- "colmenaQuery": string o null (ej. "1", "4", "20", "la cuatro")
- "marcosCria": number o null (total de marcos con cría abierta u operculada)
- "marcosMiel": number o null (total de marcos con miel o néctar)
- "marcosPolen": number o null (marcos con pan de abeja)
- "marcosCera": number o null (marcos con cera estampada o labrada)
- "poblacion": "Baja" | "Media" | "Alta" | null
- "temperamento": "Mansa" | "Defensiva" | "Agresiva" | null
- "reinaVista": boolean (true SOLO si la vio visualmente; false si no la vio o no está)
- "reinaPresente": boolean (true si se vio O si hay huevos/postura fresca de 1 a 3 días; false si está huérfana)
- "posturaFresca": boolean (true si se menciona postura del día, huevitos o cría fresca)
- "realeras": { "cantidad": number, "tipo": "enjambrazon" | "emergencia" | "general" } o null
- "zanganera": boolean
- "varroa": string o null (ej. "0", "1.5", "2%", "alta")
- "fase": "nucleo" | "traspaso" | "alza" | "cosecha" | "invernada" | "temporada" | null
- "accionUrgente": string o null (ej. "alimentar", "poner alza", "tratar varroa", "revisar enjambrazón")
- "notas": string (el texto dictado)

Reglas apícolas críticas:
1. "no vi la reina pero hay postura del día" -> reinaVista: false, reinaPresente: true, posturaFresca: true (biológicamente hay reina activa).
2. "cinco marcos de cría y cuadro de miel" -> marcosCria: 5, marcosMiel: 1 (cuadro o marco sin número implica 1 unidad).
3. "un par de marcos" = 2. "medio cajón" = 5. "cámara llena" / "a reventar" = poblacion: "Alta" (10 marcos cubiertos).
4. "tres calles de abejas" -> poblacion: "Baja".
5. "está huérfana" o "sin reina" -> reinaVista: false, reinaPresente: false.
6. "barroa" = varroa. "perculada" = operculada. "realezas" = realeras.
7. Langstroth estándar: 10 marcos por cuerpo.
Devuelve ÚNICAMENTE el objeto JSON sin bloques markdown ni texto adicional.`;

const ParseVoiceSchema = z
  .object({
    text: z.string().min(1).max(2000),
  })
  .strict();

/**
 * POST /api/ai/bitacora/parse
 * Extrae parámetros estructurados de un texto dictado usando Groq Llama 3.3
 * conciliado con la ontología apícola determinista.
 */
aiRoutes.post(
  "/bitacora/parse",
  requireProfileRole("admin", "apicultor", "territorial"),
  zValidator("json", ParseVoiceSchema),
  async (c) => {
    const { text } = c.req.valid("json");
    const baseline = parseApiculturalOntology(text);

    if (!isAiEnabled()) {
      return c.json({
        data: {
          parsed: {
            colmenaQuery: baseline.colmenaIdentificador,
            marcosCria: baseline.cuadrosTotales.marcosCriaTotal,
            marcosMiel: baseline.cuadrosTotales.marcosMiel,
            marcosPolen: baseline.cuadrosTotales.marcosPolen,
            poblacion: baseline.poblacion.nivel,
            temperamento: baseline.poblacion.temperamento,
            reinaVista: baseline.reina.vista,
            reinaPresente: baseline.reina.presente,
            posturaFresca: baseline.reina.posturaFrescaPresente,
            realeras: baseline.reina.realerasDetectadas,
            zanganera: baseline.reina.zanganera,
            varroa: baseline.sanidad.varroaDetectada,
            fase: baseline.fase,
            notas: baseline.notas,
            ontology: baseline,
          },
          model: "deterministic-ontology",
        },
      });
    }

    try {
      const { text: jsonText, model } = await groqChatCompletion({
        messages: [
          { role: "system", content: PARSE_VOICE_SYSTEM },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 600,
        response_format: { type: "json_object" },
      });

      const parsedLlm = JSON.parse(jsonText);
      const reconciled = reconcileWithLlm(baseline, parsedLlm);

      return c.json({
        data: {
          parsed: {
            colmenaQuery: reconciled.colmenaIdentificador ?? parsedLlm.colmenaQuery,
            marcosCria: reconciled.cuadrosTotales.marcosCriaTotal || parsedLlm.marcosCria,
            marcosMiel: reconciled.cuadrosTotales.marcosMiel || parsedLlm.marcosMiel,
            marcosPolen: reconciled.cuadrosTotales.marcosPolen || parsedLlm.marcosPolen,
            poblacion: reconciled.poblacion.nivel ?? parsedLlm.poblacion,
            temperamento: reconciled.poblacion.temperamento ?? parsedLlm.temperamento,
            reinaVista: reconciled.reina.vista ?? parsedLlm.reinaVista,
            reinaPresente: reconciled.reina.presente ?? parsedLlm.reinaPresente,
            posturaFresca: reconciled.reina.posturaFrescaPresente ?? parsedLlm.posturaFresca,
            realeras: reconciled.reina.realerasDetectadas ?? parsedLlm.realeras,
            zanganera: reconciled.reina.zanganera ?? parsedLlm.zanganera,
            varroa: reconciled.sanidad.varroaDetectada ?? parsedLlm.varroa,
            fase: reconciled.fase ?? parsedLlm.fase,
            accionUrgente: parsedLlm.accionUrgente ?? reconciled.accionesSugeridas[0],
            notas: text,
            ontology: reconciled,
          },
          model,
        },
      });
    } catch (e) {
      // Degradar elegantemente a la ontología determinista local si Groq tiene problemas
      return c.json({
        data: {
          parsed: {
            colmenaQuery: baseline.colmenaIdentificador,
            marcosCria: baseline.cuadrosTotales.marcosCriaTotal,
            marcosMiel: baseline.cuadrosTotales.marcosMiel,
            poblacion: baseline.poblacion.nivel,
            reinaVista: baseline.reina.vista,
            reinaPresente: baseline.reina.presente,
            varroa: baseline.sanidad.varroaDetectada,
            fase: baseline.fase,
            notas: baseline.notas,
            ontology: baseline,
          },
          model: "fallback-deterministic",
          warning: e instanceof Error ? e.message : "Fallback a ontología local",
        },
      });
    }
  },
);

/**
 * POST /api/ai/bitacora/stt-direct
 * Transcripción de audio directa en streaming/multipart vía Groq Whisper.
 */
aiRoutes.post(
  "/bitacora/stt-direct",
  requireProfileRole("admin", "apicultor", "territorial"),
  async (c) => {
    if (!isAiEnabled()) {
      return c.json(
        { code: "ai_disabled", message: "GROQ_API_KEY no configurada o AI_ENABLED=false" },
        503,
      );
    }

    const body = await c.req.parseBody();
    const file = body["audio"];
    if (!file || !(file instanceof File)) {
      return c.json(
        { code: "missing_file", message: "Se requiere archivo de audio en campo 'audio'" },
        400,
      );
    }

    try {
      const bytes = await file.arrayBuffer();
      const result = await groqTranscribeAudio({
        bytes,
        filename: file.name || "inspeccion.webm",
        mime: file.type || "audio/webm",
        language: "es",
        prompt: "Inspección apícola en Chiloé. Menciona colmenas por número, cría, miel, varroa, reina, población.",
      });

      return c.json({
        data: {
          text: result.text,
          model: result.model,
        },
      });
    } catch (e) {
      return c.json(
        {
          code: "stt_failed",
          message: e instanceof Error ? e.message : "Error en transcripción Groq Whisper",
        },
        502,
      );
    }
  },
);

