'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { Button, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import { RecipeSchema, type RecipeFormData } from '@/lib/costeo-types';
import { supabase } from '@/lib/supabase';

interface RecetaFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RecetaForm({ onSuccess, onCancel }: RecetaFormProps) {
  const [isPending, startTransition] = useTransition();
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const [productos, setProductos] = useState<{ id: string; nombre: string; formato: string }[]>([]);
  const [insumos, setInsumos] = useState<{ id: string; nombre: string; unidad: string }[]>([]);

  useEffect(() => {
    supabase.from('productos').select('id, nombre, formato').eq('visible', true).then(({ data }: { data: any }) => {
      if (data) setProductos(data);
    });
    supabase.from('ingredients').select('id, nombre, unidad').then(({ data }: { data: any }) => {
      if (data) setInsumos(data);
    });
  }, []);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RecipeFormData>({
    resolver: zodResolver(RecipeSchema) as never,
    defaultValues: {
      producto_id: '',
      rendimiento_frascos: 1,
      formato_frasco: '',
      merma_pct: 0,
      costo_empaque: 0,
      notas: '',
      lines: [
        { ingredient_id: '', cantidad: 0, estado: 'crudo', factor_conversion: 1.0, orden: 0 }
      ]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const onSubmit = (data: RecipeFormData) => {
    startTransition(async () => {
      try {
        // Step 1: Create Recipe
        const recipeRes = await apiFetch('/api/costeo/recetas', {
          method: 'POST',
          body: JSON.stringify({
            producto_id: data.producto_id,
            rendimiento_frascos: data.rendimiento_frascos,
            formato_frasco: data.formato_frasco,
            merma_pct: data.merma_pct,
            costo_empaque: data.costo_empaque,
            notas: data.notas,
          }),
        });

        if (!recipeRes.ok) throw new Error((await recipeRes.json()).message);
        
        const recipeData = await recipeRes.json();
        const recipeId = recipeData.data.id;

        // Step 2: Create Lines
        const linesRes = await apiFetch(`/api/costeo/recetas/${recipeId}/lineas`, {
          method: 'POST',
          body: JSON.stringify({ lines: data.lines }),
        });

        if (!linesRes.ok) throw new Error((await linesRes.json()).message);

        toast.success('Receta creada correctamente');
        queryClient.invalidateQueries({ queryKey: ['costeo', 'recetas'] });
        queryClient.invalidateQueries({ queryKey: ['costeo', 'margenes'] }); // Auto-update margin table
        onSuccess?.();
      } catch (err: any) {
        toast.error(err.message || 'Error al guardar la receta');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      
      {/* 1. Datos Generales de la Receta */}
      <div className="space-y-4">
        <h3 className="font-semibold border-b border-border pb-2">1. Definición del Producto</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1">Producto Final (Catálogo) *</label>
          <select
            {...register('producto_id')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecciona un producto...</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} ({p.formato || 'Sin formato'})</option>
            ))}
          </select>
          {errors.producto_id && <p className="text-sm text-destructive mt-1">{errors.producto_id.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Rendimiento (Frascos) *</label>
            <input
              type="number"
              {...register('rendimiento_frascos')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.rendimiento_frascos && <p className="text-sm text-destructive mt-1">{errors.rendimiento_frascos.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Formato Frasco *</label>
            <input
              {...register('formato_frasco')}
              placeholder="Ej. 500g"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.formato_frasco && <p className="text-sm text-destructive mt-1">{errors.formato_frasco.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Merma Esperada (%) *</label>
            <input
              type="number"
              step="0.1"
              {...register('merma_pct')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.merma_pct && <p className="text-sm text-destructive mt-1">{errors.merma_pct.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Costo Fijo de Empaque (CLP)</label>
            <input
              type="number"
              {...register('costo_empaque')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">Costo total de empaque por lote</p>
            {errors.costo_empaque && <p className="text-sm text-destructive mt-1">{errors.costo_empaque.message}</p>}
          </div>
        </div>
      </div>

      {/* 2. BOM (Bill of Materials) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="font-semibold">2. Ingredientes (BOM)</h3>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => append({ ingredient_id: '', cantidad: 0, estado: 'crudo', factor_conversion: 1.0, orden: fields.length })}
          >
            <Plus size={14} className="mr-2" />
            Añadir
          </Button>
        </div>

        {errors.lines?.root && (
          <p className="text-sm text-destructive">{errors.lines.root.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-3 items-start bg-surface-sunken p-3 rounded-md border border-border/50">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Insumo</label>
                <select
                  {...register(`lines.${index}.ingredient_id`)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Seleccionar...</option>
                  {insumos.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>
                  ))}
                </select>
                {errors.lines?.[index]?.ingredient_id && <p className="text-xs text-destructive mt-1">{errors.lines[index]?.ingredient_id?.message}</p>}
              </div>

              <div className="w-24">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  {...register(`lines.${index}.cantidad`)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="w-32">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Estado</label>
                <select
                  {...register(`lines.${index}.estado`)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="crudo">Crudo</option>
                  <option value="procesado">Procesado</option>
                  <option value="tostado">Tostado</option>
                  <option value="molido">Molido</option>
                </select>
              </div>

              <div className="pt-5">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
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
          {isPending ? 'Guardando...' : 'Crear Receta'}
        </Button>
      </div>
    </form>
  );
}
