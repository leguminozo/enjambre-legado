'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Loader2, Pencil, Trash2, Package, Tag, ToggleLeft, ToggleRight, Scale, AlertCircle, Compass, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast, Skeleton, SkeletonKpi, SkeletonTable, ImmersiveModal, cn } from '@enjambre/ui';
import type { ProductFormat, ProductCategory, ProductSensoryFamily } from '@/lib/product-types';
import { extractGramajeFromFormato } from '@/lib/product-types';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  PRESETS_FAMILIAS_SENSORIALES,
  EJES_SENSORIALES_POR_CATEGORIA,
  PARES_SEMANTICOS_POR_CATEGORIA,
  type TipoSensorial,
  type PresetSensorial,
} from '@enjambre/resenas';

type TaxonomyKind = 'formato' | 'categoria' | 'familia_sensorial';

const KIND_CONFIG: Record<TaxonomyKind, { singular: string; artDef: string; artIndef: string }> = {
  formato: { singular: 'formato', artDef: 'el formato', artIndef: 'un formato' },
  categoria: { singular: 'categoría', artDef: 'la categoría', artIndef: 'una categoría' },
  familia_sensorial: { singular: 'familia sensorial', artDef: 'la familia sensorial', artIndef: 'una familia sensorial' },
};

interface EditorState {
  kind: TaxonomyKind;
  /** null = crear nuevo */
  editingId: string | null;
  value: string;
  label: string;
  description?: string;
  sortOrder: number;
  active: boolean;
  pesoNetoG?: number | null;
  ejes?: string[];
  paresSemanticos?: Array<{ par: string; izq: string; der: string }>;
}

interface RowWithUsage {
  id: string;
  value: string;
  label: string;
  description?: string | null;
  sort_order: number;
  active: boolean;
  /** productos que usan este value (columna TEXT libre en productos) */
  productosEnUso: number;
  peso_neto_g?: number | null;
  ejes?: string[] | null;
  pares_semanticos?: Array<{ par: string; izq: string; der: string }> | null;
}

const emptyEditor = (kind: TaxonomyKind): EditorState => ({
  kind,
  editingId: null,
  value: '',
  label: '',
  description: '',
  sortOrder: 0,
  active: true,
  pesoNetoG: null,
  ejes:
    kind === 'familia_sensorial'
      ? [...EJES_SENSORIALES_POR_CATEGORIA.fortificaciones]
      : undefined,
  paresSemanticos:
    kind === 'familia_sensorial'
      ? [...PARES_SEMANTICOS_POR_CATEGORIA.fortificaciones]
      : undefined,
});

const TABLE_BY_KIND: Record<TaxonomyKind, 'product_formats' | 'product_categories' | 'product_sensory_families'> = {
  formato: 'product_formats',
  categoria: 'product_categories',
  familia_sensorial: 'product_sensory_families',
};

export function TaxonomiasPanel() {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();
  const [formats, setFormats] = useState<RowWithUsage[]>([]);
  const [categories, setCategories] = useState<RowWithUsage[]>([]);
  const [sensoryFamilies, setSensoryFamilies] = useState<RowWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const [formatsRes, categoriesRes, sensoryRes] = await Promise.all([
        supabase.from('product_formats').select('*').order('sort_order', { ascending: true }),
        supabase.from('product_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('product_sensory_families').select('*').order('sort_order', { ascending: true }),
      ]);

      if (formatsRes.error) throw formatsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (sensoryRes.error) throw sensoryRes.error;

      const formatRows = (formatsRes.data ?? []) as ProductFormat[];
      const categoryRows = (categoriesRes.data ?? []) as ProductCategory[];
      const sensoryRows = (sensoryRes.data ?? []) as ProductSensoryFamily[];

      // Cuenta de productos por value (head = solo count, sin traer filas)
      const [formatsUsage, categoriesUsage, sensoryUsage] = await Promise.all([
        countUsage('formato', formatRows.map((r) => r.value)),
        countUsage('categoria', categoryRows.map((r) => r.value)),
        countUsage('tipo_sensorial', sensoryRows.map((r) => r.value)),
      ]);

      const attachUsage = <T extends { id: string; value: string; label: string; description?: string | null; sort_order: number; active: boolean }>(
        rows: T[],
        usage: Map<string, number>,
      ): RowWithUsage[] =>
        rows.map((r) => ({ ...r, productosEnUso: usage.get(r.value) ?? 0 }));

      setFormats(attachUsage(formatRows, formatsUsage));
      setCategories(attachUsage(categoryRows, categoriesUsage));
      setSensoryFamilies(attachUsage(sensoryRows, sensoryUsage));
    } catch (err) {
      toast(friendlyError(err, 'Error al cargar taxonomías de producto'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const invalidateTaxonomies = () => {
    void queryClient.invalidateQueries({ queryKey: ['product-taxonomies'] });
  };

  const duplicateRow =
    editor && !editor.editingId && editor.value.trim()
      ? (editor.kind === 'formato'
          ? formats
          : editor.kind === 'categoria'
            ? categories
            : sensoryFamilies
        ).find(
          (r) => r.value.trim().toLowerCase() === editor.value.trim().toLowerCase(),
        )
      : null;

  const save = async () => {
    if (!editor) return;
    if (!editor.value.trim() || !editor.label.trim()) {
      toast('Value y label son obligatorios', { type: 'error' });
      return;
    }
    const trimmedValue = editor.value.trim();
    if (!editor.editingId && duplicateRow) {
      toast(
        `El código «${trimmedValue}» ya existe en el catálogo. Búscalo en la lista para editarlo o reactivarlo.`,
        { type: 'error' }
      );
      return;
    }
    setActionLoading('saving');
    try {
      const table = TABLE_BY_KIND[editor.kind];
      const listLen =
        editor.kind === 'formato'
          ? formats.length
          : editor.kind === 'categoria'
            ? categories.length
            : sensoryFamilies.length;
      const sortOrder = editor.sortOrder || listLen * 10;
      const payload: Record<string, unknown> = {
        value: trimmedValue,
        label: editor.label.trim(),
        sort_order: sortOrder,
        active: editor.active,
      };
      if (editor.kind === 'formato') {
        payload.peso_neto_g = editor.pesoNetoG ?? null;
      }
      if (editor.kind === 'familia_sensorial') {
        payload.description = editor.description?.trim() ?? '';
        payload.ejes = editor.ejes && editor.ejes.length > 0 ? editor.ejes : [...EJES_SENSORIALES_POR_CATEGORIA.miel];
        payload.pares_semanticos = editor.paresSemanticos && editor.paresSemanticos.length > 0 ? editor.paresSemanticos : [...PARES_SEMANTICOS_POR_CATEGORIA.miel];
      }

      const kindName = KIND_CONFIG[editor.kind].singular;
      if (editor.editingId) {
        // value inmutable en edición: es el identificador grabado en productos
        const updatePayload: Record<string, unknown> = {
          label: payload.label,
          sort_order: payload.sort_order,
          active: payload.active,
        };
        if (editor.kind === 'formato') {
          updatePayload.peso_neto_g = editor.pesoNetoG ?? null;
        }
        if (editor.kind === 'familia_sensorial') {
          updatePayload.description = editor.description?.trim() ?? '';
          updatePayload.ejes = payload.ejes;
          updatePayload.pares_semanticos = payload.pares_semanticos;
        }
        const { error } = await supabase.from(table).update(updatePayload).eq('id', editor.editingId);
        if (error) throw error;
        toast(`${kindName.charAt(0).toUpperCase() + kindName.slice(1)} actualizado`, { type: 'success' });
      } else {
        const { error } = await supabase.from(table).insert(payload);
        if (error) throw error;
        toast(`${kindName.charAt(0).toUpperCase() + kindName.slice(1)} creado`, { type: 'success' });
      }

      setEditor(null);
      invalidateTaxonomies();
      void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);
      await fetchRows();
    } catch (err: unknown) {
      const isConflict =
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: string }).code === '23505';
      if (isConflict) {
        toast(
          `El código «${editor.value.trim()}» ya existe en el catálogo. Usa otro identificador o edita el existente.`,
          { type: 'error' }
        );
      } else {
        toast(friendlyError(err, 'Error al guardar'), { type: 'error' });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const toggleActive = async (kind: TaxonomyKind, rowId: string, active: boolean) => {
    setActionLoading(rowId);
    try {
      const { error } = await supabase.from(TABLE_BY_KIND[kind]).update({ active: !active }).eq('id', rowId);
      if (error) throw error;
      toast(active ? 'Desactivado' : 'Activado', { type: 'success' });
      invalidateTaxonomies();
      void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);
      await fetchRows();
    } catch (err) {
      toast(friendlyError(err, 'Error al actualizar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const remove = async (kind: TaxonomyKind, row: RowWithUsage) => {
    setActionLoading(row.id);
    const kindName = KIND_CONFIG[kind].singular;
    try {
      if (row.productosEnUso > 0) {
        // En uso: soft delete — el historial del catálogo conserva el valor
        const { error } = await supabase.from(TABLE_BY_KIND[kind]).update({ active: false }).eq('id', row.id);
        if (error) throw error;
        toast(`Desactivado: lo usan ${row.productosEnUso} producto(s). El valor se conserva en su historial`, {
          type: 'success',
        });
      } else {
        const { error } = await supabase.from(TABLE_BY_KIND[kind]).delete().eq('id', row.id);
        if (error) throw error;
        toast(`${kindName.charAt(0).toUpperCase() + kindName.slice(1)} eliminado`, { type: 'success' });
      }
      invalidateTaxonomies();
      void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);
      await fetchRows();
    } catch (err) {
      toast(friendlyError(err, 'Error al eliminar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in" aria-busy="true" aria-label="Cargando formatos y categorías">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
        </div>
        <SkeletonTable rows={5} columns={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon"><Package size={18} /></div></div>
          <div className="stat-value">{formats.filter((f) => f.active).length}/{formats.length}</div>
          <div className="stat-label">Formatos activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon"><Tag size={18} /></div></div>
          <div className="stat-value">{categories.filter((c) => c.active).length}/{categories.length}</div>
          <div className="stat-label">Categorías activas</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><div className="stat-icon"><Compass size={18} /></div></div>
          <div className="stat-value">{sensoryFamilies.filter((s) => s.active).length}/{sensoryFamilies.length}</div>
          <div className="stat-label">Familias sensoriales activas</div>
        </div>
      </div>

      <TaxonomySection
        kind="formato"
        title="Formatos"
        subtitle="Empaque comercial y gramaje neto: sincroniza automáticamente el catálogo con la bodega de miel a granel."
        rows={formats}
        actionLoading={actionLoading}
        onCreate={() => setEditor(emptyEditor('formato'))}
        onEdit={(row) =>
          setEditor({
            kind: 'formato',
            editingId: row.id,
            value: row.value,
            label: row.label,
            sortOrder: row.sort_order,
            active: row.active,
            pesoNetoG: row.peso_neto_g ?? extractGramajeFromFormato(row.value),
          })
        }
        onToggle={toggleActive}
        onRemove={remove}
      />

      <TaxonomySection
        kind="categoria"
        title="Categorías"
        subtitle="Clasificación general del producto: miel, polen, propóleo, infusiones..."
        rows={categories}
        actionLoading={actionLoading}
        onCreate={() => setEditor(emptyEditor('categoria'))}
        onEdit={(row) =>
          setEditor({
            kind: 'categoria',
            editingId: row.id,
            value: row.value,
            label: row.label,
            sortOrder: row.sort_order,
            active: row.active,
          })
        }
        onToggle={toggleActive}
        onRemove={remove}
      />

      <TaxonomySection
        kind="familia_sensorial"
        title="Familias Sensoriales (Cata & Reseñas)"
        subtitle="Matriz organoléptica para cata territorial, escuela de venta POS y perfiles PDP (miel pura, fortificada, hidromiel, extractos, cosmética, infusiones...)"
        rows={sensoryFamilies}
        actionLoading={actionLoading}
        onCreate={() => setEditor(emptyEditor('familia_sensorial'))}
        onEdit={(row) => {
          const defaultEjes = EJES_SENSORIALES_POR_CATEGORIA[row.value as TipoSensorial]
            ? [...EJES_SENSORIALES_POR_CATEGORIA[row.value as TipoSensorial]]
            : [...EJES_SENSORIALES_POR_CATEGORIA.miel];
          const defaultPairs = PARES_SEMANTICOS_POR_CATEGORIA[row.value as TipoSensorial]
            ? [...PARES_SEMANTICOS_POR_CATEGORIA[row.value as TipoSensorial]]
            : [...PARES_SEMANTICOS_POR_CATEGORIA.miel];

          setEditor({
            kind: 'familia_sensorial',
            editingId: row.id,
            value: row.value,
            label: row.label,
            description: row.description ?? '',
            sortOrder: row.sort_order,
            active: row.active,
            ejes: Array.isArray(row.ejes) && row.ejes.length > 0 ? (row.ejes as string[]) : defaultEjes,
            paresSemanticos:
              Array.isArray(row.pares_semanticos) && row.pares_semanticos.length > 0
                ? (row.pares_semanticos as Array<{ par: string; izq: string; der: string }>)
                : defaultPairs,
          });
        }}
        onToggle={toggleActive}
        onRemove={remove}
      />

      <ImmersiveModal
        open={editor !== null}
        onClose={() => setEditor(null)}
        eyebrow="Catálogo"
        title={
          editor
            ? editor.editingId
              ? `Editar ${KIND_CONFIG[editor.kind].singular}`
              : `Nueva ${KIND_CONFIG[editor.kind].singular}`
            : ''
        }
        size={editor?.kind === 'familia_sensorial' ? 'lg' : 'md'}
        footer={
          <>
            <button onClick={() => setEditor(null)} className="btn btn-outline text-xs">Cancelar</button>
            <button
              disabled={actionLoading === 'saving' || Boolean(duplicateRow)}
              onClick={save}
              className="btn btn-gold text-xs disabled:opacity-50"
            >
              {actionLoading === 'saving' ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
              {editor?.editingId ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        {editor && (
          <div className="space-y-4">
            <div>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">
                Value (código canónico interno) *
              </label>
              <input
                type="text"
                value={editor.value}
                disabled={!!editor.editingId}
                onChange={(e) => {
                  const val = e.target.value;
                  const deduced = editor.kind === 'formato' ? extractGramajeFromFormato(val) : null;
                  setEditor({
                    ...editor,
                    value: val,
                    pesoNetoG:
                      (editor.pesoNetoG === null || editor.pesoNetoG === undefined) && deduced !== null
                        ? deduced
                        : editor.pesoNetoG,
                  });
                }}
                placeholder={
                  editor.kind === 'formato'
                    ? 'ej: 500g, 1kg'
                    : editor.kind === 'categoria'
                      ? 'ej: miel, polen'
                      : 'ej: infusion, extracto'
                }
                className={cn(
                  'input-field text-sm disabled:opacity-50',
                  duplicateRow && 'border-destructive focus:border-destructive'
                )}
              />
              {duplicateRow ? (
                <div className="mt-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0" />
                    Este código ya existe en el catálogo
                  </div>
                  <p className="text-[0.75rem] leading-snug text-destructive">
                    Ya existe {KIND_CONFIG[editor.kind].artIndef} con el código «<strong>{duplicateRow.value}</strong>» (
                    {duplicateRow.label}) {duplicateRow.active ? 'activo' : 'desactivado'}.
                    Para modificar su nombre comercial o datos, cierra este modal y edita la fila existente en la lista con el botón del lápiz.
                  </p>
                </div>
              ) : (
                <p className="text-[0.7rem] text-muted-foreground mt-1">
                  {editor.editingId
                    ? 'Identificador inmutable grabado en productos y bases de datos.'
                    : 'Identificador técnico único (ej: miel, infusion). Una vez creado es inmutable.'}
                </p>
              )}
            </div>
            <div>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">
                Label (nombre comercial visible en catálogo) *
              </label>
              <input
                type="text"
                value={editor.label}
                onChange={(e) => setEditor({ ...editor, label: e.target.value })}
                placeholder={
                  editor.kind === 'formato'
                    ? 'ej: 500g - Frasco tradicional'
                    : editor.kind === 'categoria'
                      ? 'ej: Miel de Bosque'
                      : 'ej: Infusiones & Botánica'
                }
                className="input-field text-sm"
              />
              <p className="text-[0.7rem] text-muted-foreground mt-1">
                Texto comercial visible para clientes en fichas, perfiles de cata y filtros.
              </p>
            </div>
            {editor.kind === 'familia_sensorial' && (
              <>
                <div>
                  <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">
                    Descripción organoléptica / Subtítulo
                  </label>
                  <input
                    type="text"
                    value={editor.description ?? ''}
                    onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                    placeholder="ej: Infusiones del bosque nativo y hierbas silvestres"
                    className="input-field text-sm"
                  />
                  <p className="text-[0.7rem] text-muted-foreground mt-1">
                    Subtítulo explicativo exhibido en el selector de producto y la Escuela de Venta POS.
                  </p>
                </div>

                {/* Selector de Plantillas Canónicas Rápidas */}
                <div className="p-3.5 bg-foreground/[0.03] rounded-xl border border-border/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles size={13} className="text-primary" />
                      Plantillas canónicas de Constelación Sensorial
                    </span>
                    <span className="text-[10px] text-muted-foreground">Pre-carga 8 ejes y 3 dimensiones</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS_FAMILIAS_SENSORIALES.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setEditor({
                            ...editor,
                            value: editor.editingId ? editor.value : (editor.value || preset.id),
                            label: editor.label || preset.label,
                            description: editor.description || preset.description,
                            ejes: [...preset.ejes],
                            paresSemanticos: preset.pares_semanticos.map((p) => ({ ...p })),
                          });
                          toast.success(`Plantilla «${preset.label}» cargada`);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-surface-raised text-foreground/80 hover:text-foreground transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ejes de la Red Sensorial (Puntos del Radar) */}
                <div className="p-3.5 bg-card rounded-xl border border-border/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        Puntos de la Red Sensorial ({editor.ejes?.length ?? 8} Ejes del Radar)
                      </label>
                      <span className="text-[0.7rem] text-muted-foreground">
                        Cada punto genera las aristas de la red poligonal en la tienda web y cata técnica.
                      </span>
                    </div>
                    {(editor.ejes?.length ?? 0) < 10 && (
                      <button
                        type="button"
                        onClick={() => {
                          const current = editor.ejes || [];
                          setEditor({
                            ...editor,
                            ejes: [...current, `Nuevo Eje ${current.length + 1}`],
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-raised border border-border text-xs font-semibold hover:border-primary/50 text-foreground transition-colors"
                      >
                        <Plus size={12} /> Agregar Punto
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(editor.ejes || []).map((axis, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-lg bg-surface-sunken/40 border border-border/50 text-xs"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground w-4 shrink-0 text-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={axis}
                          onChange={(e) => {
                            const next = [...(editor.ejes || [])];
                            next[idx] = e.target.value;
                            setEditor({ ...editor, ejes: next });
                          }}
                          placeholder={`Eje ${idx + 1}`}
                          className="input-field p-1.5 text-xs flex-1 bg-card"
                        />
                        {(editor.ejes?.length ?? 0) > 3 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = (editor.ejes || []).filter((_, i) => i !== idx);
                              setEditor({ ...editor, ejes: next });
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            title="Eliminar punto de la red"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3 Dimensiones Métricas Primarias (Pares Semánticos) */}
                <div className="p-3.5 bg-card rounded-xl border border-border/80 space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                      3 Dimensiones Métricas Primarias (Deslizadores de Resumen)
                    </label>
                    <span className="text-[0.7rem] text-muted-foreground">
                      Define qué miden los 3 cursores principales en lugar de heredar los valores fijos de la miel.
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {(editor.paresSemanticos || [
                      { par: 'Intensidad', izq: 'Suave & Sutil', der: 'Intenso & Tostado' },
                      { par: 'Molienda / Textura', izq: 'Fina / Sedosa', der: 'Granulada / Rústica' },
                      { par: 'Untuosidad / Grasa', izq: 'Seco & Harinoso', der: 'Untuoso & Oleoso' },
                    ]).map((pair, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-surface-sunken/40 border border-border/50 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-primary font-bold">Dimensión {idx + 1}:</span>
                          <input
                            type="text"
                            value={pair.par}
                            onChange={(e) => {
                              const next = [...(editor.paresSemanticos || [])];
                              if (!next[idx]) next[idx] = { par: '', izq: '', der: '' };
                              next[idx].par = e.target.value;
                              setEditor({ ...editor, paresSemanticos: next });
                            }}
                            placeholder="Nombre (ej. Intensidad, Molienda, Untuosidad)"
                            className="input-field p-1 text-xs flex-1 bg-card font-semibold"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pl-4">
                          <div>
                            <span className="text-[10px] text-muted-foreground block mb-0.5">Extremo Izquierdo (0%)</span>
                            <input
                              type="text"
                              value={pair.izq}
                              onChange={(e) => {
                                const next = [...(editor.paresSemanticos || [])];
                                if (!next[idx]) next[idx] = { par: '', izq: '', der: '' };
                                next[idx].izq = e.target.value;
                                setEditor({ ...editor, paresSemanticos: next });
                              }}
                              placeholder="ej: Sutil & Crudo"
                              className="input-field p-1 text-xs w-full bg-card"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block mb-0.5">Extremo Derecho (100%)</span>
                            <input
                              type="text"
                              value={pair.der}
                              onChange={(e) => {
                                const next = [...(editor.paresSemanticos || [])];
                                if (!next[idx]) next[idx] = { par: '', izq: '', der: '' };
                                next[idx].der = e.target.value;
                                setEditor({ ...editor, paresSemanticos: next });
                              }}
                              placeholder="ej: Intenso & Tostado"
                              className="input-field p-1 text-xs w-full bg-card"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            {editor.kind === 'formato' && (
              <div className="p-3 bg-foreground/[0.03] rounded-lg border border-border/60 space-y-1.5">
                <label className="text-[0.65rem] font-medium uppercase tracking-wider text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Scale size={13} className="text-primary" />
                    Gramaje / Peso Neto Base (g)
                  </span>
                  <span className="text-[0.6rem] text-muted-foreground font-normal lowercase">vínculo a lote granel</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={editor.pesoNetoG ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0);
                    setEditor({ ...editor, pesoNetoG: val });
                  }}
                  placeholder="ej: 500 (o deja vacío para packs/accesorios)"
                  className="input-field text-sm"
                />
                <p className="text-[0.7rem] text-muted-foreground leading-snug">
                  Gramaje neto estándar del formato. Al seleccionarlo en un producto, el sistema descontará automáticamente este peso en kg del lote a granel vinculado al registrar ventas.
                </p>
              </div>
            )}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editor.active}
                  onChange={(e) => setEditor({ ...editor, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Activo</span>
                <span className="text-xs text-muted-foreground">
                  (Disponible para asignar a nuevos productos)
                </span>
              </label>
            </div>
          </div>
        )}
      </ImmersiveModal>
    </div>
  );
}

async function countUsage(column: 'formato' | 'categoria' | 'tipo_sensorial', values: string[]): Promise<Map<string, number>> {
  const usage = new Map<string, number>();
  if (values.length === 0) return usage;
  const { data, error } = await supabase.from('productos').select(column);
  if (error) {
    toast(friendlyError(error, 'Error al contar productos'), { type: 'error' });
    return usage;
  }
  for (const row of data ?? []) {
    const v = (row as Record<string, string | null>)[column];
    if (v) usage.set(v, (usage.get(v) ?? 0) + 1);
  }
  return usage;
}

interface TaxonomySectionProps {
  kind: TaxonomyKind;
  title: string;
  subtitle: string;
  rows: RowWithUsage[];
  actionLoading: string | null;
  onCreate: () => void;
  onEdit: (row: RowWithUsage) => void;
  onToggle: (kind: TaxonomyKind, rowId: string, active: boolean) => void;
  onRemove: (kind: TaxonomyKind, row: RowWithUsage) => void;
}

function TaxonomySection({
  kind,
  title,
  subtitle,
  rows,
  actionLoading,
  onCreate,
  onEdit,
  onToggle,
  onRemove,
}: TaxonomySectionProps) {
  const activeRows = rows.filter((r) => r.active);
  const inactiveRows = rows.filter((r) => !r.active);

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-display text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <button onClick={onCreate} className="btn btn-gold flex items-center gap-2 shrink-0">
          <Plus size={16} /> {kind === 'familia_sensorial' || kind === 'categoria' ? 'Nueva' : 'Nuevo'} {KIND_CONFIG[kind].singular}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-border/50">
          <p className="text-sm text-muted-foreground italic">
            No hay {kind === 'formato' ? 'formatos' : kind === 'categoria' ? 'categorías' : 'familias sensoriales'}. Crea la primera.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeRows.map((row) => (
            <TaxonomyRow
              key={row.id}
              row={row}
              kind={kind}
              actionLoading={actionLoading}
              onEdit={onEdit}
              onToggle={onToggle}
              onRemove={onRemove}
            />
          ))}
          {inactiveRows.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground mb-2">Desactivados</p>
              {inactiveRows.map((row) => (
                <TaxonomyRow
                  key={row.id}
                  row={row}
                  kind={kind}
                  actionLoading={actionLoading}
                  onEdit={onEdit}
                  onToggle={onToggle}
                  onRemove={onRemove}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TaxonomyRowProps {
  row: RowWithUsage;
  kind: TaxonomyKind;
  actionLoading: string | null;
  onEdit: (row: RowWithUsage) => void;
  onToggle: (kind: TaxonomyKind, rowId: string, active: boolean) => void;
  onRemove: (kind: TaxonomyKind, row: RowWithUsage) => void;
}

function TaxonomyRow({ row, kind, actionLoading, onEdit, onToggle, onRemove }: TaxonomyRowProps) {
  const busy = actionLoading === row.id;
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-foreground/[0.02] px-3 py-2.5 ${!row.active ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full shrink-0">
          {row.value}
        </span>
        <span className="text-sm text-foreground truncate">{row.label}</span>
        {kind === 'formato' && (
          <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
            {row.peso_neto_g ? `${row.peso_neto_g} g` : extractGramajeFromFormato(row.value) ? `${extractGramajeFromFormato(row.value)} g (auto)` : 'Sin gramaje'}
          </span>
        )}
        {kind === 'familia_sensorial' && (
          <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
            {Array.isArray(row.ejes) && row.ejes.length > 0 ? `${row.ejes.length} ejes` : '8 ejes'}
          </span>
        )}
        {kind === 'familia_sensorial' && row.description && (
          <span className="text-[0.7rem] text-muted-foreground truncate hidden md:inline">
            ({row.description})
          </span>
        )}
        {row.productosEnUso > 0 && (
          <span className="text-[0.65rem] text-muted-foreground shrink-0 hidden sm:inline">
            {row.productosEnUso} producto{row.productosEnUso === 1 ? '' : 's'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onToggle(kind, row.id, row.active)}
          disabled={busy}
          title={row.active ? 'Desactivar' : 'Activar'}
          className="p-1.5 rounded-md text-muted-foreground hover:text-accent disabled:opacity-40"
        >
          {busy ? <Loader2 className="animate-spin" size={14} /> : row.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
        </button>
        <button
          type="button"
          onClick={() => onEdit(row)}
          disabled={busy}
          title="Editar"
          className="p-1.5 rounded-md text-muted-foreground hover:text-accent disabled:opacity-40"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(kind, row)}
          disabled={busy}
          title={row.productosEnUso > 0 ? `En uso por ${row.productosEnUso} producto(s) — se desactivará` : 'Eliminar'}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive disabled:opacity-40"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
