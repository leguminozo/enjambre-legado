'use client';

import { daysUntil } from '@/lib/shop/replenishment';

const KNOWN_FREQUENCIES = new Set(['monthly', 'quarterly', 'annual', 'biweekly', 'weekly']);

type TranslateFn = (key: string, values?: Record<string, string | number | Date>) => string;

export function translateFrequency(t: TranslateFn, frequency: string): string {
  if (KNOWN_FREQUENCIES.has(frequency)) {
    return t(`frequency.${frequency}`);
  }
  return frequency;
}

export function translateDeliveryCountdown(t: TranslateFn, isoDate: string): string {
  const days = daysUntil(isoDate);
  if (days === null) return '—';
  if (days === 0) return t('countdown.today');
  if (days === 1) return t('countdown.tomorrow');
  if (days < 0) return t('countdown.pending');
  return t('countdown.inDays', { days });
}