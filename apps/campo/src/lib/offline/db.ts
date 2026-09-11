import Dexie, { type EntityTable } from 'dexie';

export interface ProductoLocal {
  id: string;
  nombre: string | null;
  precio: number | null;
  stock: number | null;
  formato: string | null;
  visible: boolean | null;
  fotos?: string[] | null;
}

export interface SyncQueueItem {
  id?: number; // Auto-increment primary key in Dexie
  payload: Record<string, unknown>;
  status: 'pending' | 'error';
  error_message?: string;
  created_at: number;
  /** Intentos de envío fallidos (4xx/409) — conduce el backoff exponencial */
  attempts?: number;
  /** Epoch ms del próximo reintento permitido (backoff) */
  next_retry_at?: number;
}

export interface FeriaContextLocal {
  id: 'current';
  active: boolean;
  evento: { id: string; nombre_evento: string; ubicacion?: string | null } | null;
  consignaciones: Array<{
    id: string;
    producto_id: string;
    cantidad_entregada: number;
    cantidad_vendida: number;
    cantidad_devuelta: number;
    pendiente: number;
    productos?: { nombre: string | null } | null;
  }>;
  updated_at: number;
}

/** Par clave-valor para metadata local (ej. timestamp de último downsync). */
export interface SyncMetaLocal {
  key: string;
  value: number; // epoch ms
}

const db = new Dexie('CampoPOSDatabase') as Dexie & {
  productos: EntityTable<ProductoLocal, 'id'>;
  sync_queue: EntityTable<SyncQueueItem, 'id'>;
  feria_context: EntityTable<FeriaContextLocal, 'id'>;
  meta: EntityTable<SyncMetaLocal, 'key'>;
};

db.version(1).stores({
  productos: 'id, nombre, visible',
  sync_queue: '++id, status, created_at',
});

db.version(2).stores({
  productos: 'id, nombre, visible',
  sync_queue: '++id, status, created_at',
  feria_context: 'id',
});

db.version(3).stores({
  productos: 'id, nombre, visible',
  sync_queue: '++id, status, created_at, next_retry_at',
  feria_context: 'id',
});

db.version(4).stores({
  productos: 'id, nombre, visible',
  sync_queue: '++id, status, created_at, next_retry_at',
  feria_context: 'id',
  meta: 'key',
});

export { db };
