'use client';

import Link from 'next/link';
import { CheckCircle, Clock, Package, Truck, XCircle, FileText, ShieldCheck, Star, MessageCircle, ExternalLink } from 'lucide-react';
import { formatCLP } from '@/lib/shop/format';
import { getCourierLabel } from '@enjambre/logistica';
import { formatDate as formatDateBase, EmptyState, Button } from '@enjambre/ui';

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
  items?: Array<{
    nombre?: string;
    cantidad?: number;
    precio_unitario?: number;
    producto_id?: string;
    slug?: string;
  }>;
  resena?: {
    id: string;
    estado: string;
    rating: number;
  };
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

function getTrackingUrl(courierCode?: string | null, via?: string | null, trackingCode?: string | null): string | null {
  if (!trackingCode) return null;
  const code = `${courierCode || ''} ${via || ''}`.toLowerCase();
  if (code.includes('chilexpress')) {
    return `https://www.chilexpress.cl/tracking/?numero=${encodeURIComponent(trackingCode)}`;
  }
  if (code.includes('blue') || code.includes('bx')) {
    return `https://www.bluex.cl/seguimiento/?tracking=${encodeURIComponent(trackingCode)}`;
  }
  if (code.includes('starken')) {
    return `https://www.starken.cl/seguimiento?codigo=${encodeURIComponent(trackingCode)}`;
  }
  return null;
}

function resolveStatus(order: OrderTimelineItem): {
  label: string;
  tone: 'success' | 'error' | 'active' | 'muted';
  step: number;
} {
  const envio = order.logistica_envios[0];
  const raw = (envio?.status ?? order.estado ?? '').toLowerCase();

  if (raw.includes('cancel')) return { label: 'Cancelado', tone: 'error', step: 0 };
  if (raw.includes('entreg')) return { label: 'Entregado', tone: 'success', step: 4 };
  if (raw.includes('camino') || raw.includes('tránsito') || raw.includes('transito') || raw.includes('enviado')) {
    return { label: 'En tránsito', tone: 'active', step: 3 };
  }
  if (raw.includes('prepar') || raw.includes('proces') || raw.includes('embal')) return { label: 'En preparación', tone: 'active', step: 2 };
  return { label: envio?.status ?? order.estado ?? 'Confirmado', tone: 'muted', step: 1 };
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
    <div className="tienda-orders-timeline space-y-6">
      {orders.map((order, index) => {
        const status = resolveStatus(order);
        const envio = order.logistica_envios[0];
        const isLast = index === orders.length - 1;
        const trackingUrl = getTrackingUrl(envio?.courier_code, envio?.via, envio?.tracking_code);

        return (
          <article key={order.id} className="tienda-orders-timeline-item">
            <div className="tienda-orders-timeline-rail" aria-hidden>
              <span className={`tienda-orders-timeline-dot is-${status.tone}`} />
              {!isLast ? <span className="tienda-orders-timeline-line" /> : null}
            </div>

            <div className="tienda-orders-timeline-card p-6 sm:p-8 rounded-3xl bg-card border border-border space-y-6 shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.created_at)}
                    {formatTime(order.created_at) ? ` · ${formatTime(order.created_at)}` : ''}
                  </p>
                  <h3 className="mt-1 font-display text-xl text-foreground">
                    Pedido #{order.id.slice(0, 8)}
                  </h3>
                </div>
                <span className={`tienda-orders-status is-${status.tone} flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold`}>
                  <StatusIcon tone={status.tone} />
                  {status.label}
                </span>
              </div>

              {/* Stepper visual de despacho */}
              {status.step > 0 && (
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    <span className={status.step >= 1 ? 'text-accent font-bold' : ''}>1. Confirmado</span>
                    <span className={status.step >= 2 ? 'text-accent font-bold' : ''}>2. Sellado en Frío</span>
                    <span className={status.step >= 3 ? 'text-accent font-bold' : ''}>3. En Tránsito</span>
                    <span className={status.step >= 4 ? 'text-emerald-500 font-bold' : ''}>4. Entregado</span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        status.step === 4 ? 'bg-emerald-500 w-full' : status.step === 3 ? 'bg-accent w-3/4' : status.step === 2 ? 'bg-accent w-2/4' : 'bg-accent w-1/4'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="font-display text-xl text-accent-text">{formatCLP(order.total)}</p>
                {envio?.tracking_code ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      Guía: <strong className="text-foreground">{envio.tracking_code}</strong>
                    </span>
                    {trackingUrl && (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-accent/10 text-accent-text hover:bg-accent/20 text-xs font-medium transition-colors"
                      >
                        <span>Seguir Courier</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ) : null}
              </div>

              {envio && status.tone === 'active' ? (
                <p className="text-xs text-muted-foreground">
                  Courier asignado:
                  {envio.courier_code || envio.via
                    ? ` · ${getCourierLabel(envio.courier_code ?? envio.via)}`
                    : ' Red de Despacho Chiloé'}
                </p>
              ) : null}

              {envio?.eta ? (
                <p className="text-xs text-muted-foreground">Entrega estimada: {envio.eta}</p>
              ) : null}

              {/* Desglose de Productos en el Pedido */}
              {order.items && order.items.length > 0 && (
                <div className="pt-3 border-t border-border/50 space-y-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                    Productos del Pedido
                  </span>
                  <div className="divide-y divide-border/30 rounded-xl bg-surface-sunken/40 border border-border/40 px-3.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-foreground font-medium truncate">{item.nombre}</span>
                          <span className="text-muted-foreground font-mono">×{item.cantidad}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {item.precio_unitario ? (
                            <span className="text-foreground/80 font-mono">
                              {formatCLP(item.precio_unitario * (item.cantidad || 1))}
                            </span>
                          ) : null}
                          {order.lotes && order.lotes[idx] ? (
                            <Link
                              href={`/perfil/trazabilidad?lote=${encodeURIComponent(order.lotes[idx])}`}
                              className="text-[10px] font-mono text-accent-text hover:text-accent underline flex items-center gap-1"
                            >
                              <span>Lote {order.lotes[idx]}</span>
                              <ExternalLink size={10} />
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
                {order.dte ? (
                  <a
                    href={`${process.env.NEXT_PUBLIC_NUCLEO_API_URL || 'http://localhost:3000'}/api/sii/boletas/${order.dte.buyOrder}/xml`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest bg-surface-raised border border-border rounded-xl text-foreground hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all"
                  >
                    <FileText size={14} />
                    <span>Boleta SII #{order.dte.numero}</span>
                  </a>
                ) : (
                  <span className="inline-flex min-h-10 items-center gap-2 px-3.5 py-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 bg-surface-sunken/40 border border-border/40 rounded-xl">
                    <FileText size={14} className="opacity-50" />
                    <span>Boleta Electrónica SII</span>
                  </span>
                )}

                {order.lotes && order.lotes.length > 0 ? (
                  <Link
                    href={`/perfil/trazabilidad?lote=${encodeURIComponent(order.lotes[0])}`}
                    className="inline-flex min-h-10 items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest bg-accent/20 border border-accent/30 text-accent rounded-xl hover:bg-accent hover:text-accent-foreground hover:shadow-glow transition-all"
                  >
                    <ShieldCheck size={14} />
                    <span>Trazabilidad de Lote</span>
                  </Link>
                ) : (
                  <Link
                    href="/perfil/trazabilidad"
                    className="inline-flex min-h-10 items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest bg-surface-raised border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-border/80 transition-all"
                  >
                    <ShieldCheck size={14} />
                    <span>Verificar Lote</span>
                  </Link>
                )}

                {status.tone === 'success' ? (
                  order.resena ? (
                    <span className="inline-flex min-h-10 items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest bg-success/10 border border-success/20 text-success-text rounded-xl">
                      <Star size={14} className="fill-success" />
                      <span>{order.resena.estado === 'aprobada' ? 'Reseña publicada' : 'Reseña en moderación'}</span>
                    </span>
                  ) : order.items && order.items.length > 0 && order.items[0]?.slug ? (
                    <Link
                      href={`/producto/${order.items[0].slug}#resenas`}
                      className="inline-flex min-h-10 items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest bg-surface-raised border border-border rounded-xl text-foreground hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all"
                    >
                      <MessageCircle size={14} />
                      <span>Escribir reseña</span>
                    </Link>
                  ) : null
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
    <EmptyState
      icon={<Package className="w-8 h-8 opacity-50 text-accent" />}
      title="Aún sin pedidos registrados"
      description="Tu primer ciclo de miel o reserva anual generará aquí tu comprobante electrónico del SII, seguimiento logístico en ruta y certificación de trazabilidad de lote."
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/catalogo">
            <Button type="button" variant="gold" className="min-h-11">
              Explorar Catálogo
            </Button>
          </Link>
          <Link href="/perfil/trazabilidad">
            <Button type="button" variant="outline" className="min-h-11">
              Verificar un Lote
            </Button>
          </Link>
        </div>
      }
      className="rounded-2xl border border-dashed border-border bg-surface-sunken my-4 p-8 sm:p-12"
    />
  );
}