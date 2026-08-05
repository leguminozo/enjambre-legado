'use client';

import { useEffect, useState } from 'react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Select, Textarea, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import type { NodoManualRow } from '@/lib/bitacora-types';

interface NodoManualFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colmenas?: { id: string; name: string | null }[];
  colmenaIdFijo?: string | null;
  initial?: Omit<NodoManualRow, 'user_id'> | null;
  onSaved?: () => void;
}

const TIPOS = [
  { value: 'observacion', label: 'Observación' },
  { value: 'decision', label: 'Decisión' },
  { value: 'tension', label: 'Tensión' },
  { value: 'otro', label: 'Otro' },
];

/** Nodo manual de la red (capa libre, como los nodos manuales de RSN). */
export function NodoManualForm({ open, onOpenChange, colmenas = [], colmenaIdFijo, initial, onSaved }: NodoManualFormProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState('');
  const [tipo, setTipo] = useState('observacion');
  const [colmenaId, setColmenaId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLabel(initial?.label ?? '');
    setTipo(initial?.tipo ?? 'observacion');
    setColmenaId(colmenaIdFijo ?? initial?.colmena_id ?? '');
    setDescripcion(initial?.descripcion ?? '');
    setFormError(null);
  }, [open, colmenaIdFijo, initial]);

  const handleSave = async () => {
    if (!label.trim()) {
      setFormError('El nodo necesita una etiqueta.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        label: label.trim(),
        tipo,
        colmena_id: colmenaId || null,
        descripcion: descripcion.trim() || null,
      };
      const res = await apiFetch(initial ? `/api/bitacora/nodos/${initial.id}` : '/api/bitacora/nodos', {
        method: initial ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? 'No se pudo guardar el nodo');
      toast(initial ? 'Nodo actualizado' : 'Nodo creado', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bitacora-red'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-hoja'] });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display italic text-2xl font-normal">
            {initial ? 'Editar nodo manual' : 'Nuevo nodo en la red'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Etiqueta *</span>
            <Input placeholder="p. ej. Colmena 3 muestra conducta agresiva" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Tipo</span>
              <Select value={tipo} onValueChange={setTipo} options={TIPOS} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Colmena vinculada</span>
              <Select
                value={colmenaId}
                onValueChange={setColmenaId}
                options={[{ value: '', label: '— Sin colmena —' }, ...colmenas.map((c) => ({ value: c.id, label: c.name ?? 'Sin nombre' }))]}
                searchable
                disabled={Boolean(colmenaIdFijo)}
              />
            </div>
          </div>
          <Textarea label="Descripción" placeholder="Lo que se dice y lo que no se dice…" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">{formError}</div>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear nodo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
