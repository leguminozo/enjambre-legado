import { db } from './dexie-db';

/**
 * Pushes all pending offline transactions to the remote API or Supabase.
 * In a real implementation, this would iterate through 'synced: false' records
 * and await the HTTP/RPC call, then mark them true.
 */
export async function syncPendingTransactions(apiPushFn: (tx: any) => Promise<boolean>) {
  const pending = await db.transacciones.where('synced').equals(0).toArray();
  for (const tx of pending) {
    try {
      const success = await apiPushFn(tx);
      if (success && tx.id) {
        await db.transacciones.update(tx.id, { synced: true });
      }
    } catch (e) {
      console.error('Failed to sync transaction', tx.uuid, e);
    }
  }
}
