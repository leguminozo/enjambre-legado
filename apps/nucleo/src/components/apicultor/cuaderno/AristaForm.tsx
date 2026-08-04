'use client';

import { useEffect, useState } from 'react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Select, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import { RELACION_LABEL } from './labels';

interface AristaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceId: string;
  sourceLabel: string;
  targetId: string;
  targetLabel: string;
  onSaved?: () => void;
}

const RELACIONES = [
  { value: 'deriva_de', label: RELACION_LABEL.deriva_de },
  { value: 'observa', label: RELACION_LABEL.observa },
  { value: 'tension', label: RELACION_LABEL.tension },
  { value: 'analogia', label: RELACION_LABEL.analogia },
  { value: 'otro', label: RELACION_LABEL.otro },
];

/** Conexión manual entre dos nodos (modo conectar del lienzo). */
export function AristaForm({ open, onOpenChange, sourceId, sourceLabel, targetId, targetLabel, onSaved }: AristaFormProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [relacion, setRelacion] = useState('observa');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRelacion('observa');
      setLabel('');
      setFormError(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!sourceId || !targetId) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await apiFetch('/api/bitacora/aristas', {
        method: 'POST',
        body: JSON.stringify({ source_id: sourceId, target_id: targetId, relacion, label: label.trim() || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? 'No se pudo conectar');
      toast('Conexión creada', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bitacora-red'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-hoja'] });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al conectar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display italic text-2xl font-normal">Conectar nodos</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
            <span className="truncate font-medium">{sourceLabel}</span>
            <span className="text-muted-foreground">→</span>
            <span className="truncate font-medium">{targetLabel}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Relación</span>
            <Select value={relacion} onValueChange={setRelacion} options={RELACIONES} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Etiqueta (opcional)</span>
            <Input placeholder="p. ej. hipótesis de manejo" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">{formError}</div>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Conectando…' : 'Conectar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
