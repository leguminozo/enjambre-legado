import type { SubscriptionPlan } from '@/app/actions/perfil-experiences';

export type ReplenishmentPlan = Pick<
  SubscriptionPlan,
  'id' | 'name' | 'key' | 'price_clp' | 'frequency' | 'description'
> & {
  included_items?: unknown;
};

export function deliveryAddressFromMetadata(metadata: unknown): string | null {
  if (typeof metadata !== 'object' || metadata === null) return null;
  const value = (metadata as Record<string, unknown>).delivery_address;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function frequencyLabel(frequency: string): string {
  switch (frequency) {
    case 'monthly':
      return 'Mensual';
    case 'quarterly':
      return 'Trimestral';
    case 'annual':
      return 'Anual';
    case 'biweekly':
      return 'Quincenal';
    case 'weekly':
      return 'Semanal';
    default:
      return frequency;
  }
}

function parseIncludedProductIds(included: unknown): string[] {
  if (!Array.isArray(included)) return [];
  return included
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null;
      const record = item as Record<string, unknown>;
      if (typeof record.product_id === 'string') return record.product_id;
      if (typeof record.productId === 'string') return record.productId;
      return null;
    })
    .filter((id): id is string => Boolean(id));
}

/** Sugiere plan por `included_items` o por intervalo mensual. */
export function suggestPlanForProduct(
  productId: string,
  plans: ReplenishmentPlan[],
): ReplenishmentPlan | null {
  if (plans.length === 0) return null;

  for (const plan of plans) {
    const ids = parseIncludedProductIds(plan.included_items);
    if (ids.includes(productId)) return plan;
  }

  return plans.find((p) => p.key === 'monthly') ?? plans[0] ?? null;
}

/** Plan por defecto al elegir intervalo (mensual o primero disponible). */
export function defaultPlanId(plans: ReplenishmentPlan[]): string {
  return plans.find((p) => p.key === 'monthly')?.id ?? plans[0]?.id ?? '';
}

export function daysUntil(isoDate: string): number | null {
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDeliveryCountdown(isoDate: string): string {
  const days = daysUntil(isoDate);
  if (days === null) return '—';
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days < 0) return 'Pendiente';
  return `En ${days} días`;
}