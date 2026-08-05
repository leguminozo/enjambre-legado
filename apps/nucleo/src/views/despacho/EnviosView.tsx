'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Truck,
  Package,
  Plus,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { toast, ViewLoading, formatCLP } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  EnvioComposerModal,
  type EnvioFormState,
} from '@/components/logistica/EnvioComposerModal';
import { useLogisticaDashboard } from '@/components/logistica/use-logistica-dashboard';
import { getEnvioStatusConfig } from '@/components/logistica/status-config';
import { ViewShell } from '@/components/layout/ViewShell';
import { DEFAULT_COURIER, getCourierLabel } from '@enjambre/logistica';

/**
 * Envíos: cola operativa de despacho de la empresa (incluye los envíos
 * automáticos del checkout de Tienda). Proveedores, mapa y centros son
 * herramientas hermanas bajo DESPACHO.
 */
export function EnviosView() {
  const apiFetch = useApiFetch();
  const { dashboard, isLoading, refetch, queryClient } = useLogisticaDashboard();
  const stats = dashboard.stats;

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

  const filteredEnvios =
    statusFilter === 'all'
      ? dashboard.envios
      : dashboard.envios.filter((e) => e.status === statusFilter);

  const statusEntries = Object.entries(stats.byStatus);

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Despacho"
        title="Envíos"
        subtitle="Cola de despacho de la empresa: envíos automáticos de Tienda + manuales, actualizar estado y procesar ventas pendientes. Mapa, proveedores y centros de stock son herramientas aparte."
        icon={<Truck size={20} />}
      />

      <div className="stats-grid">
        {[
          {
            icon: <Truck size={20} />,
            val: String(stats.enTransito),
            label: 'En tránsito',
          },
          {
            icon: <Package size={20} />,
            val: String(stats.pendientes + stats.empacando),
            label: 'Pendientes / empacando',
          },
          {
            icon: <Clock size={20} />,
            val: String(stats.entregados),
            label: 'Entregados',
          },
          {
            icon: <Package size={20} />,
            val: String(stats.totalEnvios),
            label: 'Total registrados',
          },
        ].map((s, i) => (
          <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
            <div className="stat-header">
              <div className="stat-icon">{s.icon}</div>
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
                <div className="section-title">Envíos activos</div>
                <div className="section-subtitle">
                  {stats.totalEnvios} envío(s) registrado(s)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="p-2 rounded-lg border border-border hover:border-accent/50 text-muted-foreground hover:text-accent transition-colors min-h-11 min-w-11 inline-flex items-center justify-center"
                  title="Refrescar"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  type="button"
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
                  type="button"
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
                  const cfg = getEnvioStatusConfig(status);
                  return (
                    <button
                      type="button"
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
                  const cfg = getEnvioStatusConfig(envio.status);
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
                          <option value="pendiente">Pendiente</option>
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
        </div>

        <div className="space-y-6">
          <div className="card animate-in delay-3">
            <div className="section-header">
              <div className="section-title">Ventas recientes</div>
              <div className="section-subtitle text-xs text-muted-foreground">
                Procesar envío desde una venta sin despachar
              </div>
            </div>
            {dashboard.ventasRecientes.length > 0 ? (
              <div className="space-y-2">
                {dashboard.ventasRecientes.slice(0, 12).map((v) => {
                  const hasEnvio = v.pendiente_envio === false;
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-raised/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">
                          {v.channel ?? 'web'} · {v.metodo_pago ?? 'N/A'}
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {formatCLP(Number(v.total))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasEnvio ? (
                          <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded border border-success/20">
                            Enviado
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const itemsStr = Array.isArray(v.items)
                                ? v.items
                                    .map(
                                      (i: { cantidad: number; nombre: string }) =>
                                        `${i.cantidad}x ${i.nombre}`,
                                    )
                                    .join(', ')
                                : 'Pedido tienda';
                              setEnvioForm({
                                ...envioForm,
                                items: itemsStr,
                                status: 'En tránsito',
                                venta_id: v.id,
                                tracking_code: `VNT-${v.id.slice(0, 4)}-${Math.floor(Math.random() * 1000)}`,
                              });
                              setShowNewEnvio(true);
                            }}
                            className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all min-h-11"
                          >
                            Procesar envío
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
        ventasRecientes={dashboard.ventasRecientes.filter(
          (v) => v.pendiente_envio !== false,
        )}
        onSubmit={(form, lineItems) => createEnvio.mutate({ form, lineItems })}
        submitting={createEnvio.isPending}
      />
    </div>
  );
}
