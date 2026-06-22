import React from 'react';
import { ShoppingBag, Package, Truck, CheckCircle, ArrowUpRight, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { formatCLP } from '@/lib/shop/format';
import { getCourierLabel } from '@enjambre/logistica';
import { formatDate as formatDateBase } from '@enjambre/ui';

function formatDate(iso: string) {
  return formatDateBase(iso, { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Order {
  id: string;
  created_at: string;
  total: number;
  estado: string;
  logistica_envios: Array<{
    tracking_code: string;
    status: string;
    via: string;
    courier_code?: string | null;
    eta?: string;
  }>;
}

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let orders: Order[] | null = null;
  if (user) {
    const { data } = await supabase
      .from('ventas')
      .select('*, logistica_envios(tracking_code, status, via, courier_code, eta)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    orders = data as Order[] | null;
  }

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
          {orders.map((order) => {
            const orderId = String(order.id ?? '');
            const createdAt = String(order.created_at ?? '');
            const total = (order.total as number) ?? 0;
            const estado = String(order.estado ?? 'Procesando');
            const envios = Array.isArray(order.logistica_envios) ? order.logistica_envios : [];
            const envio = envios[0]; // Tomamos el primer envío vinculado
            
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
                    {envio && (
                      <div className="text-right">
                        <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-1">Tracking</span>
                        <span className="text-sm font-mono text-accent">{envio.tracking_code}</span>
                      </div>
                    )}

                    <div className="text-right">
                      <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-1">Inversión</span>
                      <span className="text-lg font-display text-foreground">{formatCLP(total)}</span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-1">Estado Vital</span>
                      <div className="flex items-center gap-2 justify-end">
                        <span className={`w-1.5 h-1.5 rounded-full ${estado === 'entregado' || (envio && envio.status === 'Entregado') ? 'bg-success' : 'bg-accent animate-pulse'}`} />
                        <span className="text-[0.65rem] uppercase tracking-widest text-foreground font-bold">{envio ? envio.status : estado}</span>
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
                    <div className={`flex items-center gap-2 ${estado === 'enviado' || (envio && ['Enviado', 'En Tránsito', 'Entregado'].includes(envio.status)) ? 'text-accent' : 'text-muted-foreground'}`}>
                      <Truck size={14} />
                      <span className="text-[0.6rem] uppercase tracking-widest font-bold">{envio ? envio.status : 'Preparando'}</span>
                    </div>
                    {envio?.eta && (
                      <>
                        <div className="w-12 h-px bg-border" />
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span className="text-[0.6rem] uppercase tracking-widest font-bold">ETA: {envio.eta}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {envio && (
                    <p className="text-[0.6rem] text-muted-foreground italic uppercase tracking-widest">
                      Courier: {getCourierLabel(envio.courier_code ?? envio.via)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
