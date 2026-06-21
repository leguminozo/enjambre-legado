import type { FeriaConsignacion } from '@/components/pos/feria-context';
import { getConsignacionIssues } from '@/components/pos/feria-context';

export type FeriaContextSnapshot = {
  active: boolean;
  evento: { id: string; nombre_evento: string } | null;
  consignaciones: FeriaConsignacion[];
  updated_at: number;
};

export type OfflineSaleItem = {
  producto_id: string;
  nombre: string;
  cantidad: number;
};

export function validateOfflineFeriaSale(
  items: OfflineSaleItem[],
  channel: string | undefined,
  snapshot: FeriaContextSnapshot | null,
): { ok: boolean; message?: string } {
  if (!snapshot || channel !== 'feria' || !snapshot.active) {
    return { ok: true };
  }

  const issues = getConsignacionIssues(items, snapshot.consignaciones, {
    channel: 'feria',
    eventoActivo: true,
  });

  if (issues.length === 0) {
    return { ok: true };
  }

  const message = issues
    .map((issue) =>
      issue.tipo === 'sin_consignacion'
        ? `${issue.nombre}: no consignado para este evento`
        : `${issue.nombre}: ${issue.pendiente} consignado, ${issue.solicitado} solicitado`,
    )
    .join('; ');

  return { ok: false, message };
}

export function extractSaleItemsFromPayload(payload: Record<string, unknown>): OfflineSaleItem[] {
  const override = payload.items_override;
  if (Array.isArray(override) && override.length > 0) {
    return override.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        producto_id: String(row.producto_id ?? ''),
        nombre: String(row.nombre ?? 'Producto'),
        cantidad: Math.max(1, Number(row.cantidad ?? 1)),
      };
    });
  }

  return [
    {
      producto_id: String(payload.producto_id ?? ''),
      nombre: 'Producto',
      cantidad: Math.max(1, Number(payload.cantidad ?? 1)),
    },
  ];
}