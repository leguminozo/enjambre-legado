'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Camera, X } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';
import { processImage } from '@/lib/process-image';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Button,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea,
  Select, Badge, SkeletonTable, toast, type ColumnDef,
} from '@enjambre/ui';
import { useInfusionResource } from './use-infusiones';
import { FormFieldLabel } from './shared';
import {
  tareaFormSchema, TAREA_TIPO_OPTIONS, TAREA_ESTADO_OPTIONS, TAREA_PRIORIDAD_OPTIONS,
  TAREA_TIPO_LABEL, TAREA_ESTADO_LABEL, TAREA_PRIORIDAD_LABEL, EQUIPO_ROL_LABEL,
  fmtFecha,
  type TareaRow, type TareaFormValues, type TareaTipo, type TareaEstado, type TareaPrioridad,
  type EquipoRow, type LoteEntradaRow, type LoteDeshidratadoRow, type LoteProduccionRow,
} from '@/lib/infusiones-types';

const BUCKET = 'infusiones-evidencias';

const ESTADO_VARIANTE: Record<TareaEstado, 'default' | 'warning' | 'success'> = {
  pendiente: 'default',
  en_proceso: 'warning',
  completada: 'success',
}

const PRIORIDAD_VARIANTE: Record<TareaPrioridad, 'default' | 'warning' | 'danger'> = {
  baja: 'default',
  media: 'default',
  alta: 'warning',
  urgente: 'danger',
}

const PASOS_DE_PRODUCCION: TareaTipo[] = ['molienda', 'mezcla', 'dosificado', 'envasado']

const DEFAULT_VALUES: TareaFormValues = {
  tipo: 'recoleccion',
  lote_entrada_id: null,
  lote_deshidratado_id: null,
  lote_produccion_id: null,
  equipo_id: null,
  estado: 'pendiente',
  fecha_vencimiento: undefined,
  prioridad: 'media',
  evidencia_path: undefined,
  notas: undefined,
}

function refLabel(t: TareaRow): string {
  if (t.lote_entrada) return t.lote_entrada.codigo_lote
  if (t.lote_deshidratado?.lote_entrada) return `${t.lote_deshidratado.lote_entrada.codigo_lote} (seco)`
  if (t.lote_produccion?.infusion_formulas) return t.lote_produccion.infusion_formulas.nombre
  return 'Sin lote de referencia'
}

function TareaFormDialog({
  open, onOpenChange, initial,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: TareaRow | null
}) {
  const { save } = useInfusionResource<TareaRow>('tareas');
  const { items: equipo } = useInfusionResource<EquipoRow>('equipo');
  const { items: entradas } = useInfusionResource<LoteEntradaRow>('lotes-entrada');
  const { items: deshidratados } = useInfusionResource<LoteDeshidratadoRow>('lotes-deshidratado');
  const { items: producciones } = useInfusionResource<LoteProduccionRow>('lotes-produccion');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<TareaFormValues>({
      resolver: zodResolver(tareaFormSchema) as never,
      defaultValues: DEFAULT_VALUES,
    });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            tipo: initial.tipo,
            lote_entrada_id: initial.lote_entrada_id,
            lote_deshidratado_id: initial.lote_deshidratado_id,
            lote_produccion_id: initial.lote_produccion_id,
            equipo_id: initial.equipo_id,
            estado: initial.estado,
            fecha_vencimiento: initial.fecha_vencimiento ?? undefined,
            prioridad: initial.prioridad,
            evidencia_path: initial.evidencia_path ?? undefined,
            notas: initial.notas ?? undefined,
          }
        : DEFAULT_VALUES,
    );
  }, [open, initial, reset]);

  const tipo = watch('tipo');
  const esDosificado = tipo === 'dosificado';

  const equipoOptions = useMemo(
    () => (equipo ?? [])
      .filter((e) => (esDosificado ? e.rol_operacion === 'dosificador' : true))
      .map((e) => ({ value: e.id, label: `${e.nombre} (${EQUIPO_ROL_LABEL[e.rol_operacion] ?? e.rol_operacion})` })),
    [equipo, esDosificado],
  );

  const entradaOptions = useMemo(
    () => (entradas ?? []).map((l) => ({ value: l.id, label: `${l.codigo_lote} — ${l.materia_prima?.nombre ?? ''}` })),
    [entradas],
  )
  const deshidratadoOptions = useMemo(
    () => (deshidratados ?? []).map((d) => ({ value: d.id, label: `${d.lote_entrada?.codigo_lote ?? ''} (seco)` })),
    [deshidratados],
  )
  const produccionOptions = useMemo(
    () => (producciones ?? []).map((p) => ({ value: p.id, label: `${p.formula?.nombre ?? ''} — ${fmtFecha(p.fecha)}` })),
    [producciones],
  )

  const hayDosificadores = (equipo ?? []).some((e) => e.rol_operacion === 'dosificador')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => {
          const body = {
            ...v,
            lote_entrada_id: v.tipo === 'recoleccion' ? v.lote_entrada_id : null,
            lote_deshidratado_id: v.tipo === 'deshidratado' ? v.lote_deshidratado_id : null,
            lote_produccion_id: PASOS_DE_PRODUCCION.includes(v.tipo) ? v.lote_produccion_id : null,
          };
          save.mutate(
            { id: initial?.id, body },
            {
              onSuccess: () => {
                onOpenChange(false);
              },
            },
          );
        })} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormFieldLabel>Paso *</FormFieldLabel>
              <Select
                value={tipo}
                onValueChange={(v) => setValue('tipo', v as TareaTipo)}
                options={TAREA_TIPO_OPTIONS}
              />
            </div>
            <div className="space-y-2">
              <FormFieldLabel>Prioridad *</FormFieldLabel>
              <Select
                value={watch('prioridad')}
                onValueChange={(v) => setValue('prioridad', v as TareaPrioridad)}
                options={TAREA_PRIORIDAD_OPTIONS}
              />
            </div>
          </div>

          {tipo === 'recoleccion' && (
            <div className="space-y-2">
              <FormFieldLabel>Lote de entrada (opcional)</FormFieldLabel>
              <Select
                value={watch('lote_entrada_id') ?? ''}
                onValueChange={(v) => setValue('lote_entrada_id', v || null)}
                options={entradaOptions}
                placeholder="Sin referencia…"
                searchable
              />
            </div>
          )}
          {tipo === 'deshidratado' && (
            <div className="space-y-2">
              <FormFieldLabel>Lote deshidratado (opcional)</FormFieldLabel>
              <Select
                value={watch('lote_deshidratado_id') ?? ''}
                onValueChange={(v) => setValue('lote_deshidratado_id', v || null)}
                options={deshidratadoOptions}
                placeholder="Sin referencia…"
                searchable
              />
            </div>
          )}
          {PASOS_DE_PRODUCCION.includes(tipo) && (
            <div className="space-y-2">
              <FormFieldLabel>Lote de producción (opcional)</FormFieldLabel>
              <Select
                value={watch('lote_produccion_id') ?? ''}
                onValueChange={(v) => setValue('lote_produccion_id', v || null)}
                options={produccionOptions}
                placeholder="Sin referencia…"
                searchable
              />
            </div>
          )}

          <div className="space-y-2">
            <FormFieldLabel>Asignar a</FormFieldLabel>
            <Select
              value={watch('equipo_id') ?? ''}
              onValueChange={(v) => setValue('equipo_id', v || null)}
              options={equipoOptions}
              placeholder={esDosificado ? 'Solo miembros con rol dosificador…' : 'Seleccionar miembro…'}
              searchable
            />
            {esDosificado && !hayDosificadores && (
              <p className="text-xs text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">
                No hay miembros con rol dosificador — agrégalos en la pestaña «Equipo».
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Vence" type="date" {...register('fecha_vencimiento')} />
            <div className="space-y-2">
              <FormFieldLabel>Estado</FormFieldLabel>
              <Select
                value={watch('estado')}
                onValueChange={(v) => setValue('estado', v as TareaEstado)}
                options={TAREA_ESTADO_OPTIONS}
              />
            </div>
          </div>

          <Textarea label="Notas" placeholder="Qué exactamente hay que hacer, dónde, con qué…" rows={2} {...register('notas')} />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TareasPanel() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const { items, isLoading, save, remove } = useInfusionResource<TareaRow>('tareas');
  const { items: equipo } = useInfusionResource<EquipoRow>('equipo');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TareaRow | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'todas' | TareaEstado>('todas');
  const [filtroEquipo, setFiltroEquipo] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TareaTipo>('todos');

  // Evidencia
  const fileRef = useRef<HTMLInputElement>(null);
  const [evidenciaTarget, setEvidenciaTarget] = useState<TareaRow | null>(null);
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(
    () => items.filter((t) =>
      (filtroEstado === 'todas' || t.estado === filtroEstado)
      && (filtroEquipo === 'todos' || t.equipo_id === filtroEquipo)
      && (filtroTipo === 'todos' || t.tipo === filtroTipo)),
    [items, filtroEstado, filtroEquipo, filtroTipo],
  )

  const nPendientes = items.filter((t) => t.estado === 'pendiente').length
  const nEnProceso = items.filter((t) => t.estado === 'en_proceso').length
  const nCompletadas = items.filter((t) => t.estado === 'completada').length

  async function subirEvidencia(tarea: TareaRow, file: File) {
    setUploading(true)
    try {
      const processed = await processImage(file, { maxSize: 1200, quality: 0.8 })
      const path = `tareas/${crypto.randomUUID()}.webp`
      const { error } = await supabase.storage.from(BUCKET).upload(path, processed, {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: '31536000',
      })
      if (error) throw error
      const res = await apiFetch(`/api/infusiones/tareas/${tarea.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ evidencia_path: path }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message ?? 'Error al guardar la evidencia')
      }
      toast('Evidencia registrada', { type: 'success' })
      queryClient.invalidateQueries({ queryKey: ['infusiones'] })
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al subir la foto', { type: 'error' })
    } finally {
      setUploading(false)
      setEvidenciaTarget(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function quitarEvidencia(tarea: TareaRow) {
    if (!tarea.evidencia_path) return
    if (!window.confirm('¿Quitar la foto de evidencia?')) return
    try {
      await supabase.storage.from(BUCKET).remove([tarea.evidencia_path])
      const res = await apiFetch(`/api/infusiones/tareas/${tarea.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ evidencia_path: null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message ?? 'Error al quitar la evidencia')
      }
      toast('Evidencia quitada', { type: 'success' })
      queryClient.invalidateQueries({ queryKey: ['infusiones'] })
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al quitar la foto', { type: 'error' })
    }
  }

  const hoy = new Date().toISOString().slice(0, 10)

  const columns: ColumnDef<TareaRow>[] = [
    {
      key: 'tarea',
      header: 'Tarea',
      sortable: true,
      render: (t) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Badge variant={t.tipo === 'dosificado' ? 'warning' : 'default'}>{TAREA_TIPO_LABEL[t.tipo] ?? t.tipo}</Badge>
            {t.tipo === 'dosificado' && <span className="text-xs text-muted-foreground hidden sm:inline">dosificadora</span>}
          </div>
          <span className="text-xs text-muted-foreground">{refLabel(t)}</span>
        </div>
      ),
      csvValue: (t) => `${TAREA_TIPO_LABEL[t.tipo] ?? t.tipo} ${refLabel(t)}`,
    },
    {
      key: 'asignado',
      header: 'Asignado',
      sortable: true,
      render: (t) => (
        t.equipo
          ? (
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{t.equipo.nombre}</span>
              <span className="text-xs text-muted-foreground">{EQUIPO_ROL_LABEL[t.equipo.rol_operacion] ?? t.equipo.rol_operacion}</span>
            </div>
          )
          : <span className="text-xs text-muted-foreground">Sin asignar</span>
      ),
      csvValue: (t) => t.equipo?.nombre ?? '',
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      render: (t) => (
        <div className="flex flex-col gap-1 w-32">
          <Select
            value={t.estado}
            onValueChange={(v) => save.mutate({ id: t.id, body: { estado: v as TareaEstado } })}
            options={TAREA_ESTADO_OPTIONS}
          />
          {t.estado === 'completada' && t.completada_por && (
            <span className="text-[11px] text-muted-foreground">por {t.completada_por}</span>
          )}
        </div>
      ),
      csvValue: (t) => t.estado,
    },
    {
      key: 'vence',
      header: 'Vence',
      sortable: true,
      hideBelow: 560,
      render: (t) => (
        <span className={t.fecha_vencimiento && t.fecha_vencimiento < hoy && t.estado !== 'completada' ? 'text-destructive font-medium' : ''}>
          {fmtFecha(t.fecha_vencimiento)}
        </span>
      ),
      csvValue: (t) => t.fecha_vencimiento ?? '',
    },
    {
      key: 'prioridad',
      header: 'Prioridad',
      sortable: true,
      hideBelow: 420,
      render: (t) => <Badge variant={PRIORIDAD_VARIANTE[t.prioridad]}>{TAREA_PRIORIDAD_LABEL[t.prioridad] ?? t.prioridad}</Badge>,
      csvValue: (t) => t.prioridad,
    },
    {
      key: 'evidencia',
      header: 'Evidencia',
      hideBelow: 700,
      render: (t) => (
        t.evidencia_url
          ? (
            <div className="flex items-center gap-2">
              <img
                src={t.evidencia_url}
                alt="Evidencia del pesaje"
                className="h-10 w-10 rounded-lg object-cover border border-border cursor-pointer"
                title="Abrir evidencia"
                onClick={() => window.open(t.evidencia_url!, '_blank', 'noreferrer')}
              />
              <Button variant="ghost" size="sm" className="text-destructive" aria-label="Quitar evidencia"
                onClick={() => quitarEvidencia(t)}>
                <X size={14} />
              </Button>
            </div>
          )
          : (
            <Button variant="outline" size="sm" disabled={uploading}
              onClick={() => { setEvidenciaTarget(t); fileRef.current?.click(); }}>
              <Camera size={14} className="mr-1.5" /> Subir foto
            </Button>
          )
      ),
      csvValue: (t) => t.evidencia_path ?? '',
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="min-w-11" aria-label="Editar"
            onClick={() => { setEditing(t); setFormOpen(true); }}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-11 text-destructive" aria-label="Eliminar"
            onClick={() => {
              if (window.confirm('¿Eliminar esta tarea y su evidencia?')) remove.mutate(t.id);
            }}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ]

  const equipoFilterOptions = useMemo(
    () => [
      { value: 'todos', label: 'Todos' },
      ...(equipo ?? []).map((e) => ({ value: e.id, label: e.nombre })),
    ],
    [equipo],
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <CardTitle>Tareas</CardTitle>
            <CardDescription>Pasos asignados al equipo con foto de evidencia — validás remoto sin estar presente.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={5} columns={6} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Tareas</CardTitle>
            <CardDescription>Pasos asignados al equipo con foto de evidencia — validás remoto sin estar presente.</CardDescription>
          </div>
          <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={16} className="mr-1.5" /> Nueva tarea
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border/60">
            <Badge variant="default">Pendientes: {nPendientes}</Badge>
            <Badge variant="warning">En proceso: {nEnProceso}</Badge>
            <Badge variant="success">Completadas: {nCompletadas}</Badge>
            <div className="flex-1" />
            <div className="flex flex-wrap gap-2">
              <div className="w-36">
                <Select
                  value={filtroEstado}
                  onValueChange={(v) => setFiltroEstado(v as 'todas' | TareaEstado)}
                  options={[{ value: 'todas', label: 'Todos los estados' }, ...TAREA_ESTADO_OPTIONS]}
                />
              </div>
              <div className="w-40">
                <Select
                  value={filtroEquipo}
                  onValueChange={setFiltroEquipo}
                  options={equipoFilterOptions}
                />
              </div>
              <div className="w-40">
                <Select
                  value={filtroTipo}
                  onValueChange={(v) => setFiltroTipo(v as 'todos' | TareaTipo)}
                  options={[{ value: 'todos', label: 'Todos los pasos' }, ...TAREA_TIPO_OPTIONS]}
                />
              </div>
            </div>
          </div>
          <DataTable<TareaRow>
            columns={columns}
            rows={filtered}
            getId={(t) => t.id}
            sortable
            exportable
            columnsControl
            storageKey="infusiones-tareas"
            fullscreen
            fullscreenLabel="Tareas — Infusiones"
            exportFilename="infusiones-tareas"
            emptyState="Aún no hay tareas. Asigna el primer paso del equipo."
          />
        </CardContent>
        <TareaFormDialog
          open={formOpen}
          onOpenChange={(v) => {
            setFormOpen(v);
            if (!v) setEditing(null);
          }}
          initial={editing}
        />
      </Card>

      {/* Input oculto para la foto de evidencia */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && evidenciaTarget) subirEvidencia(evidenciaTarget, file)
        }}
      />
    </div>
  );
}
