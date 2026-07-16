'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  Package,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  Navigation,
  Warehouse,
  Users,
  RefreshCw,
} from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';
import { toast, ViewLoading } from '@enjambre/ui';
import {
  EnvioComposerModal,
  type EnvioFormState,
  type ProductoInventario,
} from '@/components/logistica/EnvioComposerModal';
import { ViewShell } from '@/components/layout/ViewShell';
import { EnjTableShell } from '@/components/layout/EnjTableShell';
import { NectarRail } from '@/components/layout/NectarRail';
import { BOSQUE_ULMO, ORO_MIEL, SALUD_OPTIMA, SALUD_RIESGO } from '@/lib/colors';
import {
  DEFAULT_COURIER,
  getCourierLabel,
  type CourierCode,
} from '@enjambre/logistica';

import dynamic from 'next/dynamic';

const MapaEnviosHistorico = dynamic(
  () => import('@/components/logistica/MapaEnviosHistorico').then((mod) => mod.MapaEnviosHistorico),
  { ssr: false, loading: () => <ViewLoading variant="view" label="Mapa" hideLabel /> },
);

type Envio = {
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

type StockCenter = {
  id: string;
  name: string;
  sachets: number;
  frascos: number;
  cofres: number;
  ok: boolean;
};

type Proveedor = {
  id: string;
  name: string;
  item: string;
  next_delivery: string | null;
  urgent: boolean;
};

type LogisticaDashboard = {
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

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  pendiente: { color: 'bg-warning/15 text-warning border-warning/30', icon: <Clock size={14} /> },
  Programado: { color: 'bg-warning/15 text-warning border-warning/30', icon: <Clock size={14} /> },
  Empacando: { color: 'bg-accent/15 text-accent border-accent/30', icon: <Package size={14} /> },
  empacando: { color: 'bg-accent/15 text-accent border-accent/30', icon: <Package size={14} /> },
  'En tránsito': { color: 'bg-info/15 text-info border-info/30', icon: <Navigation size={14} /> },
  en_transito: { color: 'bg-info/15 text-info border-info/30', icon: <Navigation size={14} /> },
  Entregado: { color: 'bg-success/15 text-success border-success/30', icon: <CheckCircle2 size={14} /> },
  entregado: { color: 'bg-success/15 text-success border-success/30', icon: <CheckCircle2 size={14} /> },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { color: 'bg-surface-raised text-muted-foreground border-border', icon: <Clock size={14} /> };
}

const EMPTY_DASHBOARD: LogisticaDashboard = {
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

export function LogisticaView() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewEnvio, setShowNewEnvio] = useState(false);
  const [envioForm, setEnvioForm] = useState<EnvioFormState>({
    tracking_code: `ENV-${Math.floor(Math.random() * 10000)}`,
    destino: '',
    items: '',
    status: 'En tránsito',
    eta: '',
    courier_code: DEFAULT_COURIER,
  });

  const { data, isLoading, error, refetch } = useQuery<{ data: LogisticaDashboard }>({
    queryKey: ['logistica', 'dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/logistica/dashboard');
      if (!res.ok) throw new Error('Failed to fetch logística');
      return res.json();
    },
    staleTime: 15_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('logistica-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'logistica_envios' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['logistica'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createEnvio = useMutation({
    mutationFn: async ({
      form,
      lineItems,
    }: {
      form: typeof envioForm;
      lineItems?: Array<{ producto_id: string; cantidad: number }>;
    }) => {
      const res = await apiFetch('/api/logistica/envios', {
        method: 'POST',
        body: JSON.stringify({
          tracking_code: form.tracking_code,
          destino: form.destino,
          items: form.items,
          status: form.status,
          eta: form.eta || null,
          courier_code: form.courier_code,
          venta_id: form.venta_id || null,
          line_items: lineItems?.length ? lineItems : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Create failed' }));
        const msg =
          err.code === 'stock_insufficient'
            ? 'Stock insuficiente en inventario para uno o más productos'
            : (err.message ?? 'Create failed');
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Envío registrado', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['logistica'] });
      setShowNewEnvio(false);
      setEnvioForm({
        tracking_code: `ENV-${Math.floor(Math.random() * 10000)}`,
        destino: '',
        items: '',
        status: 'En tránsito',
        eta: '',
        courier_code: DEFAULT_COURIER,
      });
    },
    onError: (err) => toast(err.message, { type: 'error' }),
  });

  const updateEnvioStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiFetch(`/api/logistica/envios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Update failed' }));
        throw new Error(err.message ?? 'Update failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistica'] });
    },
    onError: (err) => toast(err.message, { type: 'error' }),
  });

  const dashboard = data?.data ?? EMPTY_DASHBOARD;
  const stats = dashboard.stats;

  const filteredEnvios =
    statusFilter === 'all'
      ? dashboard.envios
      : dashboard.envios.filter((e) => e.status === statusFilter);

  const statusEntries = Object.entries(stats.byStatus);

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Operaciones"
        title="Logística en Tiempo Real"
        subtitle="Operaciones de despacho, stock multicentro y proveedores"
      />
      <NectarRail current="/operaciones" />

      <div className="stats-grid">
        {[
          {
            icon: <Truck size={20} />,
            val: String(stats.enTransito),
            label: 'En tránsito',
            accent: stats.enTransito > 0,
          },
          {
            icon: <Package size={20} />,
            val: String(stats.pendientes + stats.empacando),
            label: 'Pendientes',
            accent: false,
          },
          {
            icon: <Warehouse size={20} />,
            val: String(stats.totalStockCenters),
            label: 'Centros de stock',
            trend: stats.lowStockCenters > 0 ? `${stats.lowStockCenters} bajo` : 'Óptimo',
            trendVariant: stats.lowStockCenters > 0 ? 'danger' : 'success',
          },
          {
            icon: <Users size={20} />,
            val: String(stats.totalProveedores),
            label: 'Proveedores',
            trend: stats.urgentProviders > 0 ? `${stats.urgentProviders} urgente` : undefined,
            trendVariant: stats.urgentProviders > 0 ? 'danger' : undefined,
          },
        ].map((s, i) => (
          <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
            <div className="stat-header">
              <div className="stat-icon">{s.icon}</div>
              {s.trend && (
                <span
                  className={`stat-trend ${
                    s.trendVariant === 'danger' ? 'down' : 'up'
                  }`}
                >
                  {s.trend}
                </span>
              )}
            </div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid-2-1">
        <div className="space-y-6">
          <div className="card animate-in delay-2">
            <div className="section-header">
              <div>
                <div className="section-title">Envíos Activos</div>
                <div className="section-subtitle">
                  {stats.totalEnvios} envío(s) registrado(s)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetch()}
                  className="p-2 rounded-lg border border-border hover:border-accent/50 text-muted-foreground hover:text-accent transition-colors"
                  title="Refrescar"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowNewEnvio(true)}
                >
                  <Plus size={14} className="mr-1" />
                  Nuevo envío
                </button>
              </div>
            </div>

            {statusEntries.length > 0 && (
              <div className="filter-chips-scroll mb-4">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === 'all'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-surface-sunken border border-border text-muted-foreground hover:border-accent/50'
                  }`}
                >
                  Todos ({stats.totalEnvios})
                </button>
                {statusEntries.map(([status, count]) => {
                  const cfg = getStatusConfig(status);
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        statusFilter === status
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'bg-surface-sunken border-border text-muted-foreground hover:border-accent/50'
                      }`}
                    >
                      {cfg.icon}
                      {status} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {isLoading ? (
              <ViewLoading variant="view" label="Envíos" hideLabel />
            ) : filteredEnvios.length > 0 ? (
              <div className="space-y-2">
                {filteredEnvios.map((envio) => {
                  const cfg = getStatusConfig(envio.status);
                  return (
                    <div
                      key={envio.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-sunken border border-border hover:border-accent/30 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cfg.color} border`}
                      >
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {envio.destino}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {envio.tracking_code} · {envio.items}
                          {` · Courier: ${getCourierLabel(envio.courier_code ?? envio.via)}`}
                          {envio.eta && ` · ETA: ${envio.eta}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {envio.status !== 'Entregado' && envio.status !== 'entregado' && (
                          <select
                            value={envio.status}
                            onChange={(e) =>
                              updateEnvioStatus.mutate({
                                id: envio.id,
                                status: e.target.value,
                              })
                            }
                            className="text-xs bg-surface border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          >
                            <option value="Programado">Programado</option>
                            <option value="Empacando">Empacando</option>
                            <option value="En tránsito">En tránsito</option>
                            <option value="Entregado">Entregado</option>
                          </select>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${cfg.color}`}
                        >
                          {cfg.icon}
                          {envio.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Package size={32} className="mx-auto mb-2 opacity-50" />
                {statusFilter !== 'all'
                  ? `No hay envíos con estado "${statusFilter}"`
                  : 'Todo en calma. Ningún envío en ruta.'}
              </div>
            )}
          </div>

          <div className="card animate-in delay-3">
            <div className="section-header">
              <div className="section-title">Stock Multicentro</div>
            </div>
            {dashboard.stockCenters.length > 0 ? (
              <EnjTableShell caption="Desliza para ver columnas de stock">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Centro</th>
                      <th>Sachets</th>
                      <th>Frascos</th>
                      <th>Cofres</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.stockCenters.map((sc) => (
                      <tr key={sc.id}>
                        <td className="font-medium text-foreground">{sc.name}</td>
                        <td>{sc.sachets.toLocaleString()}</td>
                        <td>{sc.frascos}</td>
                        <td>{sc.cofres}</td>
                        <td>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                              sc.ok
                                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                                : 'bg-destructive/15 text-destructive border-destructive/30'
                            }`}
                          >
                            {sc.ok ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <AlertCircle size={12} />
                            )}
                            {sc.ok ? 'Óptimo' : 'Bajo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </EnjTableShell>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Warehouse size={32} className="mx-auto mb-2 opacity-50" />
                Sin centros de stock registrados
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card animate-in delay-3">
            <div className="section-header">
              <div>
                <div className="section-title">Historial geográfico</div>
                <div className="section-subtitle">Todos los envíos registrados</div>
              </div>
            </div>
            <MapaEnviosHistorico envios={dashboard.envios} height="320px" />
          </div>

          <div className="card animate-in delay-4">
            <div className="section-header">
              <div className="section-title">Proveedores</div>
            </div>
            {dashboard.proveedores.length > 0 ? (
              <div className="space-y-2">
                {dashboard.proveedores.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-sunken border border-border"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        p.urgent
                          ? 'bg-destructive/15 text-destructive border border-destructive/30'
                          : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      }`}
                    >
                      {p.urgent ? (
                        <AlertCircle size={16} />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {p.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.item}
                        {p.next_delivery && ` · Próx: ${p.next_delivery}`}
                      </div>
                    </div>
                    {p.urgent && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-destructive/15 text-destructive border border-destructive/30">
                        Urgente
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                Red de proveedores sincronizada
              </div>
            )}
          </div>

          <div className="card animate-in delay-5">
            <div className="section-header">
              <div className="section-title">Ventas Recientes</div>
            </div>
            {dashboard.ventasRecientes.length > 0 ? (
              <div className="space-y-2">
                {dashboard.ventasRecientes.slice(0, 8).map((v) => {
                  const hasEnvio = dashboard.envios.some((e) => e.venta_id === v.id);
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-raised/50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">
                          {v.channel ?? 'web'} · {v.metodo_pago ?? 'N/A'}
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          ${Number(v.total).toLocaleString('es-CL')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasEnvio ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Enviado
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              const itemsStr = Array.isArray(v.items) 
                                ? v.items.map((i: { cantidad: number; nombre: string }) => `${i.cantidad}x ${i.nombre}`).join(', ')
                                : 'Pedido tienda';
                              setEnvioForm({
                                ...envioForm,
                                items: itemsStr,
                                status: 'En tránsito',
                                venta_id: v.id,
                                tracking_code: `VNT-${v.id.slice(0,4)}-${Math.floor(Math.random() * 1000)}`
                              });
                              setShowNewEnvio(true);
                            }}
                            className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all"
                          >
                            Procesar Envío
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Sin ventas recientes
              </div>
            )}
          </div>
        </div>
      </div>

      <EnvioComposerModal
        open={showNewEnvio}
        onClose={() => setShowNewEnvio(false)}
        form={envioForm}
        onFormChange={setEnvioForm}
        productos={dashboard.productos}
        productosLoading={isLoading}
        enviosHistoricos={dashboard.envios}
        ventasRecientes={dashboard.ventasRecientes}
        onSubmit={(form, lineItems) => createEnvio.mutate({ form, lineItems })}
        submitting={createEnvio.isPending}
      />
    </div>
  );
}
