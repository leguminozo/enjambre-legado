'use client';

import { useEffect, useState } from 'react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Select, Switch, Textarea, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import type { MuestraRow } from '@/lib/bitacora-types';

interface MuestraFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiarios: { id: string; name: string | null }[];
  apiarioIdFijo?: string | null;
  initial?: MuestraRow | null;
  onSaved?: () => void;
}

const TIPOS = [
  { value: 'varroa', label: 'Varroa' },
  { value: 'nosema', label: 'Nosema' },
  { value: 'otro', label: 'Otro' },
];

const PATOGENOS = [
  { value: 'varroa', label: 'Varroa destructor' },
  { value: 'nosema', label: 'Nosema spp.' },
  { value: 'DWV', label: 'DWV (virus ala deformada)' },
  { value: 'ABPV', label: 'ABPV (parálisis aguda)' },
  { value: 'otro', label: 'Otro' },
];

/** Muestra de laboratorio y contramuestreo (§2.1/§2.2) — archivo ≥2 años. */
export function MuestraForm({ open, onOpenChange, apiarios, apiarioIdFijo, initial, onSaved }: MuestraFormProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [apiarioId, setApiarioId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [tipo, setTipo] = useState('varroa');
  const [nAbejas, setNAbejas] = useState('');
  const [labNombre, setLabNombre] = useState('');
  const [labFecha, setLabFecha] = useState('');
  const [resultado, setResultado] = useState('');
  const [patogeno, setPatogeno] = useState('');
  const [esContramuestra, setEsContramuestra] = useState(false);
  const [confirmadoSaneado, setConfirmadoSaneado] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setApiarioId(apiarioIdFijo ?? initial?.apiario_id ?? apiarios[0]?.id ?? '');
    setFecha(initial?.fecha ?? new Date().toISOString().split('T')[0]);
    setTipo(initial?.tipo ?? 'varroa');
    setNAbejas(initial?.n_abejas != null ? String(initial.n_abejas) : '');
    setLabNombre(initial?.lab_nombre ?? '');
    setLabFecha(initial?.lab_fecha ?? '');
    setResultado(initial?.resultado ?? '');
    setPatogeno(initial?.patogeno ?? '');
    setEsContramuestra(initial?.es_contramuestra ?? false);
    setConfirmadoSaneado(initial?.confirmado_saneado ?? false);
    setFormError(null);
  }, [open, apiarioIdFijo, initial, apiarios]);

  const handleSave = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        apiario_id: apiarioId || null,
        fecha,
        tipo,
        n_abejas: nAbejas ? parseInt(nAbejas, 10) : undefined,
        lab_nombre: labNombre.trim() || undefined,
        lab_fecha: labFecha || undefined,
        resultado: resultado.trim() || undefined,
        patogeno: patogeno || null,
        es_contramuestra: esContramuestra,
        confirmado_saneado: confirmadoSaneado,
      };
      const res = await apiFetch(initial ? `/api/bitacora/muestras/${initial.id}` : '/api/bitacora/muestras', {
        method: initial ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? 'No se pudo guardar la muestra');
      toast(initial ? 'Muestra actualizada' : 'Muestra registrada', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bitacora-muestras'] });
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
            {initial ? 'Editar muestra' : 'Registrar muestra de laboratorio'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Apiario</span>
            <Select
              value={apiarioId}
              onValueChange={setApiarioId}
              options={apiarios.map((a) => ({ value: a.id, label: a.name ?? 'Sin nombre' }))}
              searchable
              disabled={Boolean(apiarioIdFijo)}
              placeholder="Seleccionar apiario…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Fecha de muestreo</span>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Tipo</span>
              <Select value={tipo} onValueChange={setTipo} options={TIPOS} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Nº de abejas</span>
              <Input type="number" min={0} placeholder="300" value={nAbejas} onChange={(e) => setNAbejas(e.target.value)} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Laboratorio</span>
              <Input placeholder="Nombre del laboratorio" value={labNombre} onChange={(e) => setLabNombre(e.target.value)} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Fecha de resultado</span>
              <Input type="date" value={labFecha} onChange={(e) => setLabFecha(e.target.value)} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Patógeno detectado</span>
              <Select value={patogeno} onValueChange={setPatogeno} options={[{ value: '', label: 'Sin resultado / pendiente' }, ...PATOGENOS]} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={esContramuestra} onCheckedChange={setEsContramuestra} /> Contramuestra
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={confirmadoSaneado} onCheckedChange={setConfirmadoSaneado} /> Confirma saneamiento
              </label>
            </div>
            <div className="sm:col-span-2">
              <Textarea label="Resultado" placeholder="Resultado del laboratorio…" value={resultado} onChange={(e) => setResultado(e.target.value)} rows={2} />
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
