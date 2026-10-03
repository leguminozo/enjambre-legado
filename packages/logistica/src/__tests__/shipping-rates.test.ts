import { describe, it, expect } from 'vitest';
import {
  computeShippingCost,
  computeShippingCostWithRates,
  getWeightMultiplier,
  shippingRatesConfigFromRaw,
  DEFAULT_SHIPPING_RATES_CONFIG,
  FREE_SHIPPING_SUBTOTAL,
  type ShippingQuoteInput,
} from '../shipping-rates';

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

describe('computeShippingCostWithRates', () => {
  it('config base = resultados idénticos a la vía legacy', () => {
    const cases: ShippingQuoteInput[] = [
      { region: 'Los Lagos', courierCode: 'blueexpress', subtotalClp: 10000 },
      { region: 'Metropolitana', courierCode: 'chilexpress', subtotalClp: 10000 },
      { region: 'Metropolitana', courierCode: 'despacho_propio', subtotalClp: 10000 },
      { region: 'Metropolitana', courierCode: 'retiro_tienda', subtotalClp: 10000 },
      { region: 'Magallanes', courierCode: 'starken', subtotalClp: 48000, weightGrams: 3200 },
      { region: 'Magallanes', courierCode: 'starken', subtotalClp: 48000, weightGrams: 6500 },
      { region: 'Isla de Pascua', courierCode: 'blueexpress', subtotalClp: 10000 },
      { region: 'Metropolitana', courierCode: 'blueexpress', subtotalClp: 10000, weightGrams: 800 },
    ];
    for (const input of cases) {
      expect(computeShippingCostWithRates(input), JSON.stringify(input)).toBe(computeShippingCost(input));
    }
  });

  it('una tarifa editada por región cambia el cobro', () => {
    const config = shippingRatesConfigFromRaw({
      regionRates: [{ region: 'Metropolitana', baseClp: 9900 }],
    });
    expect(
      computeShippingCostWithRates(
        { region: 'Metropolitana', courierCode: 'blueexpress', subtotalClp: 10000 },
        config,
      ),
    ).toBe(9900);
    // Las demás regiones conservan su tarifa base
    expect(
      computeShippingCostWithRates(
        { region: 'Los Lagos', courierCode: 'blueexpress', subtotalClp: 10000 },
        config,
      ),
    ).toBe(4500);
  });

  it('multiplicador de courier editado y fallback de desconocido', () => {
    const config = shippingRatesConfigFromRaw({
      courierMultipliers: { chilexpress: 1.5 },
      unknownCourierMultiplier: 2,
    });
    expect(config.courierMultipliers.chilexpress).toBe(1.5);
    expect(config.unknownCourierMultiplier).toBe(2);
  });

  it('tramos de peso editados', () => {
    const config = shippingRatesConfigFromRaw({
      weightTiers: [
        { maxGrams: 1000, multiplier: 1 },
        { maxGrams: null, multiplier: 2 },
      ],
    });
    expect(
      computeShippingCostWithRates(
        { region: 'Metropolitana', courierCode: 'blueexpress', subtotalClp: 10000, weightGrams: 800 },
        config,
      ),
    ).toBe(5900);
    expect(
      computeShippingCostWithRates(
        { region: 'Metropolitana', courierCode: 'blueexpress', subtotalClp: 10000, weightGrams: 2000 },
        config,
      ),
    ).toBe(11800);
  });
});

describe('shippingRatesConfigFromRaw', () => {
  it('JSON inválido o vacío cae a los valores base del código', () => {
    for (const raw of [null, undefined, {}, 'x' as unknown, [] as unknown]) {
      const config = shippingRatesConfigFromRaw(raw as Record<string, unknown>);
      expect(config.regionRates).toEqual(DEFAULT_SHIPPING_RATES_CONFIG.regionRates);
      expect(config.weightTiers).toEqual(DEFAULT_SHIPPING_RATES_CONFIG.weightTiers);
      expect(config.courierMultipliers).toEqual(DEFAULT_SHIPPING_RATES_CONFIG.courierMultipliers);
    }
  });

  it('basura en el JSON no rompe la configuración (nunca NaN)', () => {
    const config = shippingRatesConfigFromRaw({
      regionRates: [
        { region: 'Metropolitana', baseClp: 'caro' },
        { region: '', baseClp: 1000 },
        { region: 'Los Lagos', baseClp: -5 },
        'basura',
        { region: 'Aysén', baseClp: 7777 },
      ],
      courierMultipliers: { blueexpress: 'alto', falso_courier: 0.5, starken: 1.2 },
      weightTiers: [{ maxGrams: 'pesado', multiplier: 3 }, { multiplier: -1 }, null],
      defaultRegionRateClp: null,
      freeShippingMaxGrams: 'kg',
    });
    expect(config.regionRates.find((r) => r.region === 'Metropolitana')?.baseClp).toBe(5900);
    expect(config.regionRates.find((r) => r.region === 'Aysén')?.baseClp).toBe(7777);
    expect(config.regionRates.find((r) => r.region === 'Los Lagos')?.baseClp).toBe(4500);
    expect('falso_courier' in config.courierMultipliers).toBe(false);
    expect(config.courierMultipliers.blueexpress).toBe(1);
    expect(config.courierMultipliers.starken).toBe(1.2);
    // Sin tramos válidos → tramos base
    expect(config.weightTiers).toEqual(DEFAULT_SHIPPING_RATES_CONFIG.weightTiers);
    expect(config.defaultRegionRateClp).toBe(7900);
    expect(config.freeShippingMaxGrams).toBe(4000);
  });

  it('despacho propio editado y tope de cortesía por peso', () => {
    const config = shippingRatesConfigFromRaw({
      despachoPropioMultiplier: 0.5,
      freeShippingMaxGrams: 1000,
    });
    expect(
      computeShippingCostWithRates(
        { region: 'Metropolitana', courierCode: 'despacho_propio', subtotalClp: 10000 },
        config,
      ),
    ).toBe(2950);
    expect(
      computeShippingCostWithRates(
        { region: 'Metropolitana', courierCode: 'blueexpress', subtotalClp: 48000, weightGrams: 1500 },
        config,
      ),
    ).toBeGreaterThan(0);
  });
});