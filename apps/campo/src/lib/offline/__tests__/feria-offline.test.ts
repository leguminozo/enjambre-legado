import { describe, it, expect } from 'vitest';
import {
  extractSaleItemsFromPayload,
  validateOfflineFeriaSale,
  type FeriaContextSnapshot,
} from '../feria-offline';

const snapshot: FeriaContextSnapshot = {
  active: true,
  evento: { id: 'evt-1', nombre_evento: 'Feria Test' },
  updated_at: Date.now(),
  consignaciones: [
    {
      id: 'c1',
      producto_id: 'prod-a',
      cantidad_entregada: 10,
      cantidad_vendida: 3,
      cantidad_devuelta: 0,
      pendiente: 7,
      productos: { nombre: 'Miel' },
    },
  ],
};

describe('feria-offline helpers', () => {
  it('skips validation for non-feria channel', () => {
    const result = validateOfflineFeriaSale(
      [{ producto_id: 'prod-a', nombre: 'Miel', cantidad: 99 }],
      'local',
      snapshot,
    );
    expect(result.ok).toBe(true);
  });

  it('blocks when consignacion insufficient', () => {
    const result = validateOfflineFeriaSale(
      [{ producto_id: 'prod-a', nombre: 'Miel', cantidad: 8 }],
      'feria',
      snapshot,
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Miel');
  });

  it('blocks unconsigned products', () => {
    const result = validateOfflineFeriaSale(
      [{ producto_id: 'prod-x', nombre: 'Jabón', cantidad: 1 }],
      'feria',
      snapshot,
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain('no consignado');
  });

  it('extractSaleItemsFromPayload handles items_override', () => {
    const items = extractSaleItemsFromPayload({
      items_override: [
        { producto_id: 'p1', nombre: 'A', cantidad: 2 },
        { producto_id: 'p2', nombre: 'B', cantidad: 1 },
      ],
    });
    expect(items).toHaveLength(2);
    expect(items[0].cantidad).toBe(2);
  });
});