'use client';

import Link from 'next/link';
import { memo, useEffect, useMemo, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ProductoLocal } from '@/lib/offline/db';
import { QuickSaleButton } from './quick-sale-button';
import {
  Info,
  WifiOff,
  LayoutGrid,
  Search,
  X,
  Package,
  QrCode,
  Zap,
  Sparkles,
  Plus,
} from 'lucide-react';
import { ViewLoading, formatCLP } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useCart } from '@/components/pos/cart-context';
import { ContinuousStreamScanner } from '@/components/pos/continuous-stream-scanner';
import { triggerScanFeedback } from '@/lib/pos-feedback';

/**
 * Memoizado: useLiveQuery re-emite el array completo en cada escritura Dexie
 * (cada venta descuenta stock); los objetos producto son referencias estables.
 */
const ProductoCard = memo(function ProductoCard({ p }: { p: ProductoLocal }) {
  const mainPhoto = p.fotos && p.fotos.length > 0 && p.fotos[0] ? p.fotos[0] : null;

  return (
    <div className="group glass-panel p-5 rounded-xl transition-all hover:border-primary/30 flex flex-col">
      <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-surface-sunken mb-4 border border-border/40">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={p.nombre ?? 'Producto'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground/50">
            <Package className="w-7 h-7" />
            <span className="text-[10px] uppercase tracking-widest font-medium">Sin foto</span>
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h2 className="font-display text-lg sm:text-xl group-hover:text-primary transition-colors leading-tight">
            {p.nombre ?? 'Sin nombre'}
          </h2>
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter shrink-0">
            {p.formato ?? 'Estándar'}
          </span>
        </div>

        {p.stock != null && (
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-success' : 'bg-destructive'}`} />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              {p.stock} unidades en stock
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline justify-between pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-medium">Precio</span>
          <p className="text-2xl font-mono font-bold text-foreground">
            {p.precio != null ? formatCLP(p.precio) : '—'}
          </p>
        </div>

        {p.precio != null && p.id ? (
          <QuickSaleButton
            producto_id={p.id}
            nombre={p.nombre ?? 'Producto'}
            precio={p.precio}
            stock={p.stock}
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { lines, total, scanAndAdd } = useCart();

  const handleFastAdd = useCallback(
    (p: ProductoLocal) => {
      if (p.precio == null) return;
      scanAndAdd({
        producto_id: p.id,
        nombre: p.nombre ?? 'Producto',
        precio_unitario: p.precio,
      });
      triggerScanFeedback('success');
    },
    [scanAndAdd],
  );

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

  const topSkus = useMemo(() => {
    if (!productos) return [];
    return productos.filter((p) => p.precio != null && p.precio > 0).slice(0, 6);
  }, [productos]);

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="min-h-11 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
            >
              <QrCode size={15} />
              <span className="hidden sm:inline">Escanear</span>
            </button>
            {isOffline && (
              <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1 min-h-11">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}
          </div>
        }
      />

      {/* Banner Prominente Scan & Add Tipo Walmart */}
      <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border border-primary/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
            <QrCode size={20} />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold leading-tight text-foreground">
              Modo Escaneo Rápido (Scan & Add)
            </h2>
            <p className="text-xs text-muted-foreground">
              Pasa los frascos frente a la cámara o usa tu lector Bluetooth sin tocar la pantalla
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="min-h-11 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shrink-0 shadow-sm"
        >
          <Zap size={15} />
          <span>Escanear Frascos</span>
        </button>
      </div>

      {/* Botonera de Velocidad: SKUs Estrella a un toque */}
      {topSkus.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
              <Zap size={13} className="text-accent" />
              Favoritos de Feria (1 Toque)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {topSkus.map((p) => {
              const inCart = lines.find((l) => l.producto_id === p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleFastAdd(p)}
                  className="relative p-3 rounded-xl bg-card border border-border/80 hover:border-primary/50 text-left transition-all active:scale-[0.97] group flex flex-col justify-between min-h-20"
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {inCart.cantidad}
                    </span>
                  )}
                  <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {p.nombre}
                  </p>
                  <div className="flex items-baseline justify-between pt-1 mt-1 border-t border-border/40">
                    <span className="text-[11px] font-mono font-bold text-primary">
                      {formatCLP(p.precio ?? 0)}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                      +1
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Visor de Escaneo Continuo en Ráfaga (Scan & Add) */}
      <ContinuousStreamScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}
