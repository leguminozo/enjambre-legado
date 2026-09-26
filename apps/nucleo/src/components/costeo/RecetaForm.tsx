'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Check, Plus, Trash2, Layers, AlertCircle, Sparkles, Building2, Package } from 'lucide-react';
import { Button, toast, ViewLoading, formatCLP } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import {
  RecipeSchema,
  type RecipeFormData,
  type RecipeLineDetail,
  type UnidadBOM,
  UNIDADES_BOM,
  ESTADOS_INSUMO,
} from '@/lib/costeo-types';
import { supabase } from '@/lib/supabase';

interface RecetaFormProps {
  recetaId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface InsumoOption {
  id: string;
  nombre: string;
  unidad: string;
  precio_ref: number;
  origen: 'inventario' | 'ingrediente';
  stock?: number;
  proveedor?: string;
}

export function RecetaForm({ recetaId, onSuccess, onCancel }: RecetaFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoadingRecipe, setIsLoadingRecipe] = useState<boolean>(Boolean(recetaId));
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const [productos, setProductos] = useState<{ id: string; nombre: string; formato?: string; precio?: number }[]>([]);
  const [insumosOptions, setInsumosOptions] = useState<InsumoOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
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
        { ingredient_id: '', cantidad: 0, unidad: 'g', estado: 'crudo', factor_conversion: 1.0, orden: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const watchedLines = watch('lines');
  const watchedProductoId = watch('producto_id');
  const watchedRendimiento = watch('rendimiento_frascos');
  const watchedMerma = watch('merma_pct');
  const watchedEmpaque = watch('costo_empaque');

  // Cargar productos del catálogo, ingredientes e inventario operativo
  useEffect(() => {
    void (async () => {
      try {
        const { data: productosData } = await supabase
          .from('productos')
          .select('id, nombre, formato, precio')
          .eq('visible', true)
          .order('nombre');
        if (productosData) setProductos(productosData);

        // Insumos desde /api/costeo/ingredientes
        const ingRes = await apiFetch('/api/costeo/ingredientes');
        const ingData = ingRes.ok ? await ingRes.json() : { data: [] };

        // Insumos desde /api/costeo/inventario-insumos
        const invRes = await apiFetch('/api/costeo/inventario-insumos');
        const invData = invRes.ok ? await invRes.json() : { data: [] };

        const optionsMap = new Map<string, InsumoOption>();

        // Agregar ingredientes
        for (const ing of ingData.data ?? []) {
          optionsMap.set(ing.id, {
            id: ing.id,
            nombre: ing.nombre,
            unidad: ing.unidad,
            precio_ref: Number(ing.precio_ref ?? 0),
            origen: 'ingrediente',
            proveedor: ing.proveedor_ref_terceros?.nombre,
          });
        }

        // Enriquecer o complementar con inventario operativo
        for (const inv of invData.data ?? []) {
          if (inv.ingredient_id && optionsMap.has(inv.ingredient_id)) {
            const existing = optionsMap.get(inv.ingredient_id)!;
            existing.stock = Number(inv.stock ?? 0);
            if (!existing.precio_ref && inv.costo_unitario > 0) {
              existing.precio_ref = Number(inv.costo_unitario);
            }
          } else {
            // Insumo que vive en inventario operativo
            const matchingIng = Array.from(optionsMap.values()).find(
              (o) => o.nombre.toLowerCase() === inv.nombre.toLowerCase(),
            );
            if (matchingIng) {
              matchingIng.stock = Number(inv.stock ?? 0);
              if (!matchingIng.precio_ref && inv.costo_unitario > 0) {
                matchingIng.precio_ref = Number(inv.costo_unitario);
              }
            }
          }
        }

        setInsumosOptions(Array.from(optionsMap.values()));
      } catch (e) {
        console.error('Error cargando catálogos para receta:', e);
      }
    })();
  }, [apiFetch]);

  // Si estamos en modo edición, cargar la receta existente
  useEffect(() => {
    if (!recetaId) return;

    void (async () => {
      setIsLoadingRecipe(true);
      try {
        const res = await apiFetch(`/api/costeo/recetas/${recetaId}`);
        if (!res.ok) throw new Error('Error al cargar la receta');
        const json = await res.json();
        const r = json.data;

        if (r) {
          reset({
            producto_id: r.producto_id,
            rendimiento_frascos: r.rendimiento_frascos,
            formato_frasco: r.formato_frasco,
            merma_pct: Number(r.merma_pct ?? 0),
            costo_empaque: Number(r.costo_empaque ?? 0),
            notas: r.notas ?? '',
            lines: (r.lines ?? []).map((l: RecipeLineDetail, idx: number) => ({
              id: l.id,
              ingredient_id: l.ingredient_id,
              cantidad: Number(l.cantidad),
              unidad: (l.unidad || l.ingredients?.unidad || 'g') as RecipeFormData['lines'][number]['unidad'],
              estado: l.estado,
              factor_conversion: Number(l.factor_conversion ?? 1.0),
              orden: Number(l.orden ?? idx),
            })),
          });
        }
      } catch (e) {
        toast.error('No se pudo cargar la receta seleccionada');
      } finally {
        setIsLoadingRecipe(false);
      }
    })();
  }, [recetaId, apiFetch, reset]);

  // Auto-completar formato al elegir producto
  useEffect(() => {
    if (watchedProductoId) {
      const prod = productos.find((p) => p.id === watchedProductoId);
      if (prod?.formato) {
        setValue('formato_frasco', prod.formato);
      }
    }
  }, [watchedProductoId, productos, setValue]);

  // Cálculo preliminar en vivo de la receta
  const costoLineasEstimado = (watchedLines || []).reduce((acc, l) => {
    const opt = insumosOptions.find((o) => o.id === l.ingredient_id);
    if (!opt || !l.cantidad) return acc;
    const precio = opt.precio_ref || 0;
    const lineUnit = l.unidad || opt.unidad;
    const ingUnit = opt.unidad;

    let ratio = 1.0;
    if (ingUnit === 'kg' && lineUnit === 'g') ratio = 0.001;
    else if (ingUnit === 'g' && lineUnit === 'kg') ratio = 1000.0;
    else if (ingUnit === 'l' && lineUnit === 'ml') ratio = 0.001;
    else if (ingUnit === 'ml' && lineUnit === 'l') ratio = 1000.0;

    const factor = l.factor_conversion > 0 ? l.factor_conversion : 1.0;
    const costo = (Number(l.cantidad) * ratio / factor) * precio;
    return acc + costo;
  }, 0);

  const costoMermaEstimado = costoLineasEstimado * ((Number(watchedMerma) || 0) / 100);
  const costoTotalLoteEstimado = costoLineasEstimado + costoMermaEstimado + (Number(watchedEmpaque) || 0);
  const rendimientoActual = Math.max(1, Number(watchedRendimiento) || 1);
  const costoUnitarioEstimado = Math.ceil(costoTotalLoteEstimado / rendimientoActual);

  const productoSeleccionado = productos.find((p) => p.id === watchedProductoId);
  const precioVentaProd = productoSeleccionado?.precio || 0;
  const margenUnitarioEstimado = precioVentaProd > 0 ? precioVentaProd - costoUnitarioEstimado : 0;
  const margenPctEstimado = precioVentaProd > 0 ? (margenUnitarioEstimado / precioVentaProd) * 100 : 0;

  const onSubmit = (data: RecipeFormData) => {
    startTransition(async () => {
      try {
        if (recetaId) {
          // Modo edición: PUT con sync de líneas
          const res = await apiFetch(`/api/costeo/recetas/${recetaId}`, {
            method: 'PUT',
            body: JSON.stringify({
              producto_id: data.producto_id,
              rendimiento_frascos: data.rendimiento_frascos,
              formato_frasco: data.formato_frasco,
              merma_pct: data.merma_pct,
              costo_empaque: data.costo_empaque,
              notas: data.notas,
              lines: data.lines,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error al actualizar receta');
          }
          toast.success('Receta actualizada correctamente');
        } else {
          // Modo creación: POST receta + POST líneas
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

          if (!recipeRes.ok) {
            const err = await recipeRes.json();
            throw new Error(err.message || 'Error al crear receta');
          }

          const recipeData = await recipeRes.json();
          const newRecipeId = recipeData.data.id;

          const linesRes = await apiFetch(`/api/costeo/recetas/${newRecipeId}/lineas`, {
            method: 'POST',
            body: JSON.stringify({ lines: data.lines }),
          });

          if (!linesRes.ok) {
            const err = await linesRes.json();
            throw new Error(err.message || 'Error al guardar líneas de receta');
          }
          toast.success('Receta creada correctamente');
        }

        queryClient.invalidateQueries({ queryKey: ['costeo'] });
        onSuccess?.();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar la receta');
      }
    });
  };

  if (isLoadingRecipe) {
    return (
      <div className="py-12">
        <ViewLoading variant="view" label="Cargando fórmula maestra" hideLabel />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 1. Definición del Producto */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-border pb-2 text-foreground">
          1. Producto y Parámetros del Lote
        </h3>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Producto del Catálogo *
          </label>
          <select
            {...register('producto_id')}
            disabled={Boolean(recetaId)}
            className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-60"
          >
            <option value="">Selecciona un producto...</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.formato ? `(${p.formato})` : ''} · Venta: {formatCLP(p.precio || 0)}
              </option>
            ))}
          </select>
          {errors.producto_id && (
            <p className="text-xs text-destructive mt-1">{errors.producto_id.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Rendimiento (Frascos por lote) *
            </label>
            <input
              type="number"
              min={1}
              {...register('rendimiento_frascos')}
              className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            {errors.rendimiento_frascos && (
              <p className="text-xs text-destructive mt-1">{errors.rendimiento_frascos.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Formato de Frasco *
            </label>
            <input
              {...register('formato_frasco')}
              placeholder="Ej. 15g, 250g, 500g"
              className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            {errors.formato_frasco && (
              <p className="text-xs text-destructive mt-1">{errors.formato_frasco.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Merma Esperada (%)
            </label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={100}
              {...register('merma_pct')}
              className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Pérdida estimada en envasado o cocción
            </p>
            {errors.merma_pct && (
              <p className="text-xs text-destructive mt-1">{errors.merma_pct.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Costo de Empaque del Lote (CLP)
            </label>
            <input
              type="number"
              min={0}
              {...register('costo_empaque')}
              className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Frascos, etiquetas foil y tapas para todo el lote
            </p>
            {errors.costo_empaque && (
              <p className="text-xs text-destructive mt-1">{errors.costo_empaque.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. BOM (Líneas de fórmula) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              2. Materias Primas e Insumos (BOM)
            </h3>
            <p className="text-xs text-muted-foreground">
              Selecciona el insumo y la unidad en que se formula el lote.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                ingredient_id: '',
                cantidad: 0,
                unidad: 'g',
                estado: 'crudo',
                factor_conversion: 1.0,
                orden: fields.length,
              })
            }
          >
            <Plus size={14} className="mr-1.5" />
            Añadir insumo
          </Button>
        </div>

        {errors.lines?.root && (
          <p className="text-xs text-destructive">{errors.lines.root.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => {
            const selectedIngId = watch(`lines.${index}.ingredient_id`);
            const opt = insumosOptions.find((o) => o.id === selectedIngId);

            return (
              <div
                key={field.id}
                className="flex flex-col gap-3 bg-surface-sunken p-3.5 rounded-xl border border-border/60"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  {/* Selector de Insumo */}
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Insumo / Materia prima
                    </label>
                    <select
                      {...register(`lines.${index}.ingredient_id`)}
                      onChange={(e) => {
                        register(`lines.${index}.ingredient_id`).onChange(e);
                        const sel = insumosOptions.find((o) => o.id === e.target.value);
                        if (sel) {
                          setValue(`lines.${index}.unidad`, sel.unidad as UnidadBOM);
                        }
                      }}
                      className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="">Seleccionar insumo...</option>
                      {insumosOptions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre} ({i.unidad}) · Ref: {formatCLP(i.precio_ref)}
                          {i.stock !== undefined ? ` · Stock: ${i.stock} ${i.unidad}` : ''}
                        </option>
                      ))}
                    </select>

                    {opt && (
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        {opt.proveedor && (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Building2 size={11} /> {opt.proveedor}
                          </span>
                        )}
                        {opt.stock !== undefined && (
                          <span className="inline-flex items-center gap-1">
                            <Package size={11} /> Bodega: {opt.stock} {opt.unidad}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min={0}
                      {...register(`lines.${index}.cantidad`)}
                      className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  {/* Unidad de Receta */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Unidad
                    </label>
                    <select
                      {...register(`lines.${index}.unidad`)}
                      className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary"
                    >
                      {UNIDADES_BOM.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estado & Borrar */}
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                        Estado
                      </label>
                      <select
                        {...register(`lines.${index}.estado`)}
                        className="flex min-h-11 w-full rounded-xl border border-input bg-background px-2.5 py-2 text-xs focus:outline-none focus:border-primary capitalize"
                      >
                        {ESTADOS_INSUMO.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="min-h-11 min-w-11 h-11 w-11 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Panel en Vivo de Rentabilidad Estimada */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary" />
            Cálculo preliminar de rentabilidad
          </span>
          <span className="font-mono text-muted-foreground">
            Lote: {rendimientoActual} frascos
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs tabular-nums">
          <div>
            <div className="text-muted-foreground text-[11px]">Costo unitario</div>
            <div className="font-bold text-foreground font-mono">
              {formatCLP(costoUnitarioEstimado)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-[11px]">Venta catálogo</div>
            <div className="font-bold text-foreground font-mono">
              {formatCLP(precioVentaProd)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-[11px]">Margen unitario</div>
            <div className="font-bold text-primary font-mono">
              {formatCLP(margenUnitarioEstimado)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-[11px]">Rentabilidad</div>
            <div
              className={`font-bold font-mono ${
                margenPctEstimado >= 40
                  ? 'text-success'
                  : margenPctEstimado >= 20
                  ? 'text-warning'
                  : 'text-destructive'
              }`}
            >
              {margenPctEstimado.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* 4. Notas opcionales */}
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">
          Notas técnicas de la fórmula (opcional)
        </label>
        <textarea
          {...register('notas')}
          rows={2}
          placeholder="Ej. Tiempo de reposo previo a envasado, temperatura de fusión..."
          className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary"
        />
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={isPending}
          >
            <X size={15} className="mr-1.5" />
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          className="w-full sm:w-auto"
          disabled={isPending}
        >
          <Check size={15} className="mr-1.5" />
          {isPending ? 'Guardando fórmula...' : recetaId ? 'Guardar Cambios' : 'Crear Receta'}
        </Button>
      </div>
    </form>
  );
}
