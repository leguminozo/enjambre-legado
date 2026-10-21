'use client';

import { useState } from 'react';
import {
  Plug,
  Radio,
  Zap,
  CheckCircle,
  Loader2,
  RefreshCw,
  Power,
} from 'lucide-react';
import { toast, Badge, ViewLoading } from '@enjambre/ui';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ViewShell } from '@/components/layout/ViewShell';

interface IntegrationRow {
  key: string;
  name: string;
  enabled: boolean;
  configured: boolean;
  hasPixelId?: boolean;
  hasAdsId?: boolean;
  hasPurchaseLabel?: boolean;
  mode?: 'live' | 'stub';
}

export type IntegracionesViewProps = Record<string, never>;

export function IntegracionesView(_props: IntegracionesViewProps = {}) {
  const apiFetch = useApiFetch();
  const [purging, setPurging] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const integrationsQuery = useQuery({
    queryKey: ['system', 'integrations'],
    queryFn: async (): Promise<IntegrationRow[]> => {
      const res = await apiFetch('/api/admin-system/integrations');
      if (!res.ok) throw new Error('Falló la carga de integraciones');
      const data = (await res.json()) as { integrations: IntegrationRow[] };
      return data.integrations ?? [];
    },
  });

  const handleToggleIntegration = async (row: IntegrationRow) => {
    setTogglingKey(row.key);
    try {
      const res = await apiFetch(`/api/admin-system/integrations/${row.key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !row.enabled }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falló al actualizar la integración');
      }
      toast(row.enabled ? 'Integración desactivada' : 'Integración activada', { type: 'success' });
      await integrationsQuery.refetch();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error actualizando integración', { type: 'error' });
    } finally {
      setTogglingKey(null);
    }
  };

  const handlePurgeCache = async () => {
    setPurging(true);
    try {
      const res = await apiFetch('/api/admin-system/purge-cache', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falló purga de caché');
      }
      toast('Caché de tienda purgado correctamente', { type: 'success' });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error purgando caché', { type: 'error' });
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <ViewShell
        variant="compact"
        eyebrow="Plataforma"
        title="Integraciones & Conectores"
        subtitle="Pasarelas de pago, conectores de marketing y gestión de caché en el borde"
        icon={<Plug size={20} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Columna Izquierda: Salud y Caché */}
        <div className="space-y-6">
          {/* Salud de Pasarelas */}
          <section className="space-y-5 bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-2.5 text-accent">
              <Radio size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Salud de Pasarelas & Pagos
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Estado en tiempo real de los canales de pago y conciliación bancaria activos.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-surface-sunken/60 rounded-xl border border-border/60">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Transbank Webpay</p>
                    <p className="text-xs text-muted-foreground">Checkout Tienda Online</p>
                  </div>
                </div>
                <Badge variant="success">Operativo</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-sunken/60 rounded-xl border border-border/60">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">SumUp</p>
                    <p className="text-xs text-muted-foreground">Punto de Venta POS Feria</p>
                  </div>
                </div>
                <Badge variant="success">Conectado</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-sunken/60 rounded-xl border border-border/60">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Banco de Chile</p>
                    <p className="text-xs text-muted-foreground">API Conciliación Bancaria</p>
                  </div>
                </div>
                <Badge variant="success">Autenticado</Badge>
              </div>
            </div>
          </section>

          {/* Caché & Edge */}
          <section className="space-y-5 bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-2.5 text-accent">
              <Zap size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Caché &amp; Distribución Edge
              </h3>
            </div>

            <div className="p-4 bg-surface-sunken/60 rounded-xl border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Purga de Caché Global (Tienda)</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  Invalida toda la caché estática en la red de borde. Utilizar si los cambios de catálogo o stock tardan en reflejarse.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePurgeCache}
                disabled={purging}
                className="shrink-0 inline-flex items-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-colors border border-destructive/20 cursor-pointer disabled:opacity-50"
              >
                {purging ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                <span>{purging ? 'Purgando…' : 'Purgar Caché'}</span>
              </button>
            </div>
          </section>
        </div>

        {/* Columna Derecha: Conectores & APIs */}
        <div>
          <section className="space-y-5 bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-accent">
                <Plug size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Conectores de Servicio &amp; Publicidad
                </h3>
              </div>
              {integrationsQuery.isFetching && (
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              APIs externas para analítica, conversiones de marketing, facturación y entidades regulatorias.
            </p>

            {integrationsQuery.isLoading ? (
              <ViewLoading variant="inline" />
            ) : integrationsQuery.isError ? (
              <div className="text-xs text-destructive p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                Error al cargar el estado de las integraciones.
              </div>
            ) : (
              <div className="space-y-3">
                {integrationsQuery.data?.map((row) => {
                  const isMeta = row.key === 'meta_ads';
                  const isGoogle = row.key === 'google_ads';
                  const isAds = isMeta || isGoogle;
                  return (
                    <div
                      key={row.key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-sunken/60 rounded-xl border border-border/60"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <CheckCircle
                          size={16}
                          className={`mt-0.5 shrink-0 ${row.enabled ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{row.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <Badge variant={row.enabled ? 'success' : 'default'}>
                              {row.enabled ? 'Activa' : 'Inactiva'}
                            </Badge>
                            <Badge variant={row.configured ? 'success' : 'danger'}>
                              {row.configured ? 'Configurada' : 'Sin credenciales'}
                            </Badge>
                            {isMeta && (
                              <Badge variant={row.mode === 'live' ? 'success' : 'default'}>
                                CAPI {row.mode === 'live' ? 'live' : 'stub'}
                              </Badge>
                            )}
                            {isGoogle && (
                              <Badge variant={row.mode === 'live' ? 'success' : 'default'}>
                                gtag {row.mode === 'live' ? 'live' : 'stub'}
                              </Badge>
                            )}
                          </div>
                          {isMeta && !row.hasPixelId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Falta configurar el identificador del Pixel de Meta para registrar conversiones.
                            </p>
                          )}
                          {isMeta && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              La API de conversiones del servidor requiere un token de acceso configurado.
                            </p>
                          )}
                          {isGoogle && !row.hasAdsId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Falta configurar el identificador de Google Ads (AW-…) para la medición.
                            </p>
                          )}
                          {isGoogle && row.hasAdsId && !row.hasPurchaseLabel && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              El tag registra eventos base; falta la etiqueta de conversión para registrar compras.
                            </p>
                          )}
                          {isGoogle && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Identificador de conversión configurado para seguimiento en la tienda pública.
                            </p>
                          )}
                        </div>
                      </div>
                      {isAds && (
                        <button
                          type="button"
                          onClick={() => handleToggleIntegration(row)}
                          disabled={togglingKey === row.key}
                          className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors border cursor-pointer min-h-9 ${
                            row.enabled
                              ? 'bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/20'
                              : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20'
                          }`}
                        >
                          {togglingKey === row.key ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Power size={13} />
                          )}
                          <span>{row.enabled ? 'Desactivar' : 'Activar'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
