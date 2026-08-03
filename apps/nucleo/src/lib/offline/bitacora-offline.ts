// Helpers de enqueue offline de la bitácora — patrón cash-context.tsx de Campo:
// el mismo payload que iría online se guarda en sync_queue; el motor reenvía.
// Idempotencia: client_request_id (uuid) → dedupe server (POST /capturas).

import { db, type SesionLocal, type GrabacionLocal } from './db';

function uuid(): string {
  return crypto.randomUUID();
}

/** Nueva sesión local (offline-first): se reconcilia al sincronizar. */
export async function crearSesionLocal(input: {
  apiario_id?: string | null;
  fecha?: string;
  contexto?: string;
}): Promise<SesionLocal> {
  const localId = uuid();
  const sesion: SesionLocal = {
    id: localId,
    apiario_id: input.apiario_id ?? null,
    fecha: input.fecha ?? new Date().toISOString().slice(0, 10),
    contexto: input.contexto ?? null,
    sincronizada: false,
    updated_at: Date.now(),
  };
  await db.sesiones_locales.put(sesion);
  await db.sync_queue.add({
    tipo: 'sesion',
    payload: {
      client_local_id: localId,
      apiario_id: sesion.apiario_id,
      fecha: sesion.fecha,
      contexto: sesion.contexto,
    },
    status: 'pending',
    created_at: Date.now(),
  });
  return sesion;
}

/** Cachear sesiones del server (downsync) marcándolas como sincronizadas. */
export async function cachearSesiones(sesiones: Array<{
  id: string;
  apiario_id: string | null;
  fecha: string;
  contexto: string | null;
}>): Promise<void> {
  await db.transaction('rw', db.sesiones_locales, async () => {
    for (const s of sesiones) {
      await db.sesiones_locales.put({
        id: s.id,
        apiario_id: s.apiario_id,
        fecha: s.fecha,
        contexto: s.contexto,
        sincronizada: true,
        updated_at: Date.now(),
      });
    }
  });
}

/** Encolar una captura de voz (offline o como paso previo al sync). */
export async function enqueueCapturaVoz(input: {
  session_id: string;
  blob: Blob;
  mime: string;
  duracion_seg: number;
  dispositivo: string;
}): Promise<GrabacionLocal> {
  const clientRequestId = uuid();
  const grabacion: GrabacionLocal = {
    client_request_id: clientRequestId,
    session_id: input.session_id,
    blob: input.blob,
    mime: input.mime,
    duracion_seg: input.duracion_seg,
    dispositivo: input.dispositivo,
    created_at: Date.now(),
    subida: false,
  };
  await db.grabaciones.add(grabacion);
  await db.sync_queue.add({
    tipo: 'captura',
    payload: {
      session_id: input.session_id,
      client_request_id: clientRequestId,
      dispositivo: input.dispositivo,
      duracion_seg: input.duracion_seg,
    },
    status: 'pending',
    created_at: Date.now(),
  });
  return grabacion;
}
