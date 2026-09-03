'use client';

// Motor de sync de la bitácora — semántica de use-sync-engine.ts de Campo
// adaptada: dispara en mount y en evento `online`, backoff exponencial,
// 200 = replay idempotente. Añade reconciliación de sesiones offline-first
// (id local → id server) y upload de audio al bucket bitacora-audio.

import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@enjambre/auth';
import { supabase } from '@/lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { db, type SyncQueueItem } from '@/lib/offline/db';
import { cachearSesiones } from '@/lib/offline/bitacora-offline';

const MAX_ATTEMPTS = 6;
const DOWNSYNC_TTL_MS = 30_000;
const backoffMs = (attempts: number) =>
  Math.min(60_000 * 2 ** attempts, 1_800_000);

export function useBitacoraSyncEngine() {
  const apiFetch = useApiFetch();
  const token = useAuthStore((s) => s.session?.access_token);
  const role = useAuthStore((s) => s.user?.role);
  const isAllowedRole = role === 'admin' || role === 'apicultor' || role === 'territorial';
  const isSyncing = useRef(false);
  const lastDownsyncRef = useRef<number>(0);

  /** Downsync: sesiones del server → caché local (patrón feria-context). Con TTL 30s. */
  const performDownsync = useCallback(async (force = false) => {
    if (!navigator.onLine || !isAllowedRole) return;
    if (!force && Date.now() - lastDownsyncRef.current < DOWNSYNC_TTL_MS) return;
    lastDownsyncRef.current = Date.now();

    try {
      const res = await apiFetch('/api/bitacora/sesiones');
      if (!res.ok) return;
      const json = (await res.json()) as { data?: Array<{ id: string; apiario_id: string | null; fecha: string; contexto: string | null }> };
      if (json.data) await cachearSesiones(json.data);
    } catch {
      // Sin señal o red caída: se reintenta en el próximo trigger
    }
  }, [apiFetch, isAllowedRole]);

  /** Subir el blob de una grabación al bucket privado (owner = auth.uid()). */
  const uploadAudio = useCallback(async (grabacionId: number) => {
    const grabacion = await db.grabaciones.get(grabacionId);
    if (!grabacion || grabacion.subida) return null;

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    const ext = grabacion.mime.includes('mp4') ? 'm4a' : 'webm';
    const path = `${user.id}/${grabacion.client_request_id}.${ext}`;
    const { error } = await supabase.storage
      .from('bitacora-audio')
      .upload(path, grabacion.blob, {
        contentType: grabacion.mime,
        upsert: false,
      });
    if (error) {
      // Upload previo huérfano (timeout): el path en el bucket sigue siendo válido.
      // Antes se devolvía null → nunca se hacía PATCH audio_url y el audio quedaba huérfano.
      const already =
        error.message?.includes('already exists') ||
        error.message?.includes('The resource already exists') ||
        (error as { statusCode?: string }).statusCode === '409';
      if (!already) return null;
    }
    await db.grabaciones.update(grabacionId, { subida: true });
    return path;
  }, []);

  /** Upsync: sesiones primero (reconciliación), capturas después. */
  const performUpsync = useCallback(async () => {
    if (!navigator.onLine || isSyncing.current) return;
    isSyncing.current = true;
    try {
      // 1) Sesiones offline-first → id server (reconciliación)
      const sesionesPendientes = await db.sync_queue
        .where('tipo').equals('sesion')
        .filter((i) => i.status === 'pending' || (i.status === 'error' && (!i.next_retry_at || i.next_retry_at <= Date.now())))
        .toArray();

      for (const item of sesionesPendientes) {
        const res = await apiFetch('/api/bitacora/sesiones', {
          method: 'POST',
          body: JSON.stringify(item.payload),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            data: { id: string };
            meta?: { client_local_id?: string };
          };
          const localId = json.meta?.client_local_id ?? (item.payload.client_local_id as string | undefined);
          const serverId = json.data.id;
          if (localId && serverId) {
            // Dexie NO permite cambiar la PK con update() — hay que delete+put.
            await db.transaction(
              'rw',
              db.sesiones_locales,
              db.sync_queue,
              db.grabaciones,
              async () => {
                const prev = await db.sesiones_locales.get(localId);
                if (prev) {
                  await db.sesiones_locales.delete(localId);
                  await db.sesiones_locales.put({
                    ...prev,
                    id: serverId,
                    sincronizada: true,
                    updated_at: Date.now(),
                  });
                } else {
                  await db.sesiones_locales.put({
                    id: serverId,
                    apiario_id: (item.payload.apiario_id as string | null) ?? null,
                    fecha: (item.payload.fecha as string) ?? new Date().toISOString().slice(0, 10),
                    contexto: (item.payload.contexto as string | null) ?? null,
                    sincronizada: true,
                    updated_at: Date.now(),
                  });
                }
                const capturasPendientes = await db.sync_queue
                  .where('tipo')
                  .equals('captura')
                  .filter((i) => i.payload.session_id === localId)
                  .toArray();
                for (const cap of capturasPendientes) {
                  await db.sync_queue.update(cap.id!, {
                    payload: { ...cap.payload, session_id: serverId },
                  });
                }
                await db.grabaciones
                  .where('session_id')
                  .equals(localId)
                  .modify({ session_id: serverId });
              },
            );
          }
          await db.sync_queue.delete(item.id!);
        } else if (res.status === 401 || res.status === 403) {
          break; // sesión inválida: no tocar la cola
        } else {
          const err = await res.json().catch(() => null);
          const msg = (err as { error?: string } | null)?.error ?? `HTTP ${res.status}`;
          const attempts = (item.attempts ?? 0) + 1;
          await db.sync_queue.update(item.id!, {
            attempts,
            status: 'error',
            error_message: msg,
            next_retry_at: attempts >= MAX_ATTEMPTS ? undefined : Date.now() + backoffMs(attempts),
          });
        }
      }

      // 2) Capturas: registro idempotente → upload audio → PATCH audio_url
      const capturasPendientes = await db.sync_queue
        .where('tipo').equals('captura')
        .filter((i) => i.status === 'pending' || (i.status === 'error' && (!i.next_retry_at || i.next_retry_at <= Date.now())))
        .toArray();

      for (const item of capturasPendientes) {
        // La sesión referenciada debe estar sincronizada
        const sessionId = item.payload.session_id as string;
        const sesion = await db.sesiones_locales.get(sessionId);
        if (sesion && !sesion.sincronizada) continue;

        // Payload ya incluye session_id, client_request_id y opcional transcript_raw (manual).
        const res = await apiFetch('/api/bitacora/capturas', {
          method: 'POST',
          body: JSON.stringify({
            session_id: item.payload.session_id,
            client_request_id: item.payload.client_request_id,
            dispositivo: item.payload.dispositivo,
            duracion_seg: item.payload.duracion_seg,
            ...(typeof item.payload.transcript_raw === 'string'
              ? { transcript_raw: item.payload.transcript_raw }
              : {}),
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            data: { id: string };
            meta?: { already_processed?: boolean };
          };
          const capturaId = json.data.id;
          // Subir el blob si existe y aún no está en el bucket (path voz; manual no tiene blob)
          const grabacion = await db.grabaciones
            .where('client_request_id').equals(item.payload.client_request_id as string)
            .first();
          if (grabacion && !grabacion.subida) {
            const path = await uploadAudio(grabacion.id!);
            if (path) {
              await apiFetch(`/api/bitacora/capturas/${capturaId}`, {
                method: 'PATCH',
                body: JSON.stringify({ audio_url: path }),
              });
              // Auto-STT best-effort (Groq). Si no hay key o falla, no rompe la cola.
              // Desactivar: NEXT_PUBLIC_BITACORA_AUTO_STT=false (solo lectura en cliente)
              const autoStt =
                typeof process !== 'undefined' &&
                process.env.NEXT_PUBLIC_BITACORA_AUTO_STT !== 'false';
              if (autoStt) {
                try {
                  const sttRes = await apiFetch('/api/ai/bitacora/transcribe', {
                    method: 'POST',
                    body: JSON.stringify({ captura_id: capturaId }),
                  });
                  // 503 = IA off — silencioso; otros códigos se loguean en dev
                  if (!sttRes.ok && sttRes.status !== 503 && process.env.NODE_ENV !== 'production') {
                    const err = await sttRes.json().catch(() => null);
                    console.warn('[bitacora-sync] auto-STT', sttRes.status, err);
                  }
                } catch {
                  /* offline / red: la cola de captura ya está limpia; STT manual en curaduría */
                }
              }
            }
          }
          await db.sync_queue.delete(item.id!);
        } else if (res.status === 401 || res.status === 403) {
          break;
        } else {
          const err = await res.json().catch(() => null);
          const msg = (err as { error?: string } | null)?.error ?? `HTTP ${res.status}`;
          const attempts = (item.attempts ?? 0) + 1;
          await db.sync_queue.update(item.id!, {
            attempts,
            status: 'error',
            error_message: msg,
            next_retry_at: attempts >= MAX_ATTEMPTS ? undefined : Date.now() + backoffMs(attempts),
          });
        }
      }

      await performDownsync();
    } catch {
      // Red caída a mitad de ciclo: la cola queda intacta para el próximo trigger
    } finally {
      isSyncing.current = false;
    }
  }, [apiFetch, performDownsync, uploadAudio]);

  const downsyncRef = useRef(performDownsync);
  downsyncRef.current = performDownsync;

  const upsyncRef = useRef(performUpsync);
  upsyncRef.current = performUpsync;

  useEffect(() => {
    if (!token || !isAllowedRole) return;
    void downsyncRef.current();
    void upsyncRef.current();

    const onOnline = () => void upsyncRef.current();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [token, isAllowedRole]);

  return { triggerSync: performUpsync };
}
