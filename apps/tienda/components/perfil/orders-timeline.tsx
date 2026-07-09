'use client';

import Link from 'next/link';
import { CheckCircle, Clock, Package, Truck, XCircle, FileText, ShieldCheck } from 'lucide-react';
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
  dte?: {
    numero: number;
    estado_sii: string;
    buyOrder: string;
  };
  lotes?: string[];
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

              <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-border/50">
                {order.dte ? (
                  <a
                    href={`${process.env.NEXT_PUBLIC_NUCLEO_API_URL || 'http://localhost:3000'}/api/sii/boletas/${order.dte.buyOrder}/xml`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest bg-surface-raised border border-border rounded-xl text-foreground hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all"
                  >
                    <FileText size={14} />
                    <span>Boleta Electrónica</span>
                  </a>
                ) : null}

                {order.lotes && order.lotes.length > 0 ? (
                  <Link
                    href={`/perfil/trazabilidad?lote=${encodeURIComponent(order.lotes[0])}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest bg-accent/20 border border-accent/30 text-accent rounded-xl hover:bg-accent hover:text-accent-foreground hover:shadow-glow transition-all"
                  >
                    <ShieldCheck size={14} />
                    <span>Trazabilidad de Origen</span>
                  </Link>
                ) : null}
              </div>
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