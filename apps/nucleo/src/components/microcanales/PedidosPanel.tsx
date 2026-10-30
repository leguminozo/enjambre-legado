'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Button,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Textarea,
  Select, Badge, SkeletonTable, formatCLP, type ColumnDef,
} from '@enjambre/ui';
import { useMicrocanalResource } from './use-microcanales';
import { FieldLabel } from './shared';
import { CatalogoVacioCallout } from '@/components/shared/CatalogoVacioCallout';
import {
  pedidoFormSchema, PEDIDO_ESTADO_OPTIONS, PEDIDO_ESTADO_LABEL,
  type PedidoRow, type PedidoFormValues, type PuntoVentaRow, type RevendedorRow, type SetEntradaRow,
} from '@/lib/microcanales-types';

const ESTADO_VARIANTE: Record<string, 'default' | 'warning' | 'success' | 'danger'> = {
  solicitado: 'default', confirmado: 'warning', enviado: 'warning', entregado: 'success', cancelado: 'danger',
}

function PedidoFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { save } = useMicrocanalResource<PedidoRow>('pedidos');
  const { items: puntos } = useMicrocanalResource<PuntoVentaRow>('puntos-venta');
  const { items: revendedores } = useMicrocanalResource<RevendedorRow>('revendedores');
  const { items: sets } = useMicrocanalResource<SetEntradaRow>('sets');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<PedidoFormValues>({
      resolver: zodResolver(pedidoFormSchema) as never,
      defaultValues: { punto_venta_id: null, revendedor_id: null, set_id: '', notas: undefined },
    });

  useEffect(() => { if (open) reset({ punto_venta_id: null, revendedor_id: null, set_id: '', notas: undefined }); }, [open, reset]);

  const setSel = sets.find((s) => s.id === watch('set_id'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nuevo pedido</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate({ body: v }))} className="space-y-4">
          <div className="space-y-2">
            <FieldLabel>Para quién</FieldLabel>
            <Select value={watch('punto_venta_id') ?? ''} onValueChange={(v) => { setValue('punto_venta_id', v || null); setValue('revendedor_id', null); }}
              options={[{ value: '', label: '— Punto de venta —' }, ...puntos.map((p) => ({ value: p.id, label: p.nombre }))]} searchable />
            <Select value={watch('revendedor_id') ?? ''} onValueChange={(v) => { setValue('revendedor_id', v || null); setValue('punto_venta_id', null); }}
              options={[{ value: '', label: '— Revendedor —' }, ...revendedores.map((r) => ({ value: r.id, label: r.nombre }))]} searchable />
          </div>
          <div className="space-y-2">
            <FieldLabel>Set *</FieldLabel>
            {sets.filter((s) => s.activo).length === 0 ? (
              <CatalogoVacioCallout
                title="No hay sets activos"
                description="Crea un set de entrada antes de registrar un pedido al por mayor."
                href="/microcanales?tab=sets"
                goLabel="Ir a Sets"
                onNavigate={() => onOpenChange(false)}
              />
            ) : (
              <Select value={watch('set_id')} onValueChange={(v) => setValue('set_id', v)}
                options={sets.filter((s) => s.activo).map((s) => ({ value: s.id, label: `${s.nombre} — ${formatCLP(s.precio_clp)}` }))} searchable />
            )}
            {errors.set_id && <p className="text-xs text-destructive">{errors.set_id.message}</p>}
          </div>
          {setSel && <p className="text-xs text-muted-foreground">Monto snapshot: {formatCLP(setSel.precio_clp)}</p>}
          <Textarea label="Notas" rows={2} {...register('notas')} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending || sets.filter((s) => s.activo).length === 0}>{save.isPending ? 'Guardando…' : 'Crear pedido'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PedidosPanel() {
  const { items, isLoading, save, remove } = useMicrocanalResource<PedidoRow>('pedidos');
  const [formOpen, setFormOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const filtered = useMemo(
    () => items.filter((p) => filtroEstado === 'todos' || p.estado === filtroEstado),
    [items, filtroEstado],
  );

  const columns: ColumnDef<PedidoRow>[] = [
    { key: 'fecha', header: 'Fecha', sortable: true, render: (p) => p.fecha, csvValue: (p) => p.fecha },
    { key: 'cliente', header: 'Para', sortable: true, render: (p) => (
      <span className="font-medium text-foreground">{p.punto_venta?.nombre ?? p.revendedor?.nombre ?? '—'}</span>), csvValue: (p) => p.punto_venta?.nombre ?? p.revendedor?.nombre ?? '' },
    { key: 'set', header: 'Set', sortable: true, hideBelow: 560, render: (p) => p.set?.nombre ?? '—', csvValue: (p) => p.set?.nombre ?? '' },
    { key: 'monto_clp', header: 'Monto', sortable: true, align: 'right', render: (p) => formatCLP(p.monto_clp), csvValue: (p) => String(p.monto_clp) },
    { key: 'estado', header: 'Estado', sortable: true, render: (p) => (
      <div className="w-36">
        <Select value={p.estado} onValueChange={(v) => save.mutate({ id: p.id, body: { estado: v } })}
          options={PEDIDO_ESTADO_OPTIONS} />
      </div>), csvValue: (p) => p.estado },
    { key: 'acciones', header: '', align: 'right', render: (p) => (
      <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
        onClick={() => { if (window.confirm('¿Eliminar este pedido? (si tiene retribuciones se genera contra-asiento)')) remove.mutate(p.id); }}>✕</Button>),
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <CardTitle>Pedidos</CardTitle>
            <CardDescription>Confirmar un pedido al por mayor dispara la retribución automática (rebate + velocity + depth + co-op).</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={5} columns={6} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>Pedidos</CardTitle>
          <CardDescription>Confirmar un pedido al por mayor dispara la retribución automática (rebate + velocity + depth + co-op).</CardDescription>
        </div>
        <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={16} className="mr-1.5" /> Nuevo pedido
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-4 py-3 border-b border-border/60 w-44">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}
            options={[{ value: 'todos', label: 'Todos los estados' }, ...PEDIDO_ESTADO_OPTIONS]} />
        </div>
        <DataTable<PedidoRow>
          columns={columns} rows={filtered} getId={(p) => p.id} sortable exportable columnsControl
          storageKey="microcanales-pedidos" fullscreen fullscreenLabel="Pedidos — Microcanales"
          exportFilename="microcanales-pedidos" emptyState="Aún no hay pedidos."
        />
      </CardContent>
      <PedidoFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </Card>
  );
}
