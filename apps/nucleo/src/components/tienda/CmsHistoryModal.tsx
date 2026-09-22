'use client';

import { useState } from 'react';
import { History, Loader2, RotateCcw } from 'lucide-react';
import { ImmersiveModal, toast } from '@enjambre/ui';
import { useCmsVersions, type CMSContentVersion } from '@/hooks/use-cms-content';

interface CmsHistoryModalProps {
  open: boolean;
  onClose: () => void;
  onRestored: () => void;
}

/** Resumen legible de una versión: primeros textos del contenido. */
function versionSummary(version: CMSContentVersion): string {
  const texts: string[] = [];
  const collect = (value: unknown) => {
    if (texts.join(' ').length > 140 || texts.length >= 3) return;
    if (typeof value === 'string' && value.trim()) texts.push(value.trim());
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const v of Object.values(value as Record<string, unknown>)) collect(v);
    }
  };
  collect(version.draft_content ?? version.content);
  const joined = texts.join(' · ').replace(/\s+/g, ' ');
  return joined.length > 140 ? `${joined.slice(0, 140)}…` : joined || '(sin texto)';
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function CmsHistoryModal({ open, onClose, onRestored }: CmsHistoryModalProps) {
  const { data, isLoading, error, restore } = useCmsVersions();
  const [armingId, setArmingId] = useState<string | null>(null);

  const handleRestore = (versionId: string) => {
    if (armingId !== versionId) {
      setArmingId(versionId);
      return;
    }
    setArmingId(null);
    restore.mutate(versionId, {
      onSuccess: (res) => {
        toast(res.revalidated ? 'Versión restaurada y publicada ✓' : 'Versión restaurada como borrador ✓', {
          type: 'success',
        });
        onRestored();
        onClose();
      },
      onError: (err) => toast(err.message, { type: 'error' }),
    });
  };

  const versions = data?.data ?? [];

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      eyebrow="CMS · Historial"
      title="Versiones anteriores"
      size="lg"
    >
      <p className="text-xs text-muted-foreground mb-4">
        Cada guardado, publicación y descarte conserva el estado previo. Restaurar también deja su
        propia versión, así que toda acción es reversible.
      </p>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Cargando historial…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive py-6 text-center">No se pudo cargar el historial.</p>
      ) : versions.length === 0 ? (
        <div className="text-center py-10 px-4 border border-dashed border-border rounded-xl">
          <History size={20} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aún no hay versiones. Aparecen al guardar cambios.</p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {versions.map((v) => (
            <li
              key={v.id}
              className="rounded-xl border border-border bg-background p-3 flex items-start gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-foreground">
                  {v.section_key}
                  <span className="ml-2 font-normal text-muted-foreground tabular-nums">
                    {formatWhen(v.created_at)}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {versionSummary(v)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRestore(v.id)}
                disabled={restore.isPending}
                className={`inline-flex shrink-0 min-h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                  armingId === v.id
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border text-muted-foreground hover:border-accent/40 hover:text-foreground'
                }`}
                title={armingId === v.id ? 'Clic de nuevo para confirmar' : 'Restaurar esta versión'}
              >
                {restore.isPending && armingId === v.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RotateCcw size={12} />
                )}
                {armingId === v.id ? '¿Confirmar?' : 'Restaurar'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </ImmersiveModal>
  );
}
