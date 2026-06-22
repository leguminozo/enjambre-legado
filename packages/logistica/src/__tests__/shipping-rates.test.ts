import { describe, it, expect } from 'vitest';
import { computeShippingCost, FREE_SHIPPING_SUBTOTAL } from '../shipping-rates';

describe('computeShippingCost', () => {
  it('Los Lagos más barato que RM', () => {
    const losLagos = computeShippingCost({
      region: 'Los Lagos',
      courierCode: 'blueexpress',
      subtotalClp: 10000,
    });
    const rm = computeShippingCost({
      region: 'Metropolitana',
      courierCode: 'blueexpress',
      subtotalClp: 10000,
    });
    expect(losLagos).toBeLessThan(rm);
  });

  it('envío gratis sobre umbral', () => {
    expect(
      computeShippingCost({
        region: 'Metropolitana',
        courierCode: 'blueexpress',
        subtotalClp: FREE_SHIPPING_SUBTOTAL,
      }),
    ).toBe(0);
  });

  it('retiro en tienda sin costo', () => {
    expect(
      computeShippingCost({
        region: 'Metropolitana',
        courierCode: 'retiro_tienda',
        subtotalClp: 1000,
      }),
    ).toBe(0);
  });
});