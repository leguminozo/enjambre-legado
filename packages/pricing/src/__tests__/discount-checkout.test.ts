import { describe, it, expect } from 'vitest';
import { computeDiscountClp, isDiscountRowValid } from '../discount-checkout';

const baseRow = {
  id: '1',
  codigo: 'BOSQUE10',
  tipo: 'porcentaje' as const,
  valor: 10,
  valor_minimo_compra: 5000,
  max_usos: 100,
  usos_actuales: 0,
  activo: true,
  fecha_inicio: '2020-01-01T00:00:00Z',
  fecha_fin: '2030-01-01T00:00:00Z',
  productos_aplicables: null,
  canales_aplicables: ['web'],
};

describe('computeDiscountClp', () => {
  it('aplica porcentaje', () => {
    expect(computeDiscountClp('porcentaje', 10, 20000)).toBe(2000);
  });

  it('aplica monto fijo con tope', () => {
    expect(computeDiscountClp('monto_fijo', 5000, 3000)).toBe(3000);
  });
});

describe('isDiscountRowValid', () => {
  it('rechaza bajo mínimo', () => {
    expect(isDiscountRowValid(baseRow, 1000).ok).toBe(false);
  });

  it('acepta válido', () => {
    expect(isDiscountRowValid(baseRow, 10000).ok).toBe(true);
  });
});