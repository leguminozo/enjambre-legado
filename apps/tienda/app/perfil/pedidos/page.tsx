import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import {
  OrdersTimeline,
  OrdersTimelineEmpty,
  type OrderTimelineItem,
} from '@/components/perfil/orders-timeline';

export default async function PedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let orders: OrderTimelineItem[] = [];
  if (user) {
    const { data: ventasData } = await supabase
      .from('ventas')
      .select('id, buy_order, created_at, total, estado, logistica_envios(tracking_code, status, via, courier_code, eta)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ventasData && ventasData.length > 0) {
      const ventaIds = ventasData.map((v) => `venta:${v.id}`);
      const { data: dtes } = await supabase
        .from('facturas_emitidas')
        .select('id, numero, estado_sii, idempotency_key')
        .in('idempotency_key', ventaIds);

      orders = ventasData.map((v) => {
        const dte = dtes?.find((d) => d.idempotency_key === `venta:${v.id}`);
        return {
          ...v,
          dte: dte
            ? {
                numero: dte.numero,
                estado_sii: dte.estado_sii,
                buyOrder: v.buy_order,
              }
            : undefined,
        } as OrderTimelineItem;
      });
    }
  }

  return (
    <div className="space-y-12 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <ShoppingBag size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">Pedidos</h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">Historial de entregas</p>
      </div>

      {orders.length === 0 ? <OrdersTimelineEmpty /> : <OrdersTimeline orders={orders} />}
    </div>
  );
}