import type { CartLine } from './types';

/** Máximo descuento porcentual en feria/POS (anti-abuso). */
export const POS_MAX_DISCOUNT_PCT = 50;

export type PosDiscount =
  | { kind: 'none' }
  | { kind: 'percent'; value: number }
  | { kind: 'fixed'; value: number };

export type PosTotals = {
  subtotal: number;
  descuentoClp: number;
  total: number;
  /** % efectivo aplicado (null si sin descuento). */
  descuentoPct: number | null;
};

/** Total del carrito POS (precio_unitario × cantidad) sin descuento. */
export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.precio_unitario * line.cantidad, 0);
}

/**
 * Aplica descuento sobre subtotal en CLP enteros.
 * percent: 0–50; fixed: 0–subtotal.
 */
export function computePosTotals(subtotal: number, discount: PosDiscount = { kind: 'none' }): PosTotals {
  const sub = Math.max(0, Math.round(Number.isFinite(subtotal) ? subtotal : 0));
  if (discount.kind === 'percent') {
    const pct = Math.min(POS_MAX_DISCOUNT_PCT, Math.max(0, Number(discount.value) || 0));
    const descuentoClp = Math.min(sub, Math.round((sub * pct) / 100));
    return {
      subtotal: sub,
      descuentoClp,
      total: sub - descuentoClp,
      descuentoPct: descuentoClp > 0 ? pct : null,
    };
  }
  if (discount.kind === 'fixed') {
    const descuentoClp = Math.min(sub, Math.max(0, Math.round(Number(discount.value) || 0)));
    const descuentoPct =
      sub > 0 && descuentoClp > 0
        ? Math.round((descuentoClp / sub) * 1000) / 10
        : null;
    return { subtotal: sub, descuentoClp, total: sub - descuentoClp, descuentoPct };
  }
  return { subtotal: sub, descuentoClp: 0, total: sub, descuentoPct: null };
}

/** Filtra líneas de producto (ignora meta de descuento en JSON de venta). */
export function extractSaleLines(
  productos: unknown,
): Array<{ producto_id: string; nombre?: string; cantidad: number; precio_unitario?: number }> {
  const arr = Array.isArray(productos)
    ? productos
    : productos &&
        typeof productos === 'object' &&
        Array.isArray((productos as { lines?: unknown }).lines)
      ? (productos as { lines: unknown[] }).lines
      : [];
  return arr.filter((line): line is {
    producto_id: string;
    nombre?: string;
    cantidad: number;
    precio_unitario?: number;
  } => {
    if (!line || typeof line !== 'object') return false;
    const r = line as Record<string, unknown>;
    if (r._tipo === 'pos_descuento') return false;
    return typeof r.producto_id === 'string' && r.producto_id.length > 0;
  });
}

export function addCartLine(
  lines: CartLine[],
  line: Omit<CartLine, 'cantidad'> & { cantidad?: number },
): CartLine[] {
  const qty = Math.max(1, line.cantidad ?? 1);
  const i = lines.findIndex((p) => p.producto_id === line.producto_id);
  if (i >= 0) {
    const next = [...lines];
    next[i] = { ...next[i], cantidad: next[i].cantidad + qty };
    return next;
  }
  return [...lines, { ...line, cantidad: qty }];
}

export function setCartQty(lines: CartLine[], producto_id: string, cantidad: number): CartLine[] {
  const q = Math.max(0, Math.floor(cantidad));
  if (q === 0) return lines.filter((p) => p.producto_id !== producto_id);
  return lines.map((p) => (p.producto_id === producto_id ? { ...p, cantidad: q } : p));
}

export function removeCartLine(lines: CartLine[], producto_id: string): CartLine[] {
  return lines.filter((p) => p.producto_id !== producto_id);
}

export function addQrToLine(lines: CartLine[], producto_id: string, code: string): CartLine[] {
  return lines.map((p) => {
    if (p.producto_id !== producto_id) return p;
    const currentQrs = p.qr_codes || [];
    if (currentQrs.includes(code)) return p;
    return { ...p, qr_codes: [...currentQrs, code] };
  });
}

export function removeQrFromLine(lines: CartLine[], producto_id: string, code: string): CartLine[] {
  return lines.map((p) => {
    if (p.producto_id !== producto_id) return p;
    const currentQrs = p.qr_codes || [];
    return { ...p, qr_codes: currentQrs.filter((q) => q !== code) };
  });
}
