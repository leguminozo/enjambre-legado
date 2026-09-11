import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { db } from '@/lib/offline/db';
import { useAuthStore } from '@enjambre/auth';
import { useLegacyDevice } from '@enjambre/ui';
import { getNucleoApiUrl } from '@/lib/public-urls';

const API_BASE = getNucleoApiUrl();

// TTL del downsync completo: navegar entre rutas re-monta SyncProvider y re-ejecutaba
// clear+bulkAdd de todos los productos (y upsync re-dispara downsync al terminar).
// Con 60s, una vez por minuto como máximo, manteniendo offline-first intacto.
// En tier legacy (2GB RAM) el clear+bulkAdd completo es un spike de memoria:
// se espacia a 5 min para no matar la pestaña en iPhone 7.
const DOWNSYNC_TTL_MS = 60_000;
const DOWNSYNC_TTL_MS_LEGACY = 300_000;
const LAST_DOWNSYNC_KEY = 'lastFullDownsync';

let globalCampoSyncing = false;

export function useSyncEngine() {
  const isSyncing = useRef(false);
  const { legacy } = useLegacyDevice();
  const token = useAuthStore((s) => s.session?.access_token);

  const performDownsync = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      // Skip si ya hubo un downsync exitoso hace < TTL (evita el doble clear+bulkAdd por navegación)
      const lastSync = await db.meta.get(LAST_DOWNSYNC_KEY);
      const ttl = legacy ? DOWNSYNC_TTL_MS_LEGACY : DOWNSYNC_TTL_MS;
      if (lastSync && Date.now() - lastSync.value < ttl) {
        const sample = await db.productos.toCollection().first();
        if (!sample || sample.fotos !== undefined) {
          return;
        }
      }

      const supabase = createClient();
      if (!supabase) return;
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio, stock, formato, visible, fotos')
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
        await db.meta.put({ key: LAST_DOWNSYNC_KEY, value: Date.now() });
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
        }
      }
    } catch (err) {
      console.error('[SyncEngine] Downsync failed:', err);
    }
  }, [token, legacy]);

  const performUpsync = useCallback(async () => {
    if (!navigator.onLine || isSyncing.current || globalCampoSyncing) return;

    isSyncing.current = true;
    globalCampoSyncing = true;
    try {
      const now = Date.now();
      const MAX_ATTEMPTS = 6;
      // Reintentos con backoff acotado: pendientes inmediatos + errores cuyo next_retry_at venció y no superan el tope
      const pendingItems = await db.sync_queue
        .where('status')
        .anyOf('pending', 'error')
        .filter((item) => {
          if (item.status === 'pending') return true;
          return (
            item.status === 'error' &&
            item.next_retry_at != null &&
            item.next_retry_at <= now &&
            (item.attempts ?? 0) < MAX_ATTEMPTS
          );
        })
        .toArray();
      if (pendingItems.length === 0) return;

      if (!token) {
        console.warn('[SyncEngine] Upsync paused: No auth token available.');
        return;
      }

      // Backoff exponencial: 1min, 2min, 4min... cap 30min, máx 6 intentos
      const backoffMs = (attempts: number) => Math.min(60_000 * 2 ** attempts, 1_800_000);

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
            // Error de negocio permanente: no reintentar automáticamente; queda para revisión manual
            await db.sync_queue.update(item.id!, {
              status: 'error',
              attempts: attempts + 1,
              next_retry_at: undefined,
              error_message: `Consignación feria: ${errorMessage}`,
            });
            continue;
          }

          if (res.status >= 400 && res.status < 500) {
            const nextAttempts = attempts + 1;
            if (nextAttempts >= MAX_ATTEMPTS) {
              // Agotó reintentos: queda en error permanente sin reintento automático
              await db.sync_queue.update(item.id!, {
                status: 'error',
                attempts: nextAttempts,
                next_retry_at: undefined,
                error_message: `${errorMessage} (${nextAttempts}/${MAX_ATTEMPTS})`,
              });
            } else {
              // Reintentable: backoff exponencial
              await db.sync_queue.update(item.id!, {
                status: 'error',
                attempts: nextAttempts,
                next_retry_at: Date.now() + backoffMs(attempts),
                error_message: errorMessage,
              });
            }
            continue;
          }

          // 5xx / rate limit: backoff y seguir con el resto
          if (res.status >= 500 || res.status === 429) {
            const nextAttempts = attempts + 1;
            await db.sync_queue.update(item.id!, {
              status: 'error',
              attempts: nextAttempts,
              next_retry_at: nextAttempts >= MAX_ATTEMPTS ? undefined : Date.now() + backoffMs(attempts),
              error_message: errorMessage || `HTTP ${res.status}`,
            });
            continue;
          }
        } catch (fetchErr) {
          console.warn('[SyncEngine] Network error pushing item, will retry later.', fetchErr);
          // Backoff este item sin abortar toda la cola
          if (item.id != null) {
            const nextAttempts = attempts + 1;
            await db.sync_queue.update(item.id, {
              status: 'error',
              attempts: nextAttempts,
              next_retry_at: nextAttempts >= MAX_ATTEMPTS ? undefined : Date.now() + backoffMs(attempts),
              error_message: 'Error de red; se reintentará',
            });
          }
          continue;
        }
      }

      await performDownsync();
    } catch (err) {
      console.error('[SyncEngine] Upsync failed:', err);
    } finally {
      isSyncing.current = false;
      globalCampoSyncing = false;
    }
  }, [token, performDownsync]);

  useEffect(() => {
    performDownsync();
    performUpsync();

    const handleOnline = () => {
      performDownsync();
      performUpsync();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [performDownsync, performUpsync]);

  return { triggerSync: performUpsync };
}