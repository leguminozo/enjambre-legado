'use client';

import { useEffect, useState } from 'react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Select, Textarea, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import type { TratamientoRow } from '@/lib/bitacora-types';

interface TratamientoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colmenas: { id: string; name: string | null }[];
  colmenaIdFijo?: string | null;
  initial?: TratamientoRow | null;
  onSaved?: () => void;
}

const ENFERMEDADES = [
  { value: 'varroa', label: 'Varroosis' },
  { value: 'nosema', label: 'Nosemosis' },
  { value: 'loque', label: 'Loque' },
  { value: 'otro', label: 'Otro' },
];

/** Tratamiento fitosanitario (§2.3/§2.4) — archivo legal ≥5 años, con retiro. */
export function TratamientoForm({ open, onOpenChange, colmenas, colmenaIdFijo, initial, onSaved }: TratamientoFormProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [colmenaId, setColmenaId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [productoComercial, setProductoComercial] = useState('');
  const [principioActivo, setPrincipioActivo] = useState('');
  const [dosisAplicada, setDosisAplicada] = useState('');
  const [enfermedad, setEnfermedad] = useState('varroa');
  const [via, setVia] = useState('');
  const [retiroFin, setRetiroFin] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setColmenaId(colmenaIdFijo ?? initial?.colmena_id ?? colmenas[0]?.id ?? '');
    setFecha(initial?.fecha ?? new Date().toISOString().split('T')[0]);
    setProductoComercial(initial?.producto_comercial ?? '');
    setPrincipioActivo(initial?.principio_activo ?? '');
    setDosisAplicada(initial?.dosis_aplicada ?? '');
    setEnfermedad(initial?.enfermedad ?? 'varroa');
    setVia(initial?.via ?? '');
    setRetiroFin(initial?.retiro_fin ?? '');
    setFormError(null);
  }, [open, colmenaIdFijo, initial, colmenas]);

  const handleSave = async () => {
    if (!colmenaId) {
      setFormError('Selecciona una colmena.');
      return;
    }
    if (!principioActivo.trim()) {
      setFormError('El principio activo es obligatorio.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        colmena_id: colmenaId,
        fecha,
        producto_comercial: productoComercial.trim() || undefined,
        principio_activo: principioActivo.trim(),
        dosis_aplicada: dosisAplicada.trim() || undefined,
        enfermedad,
        via: via.trim() || undefined,
        retiro_fin: retiroFin || undefined,
      };
      const res = await apiFetch(initial ? `/api/bitacora/tratamientos/${initial.id}` : '/api/bitacora/tratamientos', {
        method: initial ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? 'No se pudo guardar el tratamiento');
      toast(initial ? 'Tratamiento actualizado' : 'Tratamiento registrado', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bitacora-tratamientos'] });
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
      <DialogContent className="sm:max-w-lg max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display italic text-2xl font-normal">
            {initial ? 'Editar tratamiento' : 'Registrar tratamiento'}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Fecha de aplicación</span>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Enfermedad</span>
              <Select value={enfermedad} onValueChange={setEnfermedad} options={ENFERMEDADES} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Producto comercial</span>
              <Input placeholder="Nombre del producto" value={productoComercial} onChange={(e) => setProductoComercial(e.target.value)} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Principio activo *</span>
              <Input placeholder="p. ej. ácido oxálico" value={principioActivo} onChange={(e) => setPrincipioActivo(e.target.value)} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Dosis aplicada</span>
              <Input placeholder="p. ej. 5 ml/colmena" value={dosisAplicada} onChange={(e) => setDosisAplicada(e.target.value)} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Vía</span>
              <Input placeholder="p. ej. goteo, vaporización" value={via} onChange={(e) => setVia(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Fin del período de retiro</span>
              <Input type="date" value={retiroFin} onChange={(e) => setRetiroFin(e.target.value)} />
            </div>
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
