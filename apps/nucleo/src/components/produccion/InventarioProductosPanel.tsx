'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  PlusSquare,
  Search,
  AlertTriangle,
  ExternalLink,
  Pencil,
  Trash2,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Warehouse,
} from 'lucide-react';
import {
  Button,
  toast,
  ViewLoading,
  friendlySupabaseError,
  formatMoney,
  ImmersiveModal,
  EmptyState,
} from '@enjambre/ui';
import { supabase } from '@/lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ProductForm } from '@/components/productos/ProductForm';
import type { Product } from '@/lib/product-types';
import { DerivarStockModal, type DerivarStockTarget } from '@/components/logistica/DerivarStockModal';
import type { StockCenter } from '@/components/logistica/types';
import { cn } from '@/lib/cn';


type StockFilter = 'all' | 'low' | 'out';
type SortKey = 'nombre' | 'recientes' | 'stock' | 'valor';

type StockModalMode = 'add' | 'set';

/**
 * Pestaña Productos del hub Inventario: stock de catálogo listo para venta.
 */
export function InventarioProductosPanel() {
  const apiFetch = useApiFetch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStock, setFilterStock] = useState<StockFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('nombre');

  const [stockModal, setStockModal] = useState<{
    product: Product;
    mode: StockModalMode;
  } | null>(null);
  const [stockAmount, setStockAmount] = useState(10);
  const [stockBusy, setStockBusy] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const loadProducts = useCallback(async () => {

    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProducts((data as Product[]) ?? []);
    } catch (error) {
      console.error('Error loading inventario:', error);
      toast(friendlySupabaseError(error as { code?: string; message?: string } | null), {
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const openAddStock = (p: Product) => {
    setStockModal({ product: p, mode: 'add' });
    setStockAmount(10);
  };

  const openSetStock = (p: Product) => {
    setStockModal({ product: p, mode: 'set' });
    setStockAmount(p.stock ?? 0);
  };

  const handleStockSubmit = async () => {
    if (!stockModal) return;
    const { product, mode } = stockModal;
    if (mode === 'add' && stockAmount <= 0) return;
    if (mode === 'set' && stockAmount < 0) return;

    setStockBusy(true);
    try {
      if (mode === 'add') {
        // useApiFetch: Bearer + x-empresa-id + cookies (CSRF Origin del browser)
        const res = await apiFetch('/api/produccion/add-stock', {
          method: 'POST',
          body: JSON.stringify({
            producto_id: product.id,
            cantidad: stockAmount,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          data?: { lote_id?: string; stock_nuevo?: number; mode?: string };
          error?: string;
          message?: string;
        };
        if (!res.ok) {
          // Fallback cliente: sumar stock directo si el BFF falla (p. ej. service role)
          const prev = product.stock || 0;
          const { error } = await supabase
            .from('productos')
            .update({
              stock: prev + stockAmount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', product.id);
          if (error) {
            throw new Error(json.message || json.error || error.message || 'Error agregando stock');
          }
          toast(`Stock +${stockAmount} (modo directo)`, { type: 'success' });
          // El BFF no intervino: invalidar la tienda desde el cliente
          void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);
          setProducts((list) =>
            list.map((p) =>
              p.id === product.id
                ? { ...p, stock: prev + stockAmount, updated_at: new Date().toISOString() }
                : p,
            ),
          );
        } else {
          const nuevo =
            typeof json.data?.stock_nuevo === 'number'
              ? json.data.stock_nuevo
              : (product.stock || 0) + stockAmount;
          toast(
            json.data?.mode === 'direct'
              ? `Stock +${stockAmount} (sin lote de traza)`
              : `Stock actualizado (+${stockAmount})`,
            { type: 'success' },
          );
          setProducts((list) =>
            list.map((p) =>
              p.id === product.id
                ? {
                    ...p,
                    stock: nuevo,
                    lote_id: json.data?.lote_id ?? p.lote_id,
                    updated_at: new Date().toISOString(),
                  }
                : p,
            ),
          );
        }
      } else {
        // Ajuste absoluto (incidente / reformulación) — vía BFF: valida admin y
        // revalida el ISR de la tienda server-side (sin depender de RLS cliente).
        const res = await apiFetch('/api/produccion/set-stock', {
          method: 'POST',
          body: JSON.stringify({
            producto_id: product.id,
            stock: stockAmount,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          data?: { stock_nuevo?: number; mode?: string };
          error?: string;
          message?: string;
        };
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Error reformulando stock');
        }
        const nuevo =
          typeof json.data?.stock_nuevo === 'number'
            ? json.data.stock_nuevo
            : stockAmount;
        toast(`Stock reformulado a ${nuevo} un.`, { type: 'success' });
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? { ...p, stock: nuevo, updated_at: new Date().toISOString() }
              : p,
          ),
        );
      }
      setStockModal(null);
    } catch (error: unknown) {
      console.error('Error stock:', error);
      toast(error instanceof Error ? error.message : 'Error al actualizar stock', {
        type: 'error',
      });
    } finally {
      setStockBusy(false);
    }
  };

  const openEdit = async (p: Product) => {
    setEditLoading(true);
    setEditingProduct(p);
    try {
      // Ficha completa por si el listado está reducido en el futuro
      const { data, error } = await supabase.from('productos').select('*').eq('id', p.id).single();
      if (error) throw error;
      if (data) setEditingProduct(data as Product);
    } catch (err) {
      console.error(err);
      toast('No se pudo cargar la ficha completa; editando con datos de lista', {
        type: 'warning',
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (
      !confirm(
        `¿Eliminar “${p.nombre}”? Se quita del catálogo y del inventario. Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setDeletingId(p.id);
    try {
      const { error } = await supabase.from('productos').delete().eq('id', p.id);
      if (error) throw error;
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      toast('Producto eliminado', { type: 'success' });
    } catch (error) {
      toast(friendlySupabaseError(error as { code?: string; message?: string } | null), {
        type: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = products.filter((p) => {
      if (q) {
        const hay =
          (p.nombre || '').toLowerCase().includes(q) ||
          (p.formato || '').toLowerCase().includes(q) ||
          (p.categoria || '').toLowerCase().includes(q);
        if (!hay) return false;
      }
      const stock = p.stock || 0;
      if (filterStock === 'out') return stock === 0;
      if (filterStock === 'low') return stock > 0 && stock < 10;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortKey === 'nombre') {
        return (a.nombre || '').localeCompare(b.nombre || '', 'es');
      }
      if (sortKey === 'recientes') {
        return (b.updated_at || '').localeCompare(a.updated_at || '');
      }
      if (sortKey === 'stock') {
        return (a.stock || 0) - (b.stock || 0);
      }
      // valor
      return (b.precio || 0) * (b.stock || 0) - (a.precio || 0) * (a.stock || 0);
    });
    return list;
  }, [products, searchQuery, filterStock, sortKey]);

  const totalUnits = products.reduce((s, p) => s + (p.stock || 0), 0);
  const lowCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) < 10).length;
  const outCount = products.filter((p) => (p.stock || 0) === 0).length;
  const totalValue = products.reduce((s, p) => s + (p.precio || 0) * (p.stock || 0), 0);

  const hasActiveFilters = filterStock !== 'all' || searchQuery.trim() !== '' || sortKey !== 'nombre';

  if (loading) {
    return <ViewLoading variant="view" label="Inventario" hideLabel />;
  }

  return (
    <div className="space-y-3 sm:space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
        <div className="flex items-baseline gap-2 flex-wrap min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Productos de venta</h2>
          <span className="text-xs text-muted-foreground truncate">· Stock de SKUs del catálogo</span>
        </div>
        <Link
          href="/catalogo"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/40 min-h-8 sm:min-h-9 touch-manipulation shrink-0"
        >
          <ExternalLink size={13} className="shrink-0" />
          Nueva ficha
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {[
          { label: 'Unidades', value: totalUnits.toLocaleString('es-CL') },
          { label: 'Valor total', value: formatMoney(totalValue) },
          { label: 'Stock bajo', value: String(lowCount), warn: lowCount > 0 },
          { label: 'Agotados', value: String(outCount), warn: outCount > 0 },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border/60 bg-card px-3 py-2 sm:px-3.5 sm:py-2.5 min-h-[3.6rem]"
          >
            <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-0.5">
              {s.label}
            </div>
            <div
              className={cn(
                'text-base sm:text-lg font-semibold tabular-nums leading-tight',
                s.warn ? 'text-destructive' : 'text-foreground',
              )}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar: búsqueda + filtros + orden */}
      <div className="rounded-xl border border-border/60 bg-card p-2.5 sm:p-3 space-y-2.5">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Buscar nombre, formato o categoría…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-9 pr-9 min-h-10 text-sm"
            aria-label="Buscar en inventario"
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex min-h-8 min-w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtro de stock">
            {(
              [
                { id: 'all', label: 'Todos', count: products.length },
                { id: 'low', label: 'Bajo', count: lowCount },
                { id: 'out', label: 'Agotados', count: outCount },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilterStock(chip.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 min-h-9 text-xs font-semibold uppercase tracking-wide transition-colors touch-manipulation',
                  filterStock === chip.id
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80',
                )}
              >
                {chip.label}
                <span
                  className={cn(
                    'tabular-nums rounded-full px-1.5 py-0.5 text-[0.65rem]',
                    filterStock === chip.id ? 'bg-primary/15' : 'bg-muted/60',
                  )}
                >
                  {chip.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto min-w-0">
            <ArrowUpDown size={14} className="text-muted-foreground shrink-0" aria-hidden />
            <label htmlFor="inv-sort" className="sr-only">
              Ordenar
            </label>
            <select
              id="inv-sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="input-field min-h-11 text-sm flex-1 sm:flex-none sm:w-44"
            >
              <option value="nombre">Nombre A–Z</option>
              <option value="recientes">Más recientes</option>
              <option value="stock">Menor stock</option>
              <option value="valor">Mayor valor</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span>
              {filtered.length} de {products.length} producto{products.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 min-h-11 px-2 text-primary font-medium touch-manipulation"
              onClick={() => {
                setSearchQuery('');
                setFilterStock('all');
                setSortKey('nombre');
              }}
            >
              <SlidersHorizontal size={12} />
              Restablecer
            </button>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package size={40} className="opacity-40" />}
          title="Aún no hay productos"
          description="Crea la ficha en Productos (nombre, foto, precio) y luego vuelve aquí para cargar el stock."
          action={
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground min-h-11"
            >
              Crear producto
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Prueba otro filtro o limpia la búsqueda."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFilterStock('all');
              }}
            >
              Ver todo el inventario
            </Button>
          }
        />
      ) : (
        <>
          {/* Móvil: tarjetas */}
          <ul className="md:hidden flex flex-col gap-3 list-none p-0 m-0">
            {filtered.map((p) => (
              <InventarioCard
                key={p.id}
                product={p}
                deleting={deletingId === p.id}
                onAddStock={() => openAddStock(p)}
                onSetStock={() => openSetStock(p)}
                onDerivar={() =>
                  setDerivarTarget({
                    tipo: 'producto',
                    id: p.id,
                    nombre: p.nombre ?? 'Producto',
                    unidad: 'unidad',
                    stockDisponible: p.stock ?? 0,
                  })
                }
                onEdit={() => void openEdit(p)}
                onDelete={() => void handleDelete(p)}
              />
            ))}
          </ul>

          {/* Escritorio: tabla */}
          <div className="hidden md:block rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-sunken/50 text-left text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold w-14">Img</th>
                    <th className="px-4 py-3 font-semibold">Producto</th>
                    <th className="px-4 py-3 font-semibold">Formato</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 font-semibold">Precio</th>
                    <th className="px-4 py-3 font-semibold">Valor</th>
                    <th className="px-4 py-3 font-semibold text-right min-w-[12rem]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((p) => {
                    const stock = p.stock || 0;
                    const isOut = stock === 0;
                    const isLow = stock > 0 && stock < 10;
                    return (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <ProductThumb product={p} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{p.nombre}</div>
                          {p.categoria && (
                            <div className="text-xs text-muted-foreground">{p.categoria}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{p.formato || '—'}</td>
                        <td className="px-4 py-3">
                          <StockBadge stock={stock} isOut={isOut} isLow={isLow} />
                        </td>
                        <td className="px-4 py-3 tabular-nums">{formatMoney(p.precio || 0)}</td>
                        <td className="px-4 py-3 font-medium tabular-nums">
                          {formatMoney((p.precio || 0) * stock)}
                        </td>
                        <td className="px-4 py-3">
                          <RowActions
                            dense
                            deleting={deletingId === p.id}
                            onAddStock={() => openAddStock(p)}
                            onSetStock={() => openSetStock(p)}
                            onDerivar={() =>
                              setDerivarTarget({
                                tipo: 'producto',
                                id: p.id,
                                nombre: p.nombre ?? 'Producto',
                                unidad: 'unidad',
                                stockDisponible: p.stock ?? 0,
                              })
                            }
                            onEdit={() => void openEdit(p)}
                            onDelete={() => void handleDelete(p)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}

      {/* Modal stock: cargar o reformular */}
      <ImmersiveModal
        open={Boolean(stockModal)}
        onClose={() => setStockModal(null)}
        size="md"
        eyebrow="Inventario"
        title={
          stockModal
            ? `${stockModal.mode === 'add' ? 'Cargar stock' : 'Reformular stock'}: ${stockModal.product.nombre}`
            : 'Stock'
        }
        footer={
          <>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => setStockModal(null)}
              disabled={stockBusy}
            >
              Cancelar
            </Button>
            <Button
              className="min-h-11"
              onClick={() => void handleStockSubmit()}
              disabled={
                stockBusy ||
                !stockModal ||
                (stockModal.mode === 'add' ? stockAmount <= 0 : stockAmount < 0)
              }
            >
              {stockBusy
                ? 'Guardando…'
                : stockModal?.mode === 'add'
                  ? 'Confirmar carga'
                  : 'Aplicar stock'}
            </Button>
          </>
        }
      >
        {stockModal && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {stockModal.mode === 'add' ? (
                <>
                  Unidades a <strong className="text-foreground">sumar</strong>. Actual:{' '}
                  <strong className="text-foreground">{stockModal.product.stock ?? 0}</strong>
                </>
              ) : (
                <>
                  Nuevo total absoluto (incidente, merma o corrección). Actual:{' '}
                  <strong className="text-foreground">{stockModal.product.stock ?? 0}</strong>
                </>
              )}
            </p>
            <label className="block text-sm font-medium mb-1.5" htmlFor="stock-amount">
              {stockModal.mode === 'add' ? 'Cantidad a sumar' : 'Stock final'}
            </label>
            <input
              id="stock-amount"
              type="number"
              inputMode="numeric"
              min={stockModal.mode === 'add' ? 1 : 0}
              className="input-field w-full min-h-11 text-lg tabular-nums"
              value={stockAmount}
              onChange={(e) => setStockAmount(parseInt(e.target.value, 10) || 0)}
              autoFocus
            />
          </div>
        )}
      </ImmersiveModal>

      {/* Edición desde inventario */}
      <ImmersiveModal
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        eyebrow="Inventario"
        title={
          editLoading
            ? 'Cargando ficha…'
            : `Editar · ${editingProduct?.nombre ?? 'producto'}`
        }
        size="xl"
        bodyClassName="!p-0"
      >
        {editingProduct && !editLoading && (
          <div className="p-4 sm:p-6">
            <p className="text-xs text-muted-foreground mb-4 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
              Estás en el editor de inventario: puedes reformular el stock y la ficha comercial
              sin ir a Productos.
            </p>
            <ProductForm
              key={editingProduct.id}
              variant="inventory"
              initialData={{
                id: editingProduct.id,
                nombre: editingProduct.nombre ?? '',
                descripcion_regenerativa: editingProduct.descripcion_regenerativa ?? '',
                precio: editingProduct.precio ?? 0,
                stock: editingProduct.stock ?? 0,
                formato: editingProduct.formato ?? '',
                visible: editingProduct.visible ?? true,
                channels: Array.isArray(editingProduct.channels) && editingProduct.channels.length > 0
                  ? editingProduct.channels
                  : ['tienda', 'campo'],
                trazabilidad_qr: editingProduct.trazabilidad_qr ?? true,
                tipo_sensorial: ((editingProduct as { tipo_sensorial?: 'miel' }).tipo_sensorial) ?? 'miel',
                categoria: editingProduct.categoria ?? '',
                tags: Array.isArray(editingProduct.tags)
                  ? (editingProduct.tags as string[])
                  : [],
                descripcion_corta: editingProduct.descripcion_corta ?? '',
                peso_neto_g: editingProduct.peso_neto_g ?? undefined,
                ingredientes: editingProduct.ingredientes ?? '',
                origen_apicola: editingProduct.origen_apicola ?? '',
                lote_id: editingProduct.lote_id ?? undefined,
                slug: editingProduct.slug ?? undefined,
                video_url: editingProduct.video_url ?? undefined,
                fotos: Array.isArray(editingProduct.fotos)
                  ? (editingProduct.fotos as string[])
                  : undefined,
                sustituye_azucar_g: editingProduct.sustituye_azucar_g ?? undefined,
                co2_evitado_kg: editingProduct.co2_evitado_kg ?? undefined,
                irr_referencia: editingProduct.irr_referencia ?? undefined,
              }}
              onSuccess={() => {
                setEditingProduct(null);
                void loadProducts();
                toast('Producto actualizado', { type: 'success' });
              }}
              onCancel={() => setEditingProduct(null)}
            />
          </div>
        )}
        {editLoading && (
          <div className="p-12 flex justify-center">
            <ViewLoading variant="view" label="Ficha" hideLabel />
          </div>
        )}
      </ImmersiveModal>

      <DerivarStockModal
        open={Boolean(derivarTarget)}
        onClose={() => setDerivarTarget(null)}
        target={derivarTarget}
        stockCenters={stockCenters}
        onSuccess={() => void loadProducts()}
      />
    </div>
  );
}


function ProductThumb({ product }: { product: Product }) {
  const src = Array.isArray(product.fotos) ? product.fotos[0] : null;
  if (src && typeof src === 'string') {
    return (
      <img
        src={src}
        alt=""
        className="w-12 h-12 rounded-lg object-cover bg-muted"
        loading="lazy"
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center">
      <Package size={18} className="text-muted-foreground" />
    </div>
  );
}

function StockBadge({
  stock,
  isOut,
  isLow,
}: {
  stock: number;
  isOut: boolean;
  isLow: boolean;
}) {
  return (
    <div>
      <span
        className={cn(
          'font-semibold tabular-nums',
          isOut ? 'text-destructive' : isLow ? 'text-amber-600 dark:text-amber-400' : '',
        )}
      >
        {stock}
      </span>
      {isOut && (
        <span className="flex items-center gap-1 text-[0.65rem] text-destructive mt-0.5">
          <AlertTriangle size={10} /> Agotado
        </span>
      )}
      {isLow && !isOut && (
        <span className="block text-[0.65rem] text-amber-600 dark:text-amber-400 mt-0.5">
          Stock bajo
        </span>
      )}
    </div>
  );
}

function RowActions({
  dense,
  deleting,
  onAddStock,
  onSetStock,
  onDerivar,
  onEdit,
  onDelete,
}: {
  dense?: boolean;
  deleting: boolean;
  onAddStock: () => void;
  onSetStock: () => void;
  onDerivar?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-1.5',
        dense ? 'justify-end' : 'grid grid-cols-2 sm:grid-cols-5',
      )}
    >
      <Button
        size="sm"
        variant="outline"
        className="gap-1 text-xs min-h-11 touch-manipulation"
        onClick={onAddStock}
        disabled={deleting}
      >
        <PlusSquare size={14} />
        <span className={dense ? 'hidden lg:inline' : ''}>Cargar</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1 text-xs min-h-11 touch-manipulation"
        onClick={onSetStock}
        disabled={deleting}
        title="Reformular stock absoluto"
      >
        <SlidersHorizontal size={14} />
        <span className={dense ? 'hidden lg:inline' : ''}>Ajustar</span>
      </Button>
      {onDerivar && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-xs min-h-11 touch-manipulation text-primary border-primary/30 hover:bg-primary/10"
          onClick={onDerivar}
          disabled={deleting}
          title="Derivar stock a centro de distribución"
        >
          <Warehouse size={14} />
          <span className={dense ? 'hidden lg:inline' : ''}>Derivar</span>
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        className="gap-1 text-xs min-h-11 touch-manipulation"
        onClick={onEdit}
        disabled={deleting}
      >
        <Pencil size={14} />
        <span className={dense ? 'hidden lg:inline' : ''}>Editar</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1 text-xs min-h-11 touch-manipulation text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Eliminar producto"
      >
        <Trash2 size={14} />
        <span className={dense ? 'hidden lg:inline' : ''}>
          {deleting ? '…' : 'Eliminar'}
        </span>
      </Button>
    </div>
  );
}

function InventarioCard({
  product,
  deleting,
  onAddStock,
  onSetStock,
  onDerivar,
  onEdit,
  onDelete,
}: {
  product: Product;
  deleting: boolean;
  onAddStock: () => void;
  onSetStock: () => void;
  onDerivar?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const stock = product.stock || 0;
  const isOut = stock === 0;
  const isLow = stock > 0 && stock < 10;

  return (
    <li className="rounded-xl border border-border/60 bg-card p-4 space-y-3 list-none">
      <div className="flex gap-3">
        <ProductThumb product={product} />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-foreground truncate">{product.nombre}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {[product.formato, product.categoria].filter(Boolean).join(' · ') || 'Sin formato'}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <StockBadge stock={stock} isOut={isOut} isLow={isLow} />
            <span className="tabular-nums text-muted-foreground">
              {formatMoney(product.precio || 0)}
            </span>
            <span className="tabular-nums font-medium">
              {formatMoney((product.precio || 0) * stock)}
            </span>
          </div>
        </div>
      </div>
      <RowActions
        deleting={deleting}
        onAddStock={onAddStock}
        onSetStock={onSetStock}
        onDerivar={onDerivar}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </li>
  );
}

