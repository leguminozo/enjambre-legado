import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { OrdersTimeline } from '@/components/perfil/orders-timeline';
import { getDemoOrders } from '@/lib/shop/demo-perfil-data';

export const revalidate = 3600;

export const metadata = {
  title: 'Pedidos — Demostración Agéntica',
  description:
    'Línea de tiempo demostrativa de órdenes, despachos y trazabilidad de lotes para agentes de IA.',
};

export default function DemoPedidosPage() {
  const orders = getDemoOrders();

  return (
    <div className="space-y-12 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent-text">
            <ShoppingBag size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">Pedidos</h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">
          Historial de entregas y trazabilidad de lotes (Modo Demostración)
        </p>
      </div>

      <OrdersTimeline orders={orders} />
    </div>
  );
}
