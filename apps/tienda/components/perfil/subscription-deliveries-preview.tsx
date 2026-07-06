'use client';

import { useTranslations } from 'next-intl';
import { Truck } from 'lucide-react';
import type { SubscriptionDelivery } from '@/app/actions/perfil-experiences';
import { formatDate as formatDateBase } from '@enjambre/ui';

type SubscriptionDeliveriesPreviewProps = {
  deliveries: SubscriptionDelivery[];
};

function formatDate(iso: string) {
  return formatDateBase(iso, { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusKey(status: string): 'scheduled' | 'shipped' | 'delivered' | 'canceled' | null {
  const raw = status.toLowerCase();
  if (raw.includes('cancel')) return 'canceled';
  if (raw.includes('deliver') || raw.includes('entreg')) return 'delivered';
  if (raw.includes('ship') || raw.includes('envi')) return 'shipped';
  if (raw.includes('sched') || raw.includes('pend') || raw.includes('process')) return 'scheduled';
  return null;
}

export function SubscriptionDeliveriesPreview({ deliveries }: SubscriptionDeliveriesPreviewProps) {
  const t = useTranslations('perfil.reposicion.deliveries');

  if (deliveries.length === 0) return null;

  return (
    <section className="space-y-4">
      <h3 className="font-display text-xl text-foreground">{t('title')}</h3>
      <ul className="space-y-2">
        {deliveries.map((delivery) => {
          const key = statusKey(delivery.status);
          const statusLabel = key ? t(key) : delivery.status;

          return (
            <li
              key={delivery.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3"
            >
              <div>
                <p className="text-sm text-foreground">
                  {t('cycle', { n: delivery.period_number })} · {formatDate(delivery.scheduled_for)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{statusLabel}</p>
              </div>
              {delivery.tracking_url ? (
                <a
                  href={delivery.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                >
                  <Truck size={12} />
                  {t('tracking')}
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** @deprecated Use SubscriptionDelivery */
export type SubscriptionDeliveryRow = SubscriptionDelivery;