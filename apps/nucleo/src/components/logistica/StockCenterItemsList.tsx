'use client';

import { useState } from 'react';
import {
  Package,
  Plus,
  ArrowDownToLine,
  Trash2,
  Pencil,
  AlertCircle,
  Tag,
  FlaskConical,
  Box,
  Hexagon,
  Droplets,
  Loader2,
} from 'lucide-react';
import { Button, ImmersiveModal, toast, parseNumberCLP } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { StockCenter, StockCenterItem } from '@/components/logistica/types';
import type { Product } from '@/lib/product-types';
import type { InventarioItem } from '@/lib/inventario-types';

const CLASE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  producto: Package,
  insumo: FlaskConical,
  etiqueta: Tag,
  envase: Box,
  apicola: Hexagon,
  destilacion: Droplets,
};

interface StockCenterItemsListProps {
  center: StockCenter;
  onRefresh: () => Promise<void>;
}

export function StockCenterItemsList({ center, onRefresh }: StockCenterItemsListProps) {
  const apiFetch = useApiFetch();
  const items = center.items ?? [];

  // Modal para agregar ítem local propio
  const [localModalOpen, setLocalModalOpen] = useState(false);
  const [localNombre, setLocalNombre] = useState('');
  const [localSku, setLocalSku] = useState('');
  const [localClase, setLocalClase] = useState<StockCenterItem['clase']>('producto');
  const [localUnidad, setLocalUnidad] = useState('unidad');
  const [localCantidad, setLocalCantidad] = useState(0);
  const [localMinimo, setLocalMinimo] = useState(0);
  const [localNotas, setLocalNotas] = useState('');
  const [localSubmitting, setLocalSubmitting] = useState(false);

  // Modal para reponer desde Pureo
  const [reponerModalOpen, setReponerModalOpen] = useState(false);
  const [pureoTipo, setPureoTipo] = useState<'producto' | 'inventario_item'>('producto');
  const [pureoItems, setPureoItems] = useState<Array<{ id: string; nombre: string; stock: number; unidad: string }>>([]);
  const [pureoLoading, setPureoLoading] = useState(false);
  const [selectedPureoId, setSelectedPureoId] = useState('');
  const [reponerCantidad, setReponerCantidad] = useState(1);
  const [reponerMotivo, setReponerMotivo] = useState('');
  const [reponerSubmitting, setReponerSubmitting] = useState(false);

  // Modal de edición de ítem
  const [editingItem, setEditingItem] = useState<StockCenterItem | null>(null);
  const [editCantidad, setEditCantidad] = useState(0);
  const [editMinimo, setEditMinimo] = useState(0);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPureoAvailable = async (tipo: 'producto' | 'inventario_item') => {
    setPureoLoading(true);
    try {
      if (tipo === 'producto') {
        const { supabase } = await import('@/lib/supabase');
        const { data } = await supabase
          .from('productos')
          .select('id, nombre, stock')
          .eq('visible', true)
          .order('nombre');
        const list = (data ?? []).map((p: { id: string; nombre: string; stock: number | null }) => ({
          id: p.id,
          nombre: p.nombre,
          stock: Number(p.stock ?? 0),
          unidad: 'unidad',
        }));
        setPureoItems(list);
        if (list.length > 0) setSelectedPureoId(list[0].id);
      } else {
        const res = await apiFetch('/api/inventario/items');
        const json = await res.json();
        const list = ((json.data ?? []) as InventarioItem[]).map((it) => ({
          id: it.id,
          nombre: it.nombre,
          stock: Number(it.stock ?? 0),
          unidad: it.unidad,
        }));
        setPureoItems(list);
        if (list.length > 0) setSelectedPureoId(list[0].id);
      }
    } catch {
      setPureoItems([]);
    } finally {
      setPureoLoading(false);
    }
  };

  const openReponer = (tipo: 'producto' | 'inventario_item') => {
    setPureoTipo(tipo);
    setReponerCantidad(1);
    setReponerMotivo('');
    setReponerModalOpen(true);
    void loadPureoAvailable(tipo);
  };

  const handleCrearLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localNombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setLocalSubmitting(true);
    try {
      const res = await apiFetch(`/api/logistica/stock-centers/${center.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: localNombre.trim(),
          sku_code: localSku.trim() || null,
          clase: localClase,
          unidad: localUnidad,
          cantidad: localCantidad,
          stock_minimo: localMinimo,
          notas: localNotas.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al crear ítem local');
      }
      toast.success('Ítem local creado en el centro');
      setLocalModalOpen(false);
      setLocalNombre('');
      setLocalSku('');
      setLocalCantidad(0);
      setLocalMinimo(0);
      setLocalNotas('');
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLocalSubmitting(false);
    }
  };

  const handleDerivarDesdePureo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPureoId) {
      toast.error('Selecciona un ítem de Pureo');
      return;
    }
    const chosen = pureoItems.find((it) => it.id === selectedPureoId);
    if (!chosen) return;
    if (reponerCantidad <= 0 || reponerCantidad > chosen.stock) {
      toast.error(`Cantidad inválida. Disponible en Pureo: ${chosen.stock} ${chosen.unidad}`);
      return;
    }

    setReponerSubmitting(true);
    try {
      const res = await apiFetch(`/api/logistica/stock-centers/${center.id}/derivar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origen_tipo: pureoTipo,
          origen_id: chosen.id,
          cantidad: reponerCantidad,
          motivo: reponerMotivo.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al transferir desde Pureo');
      }
      toast.success(`Se transfirieron ${reponerCantidad} ${chosen.unidad} desde Pureo a ${center.name}`);
      setReponerModalOpen(false);
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al derivar');
    } finally {
      setReponerSubmitting(false);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditSubmitting(true);
    try {
      const res = await apiFetch(`/api/logistica/stock-centers/${center.id}/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cantidad: editCantidad,
          stock_minimo: editMinimo,
        }),
      });
      if (!res.ok) throw new Error('Error al actualizar ítem');
      toast.success('Stock del centro actualizado');
      setEditingItem(null);
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteItem = async (item: StockCenterItem) => {
    if (!confirm(`¿Eliminar “${item.nombre}” de este centro de stock?`)) return;
    setDeletingId(item.id);
    try {
      const res = await apiFetch(`/api/logistica/stock-centers/${center.id}/items/${item.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success(`Ítem eliminado de ${center.name}`);
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const selectedChosen = pureoItems.find((it) => it.id === selectedPureoId);

  return (
    <div className="space-y-3 pt-3 border-t border-border/70">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Package size={14} className="text-primary" />
          <span>Inventario específico de {center.name} ({items.length} ítems)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="min-h-9 text-xs gap-1.5"
            onClick={() => openReponer('producto')}
          >
            <ArrowDownToLine size={13} /> Reponer desde Pureo
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="min-h-9 text-xs gap-1.5"
            onClick={() => setLocalModalOpen(true)}
          >
            <Plus size={13} /> Ítem propio local
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-surface-sunken/40 p-5 text-center">
          <p className="text-xs text-muted-foreground">
            Este centro aún no tiene ítems asignados. Puedes derivar stock desde Pureo o construir inventario local.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {items.map((it) => {
            const Icon = CLASE_ICONS[it.clase] ?? Package;
            const bajoMinimo = it.stock_minimo > 0 && it.cantidad <= it.stock_minimo;
            return (
              <div
                key={it.id}
                className="rounded-xl border border-border/60 bg-card p-3 space-y-2 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate flex items-center gap-1.5">
                      <Icon size={13} className="text-muted-foreground shrink-0" />
                      <span className="truncate">{it.nombre}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <span>{it.sku_code || 'Sin código'}</span>
                      <span>·</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-medium uppercase ${
                          it.origen === 'pureo'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}
                      >
                        {it.origen === 'pureo' ? 'Matriz Pureo' : 'Local'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular-nums text-foreground">
                      {Number(it.cantidad).toLocaleString('es-CL')}{' '}
                      <span className="text-[10px] font-normal text-muted-foreground">{it.unidad}</span>
                    </div>
                    {bajoMinimo && (
                      <span className="text-[9px] text-destructive font-semibold flex items-center gap-0.5 justify-end">
                        <AlertCircle size={10} /> Bajo mín ({it.stock_minimo})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(it);
                      setEditCantidad(Number(it.cantidad));
                      setEditMinimo(Number(it.stock_minimo));
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-sunken transition-colors"
                    title="Ajustar stock en este centro"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteItem(it)}
                    disabled={deletingId === it.id}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Eliminar ítem del centro"
                  >
                    {deletingId === it.id ? (
                      <Loader2 size={12} className="animate-spin text-destructive" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Reponer desde Pureo */}
      <ImmersiveModal
        open={reponerModalOpen}
        onClose={() => setReponerModalOpen(false)}
        size="md"
        eyebrow="Transferencia desde Matriz"
        title={`Reponer stock en ${center.name}`}
      >
        <form onSubmit={handleDerivarDesdePureo} className="space-y-4 py-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPureoTipo('producto');
                void loadPureoAvailable('producto');
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                pureoTipo === 'producto'
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground'
              }`}
            >
              Productos de Venta
            </button>
            <button
              type="button"
              onClick={() => {
                setPureoTipo('inventario_item');
                void loadPureoAvailable('inventario_item');
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                pureoTipo === 'inventario_item'
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground'
              }`}
            >
              Insumos / Envases / Material
            </button>
          </div>

          {pureoLoading ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              <Loader2 size={16} className="animate-spin mx-auto mb-1.5" />
              Cargando disponibilidad en Pureo...
            </div>
          ) : pureoItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground rounded-lg bg-surface-sunken">
              No hay ítems con stock disponible en Pureo.
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Seleccionar ítem disponible en Pureo
                </label>
                <select
                  value={selectedPureoId}
                  onChange={(e) => setSelectedPureoId(e.target.value)}
                  className="input-field w-full min-h-11"
                >
                  {pureoItems.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — {p.stock.toLocaleString('es-CL')} {p.unidad} en Pureo
                    </option>
                  ))}
                </select>
              </div>

              {selectedChosen && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Cantidad a transferir (máx {selectedChosen.stock} {selectedChosen.unidad})
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={reponerCantidad}
                    onChange={(e) => setReponerCantidad(parseNumberCLP(e.target.value, 0))}
                    className="input-field w-full min-h-11 tabular-nums text-lg font-semibold"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Motivo o nota de traslado (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Reposición de stock semanal"
                  value={reponerMotivo}
                  onChange={(e) => setReponerMotivo(e.target.value)}
                  className="input-field w-full min-h-11 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setReponerModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={reponerSubmitting || !selectedChosen || reponerCantidad <= 0}>
                  {reponerSubmitting ? 'Derivando...' : 'Confirmar traslado'}
                </Button>
              </div>
            </>
          )}
        </form>
      </ImmersiveModal>

      {/* Modal: Crear ítem local propio */}
      <ImmersiveModal
        open={localModalOpen}
        onClose={() => setLocalModalOpen(false)}
        size="md"
        eyebrow="Inventario Propio"
        title={`Nuevo ítem local en ${center.name}`}
      >
        <form onSubmit={handleCrearLocal} className="space-y-3.5 py-2">
          <p className="text-xs text-muted-foreground">
            Este ítem se gestionará exclusivamente dentro de {center.name} sin alterar el inventario central de Pureo.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">Nombre del ítem *</label>
            <input
              type="text"
              required
              placeholder="Ej: Bolsa compostable feria, servilletas, frascos degustación..."
              value={localNombre}
              onChange={(e) => setLocalNombre(e.target.value)}
              className="input-field w-full min-h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">Clase</label>
              <select
                value={localClase}
                onChange={(e) => setLocalClase(e.target.value as StockCenterItem['clase'])}
                className="input-field w-full min-h-11"
              >
                <option value="producto">Producto</option>
                <option value="insumo">Insumo</option>
                <option value="envase">Envase</option>
                <option value="etiqueta">Etiqueta</option>
                <option value="apicola">Apícola</option>
                <option value="destilacion">Destilación</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">Unidad</label>
              <select
                value={localUnidad}
                onChange={(e) => setLocalUnidad(e.target.value)}
                className="input-field w-full min-h-11"
              >
                <option value="unidad">Unidad</option>
                <option value="caja">Caja</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="l">L</option>
                <option value="ml">ml</option>
                <option value="rollo">Rollo</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">Cantidad inicial</label>
              <input
                type="text"
                inputMode="decimal"
                value={localCantidad}
                onChange={(e) => setLocalCantidad(parseNumberCLP(e.target.value, 0))}
                className="input-field w-full min-h-11 tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">Stock mínimo (alerta)</label>
              <input
                type="text"
                inputMode="decimal"
                value={localMinimo}
                onChange={(e) => setLocalMinimo(parseNumberCLP(e.target.value, 0))}
                className="input-field w-full min-h-11 tabular-nums"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">Código / SKU local (opcional)</label>
            <input
              type="text"
              value={localSku}
              onChange={(e) => setLocalSku(e.target.value)}
              className="input-field w-full min-h-11"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setLocalModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={localSubmitting}>
              {localSubmitting ? 'Guardando...' : 'Crear ítem local'}
            </Button>
          </div>
        </form>
      </ImmersiveModal>

      {/* Modal: Editar cantidad de ítem en centro */}
      <ImmersiveModal
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        size="md"
        eyebrow={center.name}
        title={`Ajustar stock · ${editingItem?.nombre}`}
      >
        <form onSubmit={handleUpdateItem} className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">Cantidad ({editingItem?.unidad})</label>
            <input
              type="text"
              inputMode="decimal"
              value={editCantidad}
              onChange={(e) => setEditCantidad(parseNumberCLP(e.target.value, 0))}
              className="input-field w-full min-h-11 tabular-nums text-lg font-semibold"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">Stock mínimo</label>
            <input
              type="text"
              inputMode="decimal"
              value={editMinimo}
              onChange={(e) => setEditMinimo(parseNumberCLP(e.target.value, 0))}
              className="input-field w-full min-h-11 tabular-nums"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={editSubmitting}>
              {editSubmitting ? 'Guardando...' : 'Actualizar stock'}
            </Button>
          </div>
        </form>
      </ImmersiveModal>
    </div>
  );
}
