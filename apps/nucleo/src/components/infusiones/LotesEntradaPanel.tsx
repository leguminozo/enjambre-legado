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
  loteEntradaFormSchema, LOTE_ORIGEN_OPTIONS, LOTE_ORIGEN_LABEL, fmtKg, fmtFecha,
  type LoteEntradaRow, type LoteEntradaFormValues, type MateriaPrimaRow, type ProveedorRow,
} from '@/lib/infusiones-types';

const DEFAULT_VALUES: LoteEntradaFormValues = {
  materia_prima_id: '',
  fecha: '',
  origen: 'recoleccion',
  peso_fresco_kg: null,
  precio_compra_clp: null,
  proveedor_id: null,
  recolector: undefined,
  ubicacion_recoleccion: undefined,
  notas: undefined,
};

function LoteEntradaFormDialog({
  open, onOpenChange, initial,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: LoteEntradaRow | null
}) {
  const apiFetch = useApiFetch();
  const { save } = useInfusionResource<LoteEntradaRow>('lotes-entrada');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<LoteEntradaFormValues>({
      resolver: zodResolver(loteEntradaFormSchema) as never,
      defaultValues: DEFAULT_VALUES,
    });

  const { data: mps } = useQuery<{ data: MateriaPrimaRow[] }>({
    queryKey: ['infusiones', 'materias-primas'],
    queryFn: async () => {
      const res = await apiFetch('/api/infusiones/materias-primas');
      if (!res.ok) throw new Error('Error al cargar materias primas');
      return res.json();
    },
    enabled: open,
  });
  const { data: provs } = useQuery<{ data: ProveedorRow[] }>({
    queryKey: ['infusiones', 'proveedores'],
    queryFn: async () => {
      const res = await apiFetch('/api/infusiones/proveedores');
      if (!res.ok) throw new Error('Error al cargar proveedores');
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

  const mpOptions = useMemo(
    () => (mps?.data ?? []).map((m) => ({ value: m.id, label: m.nombre })),
    [mps],
  );
  const provOptions = useMemo(
    () => [
      { value: '', label: 'Sin proveedor' },
      ...(provs?.data ?? []).map((p) => ({ value: p.id, label: p.nombre })),
    ],
    [provs],
  );

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            materia_prima_id: initial.materia_prima_id,
            fecha: initial.fecha,
            origen: initial.origen,
            peso_fresco_kg: initial.peso_fresco_kg,
            precio_compra_clp: initial.precio_compra_clp,
            proveedor_id: initial.proveedor_id,
            recolector: initial.recolector ?? undefined,
            ubicacion_recoleccion: initial.ubicacion_recoleccion ?? undefined,
            notas: initial.notas ?? undefined,
          }
        : DEFAULT_VALUES,
    );
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? `Editar ${initial.codigo_lote}` : 'Nuevo lote de entrada'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate({ id: initial?.id, body: v }))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormFieldLabel>Materia prima *</FormFieldLabel>
              <Select
                value={watch('materia_prima_id')}
                onValueChange={(v) => setValue('materia_prima_id', v)}
                options={mpOptions}
                placeholder="Seleccionar…"
                searchable
              />
              {errors.materia_prima_id && <p className="text-xs text-destructive">{errors.materia_prima_id.message}</p>}
            </div>
            <Input label="Fecha *" type="date" {...register('fecha')} error={errors.fecha?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <FormFieldLabel>Origen *</FormFieldLabel>
              <Select
                value={watch('origen')}
                onValueChange={(v) => setValue('origen', v as LoteEntradaFormValues['origen'])}
                options={LOTE_ORIGEN_OPTIONS}
              />
            </div>
            <Input label="Peso fresco (kg)" type="number" step="0.001" min="0" placeholder="2.500" {...register('peso_fresco_kg')} error={errors.peso_fresco_kg?.message} />
            <Input label="Precio compra (CLP)" type="number" step="1" min="0" placeholder="0" {...register('precio_compra_clp')} error={errors.precio_compra_clp?.message} />
          </div>

          <div className="space-y-2">
            <FormFieldLabel>Proveedor (si es compra)</FormFieldLabel>
            <Select
              value={watch('proveedor_id') ?? ''}
              onValueChange={(v) => setValue('proveedor_id', v || null)}
              options={provOptions}
              searchable
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResponsableInput
              label="Recolector / quién trajo la materia"
              listId="infusion-recolectores"
              sugerencias={responsables?.data ?? []}
              value={watch('recolector') ?? ''}
              onChange={(v) => setValue('recolector', v || undefined)}
            />
            <Input label="Ubicación de recolección" placeholder="Sector, quebrada, huerta…" {...register('ubicacion_recoleccion')} />
          </div>

          <Textarea label="Notas" placeholder="Estado de la materia, condiciones de corte…" rows={2} {...register('notas')} />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Registrar entrada'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LotesEntradaPanel() {
  const { items, isLoading, remove } = useInfusionResource<LoteEntradaRow>('lotes-entrada');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LoteEntradaRow | null>(null);

  const columns: ColumnDef<LoteEntradaRow>[] = [
    { key: 'codigo_lote', header: 'Código', sortable: true, render: (l) => <span className="font-mono text-sm font-medium text-primary">{l.codigo_lote}</span>, csvValue: (l) => l.codigo_lote },
    { key: 'materia_prima', header: 'Materia prima', sortable: true, render: (l) => l.materia_prima?.nombre ?? '—', csvValue: (l) => l.materia_prima?.nombre ?? '' },
    { key: 'fecha', header: 'Fecha', sortable: true, hideBelow: 480, render: (l) => fmtFecha(l.fecha), csvValue: (l) => l.fecha },
    { key: 'origen', header: 'Origen', sortable: true, hideBelow: 560, render: (l) => <Badge variant="default">{LOTE_ORIGEN_LABEL[l.origen] ?? l.origen}</Badge>, csvValue: (l) => l.origen },
    { key: 'peso_fresco_kg', header: 'Fresco', sortable: true, align: 'right', render: (l) => fmtKg(l.peso_fresco_kg), csvValue: (l) => String(l.peso_fresco_kg ?? '') },
    { key: 'proveedor', header: 'Proveedor', sortable: true, hideBelow: 700, render: (l) => l.proveedor?.nombre ?? '—', csvValue: (l) => l.proveedor?.nombre ?? '' },
    { key: 'recolector', header: 'Recolector', sortable: true, hideBelow: 820, render: (l) => l.recolector ?? '—', csvValue: (l) => l.recolector ?? '' },
    {
      key: 'estado',
      header: 'Estado',
      hideBelow: 640,
      render: (l) => (
        l.deshidratado
          ? <Badge variant="success">Deshidratado</Badge>
          : <Badge variant="warning">Pendiente</Badge>
      ),
      csvValue: (l) => (l.deshidratado ? 'deshidratado' : 'pendiente'),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (l) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar"
            onClick={() => { setEditing(l); setFormOpen(true); }}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
            onClick={() => {
              if (window.confirm(`¿Eliminar el lote ${l.codigo_lote}?`)) remove.mutate(l.id);
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
          <CardTitle>Lotes de entrada</CardTitle>
          <CardDescription>El origen de todo: cuánta materia fresca entra, de dónde y quién la trajo.</CardDescription>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} className="mr-1.5" /> Nuevo lote de entrada
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable<LoteEntradaRow>
          columns={columns}
          rows={items}
          getId={(l) => l.id}
          sortable
          exportable
          columnsControl
          storageKey="infusiones-lotes-entrada"
          fullscreen
          fullscreenLabel="Lotes de entrada — Infusiones"
          exportFilename="infusiones-lotes-entrada"
          emptyState="Aún no hay lotes de entrada registrados."
        />
      </CardContent>
      <LoteEntradaFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
    </Card>
  );
}
