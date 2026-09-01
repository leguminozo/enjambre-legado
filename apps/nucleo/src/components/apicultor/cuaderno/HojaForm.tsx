'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Select, Switch, Textarea, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import type { CuerpoCuadro, FaseBitacora, TipoCuadro, HojaCuaderno } from '@/lib/bitacora-types';
import { FASES_BITACORA, CUERPOS_CUADRO, TIPOS_CUADRO } from '@/lib/bitacora-types';
import { FASE_LABEL, CUERPO_LABEL, TIPO_CUADRO_LABEL } from '../bitacora-labels';
import type { HojaPlantilla } from './labels';

interface CuadroDraft {
  posicion: number;
  cuerpo: CuerpoCuadro;
  tipo: TipoCuadro;
  notas: string;
}

interface HojaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colmenas: { id: string; name: string | null }[];
  colmenaIdFijo?: string | null;
  plantilla?: HojaPlantilla | null;
  initial?: HojaCuaderno | null;
  onSaved?: () => void;
}

const POBLACIONES = ['Baja', 'Media', 'Alta'];

/** Formulario de hoja de cuaderno (crear/editar) — cada hoja es un "estudio"
 *  de la red semántica del apiario (workflow RSN adaptado). */
export function HojaForm({
  open,
  onOpenChange,
  colmenas,
  colmenaIdFijo,
  plantilla,
  initial,
  onSaved,
}: HojaFormProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const [colmenaId, setColmenaId] = useState('');
  const [fase, setFase] = useState<FaseBitacora>('temporada');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [poblacion, setPoblacion] = useState('Media');
  const [reinaVista, setReinaVista] = useState(true);
  const [marcosCria, setMarcosCria] = useState('');
  const [marcosMiel, setMarcosMiel] = useState('');
  const [varroa, setVarroa] = useState('');
  const [notas, setNotas] = useState('');
  const [cuadros, setCuadros] = useState<CuadroDraft[]>([{ posicion: 1, cuerpo: 'camara', tipo: 'vacio', notas: '' }]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setColmenaId(colmenaIdFijo ?? initial?.colmena_id ?? colmenas[0]?.id ?? '');
    setFase((initial?.fase ?? plantilla?.fase ?? 'temporada') as FaseBitacora);
    setFecha(initial?.date ?? new Date().toISOString().split('T')[0]);
    setPoblacion(initial?.poblacion ?? plantilla?.poblacion ?? 'Media');
    setReinaVista(initial?.reina ?? true);
    setMarcosCria(initial?.marcos_cria != null ? String(initial.marcos_cria) : '');
    setMarcosMiel(initial?.marcos_miel != null ? String(initial.marcos_miel) : '');
    setVarroa(initial?.varroa != null ? String(initial.varroa) : '');
    setNotas(initial?.notes ?? plantilla?.notas ?? '');
    setCuadros(
      initial?.id && initial.cuadros_count > 0
        ? Array.from({ length: initial.cuadros_count }, (_, i) => ({ posicion: i + 1, cuerpo: 'camara' as CuerpoCuadro, tipo: 'vacio' as TipoCuadro, notas: '' }))
        : [{ posicion: 1, cuerpo: 'camara', tipo: 'vacio', notas: '' }],
    );
    setFormError(null);
  }, [open, colmenaIdFijo, initial, plantilla, colmenas]);

  const updateCuadro = (i: number, patch: Partial<CuadroDraft>) => {
    setCuadros((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };

  const handleSave = async () => {
    if (!colmenaId) {
      setFormError('Selecciona una colmena para la hoja.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        colmena_id: colmenaId,
        fecha,
        fase,
        poblacion,
        reina: reinaVista,
        marcos_cria: marcosCria ? parseInt(marcosCria, 10) : undefined,
        marcos_miel: marcosMiel ? parseInt(marcosMiel, 10) : undefined,
        varroa: varroa !== '' ? parseFloat(varroa) : undefined,
        cuadros: cuadros.filter((c) => c.tipo),
        notas: notas.trim() || undefined,
      };
      const res = await apiFetch(
        initial ? `/api/bitacora/inspecciones/${initial.id}` : '/api/bitacora/inspecciones',
        { method: initial ? 'PATCH' : 'POST', body: JSON.stringify(payload) },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message ?? json.code ?? 'No se pudo guardar la hoja');
      }
      toast(initial ? 'Hoja actualizada' : 'Hoja registrada', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['bitacora-hojas'] });
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
      <DialogContent className="sm:max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display italic text-2xl font-normal">
            {initial ? 'Editar hoja' : plantilla ? `Nueva hoja · ${plantilla.label}` : 'Nueva hoja'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Fase del ciclo</span>
              <Select
                value={fase}
                onValueChange={(v) => setFase(v as FaseBitacora)}
                options={FASES_BITACORA.map((f) => ({ value: f, label: FASE_LABEL[f] }))}
              />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Fecha</span>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Población</span>
              <Select
                value={poblacion}
                onValueChange={setPoblacion}
                options={POBLACIONES.map((p) => ({ value: p, label: p }))}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={reinaVista} onCheckedChange={setReinaVista} />
                Reina vista
              </label>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Marcos de cría</span>
              <Input type="number" min={0} placeholder="0" value={marcosCria} onChange={(e) => setMarcosCria(e.target.value)} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Marcos de miel</span>
              <Input type="number" min={0} placeholder="0" value={marcosMiel} onChange={(e) => setMarcosMiel(e.target.value)} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Varroa (nivel)</span>
              <Input type="number" min={0} step={0.5} placeholder="0–10" value={varroa} onChange={(e) => setVarroa(e.target.value)} />
            </div>
          </div>

          {/* Cuadros individualizados (§1.1/§1.2): C/L/E/V/M */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Cuadros individualizados</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCuadros((prev) => [...prev, { posicion: prev.length + 1, cuerpo: 'camara', tipo: 'vacio', notas: '' }])}
              >
                <Plus className="size-3.5 mr-1" /> Agregar cuadro
              </Button>
            </div>
            <div className="space-y-2">
              {cuadros.map((c, i) => (
                <div key={i} className="flex flex-col sm:grid sm:grid-cols-[3.5rem_1fr_1fr_1fr_2rem] gap-3 sm:gap-2 items-stretch sm:items-end p-3 border border-border/50 rounded-xl sm:p-0 sm:border-0 sm:rounded-none bg-surface-sunken sm:bg-transparent relative">
                  <Input
                    type="number"
                    min={1}
                    className="h-9"
                    placeholder="Pos."
                    value={c.posicion || ''}
                    onChange={(e) => updateCuadro(i, { posicion: parseInt(e.target.value, 10) || 0 })}
                  />
                  <div className="w-full sm:w-auto">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Cuerpo</span>
                    <Select
                      value={c.cuerpo}
                      onValueChange={(v) => updateCuadro(i, { cuerpo: v as CuerpoCuadro })}
                      options={CUERPOS_CUADRO.map((cb) => ({ value: cb, label: CUERPO_LABEL[cb] }))}
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Tipo</span>
                    <Select
                      value={c.tipo}
                      onValueChange={(v) => updateCuadro(i, { tipo: v as TipoCuadro })}
                      options={TIPOS_CUADRO.map((t) => ({ value: t, label: TIPO_CUADRO_LABEL[t] }))}
                    />
                  </div>
                  <Input className="h-9" placeholder="Nota" value={c.notas} onChange={(e) => updateCuadro(i, { notas: e.target.value })} />
                  <Button variant="ghost" className="absolute top-1 right-1 sm:static sm:top-auto sm:right-auto h-9 w-9 text-destructive" onClick={() => setCuadros((prev) => prev.filter((_, idx) => idx !== i))}>
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Textarea label="Notas de la visita" placeholder="Observaciones, decisiones, lo que no se dice…" value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />

          {formError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Registrar hoja'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
