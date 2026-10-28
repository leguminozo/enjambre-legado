'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Check, Plus, Trash2, AlertCircle, Sparkles, Building2, Package } from 'lucide-react';
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
import { parseNumberCLP, parseIntegerCLP } from '@/lib/costeo-utils';
import { supabase } from '@/lib/supabase';

export type BaseRendimiento = 'unidad' | 'lote' | 'kg' | 'litro';

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
  const [baseRendimiento, setBaseRendimiento] = useState<BaseRendimiento>('unidad');
  const [valorRendimientoInput, setValorRendimientoInput] = useState<string>('1');

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
  const watchedMerma = watch('merma_pct');
  const watchedEmpaque = watch('costo_empaque');
  const watchedFormato = watch('formato_frasco');

  const pesoTotalKg = useMemo(() => {
    return (watchedLines || []).reduce((acc, l) => {
      const cant = parseNumberCLP(l.cantidad);
      const unit = l.unidad || 'g';
      if (unit === 'kg') return acc + cant;
      if (unit === 'g') return acc + cant / 1000;
      return acc;
    }, 0);
  }, [watchedLines]);

  const volumenTotalLitros = useMemo(() => {
    return (watchedLines || []).reduce((acc, l) => {
      const cant = parseNumberCLP(l.cantidad);
      const unit = l.unidad || 'ml';
      if (unit === 'l') return acc + cant;
      if (unit === 'ml') return acc + cant / 1000;
      return acc;
    }, 0);
  }, [watchedLines]);

  const matchG = (watchedFormato || '').match(/(\d+(?:[.,]\d+)?)\s*g/i);
  const gramosUnitarios = matchG ? parseFloat(matchG[1].replace(',', '.')) : null;
  const sugeridoUnKg =
    gramosUnitarios && gramosUnitarios > 0
      ? Math.round((1000 / gramosUnitarios) * 10) / 10
      : null;

  const rendimientoCalculado = useMemo(() => {
    if (baseRendimiento === 'unidad') return 1;
    if (baseRendimiento === 'lote') {
      const val = parseIntegerCLP(valorRendimientoInput);
      return Math.max(1, val || 1);
    }
    if (baseRendimiento === 'kg') {
      const val = parseNumberCLP(valorRendimientoInput);
      if (val <= 0) return 1;
      if (pesoTotalKg > 0) {
        return Math.max(1, Math.round(pesoTotalKg * val));
      }
      return Math.max(1, Math.round(val));
    }
    if (baseRendimiento === 'litro') {
      const val = parseNumberCLP(valorRendimientoInput);
      if (val <= 0) return 1;
      if (volumenTotalLitros > 0) {
        return Math.max(1, Math.round(volumenTotalLitros * val));
      }
      return Math.max(1, Math.round(val));
    }
    return 1;
  }, [baseRendimiento, valorRendimientoInput, pesoTotalKg, volumenTotalLitros]);

  const handleBaseChange = (newBase: BaseRendimiento) => {
    setBaseRendimiento(newBase);
    if (newBase === 'unidad') {
      setValorRendimientoInput('1');
      setValue('rendimiento_frascos', 1, { shouldValidate: true });
    } else if (newBase === 'lote') {
      const current = parseIntegerCLP(valorRendimientoInput) || 100;
      const target = current === 1 ? 100 : current;
      setValorRendimientoInput(String(target));
      setValue('rendimiento_frascos', target, { shouldValidate: true });
    } else if (newBase === 'kg') {
      const target = sugeridoUnKg || (gramosUnitarios ? Math.round((1000 / gramosUnitarios) * 10) / 10 : 66.7);
      setValorRendimientoInput(String(target));
      const totalUn = pesoTotalKg > 0 ? Math.max(1, Math.round(pesoTotalKg * target)) : Math.max(1, Math.round(target));
      setValue('rendimiento_frascos', totalUn, { shouldValidate: true });
    } else if (newBase === 'litro') {
      const target = 1;
      setValorRendimientoInput(String(target));
      const totalUn = volumenTotalLitros > 0 ? Math.max(1, Math.round(volumenTotalLitros * target)) : Math.max(1, Math.round(target));
      setValue('rendimiento_frascos', totalUn, { shouldValidate: true });
    }
  };

  // En modos dinámicos (kg / litro), actualizar rendimiento al cambiar el peso formulado
  useEffect(() => {
    if (baseRendimiento === 'kg') {
      const val = parseNumberCLP(valorRendimientoInput);
      if (val > 0 && pesoTotalKg > 0) {
        setValue('rendimiento_frascos', Math.max(1, Math.round(pesoTotalKg * val)), { shouldValidate: true });
      }
    } else if (baseRendimiento === 'litro') {
      const val = parseNumberCLP(valorRendimientoInput);
      if (val > 0 && volumenTotalLitros > 0) {
        setValue('rendimiento_frascos', Math.max(1, Math.round(volumenTotalLitros * val)), { shouldValidate: true });
      }
    }
  }, [baseRendimiento, valorRendimientoInput, pesoTotalKg, volumenTotalLitros, setValue]);

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
            } else {
              optionsMap.set(inv.id, {
                id: inv.ingredient_id || inv.id,
                nombre: inv.nombre,
                unidad: inv.unidad,
                precio_ref: Number(inv.costo_unitario ?? 0),
                origen: 'inventario',
                stock: Number(inv.stock ?? 0),
                proveedor: inv.proveedor_nota ?? undefined,
              });
            }
          }
        }

        setInsumosOptions(Array.from(optionsMap.values()));
      } catch (e) {
        console.error('Error cargando catálogos para receta:', e);
      }
    })();
  }, [apiFetch]);

  // Si estamos en modo edición, cargar la receta existente sin sobreescrituras destructivas
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
          const rendNum = Number(r.rendimiento_frascos) || 1;
          const esUnidad = rendNum === 1;
          setBaseRendimiento(esUnidad ? 'unidad' : 'lote');
          setValorRendimientoInput(String(rendNum));
          reset({
            producto_id: r.producto_id,
            rendimiento_frascos: rendNum,
            formato_frasco: r.formato_frasco || '',
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

    const factor = Number(l.factor_conversion) > 0 ? Number(l.factor_conversion) : 1.0;
    const cantNum = parseNumberCLP(l.cantidad);
    const costo = (cantNum * ratio / factor) * precio;
    return acc + costo;
  }, 0);

  const watchedMermaNum = parseNumberCLP(watchedMerma);
  const watchedEmpaqueNum = parseIntegerCLP(watchedEmpaque);

  const costoMermaEstimado = costoLineasEstimado * (watchedMermaNum / 100);
  const costoTotalLoteEstimado = costoLineasEstimado + costoMermaEstimado + watchedEmpaqueNum;
  const rendimientoActual = Math.max(1, rendimientoCalculado);
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
      {/* 1. Definición del Producto y Rendimiento */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold border-b border-border pb-2 text-foreground">
          1. Parámetros de la Receta y Rendimiento
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Base de la Formulación *
            </label>
            <select
              value={baseRendimiento}
              onChange={(e) => handleBaseChange(e.target.value as BaseRendimiento)}
              className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary font-medium"
            >
              <option value="unidad">Por unidad de venta (1 porción / envase)</option>
              <option value="lote">Por preparación o tanda completa (lote)</option>
              <option value="kg">Por kilogramo de mezcla base (un/kg)</option>
              <option value="litro">Por litro de mezcla base (un/L)</option>
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">
              {baseRendimiento === 'unidad'
                ? 'La receta define insumos para 1 solo envase terminado'
                : baseRendimiento === 'lote'
                ? 'La receta define una preparación grande de varias unidades'
                : baseRendimiento === 'kg'
                ? 'La receta se formula por cada 1 kg de mezcla'
                : 'La receta se formula por cada 1 litro de mezcla'}
            </p>
          </div>

          <div>
            {baseRendimiento === 'unidad' ? (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Rendimiento (Unidades resultantes)
                </label>
                <div className="flex min-h-11 w-full items-center justify-between rounded-xl border border-border bg-surface-sunken px-3 py-2 text-sm">
                  <span className="font-mono font-semibold text-foreground">1 unidad terminada</span>
                  <span className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                    Modo unitario
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  El costo total de los insumos y empaque es directamente el costo unitario
                </p>
              </div>
            ) : baseRendimiento === 'lote' ? (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Rendimiento (Unidades resultantes del lote) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={valorRendimientoInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValorRendimientoInput(val);
                    const num = parseIntegerCLP(val);
                    setValue('rendimiento_frascos', Math.max(1, num), { shouldValidate: true });
                  }}
                  placeholder="Ej. 100, 500, 1.000"
                  className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Total de unidades terminadas que produce esta preparación completa
                </p>
                {errors.rendimiento_frascos && (
                  <p className="text-xs text-destructive mt-1">{errors.rendimiento_frascos.message}</p>
                )}
              </div>
            ) : baseRendimiento === 'kg' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-foreground">
                    Cantidad por kilogramo *
                  </label>
                  {sugeridoUnKg && (
                    <button
                      type="button"
                      onClick={() => {
                        setValorRendimientoInput(String(sugeridoUnKg));
                        const totalUn = pesoTotalKg > 0 ? Math.max(1, Math.round(pesoTotalKg * sugeridoUnKg)) : Math.max(1, Math.round(sugeridoUnKg));
                        setValue('rendimiento_frascos', totalUn, { shouldValidate: true });
                      }}
                      className="text-[10px] text-primary hover:underline font-medium"
                    >
                      Sugerir: {sugeridoUnKg} un/kg
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorRendimientoInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValorRendimientoInput(val);
                    const num = parseNumberCLP(val);
                    const totalUn = pesoTotalKg > 0 ? Math.max(1, Math.round(pesoTotalKg * num)) : Math.max(1, Math.round(num));
                    setValue('rendimiento_frascos', Math.max(1, totalUn), { shouldValidate: true });
                  }}
                  placeholder="Ej. 66.7"
                  className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {pesoTotalKg > 0
                    ? `${pesoTotalKg.toLocaleString('es-CL', { maximumFractionDigits: 3 })} kg formulados → ${rendimientoCalculado.toLocaleString('es-CL')} un. en total`
                    : 'Define unidades obtenidas por cada 1 kg de mezcla'}
                </p>
                {errors.rendimiento_frascos && (
                  <p className="text-xs text-destructive mt-1">{errors.rendimiento_frascos.message}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Cantidad por litro *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorRendimientoInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValorRendimientoInput(val);
                    const num = parseNumberCLP(val);
                    const totalUn = volumenTotalLitros > 0 ? Math.max(1, Math.round(volumenTotalLitros * num)) : Math.max(1, Math.round(num));
                    setValue('rendimiento_frascos', Math.max(1, totalUn), { shouldValidate: true });
                  }}
                  placeholder="Ej. 2"
                  className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {volumenTotalLitros > 0
                    ? `${volumenTotalLitros.toLocaleString('es-CL', { maximumFractionDigits: 3 })} L formulados → ${rendimientoCalculado.toLocaleString('es-CL')} un. en total`
                    : 'Define unidades obtenidas por cada 1 L de mezcla'}
                </p>
                {errors.rendimiento_frascos && (
                  <p className="text-xs text-destructive mt-1">{errors.rendimiento_frascos.message}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Formato o Presentación *
            </label>
            <input
              {...register('formato_frasco')}
              placeholder="Ej. Sachet 15g, Frasco 250g, Botella 500ml"
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
              type="text"
              inputMode="decimal"
              {...register('merma_pct', {
                setValueAs: (v) => parseNumberCLP(v),
              })}
              placeholder="0"
              className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Pérdida estimada en dosificación, envasado o cocción (ej. 2,5%)
            </p>
            {errors.merma_pct && (
              <p className="text-xs text-destructive mt-1">{errors.merma_pct.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              {baseRendimiento === 'unidad'
                ? 'Costo de Empaque Unitario (CLP)'
                : 'Costo de Empaque y Materiales (CLP)'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              {...register('costo_empaque', {
                setValueAs: (v) => parseIntegerCLP(v),
              })}
              placeholder="Ej. 350, 1.000"
              className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {baseRendimiento === 'unidad'
                ? 'Envase, sachet, tapa, etiqueta y embalaje para 1 unidad ($)'
                : 'Envases, tapas, etiquetas y embalaje para toda la preparación ($)'}
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
              {baseRendimiento === 'unidad'
                ? 'Ingresa los insumos requeridos para producir 1 envase terminado.'
                : 'Selecciona el insumo y la cantidad requerida para la preparación.'}
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
                      type="text"
                      inputMode="decimal"
                      {...register(`lines.${index}.cantidad`, {
                        setValueAs: (v) => parseNumberCLP(v),
                      })}
                      placeholder="0"
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
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary" />
            Cálculo preliminar de rentabilidad
          </span>
          <span className="font-mono text-muted-foreground">
            {baseRendimiento === 'unidad'
              ? 'Fórmula por unidad (1 envase)'
              : `Rendimiento: ${rendimientoActual.toLocaleString('es-CL')} un.`}
            {baseRendimiento === 'kg' && pesoTotalKg > 0 && ` (${valorRendimientoInput} un/kg · ${pesoTotalKg.toLocaleString('es-CL', { maximumFractionDigits: 3 })} kg)`}
            {baseRendimiento === 'litro' && volumenTotalLitros > 0 && ` (${valorRendimientoInput} un/L · ${volumenTotalLitros.toLocaleString('es-CL', { maximumFractionDigits: 3 })} L)`}
          </span>
        </div>

        {/* Advertencia preventiva ante discrepancia de escala */}
        {baseRendimiento === 'lote' && rendimientoActual > 20 && pesoTotalKg > 0 && pesoTotalKg < 0.1 && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>
              Has formulado {(pesoTotalKg * 1000).toFixed(0)}g en total divididos entre {rendimientoActual} unidades ({((pesoTotalKg * 1000) / rendimientoActual).toFixed(2)}g por envase). Si estás formulando los insumos de 1 solo envase, selecciona «Por unidad de venta (1 porción / envase)» arriba.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs tabular-nums">
          <div>
            <div className="text-muted-foreground text-[11px]">Costo unitario</div>
            <div className="font-bold text-foreground font-mono">
              {formatCLP(costoUnitarioEstimado)}
            </div>
            {baseRendimiento !== 'unidad' && (
              <div className="text-[10px] text-muted-foreground font-mono">
                Total lote: {formatCLP(costoTotalLoteEstimado)}
              </div>
            )}
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
