'use client';

import { Calendar, Package, CircleDollarSign, Sparkles, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatCLP } from '@/lib/shop/format';
import { translateDeliveryCountdown } from '@/lib/shop/replenishment-i18n';

type ReplenishmentOverviewProps = {
  active: boolean;
  nextDeliveryIso: string | null;
  intervalTotal: number | null;
  paused?: boolean;
  pastDue?: boolean;
};

export function ReplenishmentOverview({
  active,
  nextDeliveryIso,
  intervalTotal,
  paused = false,
  pastDue = false,
}: ReplenishmentOverviewProps) {
  const t = useTranslations('perfil.reposicion.overview');
  const tRoot = useTranslations('perfil.reposicion');

  if (!active && !paused && !pastDue) {
    return (
      <div className="rounded-3xl border border-border bg-card/60 p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-accent-text text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={15} />
              <span>Abastecimiento Cíclico</span>
            </div>
            <h3 className="font-display text-2xl text-foreground">
              Sin reposición activa
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Configura tu reposición periódica para recibir miel pura y cruda cosechada en Chiloé directo en tu puerta, con prioridad de lote y sin preocupaciones de stock.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-secondary/60 border border-border/60">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Check size={14} className="text-accent" /> 100% Flexible
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Cancela cuando quieras</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-secondary/60 border border-border/60">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Check size={14} className="text-accent" /> Pausa en 1 clic
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Si viajas o tienes stock</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-secondary/60 border border-border/60">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Check size={14} className="text-accent" /> Lote Asegurado
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Prioridad de cosecha</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nextLabel = nextDeliveryIso
    ? new Date(nextDeliveryIso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
    : '—';
  const countdown = nextDeliveryIso
    ? translateDeliveryCountdown(tRoot, nextDeliveryIso)
    : t('noDeliveries');

  return (
    <div className="tienda-replenishment-overview">
      <div className="tienda-replenishment-overview-card">
        <div className="tienda-replenishment-overview-head">
          <Package size={18} className="text-accent" strokeWidth={2} />
          <span className="tienda-replenishment-overview-title">{t('active')}</span>
        </div>
        <p className="tienda-replenishment-overview-value">{active && !paused ? '1' : '0'}</p>
        <p className="tienda-replenishment-overview-sub">
          {pastDue ? t('pastDue') : paused ? t('paused') : active ? t('inProgress') : t('none')}
        </p>
      </div>

      <div className="tienda-replenishment-overview-card">
        <div className="tienda-replenishment-overview-head">
          <Calendar size={18} className="text-accent" strokeWidth={2} />
          <span className="tienda-replenishment-overview-title">{t('delivery')}</span>
        </div>
        <p className="tienda-replenishment-overview-value">{nextLabel}</p>
        <p className="tienda-replenishment-overview-sub">{countdown}</p>
      </div>

      <div className="tienda-replenishment-overview-card">
        <div className="tienda-replenishment-overview-head">
          <CircleDollarSign size={18} className="text-accent" strokeWidth={2} />
          <span className="tienda-replenishment-overview-title">{t('total')}</span>
        </div>
        <p className="tienda-replenishment-overview-value">
          {intervalTotal != null ? formatCLP(intervalTotal) : '—'}
        </p>
        <p className="tienda-replenishment-overview-sub">{t('perInterval')}</p>
      </div>
    </div>
  );
}