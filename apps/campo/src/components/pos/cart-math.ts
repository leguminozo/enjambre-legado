import type { CartLine } from './types';

/** Total del carrito POS (precio_unitario × cantidad). */
export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.precio_unitario * line.cantidad, 0);
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
