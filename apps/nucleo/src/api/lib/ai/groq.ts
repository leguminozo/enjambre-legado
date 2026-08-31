/**
 * Cliente Groq (neocloud) — solo server / BFF Núcleo.
 * API OpenAI-compatible: https://api.groq.com/openai/v1
 *
 * Nunca importar desde componentes cliente.
 */

const GROQ_BASE = "https://api.groq.com/openai/v1";

export function getGroqApiKey(): string | null {
  const key = process.env.GROQ_API_KEY?.trim();
  return key || null;
}

export function isAiEnabled(): boolean {
  if (process.env.AI_ENABLED === "false") return false;
  return Boolean(getGroqApiKey());
}

export function getGroqChatModel(): string {
  return process.env.GROQ_CHAT_MODEL?.trim() || "llama-3.3-70b-versatile";
}

export function getGroqSttModel(): string {
  return process.env.GROQ_STT_MODEL?.trim() || "whisper-large-v3-turbo";
}

export type GroqChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function groqChatCompletion(input: {
  messages: GroqChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}): Promise<{ text: string; model: string; usage?: unknown }> {
  const key = getGroqApiKey();
  if (!key) throw new Error("GROQ_API_KEY no configurada");

  const model = getGroqChatModel();
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: input.messages,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.max_tokens ?? 1024,
      ...(input.response_format ? { response_format: input.response_format } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Groq chat ${res.status}: ${errText.slice(0, 400)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
    usage?: unknown;
  };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  return { text, model: json.model ?? model, usage: json.usage };
}

/**
 * Speech-to-text vía Whisper en Groq.
 * @see https://console.groq.com/docs/speech-to-text
 */
export async function groqTranscribeAudio(input: {
  bytes: ArrayBuffer | Uint8Array;
  filename: string;
  mime?: string;
  language?: string;
  prompt?: string;
}): Promise<{ text: string; model: string }> {
  const key = getGroqApiKey();
  if (!key) throw new Error("GROQ_API_KEY no configurada");

  const model = getGroqSttModel();
  const blob = new Blob([input.bytes as BlobPart], {
    type: input.mime || "application/octet-stream",
  });

  const form = new FormData();
  form.append("file", blob, input.filename);
  form.append("model", model);
  form.append("response_format", "json");
  form.append("language", input.language ?? "es");
  form.append("temperature", "0");
  if (input.prompt) form.append("prompt", input.prompt.slice(0, 800));

  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Groq STT ${res.status}: ${errText.slice(0, 400)}`);
  }

  const json = (await res.json()) as { text?: string };
  return { text: (json.text ?? "").trim(), model };
}
