'use client';

import React, { useTransition } from 'react';
import { Calendar, Leaf, ArrowRight } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { createHarvestPreOrder, type PreOrderRow } from '@/app/actions/perfil-experiences';

type ReservasClientProps = {
  preOrders: PreOrderRow[];
  featuredProduct: { id: string; nombre: string; precio: number } | null;
};

export function ReservasClient({ preOrders, featuredProduct }: ReservasClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleReserve = () => {
    if (!featuredProduct) {
      toast('No hay producto disponible para reservar', { type: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        await createHarvestPreOrder(featuredProduct.id, 1);
        toast('Reserva registrada', { type: 'success' });
      } catch (error) {
        toast(error instanceof Error ? error.message : 'No se pudo reservar', { type: 'error' });
      }
    });
  };

  return (
    <div className="space-y-16 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <Calendar size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">Reserva de Cosecha</h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">
          Asegura tu parte del legado antes de que la naturaleza lo entregue
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-3xl bg-card border border-border">
          {featuredProduct ? (
            <>
              <h3 className="font-display text-3xl text-foreground mb-4">{featuredProduct.nombre}</h3>
              <p className="text-sm text-muted-foreground mb-8">
                Reserva anticipada vinculada a cosecha de temporada. Te contactaremos para confirmar
                despacho y liquidación.
              </p>
              <p className="text-xl font-display text-foreground mb-8">
                ${featuredProduct.precio.toLocaleString('es-CL')}{' '}
                <span className="text-[0.65rem] text-muted-foreground">referencial / unidad</span>
              </p>
              <button
                type="button"
                disabled={isPending}
                onClick={handleReserve}
                className="px-12 py-5 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl flex items-center gap-3 disabled:opacity-50"
              >
                {isPending ? 'Reservando…' : 'Garantizar Mi Cupo'} <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No hay cosechas abiertas por ahora.</p>
          )}
        </div>

        <div className="p-8 rounded-3xl bg-secondary/50 border border-border">
          <div className="flex items-center gap-3 mb-6 text-accent">
            <Leaf size={18} />
            <h4 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Tus reservas</h4>
          </div>
          {preOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aún no tienes reservas activas.</p>
          ) : (
            <ul className="space-y-4">
              {preOrders.map((order) => (
                <li key={order.id} className="text-xs text-muted-foreground border-b border-border pb-3">
                  <span className="block text-foreground capitalize">{order.status}</span>
                  Cantidad: {order.quantity} ·{' '}
                  {new Date(order.created_at).toLocaleDateString('es-CL')}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}