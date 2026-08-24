'use client';

import React, { useTransition } from 'react';
import { Calendar, Leaf, ArrowRight } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { createHarvestPreOrder, type PreOrderRow } from '@/app/actions/perfil-experiences';

type ReservasClientProps = {
  preOrders: PreOrderRow[];
  featuredProduct: { id: string; nombre: string; precio: number } | null;
  cmsSettings?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    description?: string;
    button_text?: string;
    allow_prepayment?: boolean;
  };
};

export function ReservasClient({ preOrders, featuredProduct, cmsSettings }: ReservasClientProps) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = React.useState(1);

  const title = cmsSettings?.title || 'Reserva Anual';
  const subtitle = cmsSettings?.subtitle || 'Asegura tu parte del legado antes de que la naturaleza lo entregue';
  const description = cmsSettings?.description || 'Reserva anticipada vinculada a recolección de temporada. Te contactaremos para confirmar despacho y liquidación.';
  const buttonText = cmsSettings?.button_text || 'Garantizar Mi Cupo';

  const handleReserve = () => {
    if (!featuredProduct) {
      toast('No hay producto disponible para reservar', { type: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        await createHarvestPreOrder(featuredProduct.id, quantity);
        toast(`Reserva de ${quantity} cupo(s) registrada con éxito`, { type: 'success' });
      } catch (error) {
        toast(error instanceof Error ? error.message : 'No se pudo reservar', { type: 'error' });
      }
    });
  };

  return (
    <div className="space-y-16 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent-text">
            <Calendar size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">{title}</h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">
          {subtitle}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-3xl bg-card border border-border relative overflow-hidden">
          {featuredProduct ? (
            <>
              <h3 className="font-display text-3xl text-foreground mb-4">{featuredProduct.nombre}</h3>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                {description}
              </p>
              <div className="flex flex-wrap items-baseline gap-4 mb-8">
                <p className="text-2xl font-display text-foreground">
                  ${(featuredProduct.precio * quantity).toLocaleString('es-CL')}{' '}
                  <span className="text-[0.65rem] text-muted-foreground">
                    ({quantity} {quantity === 1 ? 'unidad' : 'unidades'} · ${featuredProduct.precio.toLocaleString('es-CL')} c/u)
                  </span>
                </p>
              </div>

              {/* Selector de cantidad */}
              <div className="flex items-center gap-4 mb-8">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Cantidad de cupos:</span>
                <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isPending}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-sm hover:bg-muted transition-colors disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-mono font-bold text-foreground">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= 10 || isPending}
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="px-3 py-1.5 text-sm hover:bg-muted transition-colors disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={isPending}
                onClick={handleReserve}
                className="px-12 py-5 bg-primary text-primary-foreground text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl flex items-center gap-3 disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {isPending ? 'Reservando…' : buttonText} <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No hay recolecciones abiertas por ahora.</p>
          )}
        </div>

        <div className="p-8 rounded-3xl bg-secondary/50 border border-border">
          <div className="flex items-center gap-3 mb-6 text-accent-text">
            <Leaf size={18} />
            <h4 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Tus reservas activas</h4>
          </div>
          {preOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aún no tienes reservas activas.</p>
          ) : (
            <ul className="space-y-4">
              {preOrders.map((order) => (
                <li key={order.id} className="text-xs text-muted-foreground border-b border-border/50 pb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{order.productos?.nombre || 'Reserva Anual'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent-text uppercase font-bold tracking-wider">
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Cupos: <strong className="text-foreground">{order.quantity}</strong></span>
                    <span>{new Date(order.created_at).toLocaleDateString('es-CL')}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}