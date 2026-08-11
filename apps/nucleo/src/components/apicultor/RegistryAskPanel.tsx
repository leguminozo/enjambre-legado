'use client';

/**
 * UI del endpoint POST /api/ai/registry/ask — cierra el gap FE↔BFF de IA de registro.
 * Solo muestra datos del usuario autenticado (scope server-side).
 */

import { useState } from 'react';
import { Brain, Loader2, Send } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

export function RegistryAskPanel({ compact = false }: { compact?: boolean }) {
  const apiFetch = useApiFetch();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiOff, setAiOff] = useState(false);

  const ask = async () => {
    const q = question.trim();
    if (q.length < 3) {
      toast('Escribí una pregunta un poco más larga', { type: 'warning' });
      return;
    }
    setLoading(true);
    setAnswer(null);
    try {
      const res = await apiFetch('/api/ai/registry/ask', {
        method: 'POST',
        body: JSON.stringify({ question: q }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { answer?: string; scope_meta?: { colmenas?: number } };
        message?: string;
        code?: string;
      };
      if (res.status === 503 || json.code === 'ai_disabled') {
        setAiOff(true);
        toast(json.message ?? 'IA no configurada (GROQ_API_KEY)', { type: 'warning' });
        return;
      }
      if (!res.ok) {
        toast(json.message ?? 'No se pudo consultar el registro', { type: 'error' });
        return;
      }
      setAnswer(json.data?.answer ?? '');
    } finally {
      setLoading(false);
    }
  };

  if (aiOff) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-4 text-xs text-muted-foreground">
        Asistente de registro desactivado. Configurá <code className="text-[0.65rem]">GROQ_API_KEY</code> en Núcleo
        (ver docs/AI_NUCLEO.md).
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-border bg-card ${compact ? 'p-4' : 'p-5'} space-y-3`}>
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Brain size={18} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">Preguntá a tu registro</h3>
          <p className="text-[11px] text-muted-foreground">
            Solo ve tus colmenas / datos — no inventa de otros usuarios (Groq · server-side)
          </p>
        </div>
      </div>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={compact ? 2 : 3}
        placeholder="Ej.: ¿Qué colmenas no tienen inspección reciente?"
        className="w-full rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 resize-y"
        disabled={loading}
      />
      <button
        type="button"
        onClick={() => void ask()}
        disabled={loading || question.trim().length < 3}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-40"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        Preguntar
      </button>
      {answer != null && answer !== '' && (
        <div className="rounded-lg border border-border/50 bg-secondary/15 p-3 text-sm text-foreground whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}
