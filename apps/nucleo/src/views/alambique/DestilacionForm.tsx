'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea, Select, Switch, toast } from '@enjambre/ui';
import { CatalogoVacioCallout } from '@/components/shared/CatalogoVacioCallout';
import {
  destilacionFormSchema,
  METODO_OPTIONS,
  ESTADO_DESTILACION_OPTIONS,
  toIso,
  type DestilacionFormValues,
  type DestilacionRow,
  type PlantaRow,
} from './alambique-types';

interface DestilacionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: DestilacionRow | null;
}

const DEFAULT_VALUES: DestilacionFormValues = {
  planta_id: '',
  metodo: 'arrastre_vapor',
  fecha_inicio: '',
  fecha_fin: '',
  carga_kg: 0,
  agua_l: null,
  duracion_min: null,
  temperatura_promedio: null,
  rendimiento_hidrolato_ml: null,
  rendimiento_aceite_ml: null,
  analisis_organoleptico: undefined,
  observaciones: '',
  estado: 'finalizada',
  publico: false,
  relato_publico: '',
};

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DestilacionForm({ open, onOpenChange, initial }: DestilacionFormProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const { data: plantasData } = useQuery<{ data: PlantaRow[] }>({
    queryKey: ['alambique', 'plantas'],
    queryFn: async () => {
      const res = await apiFetch('/api/alambique/plantas');
      if (!res.ok) throw new Error('Error al cargar materias primas');
      return res.json();
    },
    enabled: open,
  });

  const plantaOptions = useMemo(
    () =>
      (plantasData?.data ?? []).map((p) => ({
        value: p.id,
        label: p.nombre_comun + (p.nombre_cientifico ? ` (${p.nombre_cientifico})` : ''),
      })),
    [plantasData],
  );

  const form = useForm<DestilacionFormValues>({
    resolver: zodResolver(destilacionFormSchema) as never,
    defaultValues: DEFAULT_VALUES,
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form;
  const publico = watch('publico');

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            planta_id: initial.planta?.id ?? '',
            metodo: (initial.metodo as DestilacionFormValues['metodo']) ?? 'arrastre_vapor',
            fecha_inicio: toDatetimeLocal(initial.fecha_inicio),
            fecha_fin: toDatetimeLocal(initial.fecha_fin),
            carga_kg: initial.carga_kg,
            agua_l: initial.agua_l,
            duracion_min: initial.duracion_min,
            temperatura_promedio: initial.temperatura_promedio,
            rendimiento_hidrolato_ml: initial.rendimiento_hidrolato_ml,
            rendimiento_aceite_ml: initial.rendimiento_aceite_ml,
            analisis_organoleptico: initial.analisis_organoleptico ?? undefined,
            observaciones: initial.observaciones ?? '',
            estado: (initial.estado as DestilacionFormValues['estado']) ?? 'finalizada',
            publico: initial.publico,
            relato_publico: initial.relato_publico ?? '',
          }
        : DEFAULT_VALUES,
    );
  }, [open, initial, reset]);

  const mutation = useMutation({
    mutationFn: async (values: DestilacionFormValues) => {
      const organo = values.analisis_organoleptico;
      const hasOrgano = organo ? Object.values(organo).some((v) => v && v.trim() !== '') : false;
      const payload = {
        ...values,
        fecha_inicio: toIso(values.fecha_inicio),
        fecha_fin: values.fecha_fin ? toIso(values.fecha_fin) : null,
        analisis_organoleptico: hasOrgano ? organo : undefined,
        observaciones: values.observaciones?.trim() || null,
        relato_publico: values.relato_publico?.trim() || null,
      };
      const res = await apiFetch(initial ? `/api/alambique/destilaciones/${initial.id}` : '/api/alambique/destilaciones', {
        method: initial ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al guardar destilación');
      }
      return res.json();
    },
    onSuccess: () => {
      toast(initial ? 'Destilación actualizada' : 'Destilación registrada', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['alambique'] });
      onOpenChange(false);
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? `Editar ${initial.codigo ?? 'destilación'}` : 'Nueva destilación'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">Materia prima *</span>
              {plantaOptions.length === 0 ? (
                <CatalogoVacioCallout
                  title="No hay materias primas"
                  description="Para registrar una destilación, primero da de alta la planta o hierba en Materias Primas."
                  href="/alambique?tab=plantas"
                  goLabel="Ir a Materias Primas"
                  onNavigate={() => onOpenChange(false)}
                />
              ) : (
                <Select
                  value={watch('planta_id')}
                  onValueChange={(v) => setValue('planta_id', v)}
                  options={plantaOptions}
                  placeholder="Seleccionar planta…"
                  searchable
                />
              )}
              {errors.planta_id && <p className="text-xs text-destructive">{errors.planta_id.message}</p>}
            </div>
            <div className="space-y-2">
              <span className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">Método *</span>
              <Select
                value={watch('metodo')}
                onValueChange={(v) => setValue('metodo', v as DestilacionFormValues['metodo'])}
                options={METODO_OPTIONS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Inicio (fecha y hora) *" type="datetime-local" {...register('fecha_inicio')} error={errors.fecha_inicio?.message} />
            <Input label="Fin (fecha y hora)" type="datetime-local" {...register('fecha_fin')} error={errors.fecha_fin?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Carga (kg) *" type="number" step="0.001" min="0" {...register('carga_kg')} error={errors.carga_kg?.message} />
            <Input label="Agua (L)" type="number" step="0.1" min="0" {...register('agua_l')} error={errors.agua_l?.message} />
            <Input label="Duración (min)" type="number" min="0" {...register('duracion_min')} error={errors.duracion_min?.message} />
            <Input label="Temp. prom. (°C)" type="number" step="0.1" {...register('temperatura_promedio')} error={errors.temperatura_promedio?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Hidrolato (ml)" type="number" step="0.1" min="0" {...register('rendimiento_hidrolato_ml')} error={errors.rendimiento_hidrolato_ml?.message} />
            <Input label="Aceite esencial (ml)" type="number" step="0.1" min="0" {...register('rendimiento_aceite_ml')} error={errors.rendimiento_aceite_ml?.message} />
          </div>

          <div className="bg-surface-sunken/50 rounded-xl border border-border/50 p-4 space-y-3">
            <p className="text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">Análisis organoléptico</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Color" placeholder="Ámbar claro" {...register('analisis_organoleptico.color')} />
              <Input label="Olor" placeholder="Dulce, resinoso" {...register('analisis_organoleptico.olor')} />
              <Input label="Sabor" placeholder="Herbal, picante" {...register('analisis_organoleptico.sabor')} />
              <Input label="Textura" placeholder="Ligera, acuosa" {...register('analisis_organoleptico.textura')} />
            </div>
          </div>

          <Textarea label="Observaciones del proceso" placeholder="Velocidad de calentamiento, incidencias, fracciones…" rows={2} {...register('observaciones')} />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Trazabilidad pública (QR)</p>
              <p className="text-xs text-muted-foreground">Genera una página pública con el origen y el proceso de esta destilación.</p>
            </div>
            <Switch checked={publico} onCheckedChange={(v) => setValue('publico', v)} />
          </div>

          {publico && (
            <Textarea label="Relato público (historia del lote)" placeholder="La historia que verá quien escanee el QR…" rows={3} {...register('relato_publico')} error={errors.relato_publico?.message} />
          )}

          <div className="space-y-2">
            <span className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">Estado *</span>
            <Select
              value={watch('estado')}
              onValueChange={(v) => setValue('estado', v as DestilacionFormValues['estado'])}
              options={ESTADO_DESTILACION_OPTIONS}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending || plantaOptions.length === 0}>
              {mutation.isPending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
