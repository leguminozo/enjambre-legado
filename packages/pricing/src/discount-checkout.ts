export type DiscountTipo = 'porcentaje' | 'monto_fijo' | 'envio_gratis';

export type DiscountRow = {
  id: string;
  codigo: string;
  tipo: DiscountTipo | 'buy_x_get_y';
  valor: number;
  valor_minimo_compra: number | null;
  max_usos: number | null;
  usos_actuales: number;
  activo: boolean;
  fecha_inicio: string;
  fecha_fin: string;
  productos_aplicables: string[] | null;
  canales_aplicables: string[] | null;
};

export function computeDiscountClp(
  tipo: DiscountRow['tipo'],
  valor: number,
  subtotalClp: number,
): number {
  if (subtotalClp <= 0) return 0;
  switch (tipo) {
    case 'porcentaje':
      return Math.min(subtotalClp, Math.round(subtotalClp * (valor / 100)));
    case 'monto_fijo':
      return Math.min(subtotalClp, Math.round(valor));
    case 'envio_gratis':
      return 0;
    default:
      return 0;
  }
}

export function isDiscountRowValid(
  row: DiscountRow,
  subtotalClp: number,
  canal = 'web',
  now = new Date(),
): { ok: true } | { ok: false; code: string } {
  if (!row.activo) return { ok: false, code: 'inactive' };
  const start = new Date(row.fecha_inicio);
  const end = new Date(row.fecha_fin);
  if (now < start || now > end) return { ok: false, code: 'expired' };
  if (row.max_usos != null && row.usos_actuales >= row.max_usos) {
    return { ok: false, code: 'max_uses' };
  }
  if (row.valor_minimo_compra != null && subtotalClp < row.valor_minimo_compra) {
    return { ok: false, code: 'min_purchase' };
  }
  if (row.canales_aplicables?.length && !row.canales_aplicables.includes(canal)) {
    return { ok: false, code: 'channel' };
  }
  return { ok: true };
}