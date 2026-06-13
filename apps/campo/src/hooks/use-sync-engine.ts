import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { db } from '@/lib/offline/db';

export function useSyncEngine() {
  const isSyncing = useRef(false);

  const performDownsync = useCallback(async () => {
    if (!navigator.onLine) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio, stock, formato, visible')
        .eq('visible', true);

      if (error) {
        console.error('[SyncEngine] Downsync error:', error.message);
        return;
      }

      if (data) {
        await db.transaction('rw', db.productos, async () => {
          // Clear and replace to handle deletions or visibility changes easily
          await db.productos.clear();
          await db.productos.bulkAdd(data);
        });
        console.log('[SyncEngine] Downsync complete. Products updated in local DB.');
      }
    } catch (err) {
      console.error('[SyncEngine] Downsync failed:', err);
    }
  }, []);

  const performUpsync = useCallback(async () => {
    if (!navigator.onLine || isSyncing.current) return;
    
    isSyncing.current = true;
    try {
      const pendingItems = await db.sync_queue.where('status').equals('pending').toArray();
      if (pendingItems.length === 0) return;

      console.log(`[SyncEngine] Upsync starting for ${pendingItems.length} items...`);

      for (const item of pendingItems) {
        try {
          const res = await fetch('/api/pos/venta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });

          if (res.ok) {
            // Success: remove from queue
            await db.sync_queue.delete(item.id!);
          } else {
            const data = await res.json().catch(() => ({}));
            // If the error is not a 5xx, it might be a fatal logic error (e.g., bad payload). 
            // We should mark it as error so it doesn't block the queue forever, but keep it for review.
            if (res.status >= 400 && res.status < 500) {
              await db.sync_queue.update(item.id!, { 
                status: 'error', 
                error_message: data.error || 'Client logic error' 
              });
            }
          }
        } catch (fetchErr) {
          // Network error during fetch, leave as pending to retry later
          console.warn('[SyncEngine] Network error pushing item, will retry later.', fetchErr);
          break; // Stop processing the queue if network drops
        }
      }
    } catch (err) {
      console.error('[SyncEngine] Upsync failed:', err);
    } finally {
      isSyncing.current = false;
    }
  }, []);

  useEffect(() => {
    // Initial sync on mount
    performDownsync();
    performUpsync();

    // Listen to online events to trigger sync when network recovers
    const handleOnline = () => {
      console.log('[SyncEngine] Network restored. Triggering sync...');
      performDownsync();
      performUpsync();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [performDownsync, performUpsync]);

  return { triggerSync: performUpsync };
}
