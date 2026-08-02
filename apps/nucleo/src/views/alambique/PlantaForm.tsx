'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea, Select, toast } from '@enjambre/ui';
import {
  plantaFormSchema,
  PARTE_USADA_OPTIONS,
  ESTADO_MATERIAL_OPTIONS,
  type PlantaFormValues,
  type PlantaRow,
} from './alambique-types';

interface PlantaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PlantaRow | null;
}

const DEFAULT_VALUES: PlantaFormValues = {
  nombre_comun: '',
  nombre_cientifico: '',
  parte_usada: 'hojas',
  estado_material: 'fresco',
  cantidad_kg: 0,
  origen: '',
  lat: null,
  lng: null,
  fecha_recoleccion: null,
  observaciones: '',
};

export function PlantaForm({ open, onOpenChange, initial }: PlantaFormProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const form = useForm<PlantaFormValues>({
    resolver: zodResolver(plantaFormSchema) as never,
    defaultValues: DEFAULT_VALUES,
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form;

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            nombre_comun: initial.nombre_comun,
            nombre_cientifico: initial.nombre_cientifico ?? '',
            parte_usada: (initial.parte_usada as PlantaFormValues['parte_usada']) ?? 'hojas',
            estado_material: (initial.estado_material as PlantaFormValues['estado_material']) ?? 'fresco',
            cantidad_kg: initial.cantidad_kg,
            origen: initial.origen ?? '',
            lat: initial.lat,
            lng: initial.lng,
            fecha_recoleccion: initial.fecha_recoleccion,
            observaciones: initial.observaciones ?? '',
          }
        : DEFAULT_VALUES,
    );
  }, [open, initial, reset]);

  const mutation = useMutation({
    mutationFn: async (values: PlantaFormValues) => {
      const res = await apiFetch(initial ? `/api/alambique/plantas/${initial.id}` : '/api/alambique/plantas', {
        method: initial ? 'PATCH' : 'POST',
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al guardar materia prima');
      }
      return res.json();
    },
    onSuccess: () => {
      toast(initial ? 'Materia prima actualizada' : 'Materia prima registrada', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['alambique'] });
      onOpenChange(false);
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  const onSubmit = (values: PlantaFormValues) => {
    mutation.mutate({
      ...values,
      nombre_cientifico: values.nombre_cientifico?.trim() || null,
      origen: values.origen?.trim() || null,
      observaciones: values.observaciones?.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar materia prima' : 'Nueva materia prima'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre común *" placeholder="Canelo" {...register('nombre_comun')} error={errors.nombre_comun?.message} />
            <Input label="Nombre científico" placeholder="Drimys winteri" {...register('nombre_cientifico')} error={errors.nombre_cientifico?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <span className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">Parte usada *</span>
              <Select
                value={watch('parte_usada')}
                onValueChange={(v) => setValue('parte_usada', v as PlantaFormValues['parte_usada'])}
                options={PARTE_USADA_OPTIONS}
              />
            </div>
            <div className="space-y-2">
              <span className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">Estado *</span>
              <Select
                value={watch('estado_material')}
                onValueChange={(v) => setValue('estado_material', v as PlantaFormValues['estado_material'])}
                options={ESTADO_MATERIAL_OPTIONS}
              />
            </div>
            <Input label="Cantidad (kg) *" type="number" step="0.001" min="0" {...register('cantidad_kg')} error={errors.cantidad_kg?.message} />
          </div>

          <Input label="Origen (sector, bosque, predio)" placeholder="Sector Huicha, Chiloé" {...register('origen')} error={errors.origen?.message} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Latitud" type="number" step="any" placeholder="-42.48" {...register('lat')} error={errors.lat?.message} />
            <Input label="Longitud" type="number" step="any" placeholder="-73.76" {...register('lng')} error={errors.lng?.message} />
            <Input label="Fecha de recolección" type="date" {...register('fecha_recoleccion')} error={errors.fecha_recoleccion?.message} />
          </div>

          <Textarea label="Observaciones" placeholder="Estado de la planta, incidencias de cosecha…" rows={3} {...register('observaciones')} error={errors.observaciones?.message} />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
