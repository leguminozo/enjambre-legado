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
