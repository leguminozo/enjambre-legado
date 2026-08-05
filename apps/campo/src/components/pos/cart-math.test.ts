import { describe, expect, it } from 'vitest';
import {
  addCartLine,
  addQrToLine,
  cartTotal,
  computePosTotals,
  extractSaleLines,
  removeCartLine,
  removeQrFromLine,
  setCartQty,
} from './cart-math';
import type { CartLine } from './types';

const line = (partial: Partial<CartLine> & Pick<CartLine, 'producto_id'>): CartLine => ({
  nombre: 'Miel',
  precio_unitario: 5000,
  cantidad: 1,
  ...partial,
});

describe('cart-math POS', () => {
  it('cartTotal suma precio × cantidad', () => {
    expect(
      cartTotal([
        line({ producto_id: 'a', precio_unitario: 1000, cantidad: 2 }),
        line({ producto_id: 'b', precio_unitario: 2500, cantidad: 1 }),
      ]),
    ).toBe(4500);
  });

  it('addCartLine agrega o incrementa', () => {
    let lines: CartLine[] = [];
    lines = addCartLine(lines, {
      producto_id: 'a',
      nombre: 'Miel',
      precio_unitario: 1000,
      cantidad: 2,
    });
    expect(lines).toHaveLength(1);
    expect(lines[0].cantidad).toBe(2);

    lines = addCartLine(lines, {
      producto_id: 'a',
      nombre: 'Miel',
      precio_unitario: 1000,
      cantidad: 1,
    });
    expect(lines).toHaveLength(1);
    expect(lines[0].cantidad).toBe(3);
  });

  it('setCartQty 0 elimina línea; floor de decimales', () => {
    const lines = [line({ producto_id: 'a', cantidad: 2 })];
    expect(setCartQty(lines, 'a', 0)).toHaveLength(0);
    expect(setCartQty(lines, 'a', 2.9)[0].cantidad).toBe(2);
  });

  it('removeCartLine filtra por id', () => {
    const lines = [line({ producto_id: 'a' }), line({ producto_id: 'b' })];
    expect(removeCartLine(lines, 'a').map((l) => l.producto_id)).toEqual(['b']);
  });

  it('addQrToLine no duplica; removeQrFromLine limpia', () => {
    let lines = [line({ producto_id: 'a', cantidad: 1, qr_codes: [] })];
    lines = addQrToLine(lines, 'a', 'QR-1');
    lines = addQrToLine(lines, 'a', 'QR-1');
    expect(lines[0].qr_codes).toEqual(['QR-1']);
    lines = addQrToLine(lines, 'a', 'QR-2');
    expect(lines[0].qr_codes).toEqual(['QR-1', 'QR-2']);
    lines = removeQrFromLine(lines, 'a', 'QR-1');
    expect(lines[0].qr_codes).toEqual(['QR-2']);
  });

  it('computePosTotals percent 10% y tope 50%', () => {
    expect(computePosTotals(10_000, { kind: 'percent', value: 10 })).toEqual({
      subtotal: 10_000,
      descuentoClp: 1_000,
      total: 9_000,
      descuentoPct: 10,
    });
    const capped = computePosTotals(10_000, { kind: 'percent', value: 90 });
    expect(capped.descuentoPct).toBe(50);
    expect(capped.descuentoClp).toBe(5_000);
  });

  it('computePosTotals fixed no supera subtotal', () => {
    expect(computePosTotals(5_000, { kind: 'fixed', value: 8_000 }).total).toBe(0);
    expect(computePosTotals(5_000, { kind: 'fixed', value: 500 }).descuentoClp).toBe(500);
  });

  it('extractSaleLines ignora meta de descuento', () => {
    const lines = extractSaleLines([
      { producto_id: 'a', cantidad: 1, precio_unitario: 100 },
      { _tipo: 'pos_descuento', descuento_clp: 10 },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0].producto_id).toBe('a');
  });
});
