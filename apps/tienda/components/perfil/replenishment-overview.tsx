'use client';

import { Calendar, Package, CircleDollarSign } from 'lucide-react';
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