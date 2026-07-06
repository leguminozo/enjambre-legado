'use client';

import Link from 'next/link';
import { CheckCircle, Clock, Package, Truck, XCircle } from 'lucide-react';
import { formatCLP } from '@/lib/shop/format';
import { getCourierLabel } from '@enjambre/logistica';
import { formatDate as formatDateBase } from '@enjambre/ui';

export type OrderTimelineItem = {
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
};

function formatDate(iso: string) {
  return formatDateBase(iso, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function resolveStatus(order: OrderTimelineItem): {
  label: string;
  tone: 'success' | 'error' | 'active' | 'muted';
} {
  const envio = order.logistica_envios[0];
  const raw = (envio?.status ?? order.estado ?? '').toLowerCase();

  if (raw.includes('cancel')) return { label: 'Cancelado', tone: 'error' };
  if (raw.includes('entreg')) return { label: 'Entregado', tone: 'success' };
  if (raw.includes('camino') || raw.includes('tránsito') || raw.includes('transito') || raw.includes('enviado')) {
    return { label: 'En tránsito', tone: 'active' };
  }
  if (raw.includes('prepar') || raw.includes('proces')) return { label: 'Procesando', tone: 'muted' };
  return { label: envio?.status ?? order.estado ?? 'Procesando', tone: 'muted' };
}

function StatusIcon({ tone }: { tone: 'success' | 'error' | 'active' | 'muted' }) {
  if (tone === 'success') return <CheckCircle size={16} className="text-success" />;
  if (tone === 'error') return <XCircle size={16} className="text-destructive" />;
  if (tone === 'active') return <Truck size={16} className="text-accent" />;
  return <Clock size={16} className="text-muted-foreground" />;
}

type OrdersTimelineProps = {
  orders: OrderTimelineItem[];
};

export function OrdersTimeline({ orders }: OrdersTimelineProps) {
  return (
    <div className="tienda-orders-timeline">
      {orders.map((order, index) => {
        const status = resolveStatus(order);
        const envio = order.logistica_envios[0];
        const isLast = index === orders.length - 1;

        return (
          <article key={order.id} className="tienda-orders-timeline-item">
            <div className="tienda-orders-timeline-rail" aria-hidden>
              <span className={`tienda-orders-timeline-dot is-${status.tone}`} />
              {!isLast ? <span className="tienda-orders-timeline-line" /> : null}
            </div>

            <div className="tienda-orders-timeline-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.created_at)}
                    {formatTime(order.created_at) ? ` · ${formatTime(order.created_at)}` : ''}
                  </p>
                  <h3 className="mt-1 font-display text-lg text-foreground">
                    Pedido #{order.id.slice(0, 8)}
                  </h3>
                </div>
                <span className={`tienda-orders-status is-${status.tone}`}>
                  <StatusIcon tone={status.tone} />
                  {status.label}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <p className="font-display text-accent">{formatCLP(order.total)}</p>
                {envio?.tracking_code ? (
                  <p className="text-xs font-mono text-muted-foreground">{envio.tracking_code}</p>
                ) : null}
              </div>

              {envio && status.tone === 'active' ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Seguimiento disponible
                  {envio.courier_code || envio.via
                    ? ` · ${getCourierLabel(envio.courier_code ?? envio.via)}`
                    : ''}
                </p>
              ) : null}

              {envio?.eta ? (
                <p className="mt-2 text-xs text-muted-foreground">ETA: {envio.eta}</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function OrdersTimelineEmpty() {
  return (
    <div className="rounded-3xl border border-border bg-secondary/30 p-12 text-center">
      <Package size={32} className="mx-auto text-muted-foreground/40 mb-4" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground mb-6">Sin pedidos.</p>
      <Link
        href="/catalogo"
        className="inline-block px-8 py-4 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.3em] font-bold rounded-xl hover:shadow-glow transition-all"
      >
        Catálogo
      </Link>
    </div>
  );
}