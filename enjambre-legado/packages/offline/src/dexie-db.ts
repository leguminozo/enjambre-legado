import Dexie, { Table } from 'dexie';

export interface OfflineTransaction {
  id?: number;
  uuid: string; // for idempotency
  cliente_id: string;
  vendedor_id: string;
  items: any;
  total: number;
  metodo_pago: string;
  synced: boolean;
  created_at: string;
}

export interface OfflineTicket {
  id?: number;
  cliente_id: string;
  producto_id: string;
  cantidad: number;
  synced: boolean;
  created_at: string;
}

export class OfflineLegacyDB extends Dexie {
  transacciones!: Table<OfflineTransaction, number>;
  tickets!: Table<OfflineTicket, number>;

  constructor() {
    super('EnjambreLegacySync');
    this.version(1).stores({
      transacciones: '++id, uuid, synced, created_at',
      tickets: '++id, synced, created_at' // Need indexes on synced
    });
  }
}

export const db = new OfflineLegacyDB();
