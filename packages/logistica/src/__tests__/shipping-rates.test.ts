import { describe, it, expect } from 'vitest';
import { computeShippingCost, getWeightMultiplier, FREE_SHIPPING_SUBTOTAL } from '../shipping-rates';

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

  it('sin peso mantiene tarifa plana histórica', () => {
    expect(
      computeShippingCost({
        region: 'Metropolitana',
        courierCode: 'blueexpress',
        subtotalClp: 10000,
      }),
    ).toBe(5900);
  });

  it('tramos de peso encarecen el flete', () => {
    const liviano = computeShippingCost({
      region: 'Metropolitana',
      courierCode: 'blueexpress',
      subtotalClp: 10000,
      weightGrams: 800,
    });
    const medio = computeShippingCost({
      region: 'Metropolitana',
      courierCode: 'blueexpress',
      subtotalClp: 10000,
      weightGrams: 3200,
    });
    const pesado = computeShippingCost({
      region: 'Metropolitana',
      courierCode: 'blueexpress',
      subtotalClp: 10000,
      weightGrams: 6500,
    });
    expect(getWeightMultiplier(800)).toBe(1);
    expect(getWeightMultiplier(3200)).toBe(1.18);
    expect(getWeightMultiplier(6500)).toBe(1.35);
    expect(liviano).toBe(5900);
    expect(medio).toBeGreaterThan(liviano);
    expect(pesado).toBeGreaterThan(medio);
  });

  it('cortesía cubre hasta 4 kg; sobre eso se cobra flete', () => {
    expect(
      computeShippingCost({
        region: 'Magallanes',
        courierCode: 'blueexpress',
        subtotalClp: 48000,
        weightGrams: 3200,
      }),
    ).toBe(0);
    expect(
      computeShippingCost({
        region: 'Magallanes',
        courierCode: 'blueexpress',
        subtotalClp: 48000,
        weightGrams: 6500,
      }),
    ).toBeGreaterThan(0);
  });
});