import { describe, expect, it } from 'vitest';
import { mapSubscriptionDashboardBundle } from './subscription-dashboard';

describe('subscription-dashboard', () => {
  it('normaliza join de plan y dirección de entrega', () => {
    const dashboard = mapSubscriptionDashboardBundle({
      subscription: {
        id: 'sub-1',
        status: 'active',
        current_period_end: '2026-08-01T00:00:00.000Z',
        metadata: { delivery_address: '  Calle 1  ' },
        subscription_plans: [
          {
            id: 'plan-1',
            name: 'Reposición mensual',
            key: 'monthly',
            price_clp: 12000,
            frequency: 'monthly',
            description: null,
          },
        ],
      },
      deliveries: [
        {
          id: 'del-1',
          period_number: 1,
          scheduled_for: '2026-08-01T00:00:00.000Z',
          status: 'scheduled',
          tracking_url: null,
        },
      ],
      plans: [
        {
          id: 'plan-1',
          name: 'Reposición mensual',
          key: 'monthly',
          price_clp: 12000,
          frequency: 'monthly',
          description: null,
        },
      ],
    });

    expect(dashboard.subscription?.delivery_address).toBe('Calle 1');
    expect(dashboard.subscription?.subscription_plans?.key).toBe('monthly');
    expect(dashboard.deliveries).toHaveLength(1);
    expect(dashboard.plans).toHaveLength(1);
  });

  it('devuelve null cuando no hay suscripción', () => {
    const dashboard = mapSubscriptionDashboardBundle({
      subscription: null,
      deliveries: [],
      plans: [],
    });

    expect(dashboard.subscription).toBeNull();
  });
});