'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Check } from 'lucide-react';
import { Button, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import { IngredientSchema, type IngredientFormData } from '@/lib/costeo-types';

interface InsumoFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InsumoForm({ onSuccess, onCancel }: InsumoFormProps) {
  const [isPending, startTransition] = useTransition();
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IngredientFormData>({
    resolver: zodResolver(IngredientSchema) as never,
    defaultValues: {
      nombre: '',
      unidad: 'kg',
      estado_default: 'crudo',
      categoria: '',
      precio_ref: undefined,
    },
  });

  const onSubmit = (data: IngredientFormData) => {
    startTransition(async () => {
      try {
        const res = await apiFetch('/api/costeo/ingredientes', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Error al guardar el insumo');
        }

        toast.success('Insumo creado correctamente');
        queryClient.invalidateQueries({ queryKey: ['costeo', 'ingredientes'] });
        onSuccess?.();
      } catch (err: any) {
        toast.error(err.message || 'Error desconocido al guardar');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del Insumo *</label>
          <input
            {...register('nombre')}
            placeholder="Ej. Frasco vidrio 500g, Miel Cruda Ulmo"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.nombre && <p className="text-sm text-destructive mt-1">{errors.nombre.message}</p>}
        </div>

        {/* Unidad y Estado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Unidad base *</label>
            <select
              {...register('unidad')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="kg">Kilogramos (kg)</option>
              <option value="g">Gramos (g)</option>
              <option value="l">Litros (l)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="unidad">Unidad (pieza)</option>
            </select>
            {errors.unidad && <p className="text-sm text-destructive mt-1">{errors.unidad.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estado Físico *</label>
            <select
              {...register('estado_default')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="crudo">Crudo / A granel</option>
              <option value="procesado">Procesado</option>
              <option value="tostado">Tostado</option>
              <option value="molido">Molido</option>
              <option value="fresco">Fresco</option>
              <option value="seco">Seco</option>
              <option value="desecado">Desecado</option>
            </select>
            {errors.estado_default && <p className="text-sm text-destructive mt-1">{errors.estado_default.message}</p>}
          </div>
        </div>

        {/* Categoría y Precio Ref */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <input
              {...register('categoria')}
              placeholder="Ej. Empaque, Miel, Hierba..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.categoria && <p className="text-sm text-destructive mt-1">{errors.categoria.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Precio Referencia Inicial (CLP)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <input
                type="number"
                {...register('precio_ref')}
                placeholder="0"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Este precio se usará para costear recetas hasta que haya una observación de precio actualizada.</p>
            {errors.precio_ref && <p className="text-sm text-destructive mt-1">{errors.precio_ref.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            <X size={16} className="mr-2" />
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isPending}>
          <Check size={16} className="mr-2" />
          {isPending ? 'Guardando...' : 'Crear Insumo'}
        </Button>
      </div>
    </form>
  );
}
