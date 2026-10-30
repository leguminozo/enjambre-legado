'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Layers, X, PackageCheck } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Button,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea,
  Select, Badge, SkeletonTable, toast, type ColumnDef,
} from '@enjambre/ui';
import { useInfusionResource } from './use-infusiones';
import { FormFieldLabel, ResponsableInput } from './shared';
import { CatalogoVacioCallout } from '@/components/shared/CatalogoVacioCallout';
import {
  loteProduccionFormSchema, materialFormSchema, fmtKg, fmtG, fmtFecha, FORMULA_TIPO_LABEL,
  type LoteProduccionRow, type LoteProduccionFormValues, type FormulaRow,
  type LoteDeshidratadoRow, type ProduccionMaterialRow,
} from '@/lib/infusiones-types';

const DEFAULT_VALUES: LoteProduccionFormValues = {
  formula_id: '',
  fecha: '',
  peso_mezcla_kg: null,
  cantidad_sachets: null,
  responsable: undefined,
  notas: undefined,
};

function LoteProduccionFormDialog({
  open, onOpenChange, initial,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: LoteProduccionRow | null
}) {
  const apiFetch = useApiFetch();
  const { save } = useInfusionResource<LoteProduccionRow>('lotes-produccion');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<LoteProduccionFormValues>({
      resolver: zodResolver(loteProduccionFormSchema) as never,
      defaultValues: DEFAULT_VALUES,
    });

  const { data: formulas } = useQuery<{ data: FormulaRow[] }>({
    queryKey: ['infusiones', 'formulas'],
    queryFn: async () => {
      const res = await apiFetch('/api/infusiones/formulas');
      if (!res.ok) throw new Error('Error al cargar fórmulas');
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

  const formulaOptions = useMemo(
    () => (formulas?.data ?? []).filter((f) => f.activa !== false).map((f) => ({
      value: f.id,
      label: `${f.nombre} · ${f.gramaje_sachet_g.toLocaleString('es-CL')} g/sachet`,
    })),
    [formulas],
  );

  const formulaSel = (formulas?.data ?? []).find((f) => f.id === watch('formula_id'));
  const pesoMezcla = Number(watch('peso_mezcla_kg') ?? 0);
  const sachetsSugeridos = formulaSel && pesoMezcla > 0
    ? Math.floor((pesoMezcla * 1000) / Number(formulaSel.gramaje_sachet_g))
    : null;

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            formula_id: initial.formula_id,
            fecha: initial.fecha,
            peso_mezcla_kg: initial.peso_mezcla_kg,
            cantidad_sachets: initial.cantidad_sachets,
            responsable: initial.responsable ?? undefined,
            notas: initial.notas ?? undefined,
          }
        : DEFAULT_VALUES,
    );
  }, [open, initial, reset]);

  const onSubmit = (v: LoteProduccionFormValues) => {
    save.mutate(
      { id: initial?.id, body: v },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar lote de producción' : 'Nuevo lote de producción'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <FormFieldLabel>Fórmula *</FormFieldLabel>
            {formulaOptions.length === 0 ? (
              <CatalogoVacioCallout
                title="No hay fórmulas"
                description="Para registrar un lote de producción, primero crea una fórmula."
                href="/produccion/infusiones?tab=formulas"
                goLabel="Ir a Fórmulas"
                onNavigate={() => onOpenChange(false)}
              />
            ) : (
              <Select
                value={watch('formula_id')}
                onValueChange={(v) => setValue('formula_id', v)}
                options={formulaOptions}
                placeholder="Seleccionar fórmula…"
                searchable
              />
            )}
            {errors.formula_id && <p className="text-xs text-destructive">{errors.formula_id.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Fecha *" type="date" {...register('fecha')} error={errors.fecha?.message} />
            <Input label="Peso de mezcla (kg)" type="number" step="0.001" min="0" placeholder="1.200" {...register('peso_mezcla_kg')} error={errors.peso_mezcla_kg?.message} />
            <Input label="Cantidad de sachets" type="number" step="1" min="0" placeholder="600" {...register('cantidad_sachets')} error={errors.cantidad_sachets?.message} />
          </div>

          {sachetsSugeridos != null && (
            <p className="text-xs text-muted-foreground bg-surface-sunken/50 rounded-lg border border-border/50 px-3 py-2">
              Con {fmtKg(pesoMezcla)} y gramaje de {formulaSel?.gramaje_sachet_g.toLocaleString('es-CL')} g/sachet salen ≈{' '}
              <span className="font-medium text-foreground">{sachetsSugeridos.toLocaleString('es-CL')} sachets</span> — ajusta el número real si sobra merma.
            </p>
          )}

          <ResponsableInput
            label="Responsable de la producción"
            listId="infusion-responsables-produccion"
            sugerencias={responsables?.data ?? []}
            value={watch('responsable') ?? ''}
            onChange={(v) => setValue('responsable', v || undefined)}
          />

          <Textarea label="Notas" placeholder="Molienda, mezcla, dosificadora, mermas…" rows={2} {...register('notas')} />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending || formulaOptions.length === 0}>
              {save.isPending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Registrar producción'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Consumo de stock seco por lote de producción: qué lote deshidratado alimentó la mezcla. */
function MaterialesEditor({ lote, onClose }: { lote: LoteProduccionRow; onClose: () => void }) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const { items: secos } = useInfusionResource<LoteDeshidratadoRow>('lotes-deshidratado');

  const [secoId, setSecoId] = useState('');
  const [gramos, setGramos] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['infusiones'] });

  const addMat = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/infusiones/lotes-produccion/${lote.id}/materiales`, {
        method: 'POST',
        body: JSON.stringify({ lote_deshidratado_id: secoId, gramos_utilizados: Number(gramos) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al agregar material');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Material agregado', { type: 'success' });
      setSecoId('');
      setGramos('');
      invalidate();
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  const deleteMat = useMutation({
    mutationFn: async (matId: string) => {
      const res = await apiFetch(`/api/infusiones/lotes-produccion/${lote.id}/materiales/${matId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al eliminar');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Material eliminado', { type: 'success' });
      invalidate();
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  const secoOptions = useMemo(
    () => (secos ?? [])
      .filter((s) => s.stock_disponible_g != null && Number(s.stock_disponible_g) > 0)
      .map((s) => ({
        value: s.id,
        label: `${s.lote_entrada?.codigo_lote ?? ''} — ${s.lote_entrada?.materia_prima?.nombre ?? ''} · disp ${fmtG(s.stock_disponible_g)}`,
      })),
    [secos],
  );

  const secoSel = (secos ?? []).find((s) => s.id === secoId);
  const disponibleG = secoSel?.stock_disponible_g != null ? Number(secoSel.stock_disponible_g) : 0;
  const excede = gramos !== '' && Number(gramos) > disponibleG;

  const totalG = (lote.materiales ?? []).reduce((a, m) => a + Number(m.gramos_utilizados), 0);

  return (
    <Card className="mt-4 border-primary/20">
      <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="text-base">Materiales consumidos — {lote.formula?.nombre ?? ''}</CardTitle>
          <CardDescription>
            {lote.formula
              ? `Según la fórmula, 1 kg de mezcla usa ${(lote.materiales ?? []).length ? '' : ''}ingredientes de materias primas secas — lo registrado abajo es el stock seco real consumido. Total: ${fmtG(totalG)}.`
              : 'Qué lotes secos alimentaron esta producción.'}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}><X size={16} className="mr-1" /> Cerrar</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {lote.materiales.length === 0 && (
            <p className="text-sm text-muted-foreground">Aún no se registró consumo de stock seco.</p>
          )}
          {(lote.materiales ?? []).map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-sunken/40 p-3">
              <PackageCheck size={16} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {m.lote_deshidratado?.lote_entrada?.codigo_lote ?? '—'}
                  <span className="text-muted-foreground"> · {m.lote_deshidratado?.lote_entrada?.materia_prima?.nombre ?? ''}</span>
                </p>
              </div>
              <span className="text-sm font-medium text-foreground">{fmtG(m.gramos_utilizados)}</span>
              <Button variant="ghost" size="sm" className="text-destructive" aria-label="Eliminar material"
                onClick={() => { if (window.confirm('¿Quitar este consumo?')) deleteMat.mutate(m.id); }}>
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 space-y-2">
            <FormFieldLabel>Lote seco</FormFieldLabel>
            <Select
              value={secoId}
              onValueChange={setSecoId}
              options={secoOptions}
              placeholder="Seleccionar lote deshidratado…"
              searchable
            />
          </div>
          <div className="w-full sm:w-36 space-y-2">
            <FormFieldLabel>Gramos utilizados</FormFieldLabel>
            <Input type="number" step="1" min="0" value={gramos}
              onChange={(e) => setGramos(e.target.value)} placeholder="120" />
          </div>
          <Button variant="primary" size="sm" disabled={!secoId || !gramos || Number(gramos) <= 0 || excede || addMat.isPending}
            onClick={() => addMat.mutate()}>
            <Plus size={16} className="mr-1.5" /> Agregar
          </Button>
        </div>
        {excede && (
          <p className="text-xs text-destructive">
            Supera el stock disponible del lote ({fmtG(disponibleG)}).
          </p>
        )}
        {secoOptions.length === 0 && (
          <CatalogoVacioCallout
            title="No hay lotes secos disponibles"
            description="Registra un proceso de deshidratado para consumir stock seco en esta producción."
            href="/produccion/infusiones?tab=deshidratado"
            goLabel="Ir a Deshidratación"
          />
        )}
      </CardContent>
    </Card>
  );
}

export function ProduccionPanel() {
  const { items, isLoading, remove } = useInfusionResource<LoteProduccionRow>('lotes-produccion');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LoteProduccionRow | null>(null);
  const [selected, setSelected] = useState<LoteProduccionRow | null>(null);

  const columns: ColumnDef<LoteProduccionRow>[] = [
    { key: 'fecha', header: 'Fecha', sortable: true, render: (l) => fmtFecha(l.fecha), csvValue: (l) => l.fecha },
    {
      key: 'formula',
      header: 'Fórmula',
      sortable: true,
      render: (l) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{l.formula?.nombre ?? '—'}</span>
          {l.formula && (
            <span className="text-xs text-muted-foreground">
              {l.formula.gramaje_sachet_g.toLocaleString('es-CL')} g/sachet · {FORMULA_TIPO_LABEL[l.formula.tipo] ?? l.formula.tipo}
            </span>
          )}
        </div>
      ),
      csvValue: (l) => l.formula?.nombre ?? '',
    },
    { key: 'peso_mezcla_kg', header: 'Mezcla', sortable: true, align: 'right', hideBelow: 560, render: (l) => fmtKg(l.peso_mezcla_kg), csvValue: (l) => String(l.peso_mezcla_kg ?? '') },
    { key: 'cantidad_sachets', header: 'Sachets', sortable: true, align: 'right', render: (l) => (l.cantidad_sachets != null ? l.cantidad_sachets.toLocaleString('es-CL') : '—'), csvValue: (l) => String(l.cantidad_sachets ?? '') },
    { key: 'responsable', header: 'Responsable', sortable: true, hideBelow: 700, render: (l) => l.responsable ?? '—', csvValue: (l) => l.responsable ?? '' },
    {
      key: 'materiales',
      header: 'Materiales',
      hideBelow: 820,
      render: (l) => {
        const g = (l.materiales ?? []).reduce((a, m) => a + Number(m.gramos_utilizados), 0);
        return l.materiales.length
          ? <span className="text-sm">{l.materiales.length} lote(s) · {fmtG(g)}</span>
          : <span className="text-xs text-muted-foreground">Sin consumo</span>;
      },
      csvValue: (l) => String((l.materiales ?? []).length),
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (l) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Materiales"
            onClick={() => setSelected((s) => (s?.id === l.id ? null : l))}>
            <Layers size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar"
            onClick={() => { setEditing(l); setFormOpen(true); }}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
            onClick={() => {
              if (window.confirm('¿Eliminar este lote de producción y su consumo asociado?')) remove.mutate(l.id);
            }}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <CardTitle>Lotes de producción</CardTitle>
            <CardDescription>Mezcla y envasado final: descuenta del stock seco y genera unidades listas.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={5} columns={6} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Producción</CardTitle>
            <CardDescription>Lotes de producción: qué fórmula, cuánta mezcla, cuántos sachets y qué stock seco se consumió.</CardDescription>
          </div>
          <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={16} className="mr-1.5" /> Nuevo lote de producción
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<LoteProduccionRow>
            columns={columns}
            rows={items}
            getId={(l) => l.id}
            sortable
            exportable
            columnsControl
            storageKey="infusiones-lotes-produccion"
            fullscreen
            fullscreenLabel="Producción — Infusiones"
            exportFilename="infusiones-lotes-produccion"
            emptyState="Aún no hay lotes de producción registrados."
          />
        </CardContent>
        <LoteProduccionFormDialog
          open={formOpen}
          onOpenChange={(v) => {
            setFormOpen(v);
            if (!v) setEditing(null);
          }}
          initial={editing}
        />
      </Card>
      {selected && <MaterialesEditor lote={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
