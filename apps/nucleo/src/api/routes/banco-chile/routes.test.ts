import { describe, it, expect } from 'vitest';
import { buildMovimientoExternalKey, mapMovimientoRow } from './routes';

describe('banco-chile movimiento mapping', () => {
  it('prefers numero_operacion as external_key', () => {
    expect(
      buildMovimientoExternalKey({
        numero_operacion: 'OP-123',
        fecha_contable: '2026-07-01',
        monto: 1000,
        tipo: 'abono',
        descripcion: 'Pago',
      }),
    ).toBe('OP-123');
  });

  it('falls back to hash key without operation number', () => {
    const key = buildMovimientoExternalKey({
      numero_operacion: null,
      fecha_contable: '2026-07-01',
      monto: 5000,
      tipo: 'cargo',
      descripcion: 'Comision',
    });
    expect(key.startsWith('h:')).toBe(true);
    expect(key).toContain('2026-07-01');
  });

  it('mapMovimientoRow fills fecha_valor and normalizes tipo', () => {
    const row = mapMovimientoRow(
      {
        fechaContable: '2026-07-10',
        monto: 2500,
        tipo: 'CREDIT',
        descripcion: 'Abono cliente',
        numeroOperacion: 'N9',
      },
      'cuenta-uuid',
      'emp-1',
      '2026-07-19',
    );
    expect(row.cuenta_id).toBe('cuenta-uuid');
    expect(row.fecha_valor).toBe('2026-07-10');
    expect(row.tipo).toBe('abono');
    expect(row.external_key).toBe('N9');
    expect(row.descripcion).toBe('Abono cliente');
  });
});
