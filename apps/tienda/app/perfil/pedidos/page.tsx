import React from 'react';
import { ShoppingBag, Package, Truck, CheckCircle, ArrowUpRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { formatCLP } from '@/lib/shop/format';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from('ventas')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-16 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <ShoppingBag size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">Historial Ritual</h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">Recorrido histórico de los frutos del bosque bajo tu custodia</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="p-12 rounded-3xl bg-secondary/50 border border-border text-center">
          <p className="text-muted-foreground font-display italic text-lg mb-8">
            Aún no has iniciado tu legado de consumo consciente.
          </p>
          <button className="px-8 py-4 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.3em] font-bold rounded-xl hover:scale-105 transition-all">
            Visitar La Tienda
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order: Record<string, unknown>) => {
            const orderId = String(order.id ?? '');
            const createdAt = String(order.created_at ?? '');
            const total = (order.total as number) ?? 0;
            const estado = String(order.estado ?? 'Procesando');
            return (
              <div key={orderId} className="p-8 rounded-3xl bg-card border border-border hover:border-accent/20 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex gap-6 items-center">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors shrink-0">
                      <Package size={24} />
                    </div>
                    <div>
                      <span className="block text-[0.6rem] uppercase tracking-[0.4em] text-accent mb-1">Orden #{orderId.slice(0, 8)}</span>
                      <h4 className="font-display text-xl text-foreground">{formatDate(createdAt)}</h4>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-8 md:gap-12">
                    <div className="text-right">
                      <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-1">Inversión</span>
                      <span className="text-lg font-display text-foreground">{formatCLP(total)}</span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-1">Estado Vital</span>
                      <div className="flex items-center gap-2 justify-end">
                        <span className={`w-1.5 h-1.5 rounded-full ${estado === 'entregado' ? 'bg-emerald-500' : 'bg-accent animate-pulse'}`} />
                        <span className="text-[0.65rem] uppercase tracking-widest text-foreground font-bold">{estado}</span>
                      </div>
                    </div>

                    <button className="p-3 bg-secondary rounded-full text-muted-foreground group-hover:text-accent hover:bg-accent/10 transition-all border border-transparent hover:border-accent/20">
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-accent">
                      <CheckCircle size={14} />
                      <span className="text-[0.6rem] uppercase tracking-widest font-bold">Pago Confirmado</span>
                    </div>
                    <div className="w-12 h-px bg-border" />
                    <div className={`flex items-center gap-2 ${estado === 'enviado' || estado === 'entregado' ? 'text-accent' : 'text-muted-foreground'}`}>
                      <Truck size={14} />
                      <span className="text-[0.6rem] uppercase tracking-widest font-bold">En Tránsito</span>
                    </div>
                  </div>
                  <p className="text-[0.6rem] text-muted-foreground italic uppercase tracking-widest">Pureo Batch #CV-2025-04</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
