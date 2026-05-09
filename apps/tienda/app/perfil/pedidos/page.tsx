import React from 'react';
import { ShoppingBag, Package, Truck, CheckCircle, ArrowUpRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(
    amount,
  );
}

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
          <div className="w-10 h-10 rounded-lg bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227]">
            <ShoppingBag size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-[#f5f0e8]">Historial Ritual</h1>
        </div>
        <p className="text-[#8a8279] text-sm tracking-wide">Recorrido histórico de los frutos del bosque bajo tu custodia</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
          <p className="text-[#8a8279] font-display italic text-lg mb-8">
            Aún no has iniciado tu legado de consumo consciente.
          </p>
          <button className="px-8 py-4 bg-[#c9a227] text-black text-[0.7rem] uppercase tracking-[0.3em] font-bold rounded-xl hover:scale-105 transition-all">
            Visitar La Tienda
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/5 hover:border-[#c9a227]/20 transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex gap-6 items-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-[#4a4a4a] group-hover:text-[#c9a227] transition-colors shrink-0">
                    <Package size={24} />
                  </div>
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-[0.4em] text-[#c9a227] mb-1">Orden #{order.id.slice(0, 8)}</span>
                    <h4 className="font-display text-xl text-[#f5f0e8]">{formatDate(order.created_at)}</h4>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8 md:gap-12">
                  <div className="text-right">
                    <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[#4a4a4a] mb-1">Inversión</span>
                    <span className="text-lg font-display text-[#f5f0e8]">{formatCurrency(order.total || 0)}</span>
                  </div>

                  <div className="text-right">
                    <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[#4a4a4a] mb-1">Estado Vital</span>
                    <div className="flex items-center gap-2 justify-end">
                       <span className={`w-1.5 h-1.5 rounded-full ${order.estado === 'entregado' ? 'bg-emerald-500' : 'bg-[#c9a227] animate-pulse'}`} />
                       <span className="text-[0.65rem] uppercase tracking-widest text-[#f5f0e8] font-bold">{order.estado || 'Procesando'}</span>
                    </div>
                  </div>

                  <button className="p-3 bg-white/5 rounded-full text-[#4a4a4a] group-hover:text-[#c9a227] hover:bg-[#c9a227]/10 transition-all border border-transparent hover:border-[#c9a227]/20">
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </div>
              
              {/* Timeline Micro-visualization */}
              <div className="mt-8 pt-8 border-t border-white/[0.03] flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[#c9a227]">
                       <CheckCircle size={14} />
                       <span className="text-[0.6rem] uppercase tracking-widest font-bold">Pago Confirmado</span>
                    </div>
                    <div className="w-12 h-px bg-white/10" />
                    <div className={`flex items-center gap-2 ${order.estado === 'enviado' || order.estado === 'entregado' ? 'text-[#c9a227]' : 'text-[#4a4a4a]'}`}>
                       <Truck size={14} />
                       <span className="text-[0.6rem] uppercase tracking-widest font-bold">En Tránsito</span>
                    </div>
                 </div>
                 <p className="text-[0.6rem] text-[#4a4a4a] italic uppercase tracking-widest">Pureo Batch #CV-2025-04</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
