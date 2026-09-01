'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, ListTree, X, Check } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Button,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea,
  Select, Badge, ViewLoading, toast, formatCLP, type ColumnDef,
} from '@enjambre/ui';
import { useMicrocanalResource } from './use-microcanales';
import { FieldLabel } from './shared';
import {
  setEntradaFormSchema, setItemFormSchema, PUNTO_VENTA_TIPO_OPTIONS,
  type SetEntradaRow, type SetEntradaFormValues, type SetItemRow, type SetItemFormValues,
} from '@/lib/microcanales-types';

const DEFAULT_VALUES: SetEntradaFormValues = {
  nombre: '', descripcion: undefined, precio_clp: NaN, tipo_entorno: 'cafeteria',
  incluye_materiales: true, materiales_descripcion: undefined, pack_digital: true,
  activo: true, sort_order: 0,
};

function SetFormDialog({ open, onOpenChange, initial }: {
  open: boolean; onOpenChange: (v: boolean) => void; initial: SetEntradaRow | null;
}) {
  const { save } = useMicrocanalResource<SetEntradaRow>('sets');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<SetEntradaFormValues>({
      resolver: zodResolver(setEntradaFormSchema) as never,
      defaultValues: DEFAULT_VALUES,
    });

  useEffect(() => {
    if (!open) return;
    reset(initial ? {
      nombre: initial.nombre, descripcion: initial.descripcion ?? undefined,
      precio_clp: initial.precio_clp, tipo_entorno: initial.tipo_entorno,
      incluye_materiales: initial.incluye_materiales, materiales_descripcion: initial.materiales_descripcion ?? undefined,
      pack_digital: initial.pack_digital, activo: initial.activo, sort_order: initial.sort_order,
    } : DEFAULT_VALUES);
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? `Editar ${initial.nombre}` : 'Nuevo set de entrada'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate({ id: initial?.id, body: v }))} className="space-y-4">
          <Input label="Nombre *" placeholder="Set cafetería — degustación + exhibición" {...register('nombre')} error={errors.nombre?.message} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Precio (CLP) *" type="number" min="0" {...register('precio_clp')} error={errors.precio_clp?.message} />
            <div className="space-y-2">
              <FieldLabel>Entorno *</FieldLabel>
              <Select value={watch('tipo_entorno')} onValueChange={(v) => setValue('tipo_entorno', v)} options={PUNTO_VENTA_TIPO_OPTIONS} />
            </div>
          </div>
          <Textarea label="Descripción" rows={2} {...register('descripcion')} />
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={watch('incluye_materiales')} onChange={(e) => setValue('incluye_materiales', e.target.checked)} className="accent-primary" />
              Incluye materiales físicos (pendón, tarjetas)
            </label>
            {watch('incluye_materiales') && (
              <Input placeholder="Pendón A4 plastificado, 20 tarjetas con QR…" {...register('materiales_descripcion')} />
            )}
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={watch('pack_digital')} onChange={(e) => setValue('pack_digital', e.target.checked)} className="accent-primary" />
              Incluye pack digital (stories, posts, textos)
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Guardando…' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Editor de ítems del set: productos reales de la tienda. */
function SetItemsEditor({ set, onClose }: { set: SetEntradaRow; onClose: () => void }) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [degustacion, setDegustacion] = useState(false);

  const { data: productos } = useQuery<{ data: { id: string; nombre: string; precio: number }[] }>({
    queryKey: ['microcanales', 'productos'],
    queryFn: async () => {
      const res = await apiFetch('/api/b2b/productos');
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['microcanales'] });

  const addItem = async () => {
    if (!productoId) return;
    const res = await apiFetch(`/api/b2b/sets/${set.id}/items`, {
      method: 'POST',
      body: JSON.stringify({ producto_id: productoId, cantidad: Number(cantidad), es_degustacion: degustacion }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast(err?.message ?? 'Error', { type: 'error' });
      return;
    }
    toast('Ítem agregado', { type: 'success' });
    setProductoId('');
    setCantidad('1');
    invalidate();
  };

  const removeItem = async (itemId: string) => {
    if (!window.confirm('¿Quitar este ítem del set?')) return;
    await apiFetch(`/api/b2b/sets/${set.id}/items/${itemId}`, { method: 'DELETE' });
    invalidate();
  };

  return (
    <Card className="mt-4 border-primary/20">
      <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="text-base">Contenido — {set.nombre}</CardTitle>
          <CardDescription>Productos reales del catálogo. Precio del set: {formatCLP(set.precio_clp)}.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}><X size={16} className="mr-1" /> Cerrar</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {(set.items ?? []).length === 0 && <p className="text-sm text-muted-foreground">Aún no hay productos en este set.</p>}
          {(set.items ?? []).map((i) => (
            <div key={i.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-sunken/40 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{i.productos?.nombre ?? '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {i.cantidad} × {i.productos?.precio != null ? formatCLP(i.productos.precio) : '—'}
                  {i.es_degustacion && ' · degustación'}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeItem(i.id)}><Trash size={15} /></Button>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 space-y-2">
            <FieldLabel>Producto</FieldLabel>
            <Select value={productoId} onValueChange={setProductoId}
              options={(productos?.data ?? []).map((p) => ({ value: p.id, label: `${p.nombre} — ${formatCLP(p.precio)}` }))}
              placeholder="Seleccionar producto…" searchable />
          </div>
          <div className="w-24 space-y-2">
            <FieldLabel>Cantidad</FieldLabel>
            <Input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground pb-2">
            <input type="checkbox" checked={degustacion} onChange={(e) => setDegustacion(e.target.checked)} className="accent-primary" />
            Degustación
          </label>
          <Button variant="primary" size="sm" disabled={!productoId} onClick={addItem}><Plus size={16} className="mr-1.5" /> Agregar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Trash({ size }: { size?: number }) {
  return <span style={{ fontSize: size }}>✕</span>;
}

export function SetsPanel() {
  const { items, isLoading, remove } = useMicrocanalResource<SetEntradaRow>('sets');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SetEntradaRow | null>(null);
  const [selected, setSelected] = useState<SetEntradaRow | null>(null);

  const columns: ColumnDef<SetEntradaRow>[] = [
    { key: 'nombre', header: 'Set', sortable: true, render: (s) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{s.nombre}</span>
        {s.descripcion && <span className="text-xs text-muted-foreground line-clamp-1">{s.descripcion}</span>}
      </div>), csvValue: (s) => s.nombre },
    { key: 'tipo_entorno', header: 'Entorno', sortable: true, hideBelow: 560, render: (s) => <Badge variant="default">{s.tipo_entorno}</Badge>, csvValue: (s) => s.tipo_entorno },
    { key: 'precio_clp', header: 'Precio', sortable: true, align: 'right', render: (s) => formatCLP(s.precio_clp), csvValue: (s) => String(s.precio_clp) },
    { key: 'items', header: 'Ítems', hideBelow: 700, render: (s) => <span className="text-sm">{(s.items ?? []).length} producto(s)</span>, csvValue: (s) => String((s.items ?? []).length) },
    { key: 'materiales', header: 'Materiales', hideBelow: 820, render: (s) => (
      <span className="text-xs text-muted-foreground">{s.incluye_materiales ? (s.materiales_descripcion ?? 'Sí') : 'No'}{s.pack_digital ? ' · digital' : ''}</span>), csvValue: (s) => `${s.incluye_materiales ? 'físicos' : ''} ${s.pack_digital ? 'digitales' : ''}` },
    { key: 'activo', header: 'Activo', sortable: true, hideBelow: 900, render: (s) => (s.activo ? <Badge variant="success">Sí</Badge> : <Badge variant="default">No</Badge>), csvValue: (s) => (s.activo ? 'si' : 'no') },
    { key: 'acciones', header: '', align: 'right', render: (s) => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="sm" className="min-w-11" aria-label="Ítems" onClick={() => setSelected((x) => (x?.id === s.id ? null : s))}><ListTree size={16} /></Button>
        <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar" onClick={() => { setEditing(s); setFormOpen(true); }}><Pencil size={16} /></Button>
        <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
          onClick={() => { if (window.confirm(`¿Eliminar el set "${s.nombre}"?`)) remove.mutate(s.id); }}>✕</Button>
      </div>),
    },
  ];

  if (isLoading) return <ViewLoading variant="view" label="Microcanales" hideLabel />;

  return (
    <div className="space-y-0">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Sets de entrada</CardTitle>
            <CardDescription>Unidades narrativas y comerciales: productos + materiales físicos + pack digital, por entorno.</CardDescription>
          </div>
          <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={16} className="mr-1.5" /> Nuevo set
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<SetEntradaRow>
            columns={columns} rows={items} getId={(s) => s.id} sortable exportable columnsControl
            storageKey="microcanales-sets" fullscreen fullscreenLabel="Sets — Microcanales"
            exportFilename="microcanales-sets" emptyState="Aún no hay sets de entrada."
          />
        </CardContent>
        <SetFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
      </Card>
      {selected && <SetItemsEditor set={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
