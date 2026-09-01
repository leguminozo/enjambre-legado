'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Button,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea,
  Select, Badge, ViewLoading, type ColumnDef,
} from '@enjambre/ui';
import { useInfusionResource } from './use-infusiones';
import { FormFieldLabel } from './shared';
import {
  materiaPrimaFormSchema, MATERIA_PRIMA_TIPO_OPTIONS, MATERIA_PRIMA_TIPO_LABEL,
  type MateriaPrimaRow, type MateriaPrimaFormValues,
} from '@/lib/infusiones-types';

const DEFAULT_VALUES: MateriaPrimaFormValues = {
  nombre: '',
  tipo: 'hierba',
  unidad_medida: 'kg',
  notas: undefined,
};

function MateriaPrimaFormDialog({
  open, onOpenChange, initial,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: MateriaPrimaRow | null
}) {
  const { save } = useInfusionResource<MateriaPrimaRow>('materias-primas');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<MateriaPrimaFormValues>({
      resolver: zodResolver(materiaPrimaFormSchema) as never,
      defaultValues: DEFAULT_VALUES,
    });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            nombre: initial.nombre,
            tipo: initial.tipo,
            unidad_medida: initial.unidad_medida,
            notas: initial.notas ?? undefined,
          }
        : DEFAULT_VALUES,
    );
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? `Editar ${initial.nombre}` : 'Nueva materia prima'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate({ id: initial?.id, body: v }))} className="space-y-4">
          <Input label="Nombre *" placeholder="Menta, Melisa, Cacao…" {...register('nombre')} error={errors.nombre?.message} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormFieldLabel>Tipo *</FormFieldLabel>
              <Select
                value={watch('tipo')}
                onValueChange={(v) => setValue('tipo', v as MateriaPrimaFormValues['tipo'])}
                options={MATERIA_PRIMA_TIPO_OPTIONS}
              />
            </div>
            <Input label="Unidad de medida *" placeholder="kg" {...register('unidad_medida')} error={errors.unidad_medida?.message} />
          </div>
          <Textarea label="Notas" placeholder="Parte usada, temporada, origen…" rows={2} {...register('notas')} />
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

export function MateriasPrimasPanel() {
  const { items, isLoading, remove } = useInfusionResource<MateriaPrimaRow>('materias-primas');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MateriaPrimaRow | null>(null);

  const columns: ColumnDef<MateriaPrimaRow>[] = [
    { key: 'nombre', header: 'Nombre', sortable: true, render: (m) => <span className="font-medium text-foreground">{m.nombre}</span>, csvValue: (m) => m.nombre },
    { key: 'tipo', header: 'Tipo', sortable: true, render: (m) => <Badge variant="default">{MATERIA_PRIMA_TIPO_LABEL[m.tipo] ?? m.tipo}</Badge>, csvValue: (m) => m.tipo },
    { key: 'unidad_medida', header: 'Unidad', sortable: true, hideBelow: 480, render: (m) => m.unidad_medida, csvValue: (m) => m.unidad_medida },
    { key: 'notas', header: 'Notas', hideBelow: 700, render: (m) => <span className="text-sm text-muted-foreground line-clamp-1">{m.notas ?? '—'}</span>, csvValue: (m) => m.notas ?? '' },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar"
            onClick={() => { setEditing(m); setFormOpen(true); }}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
            onClick={() => {
              if (window.confirm(`¿Desactivar "${m.nombre}"? Los lotes históricos se conservan.`)) {
                remove.mutate(m.id);
              }
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
          <CardTitle>Materias primas</CardTitle>
          <CardDescription>El catálogo base: hierbas, especias y otros insumos con su unidad.</CardDescription>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} className="mr-1.5" /> Nueva materia prima
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable<MateriaPrimaRow>
          columns={columns}
          rows={items}
          getId={(m) => m.id}
          sortable
          exportable
          columnsControl
          storageKey="infusiones-materias-primas"
          fullscreen
          fullscreenLabel="Materias primas — Infusiones"
          exportFilename="infusiones-materias-primas"
          emptyState="Aún no hay materias primas registradas."
        />
      </CardContent>
      <MateriaPrimaFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
    </Card>
  );
}
