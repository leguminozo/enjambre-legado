import type { ProductoInventario } from '@/components/logistica/EnvioComposerModal';

export type Envio = {
  id: string;
  tracking_code: string;
  destino: string;
  items: string;
  status: string;
  eta: string | null;
  via: string | null;
  courier_code?: string | null;
  courier_tracking_url?: string | null;
  created_at: string | null;
  venta_id?: string;
};

export type StockCenterItem = {
  id: string;
  stock_center_id: string;
  inventario_item_id?: string | null;
  producto_id?: string | null;
  nombre: string;
  sku_code?: string | null;
  clase: 'producto' | 'insumo' | 'etiqueta' | 'envase' | 'apicola' | 'destilacion';
  unidad: string;
  cantidad: number;
  stock_minimo: number;
  origen: 'pureo' | 'local';
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type StockCenter = {
  id: string;
  name: string;
  sachets: number;
  frascos: number;
  cofres: number;
  ok: boolean;
  items?: StockCenterItem[];
};


export type ProveedorInsumoDetalle = {
  id: string;
  nombre: string;
  clase: string;
  stock: number;
  stock_minimo: number;
  unidad: string;
  en_alerta: boolean;
};

export type Proveedor = {
  id: string;
  name: string;
  item: string;
  next_delivery: string | null;
  next_delivery_date?: string | null;
  urgent: boolean;
  tercero_id?: string | null;
  rut?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
  insumos_ids?: string[];
  estado_entrega?: 'pendiente' | 'en_camino' | 'recibido' | 'sin_programar';
  insumos_detalle?: ProveedorInsumoDetalle[];
  tiene_alerta_stock?: boolean;
};

export type LogisticaDashboard = {
  envios: Envio[];
  stockCenters: StockCenter[];
  proveedores: Proveedor[];
  productos: ProductoInventario[];
  ventasRecientes: Array<{
    id: string;
    total: number;
    channel: string | null;
    created_at: string | null;
    metodo_pago: string | null;
    items?: Array<{ cantidad: number; nombre: string }>;
    /** Verdad única de "ya enviado": false si la venta ya tiene envío en la empresa. */
    pendiente_envio?: boolean;
  }>;
  stats: {
    totalEnvios: number;
    pendientes: number;
    enTransito: number;
    empacando: number;
    entregados: number;
    byStatus: Record<string, number>;
    byVia: Record<string, number>;
    totalStockCenters: number;
    lowStockCenters: number;
    totalProveedores: number;
    urgentProviders: number;
  };
};

export const EMPTY_LOGISTICA_DASHBOARD: LogisticaDashboard = {
  envios: [],
  stockCenters: [],
  proveedores: [],
  productos: [],
  ventasRecientes: [],
  stats: {
    totalEnvios: 0,
    pendientes: 0,
    enTransito: 0,
    empacando: 0,
    entregados: 0,
    byStatus: {},
    byVia: {},
    totalStockCenters: 0,
    lowStockCenters: 0,
    totalProveedores: 0,
    urgentProviders: 0,
  },
};
