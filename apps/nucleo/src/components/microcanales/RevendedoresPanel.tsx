'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Button,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea,
  Select, Badge, ViewLoading, toast, formatCLP, type ColumnDef,
} from '@enjambre/ui';
import { useMicrocanalResource } from './use-microcanales';
import { FieldLabel } from './shared';
import {
  revendedorFormSchema, REVENDEDOR_ESPACIO_OPTIONS, REVENDEDOR_ESPACIO_LABEL,
  type RevendedorRow, type RevendedorFormValues,
} from '@/lib/microcanales-types';

const DEFAULT_VALUES: RevendedorFormValues = {
  nombre: '', whatsapp: undefined, tipo_espacio: 'tienda', estado: 'prospecto', notas: undefined,
};

function RevendedorFormDialog({ open, onOpenChange, initial }: {
  open: boolean; onOpenChange: (v: boolean) => void; initial: RevendedorRow | null;
}) {
  const { save } = useMicrocanalResource<RevendedorRow>('revendedores');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<RevendedorFormValues>({
      resolver: zodResolver(revendedorFormSchema) as never,
      defaultValues: DEFAULT_VALUES,
    });

  useEffect(() => {
    if (!open) return;
    reset(initial ? {
      nombre: initial.nombre, whatsapp: initial.whatsapp ?? undefined,
      tipo_espacio: initial.tipo_espacio, estado: initial.estado, notas: initial.notas ?? undefined,
    } : DEFAULT_VALUES);
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? `Editar ${initial.nombre}` : 'Nuevo revendedor'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate({ id: initial?.id, body: v }))} className="space-y-4">
          <Input label="Nombre *" {...register('nombre')} error={errors.nombre?.message} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="WhatsApp" placeholder="+56 9 …" {...register('whatsapp')} />
            <div className="space-y-2">
              <FieldLabel>Tipo de espacio</FieldLabel>
              <Select value={watch('tipo_espacio')} onValueChange={(v) => setValue('tipo_espacio', v as RevendedorFormValues['tipo_espacio'])} options={REVENDEDOR_ESPACIO_OPTIONS} />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel>Estado</FieldLabel>
            <Select value={watch('estado')} onValueChange={(v) => setValue('estado', v as RevendedorFormValues['estado'])}
              options={[{ value: 'prospecto', label: 'Prospecto' }, { value: 'activo', label: 'Activo' }, { value: 'pausado', label: 'Pausado' }]} />
          </div>
          <Textarea label="Notas" rows={2} {...register('notas')} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Guardando…' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RevendedoresPanel() {
  const { items, isLoading, save, remove } = useMicrocanalResource<RevendedorRow>('revendedores');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RevendedorRow | null>(null);

  const activarYNotificar = async (r: RevendedorRow) => {
    try {
      await save.mutateAsync({
        id: r.id,
        body: {
          nombre: r.nombre,
          whatsapp: r.whatsapp,
          tipo_espacio: r.tipo_espacio,
          estado: 'activo',
          notas: r.notas,
        },
      });
      toast(`Revendedor ${r.nombre} activado exitosamente`, { type: 'success' });
      const text = encodeURIComponent(
        `¡Hola ${r.nombre}! Tu perfil en el Programa de Revendedores de La Obrera y el Zángano ha sido activado.\n\n` +
        `Tu código de revendedor es: *${r.codigo_revendedor}*\n` +
        `Accede a tu portal mayorista y solicita tus Sets de Activación bonificados aquí:\n` +
        `${window.location.origin}/punto-de-venta/portal\n\n` +
        `¡Mucho éxito en tus ventas!`
      );
      const waNumber = (r.whatsapp || '').replace(/[^0-9]/g, '');
      const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${text}` : `https://wa.me/?text=${text}`;
      window.open(waUrl, '_blank');
    } catch {
      toast('Error al activar revendedor', { type: 'error' });
    }
  };

  const columns: ColumnDef<RevendedorRow>[] = [
    { key: 'nombre', header: 'Nombre', sortable: true, render: (r) => <span className="font-medium text-foreground">{r.nombre}</span>, csvValue: (r) => r.nombre },
    { key: 'tipo_espacio', header: 'Espacio', sortable: true, render: (r) => <Badge variant="default">{REVENDEDOR_ESPACIO_LABEL[r.tipo_espacio] ?? r.tipo_espacio}</Badge>, csvValue: (r) => r.tipo_espacio },
    { key: 'whatsapp', header: 'WhatsApp', sortable: true, hideBelow: 560, render: (r) => r.whatsapp ?? '—', csvValue: (r) => r.whatsapp ?? '' },
    { key: 'estado', header: 'Estado', sortable: true, render: (r) => (
      <Badge variant={r.estado === 'activo' ? 'success' : r.estado === 'pausado' ? 'warning' : 'default'}>{r.estado}</Badge>), csvValue: (r) => r.estado },
    { key: 'origen', header: 'Origen', sortable: true, hideBelow: 700, render: (r) => (r.origen === 'autonomo' ? 'Autónomo' : 'Marca'), csvValue: (r) => r.origen },
    { key: 'grupo_control', header: 'Holdout', sortable: true, hideBelow: 820, render: (r) => (r.grupo_control ? <Badge variant="warning">Control</Badge> : '—'), csvValue: (r) => (r.grupo_control ? 'control' : '') },
    { key: 'codigo_revendedor', header: 'Código', sortable: true, hideBelow: 900, render: (r) => <span className="font-mono text-sm text-primary">{r.codigo_revendedor}</span>, csvValue: (r) => r.codigo_revendedor },
    { key: 'acciones', header: '', align: 'right', render: (r) => (
      <div className="flex items-center justify-end gap-1">
        {r.estado === 'prospecto' && (
          <Button
            variant="outline"
            size="sm"
            className="text-success border-success/40 hover:bg-success/10 text-xs px-2"
            onClick={() => activarYNotificar(r)}
          >
            Aprobar + WA
          </Button>
        )}
        <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil size={16} /></Button>
        <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
          onClick={() => { if (window.confirm(`¿Eliminar a ${r.nombre}?`)) remove.mutate(r.id); }}>✕</Button>
      </div>),
    },
  ];

  if (isLoading) return <ViewLoading variant="view" label="Microcanales" hideLabel />;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>Revendedores</CardTitle>
          <CardDescription>El segmento de personas que promueven la marca (tienda, frutería, feria) — retribución por compras al por mayor en Fidelización.</CardDescription>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} className="mr-1.5" /> Nuevo revendedor
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable<RevendedorRow>
          columns={columns} rows={items} getId={(r) => r.id} sortable exportable columnsControl
          storageKey="microcanales-revendedores" fullscreen fullscreenLabel="Revendedores — Microcanales"
          exportFilename="microcanales-revendedores" emptyState="Aún no hay revendedores."
        />
      </CardContent>
      <RevendedorFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
    </Card>
  );
}
