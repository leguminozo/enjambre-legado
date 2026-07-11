/**
 * QRs de trazabilidad adjuntos a líneas de venta POS.
 * Puros y testables — el RPC de audit se invoca en la route.
 */

export type SaleLineWithQr = {
  qr_codes?: string[] | null;
  cantidad?: number;
};

/** Aplana y limpia códigos QR de items de venta (sin duplicados, orden estable). */
export function flattenSaleQrCodes(items: SaleLineWithQr[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (!Array.isArray(item.qr_codes)) continue;
    for (const raw of item.qr_codes) {
      if (typeof raw !== 'string') continue;
      const code = raw.trim();
      if (!code || seen.has(code)) continue;
      seen.add(code);
      out.push(code);
    }
  }
  return out;
}

/** true si aún se pueden asignar más QR a la línea (1 QR por unidad). */
export function canAssignMoreQrs(assignedCount: number, cantidad: number): boolean {
  return assignedCount < Math.max(0, Math.floor(cantidad));
}

/**
 * Valida que no haya más QRs que unidades.
 * Códigos vacíos se ignoran en el conteo efectivo.
 */
export function validateQrAssignment(
  qr_codes: string[] | undefined | null,
  cantidad: number,
): { ok: boolean; count: number; error?: string } {
  const codes = flattenSaleQrCodes([{ qr_codes: qr_codes ?? [] }]);
  const max = Math.max(0, Math.floor(cantidad));
  if (codes.length > max) {
    return {
      ok: false,
      count: codes.length,
      error: `Hay ${codes.length} QR para ${max} unidad(es)`,
    };
  }
  return { ok: true, count: codes.length };
}

export type QrRegisterRpc = (args: {
  p_codigo: string;
  p_evento: string;
  p_metadata?: Record<string, unknown>;
}) => Promise<{ error: { message: string } | null }>;

/**
 * Registra eventos 'entregado' post-venta (best-effort: no aborta la venta).
 */
export async function registerDeliveredQrCodes(
  rpc: QrRegisterRpc,
  items: SaleLineWithQr[],
  ventaId: string,
): Promise<{ attempted: number; failed: string[] }> {
  const codes = flattenSaleQrCodes(items);
  const failed: string[] = [];
  for (const code of codes) {
    try {
      const { error } = await rpc({
        p_codigo: code,
        p_evento: 'entregado',
        p_metadata: { venta_id: ventaId },
      });
      if (error) failed.push(code);
    } catch {
      failed.push(code);
    }
  }
  return { attempted: codes.length, failed };
}
