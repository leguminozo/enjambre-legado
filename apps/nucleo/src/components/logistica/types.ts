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

export type StockCenter = {
  id: string;
  name: string;
  sachets: number;
  frascos: number;
  cofres: number;
  ok: boolean;
};

export type Proveedor = {
  id: string;
  name: string;
  item: string;
  next_delivery: string | null;
  urgent: boolean;
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
