'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ListTree, X, Check } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Button,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea,
  Select, Badge, ViewLoading, toast, type ColumnDef,
} from '@enjambre/ui';
import { useInfusionResource } from './use-infusiones';
import { FormFieldLabel } from './shared';
import { CatalogoVacioCallout } from '@/components/shared/CatalogoVacioCallout';
import {
  formulaFormSchema, ingredienteFormSchema, FORMULA_TIPO_OPTIONS, FORMULA_TIPO_LABEL,
  type FormulaRow, type FormulaFormValues, type FormulaIngredienteRow, type MateriaPrimaRow,
} from '@/lib/infusiones-types';

const DEFAULT_VALUES: FormulaFormValues = {
  nombre: '',
  descripcion: undefined,
  gramaje_sachet_g: NaN,
  tipo: 'individual',
};

function FormulaFormDialog({
  open, onOpenChange, initial,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: FormulaRow | null
}) {
  const { save } = useInfusionResource<FormulaRow>('formulas');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<FormulaFormValues>({
      resolver: zodResolver(formulaFormSchema) as never,
      defaultValues: DEFAULT_VALUES,
    });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            nombre: initial.nombre,
            descripcion: initial.descripcion ?? undefined,
            gramaje_sachet_g: initial.gramaje_sachet_g,
            tipo: initial.tipo,
          }
        : DEFAULT_VALUES,
    );
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? `Editar ${initial.nombre}` : 'Nueva fórmula'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate({ id: initial?.id, body: v }))} className="space-y-4">
          <Input label="Nombre *" placeholder="Té de Menta y Melisa, Blend Bosque…" {...register('nombre')} error={errors.nombre?.message} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Gramaje por sachet (g) *" type="number" step="0.01" min="0" placeholder="2" {...register('gramaje_sachet_g')} error={errors.gramaje_sachet_g?.message} />
            <div className="space-y-2">
              <FormFieldLabel>Formato *</FormFieldLabel>
              <Select
                value={watch('tipo')}
                onValueChange={(v) => setValue('tipo', v as FormulaFormValues['tipo'])}
                options={FORMULA_TIPO_OPTIONS}
              />
            </div>
          </div>
          <Textarea label="Descripción" placeholder="Notas de cata, uso sugerido, temporada…" rows={2} {...register('descripcion')} />
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

/** Editor de ingredientes de una fórmula: porcentajes con suma controlada (≤ 100). */
function IngredientesEditor({ formula, onClose }: { formula: FormulaRow; onClose: () => void }) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const { items: mps } = useInfusionResource<MateriaPrimaRow>('materias-primas');

  const [mpId, setMpId] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});

  const suma = formula.ingredientes.reduce((a, i) => a + Number(i.porcentaje), 0);
  const disponible = Math.round((100 - suma) * 100) / 100;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['infusiones'] });

  const addIng = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/infusiones/formulas/${formula.id}/ingredientes`, {
        method: 'POST',
        body: JSON.stringify({ materia_prima_id: mpId, porcentaje: Number(porcentaje) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al agregar ingrediente');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Ingrediente agregado', { type: 'success' });
      setMpId('');
      setPorcentaje('');
      invalidate();
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  const updateIng = useMutation({
    mutationFn: async (ing: FormulaIngredienteRow) => {
      const res = await apiFetch(`/api/infusiones/formulas/${formula.id}/ingredientes/${ing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ porcentaje: Number(edits[ing.id]) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al actualizar');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Porcentaje actualizado', { type: 'success' });
      setEdits({});
      invalidate();
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  const deleteIng = useMutation({
    mutationFn: async (ingId: string) => {
      const res = await apiFetch(`/api/infusiones/formulas/${formula.id}/ingredientes/${ingId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al eliminar');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Ingrediente eliminado', { type: 'success' });
      invalidate();
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  const mpOptions = useMemo(
    () => (mps ?? []).map((m) => ({ value: m.id, label: m.nombre })),
    [mps],
  );

  return (
    <Card className="mt-4 border-primary/20">
      <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="text-base">Ingredientes — {formula.nombre}</CardTitle>
          <CardDescription>
            Gramos por kg se calculan solos (porcentaje · 10). Suma actual:{' '}
            <span className={suma > 100 ? 'text-destructive font-medium' : 'text-foreground font-medium'}>
              {suma.toLocaleString('es-CL', { maximumFractionDigits: 1 })}%
            </span>
            {disponible > 0 && ` · quedan ${disponible.toLocaleString('es-CL', { maximumFractionDigits: 1 })}%`}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}><X size={16} className="mr-1" /> Cerrar</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {formula.ingredientes.length === 0 && (
            <p className="text-sm text-muted-foreground">Aún no hay ingredientes en esta fórmula.</p>
          )}
          {formula.ingredientes.map((ing) => {
            const edited = edits[ing.id] ?? String(ing.porcentaje);
            const dirty = Number(edited) !== Number(ing.porcentaje);
            return (
              <div key={ing.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-sunken/40 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ing.materia_prima?.nombre ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(ing.gramos_por_kg_mezcla).toLocaleString('es-CL', { maximumFractionDigits: 1 })} g por kg de mezcla
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" step="0.1" min="0" max="100" className="w-24"
                    value={edited}
                    onChange={(e) => setEdits((p) => ({ ...p, [ing.id]: e.target.value }))}
                    aria-label="Porcentaje"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  {dirty && (
                    <Button variant="outline" size="sm" disabled={updateIng.isPending}
                      onClick={() => updateIng.mutate(ing)}>
                      <Check size={14} />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-destructive" aria-label="Eliminar ingrediente"
                    onClick={() => { if (window.confirm('¿Quitar este ingrediente de la fórmula?')) deleteIng.mutate(ing.id); }}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 space-y-2">
            <FormFieldLabel>Materia prima</FormFieldLabel>
            {mpOptions.length === 0 ? (
              <CatalogoVacioCallout
                title="No hay materias primas"
                description="Da de alta hierbas o materias primas antes de armar la receta."
                href="/produccion/infusiones?tab=materias"
                goLabel="Ir a Materias primas"
              />
            ) : (
              <Select
                value={mpId}
                onValueChange={setMpId}
                options={mpOptions}
                placeholder="Seleccionar…"
                searchable
              />
            )}
          </div>
          <div className="w-full sm:w-32 space-y-2">
            <FormFieldLabel>% de la mezcla</FormFieldLabel>
            <Input type="number" step="0.1" min="0" max={Math.max(disponible, 0)} value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)} placeholder="30" />
          </div>
          <Button variant="primary" size="sm" disabled={!mpId || !porcentaje || addIng.isPending || Number(porcentaje) <= 0}
            onClick={() => addIng.mutate()}>
            <Plus size={16} className="mr-1.5" /> Agregar
          </Button>
        </div>
        {disponible <= 0 && (
          <p className="text-xs text-destructive">La suma ya es 100%: ajusta un porcentaje antes de agregar.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function FormulasPanel() {
  const { items, isLoading, remove } = useInfusionResource<FormulaRow>('formulas');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FormulaRow | null>(null);
  const [selected, setSelected] = useState<FormulaRow | null>(null);

  const columns: ColumnDef<FormulaRow>[] = [
    {
      key: 'nombre',
      header: 'Fórmula',
      sortable: true,
      render: (f) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{f.nombre}</span>
          {f.descripcion && <span className="text-xs text-muted-foreground line-clamp-1">{f.descripcion}</span>}
        </div>
      ),
      csvValue: (f) => f.nombre,
    },
    { key: 'tipo', header: 'Formato', sortable: true, hideBelow: 560, render: (f) => <Badge variant="default">{FORMULA_TIPO_LABEL[f.tipo] ?? f.tipo}</Badge>, csvValue: (f) => f.tipo },
    { key: 'gramaje_sachet_g', header: 'Sachet (g)', sortable: true, align: 'right', render: (f) => f.gramaje_sachet_g.toLocaleString('es-CL'), csvValue: (f) => String(f.gramaje_sachet_g) },
    {
      key: 'ingredientes',
      header: 'Ingredientes',
      hideBelow: 700,
      render: (f) => (
        <div className="flex flex-wrap gap-1 max-w-64">
          {f.ingredientes.slice(0, 3).map((i) => (
            <Badge key={i.id} variant="default" className="text-xs">
              {i.materia_prima?.nombre ?? '—'} {Number(i.porcentaje).toLocaleString('es-CL', { maximumFractionDigits: 0 })}%
            </Badge>
          ))}
          {f.ingredientes.length > 3 && <Badge variant="default" className="text-xs">+{f.ingredientes.length - 3}</Badge>}
          {f.ingredientes.length === 0 && <span className="text-xs text-muted-foreground">Sin ingredientes</span>}
        </div>
      ),
      csvValue: (f) => f.ingredientes.map((i) => `${i.materia_prima?.nombre ?? ''}:${i.porcentaje}`).join(' | '),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (f) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Ingredientes"
            onClick={() => setSelected((s) => (s?.id === f.id ? null : f))}>
            <ListTree size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar"
            onClick={() => { setEditing(f); setFormOpen(true); }}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
            onClick={() => {
              if (window.confirm(`¿Desactivar la fórmula "${f.nombre}"?`)) remove.mutate(f.id);
            }}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <ViewLoading variant="view" label="Infusiones" hideLabel />;

  return (
    <div className="space-y-0">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Fórmulas</CardTitle>
            <CardDescription>Recetas con gramaje por sachet y porcentajes de mezcla trazables a cada materia prima.</CardDescription>
          </div>
          <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={16} className="mr-1.5" /> Nueva fórmula
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<FormulaRow>
            columns={columns}
            rows={items}
            getId={(f) => f.id}
            sortable
            exportable
            columnsControl
            storageKey="infusiones-formulas"
            fullscreen
            fullscreenLabel="Fórmulas — Infusiones"
            exportFilename="infusiones-formulas"
            emptyState="Aún no hay fórmulas registradas."
          />
        </CardContent>
        <FormulaFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} />
      </Card>
      {selected && <IngredientesEditor formula={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
