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

export type ProductScanInput = {
  producto_id: string;
  nombre: string;
  precio_unitario: number;
};

/**
 * Agrega un producto escaneado e indexa su código QR unitario de forma atómica.
 * Si el producto ya existe en el carrito, incrementa la cantidad y adjunta el QR.
 */
export function scanAndAddProductToCart(
  lines: CartLine[],
  product: ProductScanInput,
  qrCode?: string,
): CartLine[] {
  const i = lines.findIndex((p) => p.producto_id === product.producto_id);
  const cleanCode = qrCode?.trim();

  if (i >= 0) {
    const existing = lines[i];
    const currentQrs = existing.qr_codes || [];
    const newQrs =
      cleanCode && !currentQrs.includes(cleanCode)
        ? [...currentQrs, cleanCode]
        : currentQrs;

    const next = [...lines];
    next[i] = {
      ...existing,
      cantidad: existing.cantidad + 1,
      qr_codes: newQrs,
    };
    return next;
  }

  return [
    ...lines,
    {
      producto_id: product.producto_id,
      nombre: product.nombre,
      precio_unitario: product.precio_unitario,
      cantidad: 1,
      qr_codes: cleanCode ? [cleanCode] : [],
    },
  ];
}

export interface FeriaComboRule {
  id: string;
  nombre: string;
  min_units: number;
  min_unique?: number;
  descuento_pct: number;
  descripcion: string;
}

export const CANONICAL_FERIA_COMBOS: FeriaComboRule[] = [
  {
    id: 'trio_recoleccion',
    nombre: 'Pack Recolección (3+ frascos)',
    min_units: 3,
    min_unique: 1,
    descuento_pct: 10,
    descripcion: 'Descuento especial del 10% por llevar 3 o más unidades de feria.',
  },
  {
    id: 'duo_bienestar',
    nombre: 'Dúo Bienestar de Feria',
    min_units: 2,
    min_unique: 2,
    descuento_pct: 5,
    descripcion: 'Descuento del 5% por combinar 2 variedades distintas.',
  },
];

export interface FeriaComboSuggestion {
  id: string;
  nombre: string;
  descuentoPct: number;
  descripcion: string;
}

/**
 * Detecta sugerencias automáticas de combos de feria según las líneas del carrito.
 * Soporta reglas personalizadas configuradas desde Núcleo o usa el canon oficial.
 */
export function detectFeriaCombos(
  lines: CartLine[],
  customRules?: FeriaComboRule[] | null,
): FeriaComboSuggestion | null {
  const rules = customRules && customRules.length > 0 ? customRules : CANONICAL_FERIA_COMBOS;
  const totalUnits = lines.reduce((acc, l) => acc + l.cantidad, 0);
  const uniqueProducts = lines.length;

  // Evaluar de mayor a menor descuento
  const sorted = [...rules].sort((a, b) => b.descuento_pct - a.descuento_pct);

  for (const r of sorted) {
    const minUnits = r.min_units;
    const minUnique = r.min_unique ?? 1;
    if (totalUnits >= minUnits && uniqueProducts >= minUnique) {
      return {
        id: r.id,
        nombre: r.nombre,
        descuentoPct: r.descuento_pct,
        descripcion: r.descripcion,
      };
    }
  }

  return null;
}

/**
 * Devuelve un mensaje proactivo de recomendación comercial (up-sell) para el vendedor
 * cuando el cliente está cerca de desbloquear un combo de mayor valor.
 */
export function getFeriaUpsellNudge(
  lines: CartLine[],
  customRules?: FeriaComboRule[] | null,
): string | null {
  const totalUnits = lines.reduce((acc, l) => acc + l.cantidad, 0);
  if (totalUnits === 0) return null;

  const currentCombo = detectFeriaCombos(lines, customRules);
  if (currentCombo && currentCombo.descuentoPct >= 10) return null;

  const rules = customRules && customRules.length > 0 ? customRules : CANONICAL_FERIA_COMBOS;

  if (totalUnits === 1) {
    const duo = rules.find((r) => r.id === 'duo_bienestar' || r.min_units === 2);
    if (duo) {
      return `Agrega 1 variedad más para activar ${duo.nombre} (${duo.descuento_pct}% dto)`;
    }
  }

  if (totalUnits === 2 && (!currentCombo || currentCombo.descuentoPct < 10)) {
    const trio = rules.find((r) => r.id === 'trio_recoleccion' || r.min_units === 3);
    if (trio) {
      return `Agrega 1 unidad más para activar ${trio.nombre} (${trio.descuento_pct}% dto)`;
    }
  }

  return null;
}

