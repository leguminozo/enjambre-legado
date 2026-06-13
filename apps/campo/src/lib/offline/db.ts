import Dexie, { type EntityTable } from 'dexie';

export interface ProductoLocal {
  id: string;
  nombre: string | null;
  precio: number | null;
  stock: number | null;
  formato: string | null;
  visible: boolean | null;
}

export interface SyncQueueItem {
  id?: number; // Auto-increment primary key in Dexie
  payload: any;
  status: 'pending' | 'error';
  error_message?: string;
  created_at: number;
}

const db = new Dexie('CampoPOSDatabase') as Dexie & {
  productos: EntityTable<ProductoLocal, 'id'>;
  sync_queue: EntityTable<SyncQueueItem, 'id'>;
};

// Schema versioning
db.version(1).stores({
  productos: 'id, nombre, visible', // Primary key and indexed props
  sync_queue: '++id, status, created_at', // ++ means auto-increment
});

export { db };
