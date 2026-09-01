'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Button,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea,
  ViewLoading, type ColumnDef,
} from '@enjambre/ui';
import { useInfusionResource } from './use-infusiones';
import {
  proveedorFormSchema, type ProveedorRow, type ProveedorFormValues,
} from '@/lib/infusiones-types';

const DEFAULT_VALUES: ProveedorFormValues = {
  nombre: '',
  contacto: undefined,
  ubicacion: undefined,
  notas: undefined,
};

function ProveedorFormDialog({
  open, onOpenChange, initial,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: ProveedorRow | null
}) {
  const { save } = useInfusionResource<ProveedorRow>('proveedores');
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<ProveedorFormValues>({
      resolver: zodResolver(proveedorFormSchema) as never,
      defaultValues: DEFAULT_VALUES,
    });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            nombre: initial.nombre,
            contacto: initial.contacto ?? undefined,
            ubicacion: initial.ubicacion ?? undefined,
            notas: initial.notas ?? undefined,
          }
        : DEFAULT_VALUES,
    );
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? `Editar ${initial.nombre}` : 'Nuevo proveedor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate({ id: initial?.id, body: v }))} className="space-y-4">
          <Input label="Nombre *" placeholder="Vivero, cooperativa, feria…" {...register('nombre')} error={errors.nombre?.message} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contacto" placeholder="Nombre, teléfono o correo" {...register('contacto')} />
            <Input label="Ubicación" placeholder="Comuna, sector…" {...register('ubicacion')} />
          </div>
          <Textarea label="Notas" placeholder="Condiciones, temporada de oferta…" rows={2} {...register('notas')} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProveedoresPanel() {
  const { items, isLoading, remove } = useInfusionResource<ProveedorRow>('proveedores');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProveedorRow | null>(null);

  const columns: ColumnDef<ProveedorRow>[] = [
    { key: 'nombre', header: 'Nombre', sortable: true, render: (p) => <span className="font-medium text-foreground">{p.nombre}</span>, csvValue: (p) => p.nombre },
    { key: 'contacto', header: 'Contacto', sortable: true, hideBelow: 560, render: (p) => p.contacto ?? '—', csvValue: (p) => p.contacto ?? '' },
    { key: 'ubicacion', header: 'Ubicación', sortable: true, hideBelow: 700, render: (p) => p.ubicacion ?? '—', csvValue: (p) => p.ubicacion ?? '' },
    { key: 'notas', header: 'Notas', hideBelow: 820, render: (p) => <span className="text-sm text-muted-foreground line-clamp-1">{p.notas ?? '—'}</span>, csvValue: (p) => p.notas ?? '' },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar"
            onClick={() => { setEditing(p); setFormOpen(true); }}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
            onClick={() => {
              if (window.confirm(`¿Desactivar al proveedor "${p.nombre}"?`)) remove.mutate(p.id);
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
          <CardTitle>Proveedores</CardTitle>
          <CardDescription>De quién se compra materia prima — el vínculo con cada lote vive en la entrada.</CardDescription>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} className="mr-1.5" /> Nuevo proveedor
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable<ProveedorRow>
          columns={columns}
          rows={items}
          getId={(p) => p.id}
          sortable
          exportable
          columnsControl
          storageKey="infusiones-proveedores"
          fullscreen
          fullscreenLabel="Proveedores — Infusiones"
          exportFilename="infusiones-proveedores"
          emptyState="Aún no hay proveedores registrados."
        />
      </CardContent>
      <ProveedorFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
    </Card>
  );
}
