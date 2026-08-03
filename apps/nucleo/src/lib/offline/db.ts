// Cola offline-first de la bitácora apícola — patrón de Campo (sync_queue +
// payload JSON opaco + backoff), adaptado a nucleo con una tabla de blobs.
// Referencia: docs/BITACORA_APICOLA.md §5.1 — reutiliza la semántica de
// apps/campo/src/lib/offline/db.ts, no la duplica conceptualmente.

import Dexie, { type EntityTable } from 'dexie';

/** Sesión de bitácora cacheadas localmente (downsync) o creadas offline. */
export type SesionLocal = {
  id: string; // uuid local; si es offline-first, se reconcilia con el id server
  apiario_id: string | null;
  fecha: string; // YYYY-MM-DD
  contexto: string | null;
  sincronizada: boolean; // false = creada offline, pendiente de reconciliación
  updated_at: number;
};

/** Grabación de audio local: el blob es la fuente de verdad hasta el upload. */
export type GrabacionLocal = {
  id?: number; // autoincrement
  client_request_id: string; // uuid → idempotencia server (patrón buy_order)
  session_id: string; // id de SesionLocal (puede ser local, se reconcilia)
  blob: Blob;
  mime: string; // audio/mp4 (iOS) | audio/webm
  duracion_seg: number;
  dispositivo: string;
  created_at: number; // epoch ms
  subida: boolean; // true = audio ya en bucket bitacora-audio
};

/** Ítem de la cola de sync — misma semántica que Campo (200 = replay idempotente). */
export type SyncQueueItem = {
  id?: number; // autoincrement
  tipo: 'sesion' | 'captura';
  payload: Record<string, unknown>;
  status: 'pending' | 'error';
  error_message?: string;
  created_at: number;
  attempts?: number;
  next_retry_at?: number;
};

const db = new Dexie('NucleoBitacoraDB') as Dexie & {
  sesiones_locales: EntityTable<SesionLocal, 'id'>;
  grabaciones: EntityTable<GrabacionLocal, 'id'>;
  sync_queue: EntityTable<SyncQueueItem, 'id'>;
};

db.version(1).stores({
  sesiones_locales: 'id, apiario_id, sincronizada, updated_at',
  grabaciones: '++id, client_request_id, session_id, subida, created_at',
  sync_queue: '++id, tipo, status, created_at, next_retry_at',
});

export { db };
