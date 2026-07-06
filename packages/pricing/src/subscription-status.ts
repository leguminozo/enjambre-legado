/** Estados de reposición — fuente compartida tienda + núcleo. */

export const SUBSCRIPTION_VISIBLE_STATUSES = [
  'active',
  'trialing',
  'paused',
  'past_due',
] as const;

export type SubscriptionVisibleStatus = (typeof SUBSCRIPTION_VISIBLE_STATUSES)[number];

/** Impide alta nueva (init checkout); `past_due` queda fuera para permitir regularizar pago. */
export const SUBSCRIPTION_BLOCKING_STATUSES = [
  'active',
  'trialing',
  'paused',
] as const;

export type SubscriptionBlockingStatus = (typeof SUBSCRIPTION_BLOCKING_STATUSES)[number];

export function isReplenishmentLive(status: string): boolean {
  return (
    status === 'active' ||
    status === 'trialing' ||
    status === 'paused' ||
    status === 'past_due'
  );
}

export function canPauseReplenishment(status: string): boolean {
  return status === 'active' || status === 'trialing';
}

export function canResumeReplenishment(status: string): boolean {
  return status === 'paused';
}

export function isPastDue(status: string): boolean {
  return status === 'past_due';
}