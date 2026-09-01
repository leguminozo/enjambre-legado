'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Button,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea,
  Select, Badge, ViewLoading, type ColumnDef,
} from '@enjambre/ui';
import { useInfusionResource } from './use-infusiones';
import { FormFieldLabel, ResponsableInput } from './shared';
import {
  loteDeshidratadoFormSchema, DESHIDRATADO_METODO_OPTIONS, DESHIDRATADO_METODO_LABEL,
  fmtKg, fmtG, fmtPct, fmtFecha,
  type LoteDeshidratadoRow, type LoteDeshidratadoFormValues, type LoteEntradaRow,
} from '@/lib/infusiones-types';

const DEFAULT_VALUES: LoteDeshidratadoFormValues = {
  lote_entrada_id: '',
  fecha_inicio: null,
  fecha_fin: null,
  metodo: 'deshidratador',
  temperatura_c: null,
  peso_entrada_kg: null,
  peso_salida_kg: null,
  responsable: undefined,
  notas: undefined,
};

function LoteDeshidratadoFormDialog({
  open, onOpenChange, initial,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: LoteDeshidratadoRow | null
}) {
  const apiFetch = useApiFetch();
  const { save } = useInfusionResource<LoteDeshidratadoRow>('lotes-deshidratado');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<LoteDeshidratadoFormValues>({
      resolver: zodResolver(loteDeshidratadoFormSchema) as never,
      defaultValues: DEFAULT_VALUES,
    });

  const { data: entradas } = useQuery<{ data: LoteEntradaRow[] }>({
    queryKey: ['infusiones', 'lotes-entrada'],
    queryFn: async () => {
      const res = await apiFetch('/api/infusiones/lotes-entrada');
      if (!res.ok) throw new Error('Error al cargar lotes de entrada');
      return res.json();
    },
    enabled: open,
  });
  const { data: responsables } = useQuery<{ data: string[] }>({
    queryKey: ['infusiones', 'responsables'],
    queryFn: async () => {
      const res = await apiFetch('/api/infusiones/responsables');
      if (!res.ok) throw new Error('Error al cargar responsables');
      return res.json();
    },
    enabled: open,
  });

  // Para crear: solo entradas sin deshidratar. Para editar: se agrega la actual.
  const entradaOptions = useMemo(() => {
    const actualId = initial?.lote_entrada_id;
    return (entradas?.data ?? [])
      .filter((e) => !e.deshidratado || e.id === actualId)
      .map((e) => ({
        value: e.id,
        label: `${e.codigo_lote} — ${e.materia_prima?.nombre ?? ''}${e.peso_fresco_kg != null ? ` (${fmtKg(e.peso_fresco_kg)})` : ''}`,
      }));
  }, [entradas, initial]);

  const pesoEntrada = Number(watch('peso_entrada_kg') ?? 0);
  const pesoSalida = Number(watch('peso_salida_kg') ?? 0);
  const rendPreview = pesoEntrada > 0 && pesoSalida > 0
    ? ((pesoSalida / pesoEntrada) * 100).toLocaleString('es-CL', { maximumFractionDigits: 1 })
    : null;

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            lote_entrada_id: initial.lote_entrada_id,
            fecha_inicio: initial.fecha_inicio,
            fecha_fin: initial.fecha_fin,
            metodo: initial.metodo,
            temperatura_c: initial.temperatura_c,
            peso_entrada_kg: initial.peso_entrada_kg,
            peso_salida_kg: initial.peso_salida_kg,
            responsable: initial.responsable ?? undefined,
            notas: initial.notas ?? undefined,
          }
        : DEFAULT_VALUES,
    );
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar deshidratado' : 'Nuevo proceso de deshidratado'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate({ id: initial?.id, body: v }))} className="space-y-4">
          <div className="space-y-2">
            <FormFieldLabel>Lote de entrada *</FormFieldLabel>
            <Select
              value={watch('lote_entrada_id')}
              onValueChange={(v) => setValue('lote_entrada_id', v)}
              options={entradaOptions}
              placeholder="Seleccionar lote…"
              searchable
            />
            {errors.lote_entrada_id && <p className="text-xs text-destructive">{errors.lote_entrada_id.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Inicio" type="date" {...register('fecha_inicio')} />
            <Input label="Fin" type="date" {...register('fecha_fin')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <FormFieldLabel>Método *</FormFieldLabel>
              <Select
                value={watch('metodo')}
                onValueChange={(v) => setValue('metodo', v as LoteDeshidratadoFormValues['metodo'])}
                options={DESHIDRATADO_METODO_OPTIONS}
              />
            </div>
            <Input label="Temperatura (°C)" type="number" step="0.1" min="0" placeholder="42" {...register('temperatura_c')} error={errors.temperatura_c?.message} />
            <div className="flex items-end pb-1">
              {rendPreview && (
                <Badge variant="success" className="w-full justify-center">
                  Rendimiento: {rendPreview}%
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Peso de entrada (kg)" type="number" step="0.001" min="0" placeholder="2.500" {...register('peso_entrada_kg')} error={errors.peso_entrada_kg?.message} />
            <Input label="Peso de salida (kg)" type="number" step="0.001" min="0" placeholder="0.650" {...register('peso_salida_kg')} error={errors.peso_salida_kg?.message} />
          </div>

          <ResponsableInput
            label="Responsable del proceso"
            listId="infusion-responsables-deshidratado"
            sugerencias={responsables?.data ?? []}
            value={watch('responsable') ?? ''}
            onChange={(v) => setValue('responsable', v || undefined)}
          />

          <Textarea label="Notas" placeholder="Humedad final, cortes, incidencias…" rows={2} {...register('notas')} />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Registrar proceso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LotesDeshidratadoPanel() {
  const { items, isLoading, remove } = useInfusionResource<LoteDeshidratadoRow>('lotes-deshidratado');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LoteDeshidratadoRow | null>(null);

  const columns: ColumnDef<LoteDeshidratadoRow>[] = [
    {
      key: 'lote',
      header: 'Lote de entrada',
      sortable: true,
      render: (d) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm font-medium text-primary">{d.lote_entrada?.codigo_lote ?? '—'}</span>
          <span className="text-xs text-muted-foreground">{d.lote_entrada?.materia_prima?.nombre ?? ''}</span>
        </div>
      ),
      csvValue: (d) => `${d.lote_entrada?.codigo_lote ?? ''} ${d.lote_entrada?.materia_prima?.nombre ?? ''}`,
    },
    { key: 'metodo', header: 'Método', sortable: true, hideBelow: 480, render: (d) => DESHIDRATADO_METODO_LABEL[d.metodo] ?? d.metodo, csvValue: (d) => d.metodo },
    { key: 'fecha_inicio', header: 'Inicio', sortable: true, hideBelow: 560, render: (d) => fmtFecha(d.fecha_inicio), csvValue: (d) => d.fecha_inicio ?? '' },
    { key: 'temperatura_c', header: '°C', sortable: true, hideBelow: 700, align: 'right', render: (d) => (d.temperatura_c != null ? `${d.temperatura_c}°` : '—'), csvValue: (d) => String(d.temperatura_c ?? '') },
    {
      key: 'pesos',
      header: 'Entrada → Salida',
      sortable: true,
      align: 'right',
      render: (d) => (
        <div className="flex flex-col text-xs">
          <span>{fmtKg(d.peso_entrada_kg)}</span>
          <span className="text-muted-foreground">{fmtKg(d.peso_salida_kg)}</span>
        </div>
      ),
      csvValue: (d) => `${d.peso_entrada_kg ?? ''} ${d.peso_salida_kg ?? ''}`,
    },
    {
      key: 'rendimiento_pct',
      header: 'Rendimiento',
      sortable: true,
      align: 'right',
      render: (d) => <span className="font-semibold text-foreground">{fmtPct(d.rendimiento_pct)}</span>,
      csvValue: (d) => String(d.rendimiento_pct ?? ''),
    },
    {
      key: 'stock_disponible_g',
      header: 'Disponible',
      sortable: true,
      align: 'right',
      hideBelow: 820,
      render: (d) => (
        <span className={d.stock_disponible_g != null && Number(d.stock_disponible_g) > 0 ? 'text-success' : 'text-muted-foreground'}>
          {fmtG(d.stock_disponible_g)}
        </span>
      ),
      csvValue: (d) => String(d.stock_disponible_g ?? ''),
    },
    { key: 'responsable', header: 'Responsable', sortable: true, hideBelow: 900, render: (d) => d.responsable ?? '—', csvValue: (d) => d.responsable ?? '' },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar"
            onClick={() => { setEditing(d); setFormOpen(true); }}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
            onClick={() => {
              if (window.confirm('¿Eliminar este proceso de deshidratado?')) remove.mutate(d.id);
            }}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <ViewLoading variant="view" label="Infusiones" hideLabel />;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>Deshidratación</CardTitle>
          <CardDescription>El proceso fresca→seca: método, temperaturas y cuánto se registró de salida.</CardDescription>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} className="mr-1.5" /> Nuevo proceso
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable<LoteDeshidratadoRow>
          columns={columns}
          rows={items}
          getId={(d) => d.id}
          sortable
          exportable
          columnsControl
          storageKey="infusiones-lotes-deshidratado"
          fullscreen
          fullscreenLabel="Deshidratación — Infusiones"
          exportFilename="infusiones-lotes-deshidratado"
          emptyState="Aún no hay procesos de deshidratado registrados."
        />
      </CardContent>
      <LoteDeshidratadoFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
    </Card>
  );
}
