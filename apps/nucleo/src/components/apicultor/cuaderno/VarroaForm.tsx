'use client';

import { useEffect, useState } from 'react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Select, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import type { VarroaRow } from '@/lib/apicultor-types';

interface VarroaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colmenas: { id: string; name: string | null }[];
  colmenaIdFijo?: string | null;
  initial?: VarroaRow | null;
  onSaved?: () => void;
}

const METODOS = ['Lavado de alcohol', 'Azúcar impalpable', 'Bandeja engomada', 'Otro'];

/** Monitoreo de Varroa destructor — registro rápido del cuaderno. */
export function VarroaForm({ open, onOpenChange, colmenas, colmenaIdFijo, initial, onSaved }: VarroaFormProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [colmenaId, setColmenaId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [level, setLevel] = useState('');
  const [method, setMethod] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setColmenaId(colmenaIdFijo ?? initial?.colmena_id ?? colmenas[0]?.id ?? '');
    setDate(initial?.date ?? new Date().toISOString().split('T')[0]);
    setLevel(initial?.level != null ? String(initial.level) : '');
    setMethod(initial?.method ?? '');
    setFormError(null);
  }, [open, colmenaIdFijo, initial, colmenas]);

  const handleSave = async () => {
    if (!colmenaId) {
      setFormError('Selecciona una colmena.');
      return;
    }
    if (level === '') {
      setFormError('Registra el nivel de varroa.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = { colmena_id: colmenaId, date, level: parseFloat(level), method: method || undefined };
      const res = await apiFetch(initial ? `/api/bitacora/varroa/${initial.id}` : '/api/bitacora/varroa', {
        method: initial ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? 'No se pudo guardar el monitoreo');
      toast(initial ? 'Monitoreo actualizado' : 'Monitoreo registrado', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bitacora-varroa'] });
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
            {initial ? 'Editar monitoreo varroa' : 'Registrar monitoreo varroa'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Colmena</span>
            <Select
              value={colmenaId}
              onValueChange={setColmenaId}
              options={colmenas.map((c) => ({ value: c.id, label: c.name ?? 'Sin nombre' }))}
              searchable
              disabled={Boolean(colmenaIdFijo)}
              placeholder="Seleccionar colmena…"
            />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Fecha</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Nivel (0–10)</span>
            <Input type="number" min={0} max={10} step={0.5} placeholder="0.0" value={level} onChange={(e) => setLevel(e.target.value)} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Método</span>
            <Select value={method} onValueChange={setMethod} options={METODOS.map((m) => ({ value: m, label: m }))} placeholder="Seleccionar método…" />
          </div>
          {formError && <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">{formError}</div>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
