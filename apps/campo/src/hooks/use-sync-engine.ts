import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { db } from '@/lib/offline/db';
import { useAuthStore } from '@enjambre/auth';

const API_BASE = process.env.NEXT_PUBLIC_NUCLEO_API_URL || '';

export function useSyncEngine() {
  const isSyncing = useRef(false);
  const token = useAuthStore((s) => s.session?.access_token);

  const performDownsync = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const supabase = createClient();
      if (!supabase) return;
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
          await db.productos.clear();
          await db.productos.bulkAdd(data);
        });
        console.log('[SyncEngine] Downsync complete. Products updated in local DB.');
      }

      if (token) {
        const feriaRes = await fetch(`${API_BASE}/api/rep-ventas/feria-context`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (feriaRes.ok) {
          const feriaJson = await feriaRes.json();
          const feriaData = feriaJson.data ?? {};
          await db.feria_context.put({
            id: 'current',
            active: Boolean(feriaData.active),
            evento: feriaData.evento ?? null,
            consignaciones: feriaData.consignaciones ?? [],
            updated_at: Date.now(),
          });
          console.log('[SyncEngine] Feria context cached locally.');
        }
      }
    } catch (err) {
      console.error('[SyncEngine] Downsync failed:', err);
    }
  }, [token]);

  const performUpsync = useCallback(async () => {
    if (!navigator.onLine || isSyncing.current) return;

    isSyncing.current = true;
    try {
      const pendingItems = await db.sync_queue.where('status').equals('pending').toArray();
      if (pendingItems.length === 0) return;

      if (!token) {
        console.warn('[SyncEngine] Upsync paused: No auth token available.');
        return;
      }

      console.log(`[SyncEngine] Upsync starting for ${pendingItems.length} items...`);

      for (const item of pendingItems) {
        try {
          const res = await fetch(`${API_BASE}/api/rep-ventas/quick`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(item.payload),
          });

          if (res.ok) {
            await db.sync_queue.delete(item.id!);
            continue;
          }

          const data = await res.json().catch(() => ({} as Record<string, unknown>));

          if (res.status === 401 || res.status === 403) {
            console.warn('[SyncEngine] Auth rejected sync, keeping item pending.');
            break;
          }

          const errorMessage =
            (data.message as string | undefined) ||
            (data.error as string | undefined) ||
            'Client logic error';

          if (res.status === 409 && data.code === 'consignacion_insuficiente') {
            await db.sync_queue.update(item.id!, {
              status: 'error',
              error_message: `Consignación feria: ${errorMessage}`,
            });
            continue;
          }

          if (res.status >= 400 && res.status < 500) {
            await db.sync_queue.update(item.id!, {
              status: 'error',
              error_message: errorMessage,
            });
          }
        } catch (fetchErr) {
          console.warn('[SyncEngine] Network error pushing item, will retry later.', fetchErr);
          break;
        }
      }

      await performDownsync();
    } catch (err) {
      console.error('[SyncEngine] Upsync failed:', err);
    } finally {
      isSyncing.current = false;
    }
  }, [token, performDownsync]);

  useEffect(() => {
    performDownsync();
    performUpsync();

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