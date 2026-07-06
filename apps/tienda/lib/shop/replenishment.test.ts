import { describe, expect, it } from 'vitest';
import {
  daysUntil,
  defaultPlanId,
  deliveryAddressFromMetadata,
  formatDeliveryCountdown,
  frequencyLabel,
  suggestPlanForProduct,
} from './replenishment';

describe('replenishment', () => {
  it('defaultPlanId prefiere mensual', () => {
    const plans = [
      { id: 'a', key: 'annual', name: 'Anual', price_clp: 1, frequency: 'annual', description: null },
      { id: 'b', key: 'monthly', name: 'Mensual', price_clp: 2, frequency: 'monthly', description: null },
    ];
    expect(defaultPlanId(plans)).toBe('b');
  });
  it('deliveryAddressFromMetadata extrae dirección', () => {
    expect(deliveryAddressFromMetadata({ delivery_address: '  Calle 1  ' })).toBe('Calle 1');
    expect(deliveryAddressFromMetadata({})).toBeNull();
    expect(deliveryAddressFromMetadata(null)).toBeNull();
  });

  it('frequencyLabel traduce claves conocidas', () => {
    expect(frequencyLabel('monthly')).toBe('Mensual');
    expect(frequencyLabel('quarterly')).toBe('Trimestral');
  });

  it('suggestPlanForProduct prioriza included_items', () => {
    const plans = [
      {
        id: 'a',
        name: 'Mensual',
        key: 'monthly',
        price_clp: 10000,
        frequency: 'monthly',
        description: null,
        included_items: [{ product_id: 'p1' }],
      },
      {
        id: 'b',
        name: 'Anual',
        key: 'annual',
        price_clp: 90000,
        frequency: 'annual',
        description: null,
        included_items: [],
      },
    ];
    expect(suggestPlanForProduct('p1', plans)?.id).toBe('a');
  });

  it('formatDeliveryCountdown calcula días', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(formatDeliveryCountdown(tomorrow.toISOString())).toBe('Mañana');
    expect(daysUntil('invalid')).toBeNull();
  });
});