'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  AlertTriangle,
  Pencil,
  Trash2,
  PlusSquare,
  SlidersHorizontal,
  History,
  X,
  Warehouse,
} from 'lucide-react';
import {
  Button,
  toast,
  ViewLoading,
  EmptyState,
  formatMoney,
  ImmersiveModal,
  MoneyInput,
  parseNumberCLP,
} from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  UNIDADES_INVENTARIO,
  itemEnAlerta,
  type InventarioItem,
  type InventarioItemClase,
  type InventarioMovimiento,
} from '@/lib/inventario-types';
import { DerivarStockModal, type DerivarStockTarget } from '@/components/logistica/DerivarStockModal';
import type { StockCenter } from '@/components/logistica/types';
import { cn } from '@/lib/cn';


type Props = {
  clase: InventarioItemClase;
  label: string;
  description: string;
  /** Oculta el botón local: el hub usa «Nuevo inventario» centralizado */
  hideCreate?: boolean;
  onRequestCreate?: () => void;
};

/**
 * Panel genérico de inventario operativo (insumos, etiquetas, envases, apícola, destilación).
 * Productos de venta viven en InventarioProductos / productos.stock.
 */
export function InventarioItemsPanel({
  clase,
  label,
  description,
  hideCreate,
  onRequestCreate,
}: Props) {
  const apiFetch = useApiFetch();
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingMigration, setPendingMigration] = useState(false);
  const [search, setSearch] = useState('');
  const [soloAlertas, setSoloAlertas] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventarioItem | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    unidad: 'unidad',
    stock: 0,
    stock_minimo: 0,
    costo_unitario: 0,
    proveedor_nota: '',
    notas: '',
    sku_code: '',
  });
  const [saving, setSaving] = useState(false);

  const [movItem, setMovItem] = useState<InventarioItem | null>(null);
  const [movTipo, setMovTipo] = useState<'entrada' | 'salida' | 'ajuste' | 'merma'>('entrada');
  const [movCantidad, setMovCantidad] = useState(1);
  const [movMotivo, setMovMotivo] = useState('');
  const [movDocTipo, setMovDocTipo] = useState('');
  const [movDocNumero, setMovDocNumero] = useState('');
  const [movDocFecha, setMovDocFecha] = useState('');
  const [movBusy, setMovBusy] = useState(false);

  const [histItem, setHistItem] = useState<InventarioItem | null>(null);
  const [historial, setHistorial] = useState<InventarioMovimiento[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  const [stockCenters, setStockCenters] = useState<StockCenter[]>([]);
  const [derivarTarget, setDerivarTarget] = useState<DerivarStockTarget | null>(null);

  const loadStockCenters = useCallback(async () => {
    try {
      const res = await apiFetch('/api/logistica/dashboard');
      if (res.ok) {
        const json = await res.json();
        setStockCenters(json.data?.stockCenters ?? []);
      }
    } catch {
      // ignore
    }
  }, [apiFetch]);

  useEffect(() => {
    void loadStockCenters();
  }, [loadStockCenters]);

  const load = useCallback(async () => {

    setLoading(true);
    try {
      const res = await apiFetch(`/api/inventario/items?clase=${clase}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error cargando inventario');
      setItems((json.data ?? []) as InventarioItem[]);
      setPendingMigration(Boolean(json.meta?.pending_migration));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error de inventario', { type: 'error' });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, clase]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (soloAlertas && !itemEnAlerta(it)) return false;
      if (!q) return true;
      return (
        it.nombre.toLowerCase().includes(q) ||
        (it.sku_code || '').toLowerCase().includes(q) ||
        (it.proveedor_nota || '').toLowerCase().includes(q)
      );
    });
  }, [items, search, soloAlertas]);

  const alertCount = items.filter(itemEnAlerta).length;

  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: '',
      unidad: 'unidad',
      stock: 0,
      stock_minimo: 0,
      costo_unitario: 0,
      proveedor_nota: '',
      notas: '',
      sku_code: '',
    });
    setFormOpen(true);
  };

  const openEdit = (it: InventarioItem) => {
    setEditing(it);
    setForm({
      nombre: it.nombre,
      unidad: it.unidad,
      stock: Number(it.stock),
      stock_minimo: Number(it.stock_minimo),
      costo_unitario: Number(it.costo_unitario),
      proveedor_nota: it.proveedor_nota ?? '',
      notas: it.notas ?? '',
      sku_code: it.sku_code ?? '',
    });
    setFormOpen(true);
  };

  const saveItem = async () => {
    if (!form.nombre.trim()) {
      toast('Nombre obligatorio', { type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const body = {
        clase,
        nombre: form.nombre.trim(),
        unidad: form.unidad,
        stock: form.stock,
        stock_minimo: form.stock_minimo,
        costo_unitario: form.costo_unitario,
        proveedor_nota: form.proveedor_nota.trim() || null,
        notas: form.notas.trim() || null,
        sku_code: form.sku_code.trim() || null,
      };
      const res = await apiFetch(
        editing ? `/api/inventario/items/${editing.id}` : '/api/inventario/items',
        {
          method: editing ? 'PATCH' : 'POST',
          body: JSON.stringify(
            editing
              ? {
                  nombre: body.nombre,
                  unidad: body.unidad,
                  stock_minimo: body.stock_minimo,
                  costo_unitario: body.costo_unitario,
                  proveedor_nota: body.proveedor_nota,
                  notas: body.notas,
                  sku_code: body.sku_code,
                }
              : body,
          ),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'No se pudo guardar');
      toast(editing ? 'Ítem actualizado' : 'Ítem creado', { type: 'success' });
      setFormOpen(false);
      void load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al guardar', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (it: InventarioItem) => {
    if (!confirm(`¿Desactivar “${it.nombre}” del inventario?`)) return;
    const res = await apiFetch(`/api/inventario/items/${it.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast(json.message || 'No se pudo eliminar', { type: 'error' });
      return;
    }
    toast('Ítem desactivado', { type: 'success' });
    void load();
  };

  const applyMov = async () => {
    if (!movItem || movCantidad <= 0) return;
    setMovBusy(true);
    try {
      const res = await apiFetch(`/api/inventario/items/${movItem.id}/movimiento`, {
        method: 'POST',
        body: JSON.stringify({
          tipo: movTipo,
          cantidad: movCantidad,
          motivo: movMotivo.trim() || null,
          doc_tipo: movDocTipo || null,
          doc_numero: movDocNumero.trim() || null,
          doc_fecha: movDocFecha || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Movimiento fallido');
      toast('Movimiento registrado', { type: 'success' });
      setMovItem(null);
      setMovDocTipo('');
      setMovDocNumero('');
      setMovDocFecha('');
      void load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', { type: 'error' });
    } finally {
      setMovBusy(false);
    }
  };

  const openHistorial = async (it: InventarioItem) => {
    setHistItem(it);
    setHistLoading(true);
    try {
      const res = await apiFetch(`/api/inventario/items/${it.id}/movimientos`);
      const json = await res.json();
      setHistorial((json.data ?? []) as InventarioMovimiento[]);
    } catch {
      setHistorial([]);
    } finally {
      setHistLoading(false);
    }
  };

  if (loading) {
    return <ViewLoading variant="view" label={label} hideLabel />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
        <div className="flex items-baseline gap-2 flex-wrap min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{label}</h2>
          <span className="text-xs text-muted-foreground truncate">· {description}</span>
        </div>
        {!hideCreate ? (
          <Button className="min-h-9 px-3 text-xs shrink-0" onClick={openCreate}>
            <Plus size={14} className="mr-1" /> Nuevo
          </Button>
        ) : null}
      </div>

      {pendingMigration && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
          El módulo de inventario de insumos y etiquetas no está disponible temporalmente. Si el problema persiste, contacta al administrador.
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            className="input-field w-full pl-9 pr-9 min-h-10 text-sm bg-card"
            placeholder={`Buscar en ${label.toLowerCase()}… (${items.length} ${items.length === 1 ? 'ítem' : 'ítems'})`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-8 min-w-8 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
              onClick={() => setSearch('')}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {soloAlertas && (
          <button
            type="button"
            onClick={() => setSoloAlertas(false)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3 min-h-10 text-xs font-semibold text-destructive shrink-0"
          >
            <span>Filtro de alertas activo ({alertCount})</span>
            <X size={13} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? `Sin ${label.toLowerCase()}` : 'Sin resultados'}
          description={
            items.length === 0
              ? `Registra el primer ítem de ${label.toLowerCase()} para controlar stock y alertas.`
              : 'Prueba otro filtro o búsqueda.'
          }
          action={
            items.length === 0 ? (
              <Button onClick={onRequestCreate ?? openCreate}>
                <Plus size={16} className="mr-1" /> Crear
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3 list-none p-0 m-0">
          {filtered.map((it) => {
            const alerta = itemEnAlerta(it);
            return (
              <li
                key={it.id}
                className={cn(
                  'rounded-xl border bg-card p-4 space-y-3',
                  alerta ? 'border-destructive/35' : 'border-border/60',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                      {it.nombre}
                      {alerta && (
                        <span className="text-[0.65rem] uppercase tracking-wide text-destructive font-semibold inline-flex items-center gap-1">
                          <AlertTriangle size={12} /> Bajo mínimo
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {[it.sku_code, it.unidad, it.proveedor_nota].filter(Boolean).join(' · ') ||
                        'Sin código'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={cn(
                        'text-lg font-semibold tabular-nums',
                        alerta && 'text-destructive',
                      )}
                    >
                      {Number(it.stock).toLocaleString('es-CL')}{' '}
                      <span className="text-xs font-normal text-muted-foreground">{it.unidad}</span>
                    </div>
                    <div className="text-[0.65rem] text-muted-foreground">
                      mín. {Number(it.stock_minimo).toLocaleString('es-CL')} ·{' '}
                      {formatMoney(Number(it.costo_unitario))} c/u
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11 text-xs"
                    onClick={() => {
                      setMovItem(it);
                      setMovTipo('entrada');
                      setMovCantidad(1);
                      setMovMotivo('');
                    }}
                  >
                    <PlusSquare size={14} className="mr-1" /> Entrada
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11 text-xs"
                    onClick={() => {
                      setMovItem(it);
                      setMovTipo('ajuste');
                      setMovCantidad(Number(it.stock));
                      setMovMotivo('');
                    }}
                  >
                    <SlidersHorizontal size={14} className="mr-1" /> Ajustar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11 text-xs text-primary border-primary/30 hover:bg-primary/10"
                    onClick={() => {
                      setDerivarTarget({
                        tipo: 'inventario_item',
                        id: it.id,
                        nombre: it.nombre,
                        unidad: it.unidad,
                        stockDisponible: Number(it.stock),
                      });
                    }}
                  >
                    <Warehouse size={14} className="mr-1" /> Derivar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11 text-xs"
                    onClick={() => openEdit(it)}
                  >
                    <Pencil size={14} className="mr-1" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11 text-xs"
                    onClick={() => void openHistorial(it)}
                  >
                    <History size={14} className="mr-1" /> Traza
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11 text-xs text-destructive border-destructive/30 col-span-2 sm:col-span-3 lg:col-span-5"
                    onClick={() => void deleteItem(it)}
                  >
                    <Trash2 size={14} className="mr-1" /> Desactivar
                  </Button>
                </div>

              </li>
            );
          })}
        </ul>
      )}

      {/* Form alta/edición */}
      <ImmersiveModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        eyebrow={label}
        title={editing ? `Editar · ${editing.nombre}` : `Nuevo · ${label}`}
        size="md"
      >
        <div className="space-y-3 p-1">
          <Field label="Nombre *">
            <input
              className="input-field w-full min-h-11"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Unidad">
              <select
                className="input-field w-full min-h-11"
                value={form.unidad}
                onChange={(e) => setForm({ ...form, unidad: e.target.value })}
              >
                {UNIDADES_INVENTARIO.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Código / SKU">
              <input
                className="input-field w-full min-h-11"
                value={form.sku_code}
                onChange={(e) => setForm({ ...form, sku_code: e.target.value })}
              />
            </Field>
          </div>
          {!editing && (
            <Field label="Stock inicial">
              <input
                type="text"
                inputMode="decimal"
                className="input-field w-full min-h-11 tabular-nums"
                defaultValue={form.stock}
                onChange={(e) => setForm({ ...form, stock: parseNumberCLP(e.target.value) })}
              />
            </Field>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Stock mínimo (alerta)">
              <input
                type="text"
                inputMode="decimal"
                className="input-field w-full min-h-11 tabular-nums"
                defaultValue={form.stock_minimo}
                onChange={(e) => setForm({ ...form, stock_minimo: parseNumberCLP(e.target.value) })}
              />
            </Field>
            <Field label="Costo unitario (CLP)">
              <MoneyInput
                className="w-full"
                value={form.costo_unitario}
                onValueChange={(v) => setForm({ ...form, costo_unitario: v })}
              />
            </Field>
          </div>
          <Field label="Proveedor / nota">
            <input
              className="input-field w-full min-h-11"
              value={form.proveedor_nota}
              onChange={(e) => setForm({ ...form, proveedor_nota: e.target.value })}
            />
          </Field>
          <Field label="Notas">
            <textarea
              className="input-field w-full min-h-[5rem]"
              rows={3}
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
          </Field>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button variant="outline" className="min-h-11" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button className="min-h-11" disabled={saving} onClick={() => void saveItem()}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      </ImmersiveModal>

      {/* Movimiento */}
      <ImmersiveModal
        open={Boolean(movItem)}
        onClose={() => setMovItem(null)}
        size="md"
        eyebrow="Inventario"
        title={movItem ? `Movimiento · ${movItem.nombre}` : 'Movimiento'}
        footer={
          <>
            <Button variant="outline" className="min-h-11" onClick={() => setMovItem(null)}>
              Cancelar
            </Button>
            <Button className="min-h-11" disabled={movBusy} onClick={() => void applyMov()}>
              {movBusy ? '…' : 'Registrar'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <select
            className="input-field w-full min-h-11"
            value={movTipo}
            onChange={(e) => setMovTipo(e.target.value as typeof movTipo)}
          >
            <option value="entrada">Entrada (sumar)</option>
            <option value="salida">Salida (consumir)</option>
            <option value="merma">Merma / pérdida</option>
            <option value="ajuste">Ajuste (stock final)</option>
          </select>
          <input
            type="text"
            inputMode="decimal"
            className="input-field w-full min-h-11 tabular-nums text-lg"
            defaultValue={movCantidad}
            onChange={(e) => setMovCantidad(parseNumberCLP(e.target.value))}
          />
          <input
            className="input-field w-full min-h-11"
            placeholder="Motivo (opcional, traza)"
            value={movMotivo}
            onChange={(e) => setMovMotivo(e.target.value)}
          />
          <div className="rounded-lg border border-border/50 bg-muted/15 p-3 space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground tracking-wide">
              Documento (opcional)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                className="input-field min-h-11 text-sm"
                value={movDocTipo}
                onChange={(e) => setMovDocTipo(e.target.value)}
              >
                <option value="">Sin doc.</option>
                <option value="factura">Factura</option>
                <option value="boleta">Boleta</option>
                <option value="guia">Guía</option>
                <option value="orden_compra">Orden compra</option>
                <option value="comprobante">Comprobante</option>
                <option value="otro">Otro</option>
              </select>
              <input
                className="input-field min-h-11 text-sm"
                placeholder="Nº"
                value={movDocNumero}
                onChange={(e) => setMovDocNumero(e.target.value)}
              />
              <input
                type="date"
                className="input-field min-h-11 text-sm"
                value={movDocFecha}
                onChange={(e) => setMovDocFecha(e.target.value)}
              />
            </div>
          </div>
        </div>
      </ImmersiveModal>

      {/* Historial / traza */}
      <ImmersiveModal
        open={Boolean(histItem)}
        onClose={() => setHistItem(null)}
        eyebrow="Trazabilidad"
        title={histItem ? `Movimientos · ${histItem.nombre}` : 'Historial'}
        size="md"
      >
        {histLoading ? (
          <ViewLoading variant="view" label="Historial" hideLabel />
        ) : historial.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Sin movimientos aún.</p>
        ) : (
          <ul className="space-y-2 list-none p-0 m-0 max-h-[60vh] overflow-y-auto">
            {historial.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-border/50 px-3 py-2 text-sm"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium capitalize">{m.tipo}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {new Date(m.created_at).toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {Number(m.stock_antes).toLocaleString('es-CL')} →{' '}
                  {Number(m.stock_despues).toLocaleString('es-CL')}
                  {m.motivo ? ` · ${m.motivo}` : ''}
                  {(m as InventarioMovimiento & { doc_numero?: string }).doc_numero
                    ? ` · doc ${(m as InventarioMovimiento & { doc_numero?: string }).doc_numero}`
                    : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ImmersiveModal>

      <DerivarStockModal
        open={Boolean(derivarTarget)}
        onClose={() => setDerivarTarget(null)}
        target={derivarTarget}
        stockCenters={stockCenters}
        onSuccess={() => void load()}
      />
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
