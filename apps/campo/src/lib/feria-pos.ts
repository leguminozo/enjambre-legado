import type { SupabaseClient } from '@supabase/supabase-js';

export type FeriaSaleItem = {
  producto_id: string;
  nombre?: string;
  cantidad: number;
  precio_unitario?: number;
};

type FeriaValidation = {
  required?: boolean;
  ok?: boolean;
  evento_id?: string;
  errors?: Array<{ producto_id: string; error: string; pendiente?: number; solicitado?: number }>;
  reason?: string;
};

type FeriaApplyResult = {
  applied?: boolean;
  evento_id?: string;
  comision_feria?: number;
  ledger_id?: string;
  reason?: string;
};

export function isFeriaChannel(channel?: string | null): boolean {
  return channel === 'feria';
}

export async function validateFeriaConsignacion(
  supabase: SupabaseClient,
  userId: string,
  items: FeriaSaleItem[],
  channel?: string | null,
): Promise<FeriaValidation> {
  if (!isFeriaChannel(channel)) {
    return { required: false, ok: true };
  }

  const { data, error } = await supabase.rpc('validar_consignacion_feria', {
    p_user_id: userId,
    p_items: items,
    p_channel: channel ?? 'feria',
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? { ok: false }) as FeriaValidation;
}

export async function applyFeriaPostVenta(
  supabase: SupabaseClient,
  userId: string,
  ventaId: string,
  items: FeriaSaleItem[],
  total: number,
  channel?: string | null,
): Promise<FeriaApplyResult> {
  if (!isFeriaChannel(channel)) {
    return { applied: false, reason: 'not_feria_channel' };
  }

  const { data, error } = await supabase.rpc('aplicar_venta_feria_post_venta', {
    p_user_id: userId,
    p_venta_id: ventaId,
    p_items: items,
    p_total: total,
    p_channel: channel ?? 'feria',
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? { applied: false }) as FeriaApplyResult;
}

export function formatFeriaValidationError(validation: FeriaValidation): string {
  if (!validation.errors?.length) {
    return 'Stock consignado insuficiente para venta en feria';
  }
  return validation.errors
    .map((e) => {
      if (e.error === 'sin_consignacion') {
        return `Producto no consignado (${e.producto_id.slice(0, 8)}…)`;
      }
      return `Stock consignado: ${e.pendiente ?? 0} disponible, ${e.solicitado ?? 0} solicitado`;
    })
    .join('; ');
}