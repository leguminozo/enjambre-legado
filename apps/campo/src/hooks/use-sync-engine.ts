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
      // Reintentos con backoff: pendientes + errores cuyo next_retry_at ya venció
      const now = Date.now();
      const pendingItems = await db.sync_queue
        .where('status')
        .anyOf('pending', 'error')
        .filter((item) => !item.next_retry_at || item.next_retry_at <= now)
        .toArray();
      if (pendingItems.length === 0) return;

      if (!token) {
        console.warn('[SyncEngine] Upsync paused: No auth token available.');
        return;
      }

      console.log(`[SyncEngine] Upsync starting for ${pendingItems.length} items...`);

      // Backoff exponencial: 1min, 2min, 4min... cap 30min, máx 6 intentos
      const backoffMs = (attempts: number) => Math.min(60_000 * 2 ** attempts, 1_800_000);
      const MAX_ATTEMPTS = 6;

      for (const item of pendingItems) {
        const attempts = item.attempts ?? 0;
        try {
          const res = await fetch(`${API_BASE}/api/rep-ventas/quick`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(item.payload),
          });

          // 200 (idempotent replay) or 201 (created) both mean the sale is persisted.
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
            // Error de negocio permanente: no reintentar, queda visible para el usuario
            await db.sync_queue.update(item.id!, {
              status: 'error',
              error_message: `Consignación feria: ${errorMessage}`,
            });
            continue;
          }

          if (res.status >= 400 && res.status < 500) {
            if (attempts + 1 >= MAX_ATTEMPTS) {
              // Agotó reintentos: queda en error para revisión manual
              await db.sync_queue.update(item.id!, {
                status: 'error',
                attempts: attempts + 1,
                error_message: `${errorMessage} (${attempts + 1}/${MAX_ATTEMPTS})`,
              });
            } else {
              // Reintentable: backoff exponencial
              await db.sync_queue.update(item.id!, {
                status: 'error',
                attempts: attempts + 1,
                next_retry_at: Date.now() + backoffMs(attempts),
                error_message: errorMessage,
              });
            }
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