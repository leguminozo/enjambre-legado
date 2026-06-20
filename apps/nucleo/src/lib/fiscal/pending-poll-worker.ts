import { createClient } from '@supabase/supabase-js';
import { pollFacturaCompraSii } from '@/api/lib/fiscal/poll-factura-compra';
import { pollFacturaEmitidaSii } from '@/api/lib/fiscal/poll-factura-emitida';
import { periodoFromFecha, syncRcvPeriod } from '@/api/lib/fiscal/rcv-sync';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials for fiscal worker');
  return createClient(url, key, { auth: { persistSession: false } });
}

export type FiscalPollWorkerResult = {
  polled: number;
  polledVentas: number;
  accepted: number;
  rejected: number;
  rcvSynced: number;
  rcvVentasSynced: number;
  errors: string[];
};

export async function processPendingSiiPolls(limit = 20): Promise<FiscalPollWorkerResult> {
  const admin = createAdminClient();
  const result: FiscalPollWorkerResult = {
    polled: 0,
    polledVentas: 0,
    accepted: 0,
    rejected: 0,
    rcvSynced: 0,
    rcvVentasSynced: 0,
    errors: [],
  };

  const { data: pending, error } = await admin
    .from('facturas_compra')
    .select('id, empresa_id, fecha_emision, estado_sii')
    .eq('estado_sii', 'enviado')
    .not('track_id', 'is', null)
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (error) {
    result.errors.push(`compras: ${error.message}`);
  }

  for (const row of pending ?? []) {
    result.polled += 1;
    const poll = await pollFacturaCompraSii(admin, row.empresa_id, row.id);

    if (!poll.ok) {
      result.errors.push(`${row.id}: ${poll.message}`);
      continue;
    }

    if (poll.estadoSii === 'aceptado') {
      result.accepted += 1;
      await admin
        .from('gastos_extranjeros')
        .update({ estado: 'aceptado_sii' })
        .eq('factura_compra_id', row.id);

      try {
        const periodo = periodoFromFecha(String(row.fecha_emision));
        const synced = await syncRcvPeriod(admin, row.empresa_id, periodo, 'compras');
        if (synced.ok) result.rcvSynced += 1;
        else result.errors.push(`RCV ${row.id}: ${synced.message}`);
      } catch (err) {
        result.errors.push(`RCV ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else if (poll.estadoSii === 'rechazado') {
      result.rejected += 1;
      await admin
        .from('gastos_extranjeros')
        .update({ estado: 'rechazado_sii' })
        .eq('factura_compra_id', row.id);
    }
  }

  const ventaLimit = Math.max(5, Math.floor(limit / 2));
  const { data: pendingVentas, error: ventasError } = await admin
    .from('facturas_emitidas')
    .select('id, empresa_id, fecha_emision, estado_sii')
    .eq('estado_sii', 'enviado')
    .not('track_id', 'is', null)
    .order('updated_at', { ascending: true })
    .limit(ventaLimit);

  if (ventasError) {
    result.errors.push(`ventas: ${ventasError.message}`);
    return result;
  }

  for (const row of pendingVentas ?? []) {
    result.polledVentas += 1;
    const poll = await pollFacturaEmitidaSii(admin, row.empresa_id, row.id);

    if (!poll.ok) {
      result.errors.push(`venta ${row.id}: ${poll.message}`);
      continue;
    }

    if (poll.estadoSii === 'aceptado') {
      result.accepted += 1;
      try {
        const periodo = periodoFromFecha(String(row.fecha_emision));
        const synced = await syncRcvPeriod(admin, row.empresa_id, periodo, 'ventas');
        if (synced.ok) result.rcvVentasSynced += 1;
        else result.errors.push(`RCV venta ${row.id}: ${synced.message}`);
      } catch (err) {
        result.errors.push(`RCV venta ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else if (poll.estadoSii === 'rechazado') {
      result.rejected += 1;
    }
  }

  return result;
}