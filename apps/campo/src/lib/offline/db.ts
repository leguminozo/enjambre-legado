import Dexie, { type EntityTable } from 'dexie';

export interface LoteInfoLocal {
  nombre_lote?: string | null;
  variedad_floral?: string | null;
  relato_publico?: string | null;
  analisis_humedad?: number | null;
  metodo_extraccion?: string | null;
}

export interface PerfilSensorialLocal {
  intensidad?: number;
  dulzor_acidez?: number;
  textura?: number;
  descriptores_intensidad?: { izq?: string; der?: string };
  descriptores_dulzor?: { izq?: string; der?: string };
  descriptores_textura?: { izq?: string; der?: string };
  notas_aromaticas?: string[];
  maridajes?: Array<{ titulo: string; detalle: string }>;
  momento_consumo?: string;
}

export interface ProductoLocal {
  id: string;
  slug?: string | null;
  nombre: string | null;
  precio: number | null;
  stock: number | null;
  formato: string | null;
  visible: boolean | null;
  fotos?: string[] | null;
  descripcion_corta?: string | null;
  descripcion_regenerativa?: string | null;
  ingredientes?: string | null;
  origen_apicola?: string | null;
  peso_neto_g?: number | null;
  tags?: string[] | null;
  lote?: LoteInfoLocal | null;
  perfil_sensorial?: PerfilSensorialLocal | null;
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

export interface FeriaComboRule {
  id: string;
  nombre: string;
  min_units: number;
  min_unique?: number;
  descuento_pct: number;
  descripcion: string;
}

export interface FeriaContratoLocal {
  id: string;
  tipo: string;
  comision_base_pct: number;
  score_confianza: number;
  bono_puntualidad_clp: number;
  estado: string;
}

export interface FeriaContextLocal {
  id: 'current';
  active: boolean;
  evento: { id: string; nombre_evento: string; ubicacion?: string | null } | null;
  contrato?: FeriaContratoLocal | null;
  consignaciones: Array<{
    id: string;
    producto_id: string;
    cantidad_entregada: number;
    cantidad_vendida: number;
    cantidad_devuelta: number;
    pendiente: number;
    productos?: { nombre: string | null } | null;
  }>;
  whatsapp_template?: string | null;
  combos_config?: FeriaComboRule[] | null;
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
