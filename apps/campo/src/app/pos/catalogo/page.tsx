'use client';

import Link from 'next/link';
import { memo, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ProductoLocal } from '@/lib/offline/db';
import { QuickSaleButton } from './quick-sale-button';
import { Info, WifiOff, LayoutGrid, Search, X, ShoppingBag } from 'lucide-react';
import { ViewLoading, formatCLP } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useCart } from '@/components/pos/cart-context';

/**
 * Memoizado: useLiveQuery re-emite el array completo en cada escritura Dexie
 * (cada venta descuenta stock); los objetos producto son referencias estables.
 */
const ProductoCard = memo(function ProductoCard({ p }: { p: ProductoLocal }) {
  return (
    <div className="group glass-panel p-6 rounded-lg transition-colors hover:border-primary/30 flex flex-col">
      <div className="flex-1">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-display text-xl group-hover:text-primary transition-colors">{p.nombre ?? 'Sin nombre'}</h2>
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-tighter">
            {p.formato ?? 'Estándar'}
          </span>
        </div>

        {p.stock != null && (
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-success' : 'bg-destructive'}`} />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              {p.stock} unidades en stock
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline justify-between pt-4 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-medium">Precio</span>
          <p className="text-2xl font-mono font-bold text-foreground">
            {p.precio != null
              ? new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                }).format(p.precio)
              : '—'}
          </p>
        </div>

        {p.precio != null && p.id ? (
          <QuickSaleButton
            producto_id={p.id}
            nombre={p.nombre ?? 'Producto'}
            precio={p.precio}
          />
        ) : null}
      </div>
    </div>
  );
});

export default function CatalogoPage() {
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormato, setSelectedFormato] = useState<string>('todos');
  const { lines, total } = useCart();

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const productos = useLiveQuery(() => db.productos.toArray());

  const formatosDisponibles = useMemo(() => {
    if (!productos) return [];
    const set = new Set<string>();
    productos.forEach((p) => {
      if (p.formato) set.add(p.formato);
    });
    return Array.from(set).sort();
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    if (!productos) return [];
    return productos.filter((p) => {
      const matchSearch =
        !searchQuery.trim() ||
        (p.nombre ?? '').toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchFormato =
        selectedFormato === 'todos' || p.formato === selectedFormato;
      return matchSearch && matchFormato;
    });
  }, [productos, searchQuery, selectedFormato]);

  const totalItemsEnCarrito = lines.reduce((s, l) => s + l.cantidad, 0);

  return (
    <div className="animate-in fade-in duration-700 space-y-6 pb-20">
      <ViewShell
        variant="compact"
        eyebrow="POS"
        title="Catálogo"
        subtitle={
          isOffline
            ? 'Venta rápida offline · se sincroniza al recuperar conexión'
            : 'Venta rápida: producto → cantidad → pago · comisión automática'
        }
        icon={<LayoutGrid size={20} />}
        actions={
          isOffline ? (
            <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1 min-h-11">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          ) : undefined
        }
      />

      {/* Controles de Búsqueda y Filtros de Terreno */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar miel, propóleo, cosmética..."
            className="w-full min-h-11 bg-card border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {formatosDisponibles.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedFormato('todos')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all shrink-0 min-h-9 ${
                selectedFormato === 'todos'
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos ({productos?.length ?? 0})
            </button>
            {formatosDisponibles.map((f) => {
              const count = productos?.filter((p) => p.formato === f).length ?? 0;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedFormato(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all shrink-0 min-h-9 ${
                    selectedFormato === f
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {!productos ? (
          <div className="col-span-full">
            <ViewLoading variant="view" label="Inventario" hideLabel />
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-card/30 border border-border border-dashed rounded-3xl">
            <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-light uppercase tracking-widest text-xs">
              {searchQuery || selectedFormato !== 'todos'
                ? 'No se encontraron productos con esos filtros.'
                : 'No hay productos disponibles localmente.'}
            </p>
            {(searchQuery || selectedFormato !== 'todos') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFormato('todos');
                }}
                className="mt-3 text-xs text-primary font-bold uppercase tracking-widest hover:underline"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        ) : (
          productosFiltrados.map((p) => <ProductoCard key={p.id} p={p} />)
        )}
      </div>

      {/* Barra flotante inferior de Carrito cuando hay productos seleccionados */}
      {totalItemsEnCarrito > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 z-40 md:max-w-sm ml-auto animate-in slide-in-from-bottom-5 duration-300">
          <Link
            href="/pos/carrito"
            className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30 border border-primary-foreground/20 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-14"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold text-xs">
                {totalItemsEnCarrito}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm leading-tight">En Carrito</span>
                <span className="text-[10px] text-primary-foreground/80 uppercase tracking-widest">
                  {lines.length} {lines.length === 1 ? 'ítem' : 'ítems'} distintos
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-base">{formatCLP(total)}</span>
              <span className="text-xs uppercase tracking-widest font-bold bg-primary-foreground text-primary px-3 py-1.5 rounded-xl">
                Cobrar →
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
