'use client';

import React, { useTransition } from 'react';
import { Calendar, Leaf, ArrowRight, Truck, XCircle, MessageCircle } from 'lucide-react';
import { toast, friendlyError, ConfirmDialog } from '@enjambre/ui';
import {
  createHarvestPreOrder,
  cancelHarvestPreOrder,
  type PreOrderRow,
} from '@/app/actions/perfil-experiences';
import { alignToClass, type TextAlign } from '@/lib/shop/store-chrome';

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
    text_align?: TextAlign;
  };
  embedded?: boolean;
};

const PREORDER_STATUS_MAP: Record<string, { label: string; className: string }> = {
  reserved: {
    label: 'Reservado',
    className: 'bg-accent/15 text-accent-text border border-accent/25',
  },
  contacted: {
    label: 'En Coordinación',
    className: 'bg-accent/15 text-accent-text border border-accent/25',
  },
  confirmed: {
    label: 'Confirmado',
    className: 'bg-success/15 text-success-text border border-success/25',
  },
  paid: {
    label: 'Pagado',
    className: 'bg-success/15 text-success-text border border-success/25',
  },
  preparing: {
    label: 'En Recolección',
    className: 'bg-primary/10 text-primary border border-primary/25',
  },
  fulfilled: {
    label: 'Despachado',
    className: 'bg-primary/10 text-primary border border-primary/25',
  },
  completed: {
    label: 'Entregado',
    className: 'bg-secondary text-muted-foreground border border-border',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-destructive/10 text-destructive border border-destructive/20',
  },
};

function formatStatus(status: string) {
  const normalized = status.toLowerCase();
  return PREORDER_STATUS_MAP[normalized] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
    className: 'bg-accent/15 text-accent-text border border-accent/25',
  };
}

export function ReservasClient({ preOrders, featuredProduct, cmsSettings, embedded = false }: ReservasClientProps) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = React.useState(1);
  const [cancelTarget, setCancelTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [cancelLoading, setCancelLoading] = React.useState(false);

  const title = cmsSettings?.title || 'Reserva Anual de Recolección';
  const subtitle = cmsSettings?.subtitle || 'Asegura tu parte de la recolección estacional del bosque nativo antes de que concluya la temporada';
  const description = cmsSettings?.description || 'Asignación anticipada de cupos vinculada a la recolección anual de temporada en Chiloé. Te contactaremos al correo registrado para confirmar despacho y liquidación.';
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
        toast(friendlyError(error, 'No se pudo reservar'), { type: 'error' });
      }
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await cancelHarvestPreOrder(cancelTarget.id);
      toast(`Tu reserva para "${cancelTarget.name}" fue cancelada y el cupo ha sido liberado.`, { type: 'success' });
      setCancelTarget(null);
    } catch (err) {
      toast(friendlyError(err, 'No se pudo cancelar la reserva'), { type: 'error' });
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in">
      {!embedded && (
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
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-3xl bg-card border border-border relative overflow-hidden">
          {featuredProduct ? (
            <>
              <h3 className="font-display text-3xl text-foreground mb-4">{featuredProduct.nombre}</h3>
              <p className={`text-sm text-muted-foreground mb-8 leading-relaxed whitespace-pre-line ${alignToClass(cmsSettings?.text_align)}`}>
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

              {/* Garantía y coordinación de destino */}
              <div className="mt-8 pt-6 border-t border-border/60 flex items-start gap-3 text-xs text-muted-foreground">
                <Truck size={16} className="text-accent shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-foreground font-medium">Coordinación de Entrega:</strong> Al concluir la maduración y recolección en Chiloé, te contactaremos al correo registrado para confirmar tu dirección definitiva de despacho. Sin costos ocultos.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No hay recolecciones abiertas por ahora.</p>
          )}
        </div>

        <div className="p-8 rounded-3xl bg-secondary/50 border border-border">
          <div className="flex items-center gap-3 mb-6 text-accent-text">
            <Leaf size={18} />
            <h4 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Tus reservas registradas</h4>
          </div>
          {preOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aún no tienes reservas activas.</p>
          ) : (
            <ul className="space-y-4">
              {preOrders.map((order) => {
                const statusInfo = formatStatus(order.status);
                const refCode = `#RES-${order.id.slice(0, 6).toUpperCase()}`;
                const productName = order.productos?.nombre || 'Reserva Anual de Recolección';
                const canCancel = order.status === 'reserved' || order.status === 'contacted';
                const isCancelled = order.status === 'cancelled';
                const waMessage = encodeURIComponent(
                  `Hola, quisiera consultar sobre mi reserva ${refCode} (${productName})`
                );
                const waUrl = `https://wa.me/56940831358?text=${waMessage}`;

                return (
                  <li
                    key={order.id}
                    className={`text-xs text-muted-foreground border-b border-border/50 pb-4 space-y-2.5 ${
                      isCancelled ? 'opacity-65' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-medium text-foreground block">{productName}</span>
                        <span className="font-mono text-[10px] text-accent-text">{refCode}</span>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span>Cupos: <strong className="text-foreground">{order.quantity} {order.quantity === 1 ? 'unidad' : 'unidades'}</strong></span>
                      <span className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>

                    {isCancelled ? (
                      <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1.5 italic">
                        <span>Cupo cancelado y liberado · Sin cobros pendientes</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                        <span>Recolección Temporada 2026/2027 · Despacho coordinado a domicilio</span>
                      </div>
                    )}

                    {/* Acciones de gestión para el cliente */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/30 text-[11px]">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        title="Consultar al equipo de Chiloé"
                      >
                        <MessageCircle size={13} className="text-accent" />
                        <span>Consultar</span>
                      </a>

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget({ id: order.id, name: productName })}
                          className="inline-flex items-center gap-1 text-destructive/80 hover:text-destructive transition-colors text-[11px] font-medium"
                        >
                          <XCircle size={13} />
                          <span>Cancelar cupo</span>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="¿Cancelar reserva de recolección?"
        description={`Estás a punto de liberar tu cupo para "${cancelTarget?.name ?? ''}". Si decides reservarlo más adelante, dependerá de la disponibilidad de la partida.`}
        confirmLabel="Sí, cancelar reserva"
        cancelLabel="Volver"
        variant="destructive"
        loading={cancelLoading}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}