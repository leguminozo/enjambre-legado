import type { SupabaseClient } from '@supabase/supabase-js';

type CartLine = {
  productId?: string;
  producto_id?: string;
  quantity?: number;
  cantidad?: number;
};

export function cartLinesToStampJson(lines: CartLine[]): CartLine[] {
  return lines.map((line) => ({
    productId: line.productId ?? line.producto_id,
    producto_id: line.producto_id ?? line.productId,
    quantity: line.quantity ?? line.cantidad ?? 1,
    cantidad: line.cantidad ?? line.quantity ?? 1,
  }));
}

export async function applyGuardianStamps(
  admin: SupabaseClient,
  input: {
    userId: string;
    ventaId: string;
    channel: string;
    lines: unknown;
  },
): Promise<{ ok: boolean; error?: string }> {
  const { userId, ventaId, channel, lines } = input;
  const lineas = Array.isArray(lines) ? cartLinesToStampJson(lines as CartLine[]) : [];

  if (lineas.length === 0) {
    return { ok: true };
  }

  const { data, error } = await admin.rpc('increment_guardian_stamps', {
    p_user_id: userId,
    p_venta_id: ventaId,
    p_channel: channel,
    p_lineas: lineas,
  });

  if (error) {
    console.error('[stamp-fulfill] increment_guardian_stamps error:', error.message);
    return { ok: false, error: error.message };
  }

  const parsed = data as { success?: boolean } | null;
  if (parsed?.success === false) {
    return { ok: false, error: 'stamp_increment_failed' };
  }

  return { ok: true };
}

export async function enqueueWalletPassUpdate(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: registrations } = await admin
    .from('wallet_pass_registrations')
    .select('id, platform, push_token')
    .eq('user_id', userId)
    .not('push_token', 'is', null);

  if (!registrations?.length) return;

  // W3: PassKit push — log por ahora; APNs requiere certs
  console.info(
    `[wallet] pass update queued for user ${userId} (${registrations.length} devices)`,
  );
}