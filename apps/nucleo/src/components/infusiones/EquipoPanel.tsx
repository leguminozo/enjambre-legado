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
  equipoFormSchema, EQUIPO_ROL_OPTIONS, EQUIPO_ROL_LABEL,
  type EquipoRow, type EquipoFormValues,
} from '@/lib/infusiones-types';

const DEFAULT_VALUES: EquipoFormValues = {
  nombre: '',
  rol_operacion: 'operario',
  notas: undefined,
};

function EquipoFormDialog({
  open, onOpenChange, initial,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: EquipoRow | null
}) {
  const { save } = useInfusionResource<EquipoRow>('equipo');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<EquipoFormValues>({
      resolver: zodResolver(equipoFormSchema) as never,
      defaultValues: DEFAULT_VALUES,
    });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            nombre: initial.nombre,
            rol_operacion: initial.rol_operacion,
            notas: initial.notas ?? undefined,
          }
        : DEFAULT_VALUES,
    );
  }, [open, initial, reset]);

  const esDosificador = watch('rol_operacion') === 'dosificador';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? `Editar ${initial.nombre}` : 'Nuevo miembro del equipo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate({ id: initial?.id, body: v }))} className="space-y-4">
          <Input label="Nombre *" placeholder="Quién hace el trabajo…" {...register('nombre')} error={errors.nombre?.message} />
          <div className="space-y-2">
            <FormFieldLabel>Rol de operación *</FormFieldLabel>
            <Select
              value={watch('rol_operacion')}
              onValueChange={(v) => setValue('rol_operacion', v as EquipoFormValues['rol_operacion'])}
              options={EQUIPO_ROL_OPTIONS}
            />
            {esDosificador && (
              <p className="text-xs text-muted-foreground bg-surface-sunken/50 rounded-lg border border-border/50 px-3 py-2">
                El rol <span className="font-medium text-foreground">dosificador</span> es el único que puede
                asignarse al paso «Dosificado» — para la dosificadora.
              </p>
            )}
          </div>
          <Textarea label="Notas" placeholder="Contacto, disponibilidad, preferencias…" rows={2} {...register('notas')} />
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

export function EquipoPanel() {
  const { items, isLoading, remove } = useInfusionResource<EquipoRow>('equipo');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EquipoRow | null>(null);

  const columns: ColumnDef<EquipoRow>[] = [
    { key: 'nombre', header: 'Nombre', sortable: true, render: (e) => <span className="font-medium text-foreground">{e.nombre}</span>, csvValue: (e) => e.nombre },
    {
      key: 'rol_operacion',
      header: 'Rol',
      sortable: true,
      render: (e) => (
        <Badge variant={e.rol_operacion === 'dosificador' ? 'warning' : 'default'}>
          {EQUIPO_ROL_LABEL[e.rol_operacion] ?? e.rol_operacion}
        </Badge>
      ),
      csvValue: (e) => e.rol_operacion,
    },
    { key: 'notas', header: 'Notas', hideBelow: 700, render: (e) => <span className="text-sm text-muted-foreground line-clamp-1">{e.notas ?? '—'}</span>, csvValue: (e) => e.notas ?? '' },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar"
            onClick={() => { setEditing(e); setFormOpen(true); }}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
            onClick={() => {
              if (window.confirm(`¿Desactivar a "${e.nombre}"? Las tareas asignadas se conservan.`)) remove.mutate(e.id);
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
          <CardTitle>Equipo</CardTitle>
          <CardDescription>Las personas a quienes delegar pasos de producción — el rol dosificador queda reservado para la dosificadora.</CardDescription>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} className="mr-1.5" /> Nuevo miembro
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable<EquipoRow>
          columns={columns}
          rows={items}
          getId={(e) => e.id}
          sortable
          exportable
          columnsControl
          storageKey="infusiones-equipo"
          fullscreen
          fullscreenLabel="Equipo — Infusiones"
          exportFilename="infusiones-equipo"
          emptyState="Aún no hay miembros del equipo. Agrega a las personas a quienes delegarás."
        />
      </CardContent>
      <EquipoFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
    </Card>
  );
}
