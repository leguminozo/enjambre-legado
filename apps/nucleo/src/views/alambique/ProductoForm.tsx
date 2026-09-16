'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea, Select, toast } from '@enjambre/ui';
import {
  productoFormSchema,
  TIPO_PRODUCTO_OPTIONS,
  DESTINO_OPTIONS,
  type ProductoFormValues,
  type ProductoDestilacionRow,
  type DestilacionRow,
  type ProductoVentaOption,
} from './alambique-types';

interface ProductoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ProductoDestilacionRow | null;
}

const DEFAULT_VALUES: ProductoFormValues = {
  destilacion_id: '',
  tipo: 'hidrolato',
  volumen_ml: 0,
  envase: '',
  unidades: 1,
  fecha_envasado: null,
  destino: 'venta',
  producto_id: null,
  precio_sugerido_clp: null,
  observaciones: '',
  ingresar_a_stock: false,
};

export function ProductoForm({ open, onOpenChange, initial }: ProductoFormProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const { data: destilacionesData } = useQuery<{ data: DestilacionRow[] }>({
    queryKey: ['alambique', 'destilaciones'],
    queryFn: async () => {
      const res = await apiFetch('/api/alambique/destilaciones');
      if (!res.ok) throw new Error('Error al cargar destilaciones');
      return res.json();
    },
    enabled: open,
  });

  const { data: productosVentaData } = useQuery<{ data: ProductoVentaOption[] }>({
    queryKey: ['alambique', 'productos-venta'],
    queryFn: async () => {
      const res = await apiFetch('/api/alambique/productos-venta');
      if (!res.ok) throw new Error('Error al cargar productos de venta');
      return res.json();
    },
    enabled: open,
  });

  const destilacionOptions = useMemo(
    () =>
      (destilacionesData?.data ?? []).map((d) => ({
        value: d.id,
        label: `${d.codigo ?? 'Sin código'} — ${d.planta?.nombre_comun ?? 'Sin planta'}`,
      })),
    [destilacionesData],
  );

  const productoVentaOptions = useMemo(
    () =>
      (productosVentaData?.data ?? []).map((p) => ({
        value: p.id,
        label: `${p.nombre} (stock ${p.stock})`,
      })),
    [productosVentaData],
  );

  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(productoFormSchema) as never,
    defaultValues: DEFAULT_VALUES,
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form;

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            destilacion_id: initial.destilacion_id || initial.destilacion?.id || '',
            tipo: (initial.tipo as ProductoFormValues['tipo']) ?? 'hidrolato',
            volumen_ml: initial.volumen_ml,
            envase: initial.envase ?? '',
            unidades: initial.unidades,
            fecha_envasado: initial.fecha_envasado,
            destino: (initial.destino as ProductoFormValues['destino']) ?? 'venta',
            producto_id: initial.producto_venta?.id ?? null,
            precio_sugerido_clp: initial.precio_sugerido_clp,
            observaciones: initial.observaciones ?? '',
          }
        : DEFAULT_VALUES,
    );
  }, [open, initial, reset]);

  const mutation = useMutation({
    mutationFn: async (values: ProductoFormValues) => {
      const payload = {
        ...values,
        envase: values.envase?.trim() || null,
        observaciones: values.observaciones?.trim() || null,
        // ingresar_a_stock solo aplica en creación; ignorar en PATCH
        ingresar_a_stock: initial ? undefined : (values.ingresar_a_stock ?? false),
      };
      const res = await apiFetch(initial ? `/api/alambique/productos/${initial.id}` : '/api/alambique/productos', {
        method: initial ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null) as { message?: string } | null;
        throw new Error(err?.message ?? 'Error al guardar producto');
      }
      return res.json() as Promise<{ data: unknown; stock_actualizado?: boolean }>;
    },
    onSuccess: (result) => {
      if (!initial && result.stock_actualizado) {
        toast('Producto registrado e ingresado al stock del catálogo.', { type: 'success' });
      } else {
        toast(initial ? 'Producto actualizado' : 'Producto registrado', { type: 'success' });
      }
      queryClient.invalidateQueries({ queryKey: ['alambique'] });
      onOpenChange(false);
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar producto envasado' : 'Nuevo producto envasado'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <span className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">Destilación *</span>
            <Select
              value={watch('destilacion_id')}
              onValueChange={(v) => setValue('destilacion_id', v)}
              options={destilacionOptions}
              placeholder="Seleccionar destilación…"
              searchable
            />
            {errors.destilacion_id && <p className="text-xs text-destructive">{errors.destilacion_id.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">Tipo *</span>
              <Select
                value={watch('tipo')}
                onValueChange={(v) => setValue('tipo', v as ProductoFormValues['tipo'])}
                options={TIPO_PRODUCTO_OPTIONS}
              />
            </div>
            <div className="space-y-2">
              <span className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">Destino *</span>
              <Select
                value={watch('destino')}
                onValueChange={(v) => setValue('destino', v as ProductoFormValues['destino'])}
                options={DESTINO_OPTIONS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Volumen (ml) *" type="number" step="0.1" min="0" {...register('volumen_ml')} error={errors.volumen_ml?.message} />
            <Input label="Unidades *" type="number" min="1" {...register('unidades')} error={errors.unidades?.message} />
            <Input label="Fecha envasado" type="date" {...register('fecha_envasado')} error={errors.fecha_envasado?.message} />
            <Input label="Precio sug. (CLP)" type="number" min="0" step="100" {...register('precio_sugerido_clp')} error={errors.precio_sugerido_clp?.message} />
          </div>

          <Input label="Envase" placeholder="Frasco vidrio ámbar 100 ml" {...register('envase')} error={errors.envase?.message} />

          <div className="space-y-2">
            <span className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">
              Producto de catálogo (venta / traza)
            </span>
            <Select
              value={watch('producto_id') ?? ''}
              onValueChange={(v) => setValue('producto_id', v || null)}
              options={[{ value: '', label: 'Sin vínculo de venta' }, ...productoVentaOptions]}
              placeholder="Elegir SKU del catálogo…"
              searchable
            />
            {/* Triangulación 4: toggle para ingresar al stock de inmediato */}
            {watch('producto_id') && !initial && (
              <label className="flex items-start gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={watch('ingresar_a_stock') ?? false}
                  onChange={(e) => setValue('ingresar_a_stock', e.target.checked)}
                  className="mt-0.5 accent-[hsl(var(--primary))] w-4 h-4 rounded shrink-0"
                />
                <span className="text-xs text-foreground">
                  Ingresar estas <strong>{watch('unidades') || 0}</strong> unidades directamente al stock del catálogo ahora.
                  <span className="block text-muted-foreground mt-0.5">
                    Si no lo activas, el stock queda sin cambio y lo ajustas desde Producción.
                  </span>
                </span>
              </label>
            )}
            {(!watch('producto_id') || initial) && (
              <p className="text-xs text-muted-foreground">
                Opcional. Enlaza este envase a un SKU del catálogo para venta y trazabilidad.
                Al crear sin vínculo, el stock no se modifica.
              </p>
            )}
          </div>

          <Textarea label="Observaciones" placeholder="Notas de envasado, etiquetado…" rows={2} {...register('observaciones')} />

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
