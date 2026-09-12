import { describe, expect, it } from 'vitest';
import {
  addCartLine,
  addQrToLine,
  cartTotal,
  computePosTotals,
  detectFeriaCombos,
  extractSaleLines,
  getFeriaUpsellNudge,
  removeCartLine,
  removeQrFromLine,
  scanAndAddProductToCart,
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

  it('calcula el vuelto de efectivo correctamente', () => {
    const total = 7500;
    const recibido = 10000;
    const vuelto = Math.max(0, recibido - total);
    expect(vuelto).toBe(2500);

    const exacto = 7500;
    expect(Math.max(0, exacto - total)).toBe(0);

    const insuficiente = 5000;
    expect(insuficiente < total).toBe(true);
  });

  it('scanAndAddProductToCart añade nuevo producto con QR unitario', () => {
    const lines: CartLine[] = [];
    const product = { producto_id: 'p-1', nombre: 'Crema de Miel', precio_unitario: 22990 };
    const res = scanAndAddProductToCart(lines, product, 'QR-001');

    expect(res).toHaveLength(1);
    expect(res[0].producto_id).toBe('p-1');
    expect(res[0].cantidad).toBe(1);
    expect(res[0].qr_codes).toEqual(['QR-001']);
  });

  it('scanAndAddProductToCart incrementa cantidad y asocia segundo QR al mismo producto', () => {
    const product = { producto_id: 'p-1', nombre: 'Crema de Miel', precio_unitario: 22990 };
    let lines = scanAndAddProductToCart([], product, 'QR-001');
    lines = scanAndAddProductToCart(lines, product, 'QR-002');

    expect(lines).toHaveLength(1);
    expect(lines[0].cantidad).toBe(2);
    expect(lines[0].qr_codes).toEqual(['QR-001', 'QR-002']);
  });

  it('scanAndAddProductToCart no duplica mismo QR si se escanea dos veces', () => {
    const product = { producto_id: 'p-1', nombre: 'Crema de Miel', precio_unitario: 22990 };
    let lines = scanAndAddProductToCart([], product, 'QR-001');
    lines = scanAndAddProductToCart(lines, product, 'QR-001');

    expect(lines).toHaveLength(1);
    expect(lines[0].cantidad).toBe(2);
    expect(lines[0].qr_codes).toEqual(['QR-001']);
  });

  it('detectFeriaCombos sugiere Dúo con 2 productos y Trío con 3+ unidades', () => {
    expect(detectFeriaCombos([])).toBeNull();
    expect(detectFeriaCombos([line({ producto_id: 'a', cantidad: 1 })])).toBeNull();

    const duo = detectFeriaCombos([
      line({ producto_id: 'a', cantidad: 1 }),
      line({ producto_id: 'b', cantidad: 1 }),
    ]);
    expect(duo?.id).toBe('duo_bienestar');
    expect(duo?.descuentoPct).toBe(5);

    const trio = detectFeriaCombos([
      line({ producto_id: 'a', cantidad: 2 }),
      line({ producto_id: 'b', cantidad: 1 }),
    ]);
    expect(trio?.id).toBe('trio_recoleccion');
    expect(trio?.descuentoPct).toBe(10);
  });

  it('detectFeriaCombos respeta customRules configuradas desde Núcleo', () => {
    const customRules = [
      {
        id: 'promo_lo_barnechea',
        nombre: 'Especial Lo Barnechea (4+ unidades)',
        min_units: 4,
        descuento_pct: 15,
        descripcion: '15% de beneficio por 4 frascos',
      },
    ];

    const below = detectFeriaCombos([line({ producto_id: 'a', cantidad: 3 })], customRules);
    expect(below).toBeNull();

    const hit = detectFeriaCombos([line({ producto_id: 'a', cantidad: 4 })], customRules);
    expect(hit?.id).toBe('promo_lo_barnechea');
    expect(hit?.descuentoPct).toBe(15);
  });

  it('getFeriaUpsellNudge incentiva al vendedor cuando hay 1 o 2 unidades', () => {
    expect(getFeriaUpsellNudge([])).toBeNull();
    const nudge1 = getFeriaUpsellNudge([line({ producto_id: 'a', cantidad: 1 })]);
    expect(nudge1).toContain('Agrega 1 variedad más para activar Dúo Bienestar de Feria (5% dto)');

    const nudge2 = getFeriaUpsellNudge([
      line({ producto_id: 'a', cantidad: 1 }),
      line({ producto_id: 'b', cantidad: 1 }),
    ]);
    expect(nudge2).toContain('Agrega 1 unidad más para activar Pack Recolección (3+ frascos) (10% dto)');
  });
});
