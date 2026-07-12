'use client';

import { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import { friendlyError, toast } from '@enjambre/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@enjambre/auth';
import { ViewShell } from '@/components/layout/ViewShell';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  format: string;
  impactTrees: number;
  emoji: string;
  stock: number;
  category: string;
}

function mapProductoRow(p: Record<string, unknown>): Product {
  const precio = Number(p.precio) || 0;
  return {
    id: String(p.id),
    name: String(p.nombre ?? 'Producto'),
    description: String(p.descripcion_regenerativa ?? ''),
    price: precio,
    format: String(p.formato ?? ''),
    impactTrees: Math.max(1, Math.floor(precio / 50000) || 1),
    emoji: '🍯',
    stock: Number(p.stock) || 0,
    category: String(p.categoria ?? p.formato ?? 'Legado'),
  };
}

export function PosFeriaView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [posCart, setPosCart] = useState<Record<string, number>>({});
  const [posMetodoPago, setPosMetodoPago] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'pos_terminal' | 'mixto'>('efectivo');
  const [loadingPos, setLoadingPos] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('productos').select('*').order('nombre');
      if (data?.length) {
        setProducts(data.map((r: Record<string, unknown>) => mapProductoRow(r)));
      }
    })();
  }, []);

  const addToCart = (id: string, step: number = 1) => {
    setPosCart((prev) => {
      const current = prev[id] || 0;
      const next = current + step;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const cartTotal = useMemo(() => {
    return Object.entries(posCart).reduce((sum, [id, qty]) => {
      const p = products.find((prod) => prod.id === id);
      return sum + (p?.price || 0) * qty;
    }, 0);
  }, [posCart, products]);

  const cartItemsCount = useMemo(() => {
    return Object.values(posCart).reduce((a, b) => a + b, 0);
  }, [posCart]);

  const handleCheckout = async () => {
    setLoadingPos(true);
    try {
      const user = useAuthStore.getState().user;
      if (user) {
        const { error } = await supabase.from('ventas').insert({
          vendedor_id: user.id,
          total: Math.round(cartTotal),
          items: posCart as unknown as Record<string, number>,
          origen: 'feria',
          metodo_pago: posMetodoPago,
          estado: 'completada',
          offline_synced: typeof navigator !== 'undefined' ? !navigator.onLine : false,
        });
        if (error) throw error;
      }
      toast(
        typeof navigator !== 'undefined' && !navigator.onLine
          ? 'Venta guardada localmente; se sincronizará al recuperar conexión.'
          : 'Venta registrada correctamente.',
        { type: 'success' }
      );
      setPosCart({});
    } catch (e) {
      toast(friendlyError(e, 'No se pudo registrar la venta'), { type: 'error' });
    } finally {
      setLoadingPos(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-var(--header-height,64px))]">
      <ViewShell
        eyebrow="Operaciones en Terreno"
        title="Punto de Venta"
        subtitle="Modo Feria offline-first para registro de ventas"
      />
      
      <div className="flex flex-1 overflow-hidden min-h-0 bg-background border-t border-border mt-4">
        {/* Productos Grid */}
        <div className="flex-[2] overflow-y-auto p-6 bg-muted/30">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-card p-4 rounded-sm border border-border shadow-sm flex flex-col"
              >
                <div className="text-[2rem] text-center mb-2">{p.emoji}</div>
                <div className="font-semibold text-[0.85rem] text-foreground leading-tight mb-1">
                  {p.name}
                </div>
                <div className="text-[0.9rem] text-accent font-bold mb-auto">
                  ${p.price.toLocaleString()}
                </div>
                <div className="flex items-center justify-between mt-3 bg-muted/50 rounded-sm p-1">
                  <button
                    onClick={() => addToCart(p.id, -1)}
                    className="w-7 h-7 flex items-center justify-center bg-card rounded border border-border cursor-pointer hover:bg-muted transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-semibold text-[0.9rem]">
                    {posCart[p.id] || 0}
                  </span>
                  <button
                    onClick={() => addToCart(p.id, 1)}
                    className="w-7 h-7 flex items-center justify-center bg-foreground text-primary-foreground rounded border-none cursor-pointer hover:bg-foreground/90 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Cargando productos...
              </div>
            )}
          </div>
        </div>

        {/* Carrito Sidebar */}
        <div className="flex-[1] min-w-[300px] max-w-[400px] flex flex-col bg-card border-l border-border shadow-[-4px_0_24px_hsl(var(--foreground)/0.02)]">
          <div className="p-4 border-b border-border font-semibold text-[0.95rem] text-foreground flex justify-between items-center bg-muted/30">
            <span className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-accent" />
              Venta Actual
            </span>
            <span className="text-muted-foreground bg-background px-2 py-0.5 rounded text-xs border border-border">
              {cartItemsCount} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {Object.entries(posCart).length === 0 ? (
              <div className="text-center text-muted-foreground text-[0.85rem] mt-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <ShoppingBag size={20} className="opacity-50" />
                </div>
                El carrito está vacío.
                <br />
                Selecciona productos para comenzar.
              </div>
            ) : (
              Object.entries(posCart).map(([id, qty]) => {
                const p = products.find((prod) => prod.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex justify-between items-center mb-4 text-[0.85rem] group">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-medium text-foreground truncate">{p.name}</div>
                      <div className="text-muted-foreground">
                        {qty} x ${p.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="font-semibold whitespace-nowrap">
                      ${(p.price * qty).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-6 border-t border-border bg-accent/[0.04]">
            <div className="flex justify-between mb-2 text-[0.9rem] text-muted-foreground">
              <span>Subtotal</span>
              <span>${cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-5 text-xl font-bold text-foreground">
              <span>Total</span>
              <span>${cartTotal.toLocaleString()}</span>
            </div>

            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Método de pago
            </label>
            <select
              className="w-full mb-6 px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              value={posMetodoPago}
              onChange={(e) =>
                setPosMetodoPago(e.target.value as typeof posMetodoPago)
              }
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta (Webpay)</option>
              <option value="pos_terminal">POS Físico (SumUp)</option>
              <option value="mixto">Mixto</option>
            </select>

            <button
              className="btn w-full py-4 text-base font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-accent text-accent-foreground hover:bg-accent/90 border-none"
              disabled={cartTotal === 0 || loadingPos}
              onClick={handleCheckout}
            >
              {loadingPos ? 'Procesando...' : 'Cobrar Venta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
