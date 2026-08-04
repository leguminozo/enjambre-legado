'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, PlusSquare, Search, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button, toast, ViewLoading, friendlySupabaseError } from '@enjambre/ui';
import { supabase } from '@/lib/supabase';
import { ViewShell } from '@/components/layout/ViewShell';
import { EnjTableShell } from '@/components/layout/EnjTableShell';
import type { Product } from '@/lib/product-types';

/**
 * Inventario centralizado de productos listos para la venta.
 * El catálogo (Productos) define la ficha de tienda; aquí se gestiona el stock.
 */
export function InventarioView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [refillProduct, setRefillProduct] = useState<Product | null>(null);
  const [refillAmount, setRefillAmount] = useState(10);
  const [isRefilling, setIsRefilling] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, stock, formato, precio, visible, slug, fotos, categoria, lote_id, updated_at')
        .order('nombre', { ascending: true });

      if (error) throw error;
      const mapped = (data || []).map((p: Record<string, unknown>) => ({
        id: String(p.id),
        nombre: String(p.nombre ?? ''),
        stock: Number(p.stock) || 0,
        formato: String(p.formato ?? ''),
        precio: Number(p.precio) || 0,
        visible: Boolean(p.visible ?? true),
        slug: String(p.slug ?? ''),
        fotos: Array.isArray(p.fotos) ? (p.fotos as string[]) : [],
        categoria: String(p.categoria ?? ''),
        lote_id: p.lote_id ? String(p.lote_id) : null,
        updated_at: p.updated_at ? String(p.updated_at) : null,
        descripcion_regenerativa: '',
        trazabilidad_qr: true,
      })) as Product[];
      setProducts(mapped);
    } catch (error) {
      console.error('Error loading inventario:', error);
      toast(friendlySupabaseError(error as { code?: string; message?: string } | null), { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleRefillSubmit = async () => {
    if (!refillProduct || refillAmount <= 0) return;
    setIsRefilling(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No autenticado');
      const { data: { session: authSession } } = await supabase.auth.getSession();

      const res = await fetch('/api/produccion/add-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession?.access_token}`,
        },
        body: JSON.stringify({
          producto_id: refillProduct.id,
          cantidad: refillAmount,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Error agregando stock');

      toast(`Stock actualizado (+${refillAmount})`, { type: 'success' });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === refillProduct.id
            ? { ...p, stock: (p.stock || 0) + refillAmount, lote_id: json.data?.lote_id ?? p.lote_id }
            : p,
        ),
      );
      setRefillProduct(null);
      setRefillAmount(10);
    } catch (error: unknown) {
      console.error('Error refilling stock:', error);
      toast(error instanceof Error ? error.message : 'Error al reponer stock', { type: 'error' });
    } finally {
      setIsRefilling(false);
    }
  };

  const filtered = products.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (q && !(p.nombre || '').toLowerCase().includes(q) && !(p.formato || '').toLowerCase().includes(q)) {
      return false;
    }
    const stock = p.stock || 0;
    if (filterStock === 'out') return stock === 0;
    if (filterStock === 'low') return stock > 0 && stock < 10;
    return true;
  });

  const totalUnits = products.reduce((s, p) => s + (p.stock || 0), 0);
  const lowCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) < 10).length;
  const outCount = products.filter((p) => (p.stock || 0) === 0).length;
  const totalValue = products.reduce((s, p) => s + (p.precio || 0) * (p.stock || 0), 0);

  if (loading) {
    return <ViewLoading variant="view" label="Inventario" hideLabel />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Producción"
        title="Inventario"
        subtitle="Stock de productos listos para la venta. Las fichas de tienda se editan en Productos; aquí solo se carga y se reponen unidades."
        icon={<Package size={20} />}
        actions={
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline min-h-11"
          >
            <ExternalLink size={16} />
            Ir a Productos (ficha tienda)
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Unidades en stock', value: totalUnits.toLocaleString('es-CL') },
          { label: 'Valor inventario', value: `$${totalValue.toLocaleString('es-CL')}` },
          { label: 'Stock bajo (<10)', value: String(lowCount), warn: lowCount > 0 },
          { label: 'Agotados', value: String(outCount), warn: outCount > 0 },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border/60 bg-card p-4"
          >
            <div className="text-[0.7rem] uppercase tracking-wider text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-xl font-semibold ${s.warn ? 'text-destructive' : 'text-foreground'}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[14rem] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar por nombre o formato…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-9"
          />
        </div>
        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value as typeof filterStock)}
          className="input-field w-auto"
        >
          <option value="all">Todo el inventario</option>
          <option value="low">Stock bajo</option>
          <option value="out">Agotados</option>
        </select>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Package className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="font-medium text-foreground mb-1">Aún no hay productos en catálogo</p>
          <p className="text-sm text-muted-foreground mb-4">
            Crea primero la ficha en Productos (nombre, foto, precio). Luego vuelve aquí a cargar stock.
          </p>
          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground min-h-11"
          >
            Crear producto
          </Link>
        </div>
      ) : (
        <EnjTableShell caption="Inventario de productos">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 56 }}>Img</th>
                <th>Producto</th>
                <th>Formato</th>
                <th>Stock</th>
                <th>Precio unit.</th>
                <th>Valor</th>
                <th style={{ textAlign: 'right', width: 140 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                    Sin resultados para este filtro
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const stock = p.stock || 0;
                  const isOut = stock === 0;
                  const isLow = stock > 0 && stock < 10;
                  return (
                    <tr key={p.id}>
                      <td>
                        {p.fotos?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.fotos[0]}
                            alt=""
                            className="w-12 h-12 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted/40 flex items-center justify-center">
                            <Package size={18} className="text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="font-medium text-foreground">{p.nombre}</div>
                        {p.categoria && (
                          <div className="text-xs text-muted-foreground">{p.categoria}</div>
                        )}
                      </td>
                      <td className="text-sm">{p.formato || '—'}</td>
                      <td>
                        <span className={`font-semibold ${isOut ? 'text-destructive' : isLow ? 'text-warning' : ''}`}>
                          {stock}
                        </span>
                        {isOut && (
                          <span className="flex items-center gap-1 text-[0.65rem] text-destructive mt-0.5">
                            <AlertTriangle size={10} /> Agotado
                          </span>
                        )}
                        {isLow && !isOut && (
                          <span className="block text-[0.65rem] text-warning mt-0.5">Stock bajo</span>
                        )}
                      </td>
                      <td className="text-sm">${(p.precio || 0).toLocaleString('es-CL')}</td>
                      <td className="text-sm font-medium">
                        ${((p.precio || 0) * stock).toLocaleString('es-CL')}
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => {
                              setRefillProduct(p);
                              setRefillAmount(10);
                            }}
                          >
                            <PlusSquare size={14} />
                            Cargar stock
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </EnjTableShell>
      )}

      {refillProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="refill-title"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 id="refill-title" className="text-lg font-semibold mb-1">
              Cargar stock: {refillProduct.nombre}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Unidades a sumar al inventario. Stock actual:{' '}
              <strong className="text-foreground">{refillProduct.stock ?? 0}</strong>
            </p>
            <label className="block text-sm font-medium mb-1.5">Cantidad</label>
            <input
              type="number"
              min={1}
              className="input-field w-full mb-5"
              value={refillAmount}
              onChange={(e) => setRefillAmount(parseInt(e.target.value, 10) || 0)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRefillProduct(null)} disabled={isRefilling}>
                Cancelar
              </Button>
              <Button onClick={() => void handleRefillSubmit()} disabled={isRefilling || refillAmount <= 0}>
                {isRefilling ? 'Guardando…' : 'Confirmar carga'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
