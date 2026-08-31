'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Loader2, Pencil, Trash2, Package, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast, ViewLoading, ImmersiveModal } from '@enjambre/ui';
import type { ProductFormat, ProductCategory } from '@/lib/product-types';

type TaxonomyKind = 'formato' | 'categoria';

interface EditorState {
  kind: TaxonomyKind;
  /** null = crear nuevo */
  editingId: string | null;
  value: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

interface RowWithUsage {
  id: string;
  value: string;
  label: string;
  sort_order: number;
  active: boolean;
  /** productos que usan este value (columna TEXT libre en productos) */
  productosEnUso: number;
}

const emptyEditor = (kind: TaxonomyKind): EditorState => ({
  kind,
  editingId: null,
  value: '',
  label: '',
  sortOrder: 0,
  active: true,
});

const TABLE_BY_KIND: Record<TaxonomyKind, 'product_formats' | 'product_categories'> = {
  formato: 'product_formats',
  categoria: 'product_categories',
};

export function TaxonomiasPanel() {
  const queryClient = useQueryClient();
  const [formats, setFormats] = useState<RowWithUsage[]>([]);
  const [categories, setCategories] = useState<RowWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const [formatsRes, categoriesRes] = await Promise.all([
        supabase.from('product_formats').select('*').order('sort_order', { ascending: true }),
        supabase.from('product_categories').select('*').order('sort_order', { ascending: true }),
      ]);

      if (formatsRes.error) throw formatsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const formatRows = (formatsRes.data ?? []) as ProductFormat[];
      const categoryRows = (categoriesRes.data ?? []) as ProductCategory[];

      // Cuenta de productos por value (head = solo count, sin traer filas)
      const [formatsUsage, categoriesUsage] = await Promise.all([
        countUsage('formato', formatRows.map((r) => r.value)),
        countUsage('categoria', categoryRows.map((r) => r.value)),
      ]);

      const attachUsage = <T extends { id: string; value: string; label: string; sort_order: number; active: boolean }>(
        rows: T[],
        usage: Map<string, number>,
      ): RowWithUsage[] =>
        rows.map((r) => ({ ...r, productosEnUso: usage.get(r.value) ?? 0 }));

      setFormats(attachUsage(formatRows, formatsUsage));
      setCategories(attachUsage(categoryRows, categoriesUsage));
    } catch (err) {
      toast(friendlyError(err, 'Error al cargar formatos y categorías'), { type: 'error' });
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

  const save = async () => {
    if (!editor) return;
    if (!editor.value.trim() || !editor.label.trim()) {
      toast('Value y label son obligatorios', { type: 'error' });
      return;
    }
    setActionLoading('saving');
    try {
      const table = TABLE_BY_KIND[editor.kind];
      const payload = {
        value: editor.value.trim(),
        label: editor.label.trim(),
        sort_order: editor.sortOrder,
        active: editor.active,
      };

      if (editor.editingId) {
        // value inmutable en edición: es el identificador grabado en productos
        const { error } = await supabase.from(table).update({
          label: payload.label,
          sort_order: payload.sort_order,
          active: payload.active,
        }).eq('id', editor.editingId);
        if (error) throw error;
        toast(`${editor.kind === 'formato' ? 'Formato' : 'Categoría'} actualizado`, { type: 'success' });
      } else {
        const { error } = await supabase.from(table).insert(payload);
        if (error) throw error;
        toast(`${editor.kind === 'formato' ? 'Formato' : 'Categoría'} creado`, { type: 'success' });
      }

      setEditor(null);
      invalidateTaxonomies();
      await fetchRows();
    } catch (err) {
      toast(friendlyError(err, 'Error al guardar'), { type: 'error' });
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
      await fetchRows();
    } catch (err) {
      toast(friendlyError(err, 'Error al actualizar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const remove = async (kind: TaxonomyKind, row: RowWithUsage) => {
    setActionLoading(row.id);
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
        toast(`${kind === 'formato' ? 'Formato' : 'Categoría'} eliminado`, { type: 'success' });
      }
      invalidateTaxonomies();
      await fetchRows();
    } catch (err) {
      toast(friendlyError(err, 'Error al eliminar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <ViewLoading variant="view" label="Formatos y Categorías" hideLabel />;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      <TaxonomySection
        kind="formato"
        title="Formatos"
        subtitle="Cómo se vende el producto: 250g, 1kg, 30x15g, Panal…"
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
          })
        }
        onToggle={toggleActive}
        onRemove={remove}
      />

      <TaxonomySection
        kind="categoria"
        title="Categorías"
        subtitle="Clasificación del producto: miel, polen, propóleo…"
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

      <ImmersiveModal
        open={editor !== null}
        onClose={() => setEditor(null)}
        eyebrow="Catálogo"
        title={
          editor
            ? editor.editingId
              ? `Editar ${editor.kind === 'formato' ? 'formato' : 'categoría'}`
              : `Nuevo ${editor.kind === 'formato' ? 'formato' : 'categoría'}`
            : ''
        }
        size="md"
        footer={
          <>
            <button onClick={() => setEditor(null)} className="btn btn-outline text-xs">Cancelar</button>
            <button disabled={actionLoading === 'saving'} onClick={save} className="btn btn-gold text-xs">
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
                Value (código interno) *
              </label>
              <input
                type="text"
                value={editor.value}
                disabled={!!editor.editingId}
                onChange={(e) => setEditor({ ...editor, value: e.target.value })}
                placeholder="ej: 30x15g"
                className="input-field text-sm disabled:opacity-50"
              />
              {editor.editingId && (
                <p className="text-[0.7rem] text-muted-foreground mt-1">
                  El value queda grabado en los productos que lo usan y no se puede cambiar.
                </p>
              )}
            </div>
            <div>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">
                Label (visible) *
              </label>
              <input
                type="text"
                value={editor.label}
                onChange={(e) => setEditor({ ...editor, label: e.target.value })}
                placeholder="ej: 30x15g - Sachets individual"
                className="input-field text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Orden</label>
                <input
                  type="number"
                  min={0}
                  value={editor.sortOrder}
                  onChange={(e) => setEditor({ ...editor, sortOrder: Number(e.target.value) || 0 })}
                  className="input-field text-sm"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editor.active}
                    onChange={(e) => setEditor({ ...editor, active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Activo</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </ImmersiveModal>
    </div>
  );
}

async function countUsage(column: 'formato' | 'categoria', values: string[]): Promise<Map<string, number>> {
  const usage = new Map<string, number>();
  if (values.length === 0) return usage;
  const { data, error } = await supabase.from('productos').select(column);
  if (error) {
    toast(friendlyError(error, 'Error al contar productos'), { type: 'error' });
    return usage;
  }
  for (const row of data ?? []) {
    const v = row[column];
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
          <Plus size={16} /> Nuevo {kind === 'formato' ? 'formato' : 'categoría'}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-border/50">
          <p className="text-sm text-muted-foreground italic">
            No hay {kind === 'formato' ? 'formatos' : 'categorías'}. Crea el primero.
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
