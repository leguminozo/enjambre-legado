'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plug,
  Radio,
  Zap,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  Target,
} from 'lucide-react';
import { toast, Badge, Skeleton } from '@enjambre/ui';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ViewShell } from '@/components/layout/ViewShell';

export interface GatewayStatus {
  key: string;
  name: string;
  subtitle: string;
  status: 'operational' | 'inactive' | 'missing_credentials';
  statusLabel: string;
  environment: string;
  active: boolean;
  href: string;
  details?: string;
  lastSync?: string | null;
}

export interface ServiceStatus {
  key: string;
  name: string;
  subtitle: string;
  configured: boolean;
  statusLabel: string;
  href: string;
}

export interface IntegrationsApiResponse {
  gateways?: GatewayStatus[];
  cache?: {
    tiendaConfigured: boolean;
    secretConfigured: boolean;
  };
  services?: ServiceStatus[];
}

export type IntegracionesViewProps = Record<string, never>;

export function IntegracionesView(_props: IntegracionesViewProps = {}) {
  const apiFetch = useApiFetch();
  const [purging, setPurging] = useState(false);

  const integrationsQuery = useQuery({
    queryKey: ['system', 'integrations'],
    queryFn: async (): Promise<IntegrationsApiResponse> => {
      const res = await apiFetch('/api/admin-system/integrations');
      if (!res.ok) throw new Error('Falló la carga de integraciones');
      return (await res.json()) as IntegrationsApiResponse;
    },
  });

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

  const gateways = integrationsQuery.data?.gateways ?? [];
  const services = integrationsQuery.data?.services ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <ViewShell
        variant="compact"
        eyebrow="Plataforma"
        title="Integraciones & Conectores"
        subtitle="Pasarelas de pago, conectores de servicio y distribución de caché en el borde"
        icon={<Plug size={20} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Columna Izquierda: Pasarelas de Pago y Caché */}
        <div className="space-y-6">
          {/* Salud de Pasarelas Real */}
          <section className="space-y-5 bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-accent">
                <Radio size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Salud de Pasarelas &amp; Pagos
                </h3>
              </div>
              {integrationsQuery.isFetching && (
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Diagnóstico en tiempo real basado en credenciales activas en el entorno y configuraciones de terminales.
            </p>

            {integrationsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-surface-sunken space-y-2">
                    <Skeleton variant="text" className="w-32 h-4" />
                    <Skeleton variant="text" className="w-48 h-3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {gateways.map((gw) => {
                  const isOk = gw.status === 'operational';
                  const badgeVariant = isOk ? 'success' : gw.status === 'inactive' ? 'default' : 'danger';

                  return (
                    <div
                      key={gw.key}
                      className="p-4 bg-surface-sunken/60 rounded-xl border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {isOk ? (
                          <CheckCircle size={16} className="text-primary shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{gw.name}</p>
                            <Badge variant={badgeVariant}>{gw.statusLabel}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{gw.subtitle}</p>
                          {gw.details && (
                            <p className="text-[11px] text-muted-foreground/80 mt-1">
                              {gw.details}
                            </p>
                          )}
                        </div>
                      </div>

                      <Link
                        href={gw.href}
                        className="inline-flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors border border-primary/20 shrink-0"
                      >
                        <span>Ver en módulo</span>
                        <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
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
                  Invalida toda la caché estática en la red de borde. Utilizar si los cambios de catálogo, stock o precios tardan en reflejarse.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePurgeCache}
                disabled={purging}
                className="shrink-0 inline-flex items-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-colors border border-destructive/20 cursor-pointer disabled:opacity-50 min-h-10"
              >
                {purging ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                <span>{purging ? 'Purgando…' : 'Purgar Caché'}</span>
              </button>
            </div>
          </section>
        </div>

        {/* Columna Derecha: Servicios Centrales & Puntero a Píxeles */}
        <div className="space-y-6">
          {/* Tarjeta de Redirección a Píxeles (Centralizado en Tienda Web) */}
          <section className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-accent">
                <Target size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Píxeles de Conversión &amp; Medición
                </h3>
              </div>
              <Badge variant="default">Tienda Web</Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              La configuración del Pixel de Meta Ads (junto a Conversions API / CAPI) y las etiquetas de conversión de Google Ads (gtag) se han centralizado de forma exclusiva en el flujo comercial de la tienda pública.
            </p>

            <div className="p-4 bg-surface-sunken/60 rounded-xl border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-foreground">Gestión de Audiencias y Campañas</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Edición de tokens, códigos de prueba e identificadores de pauta publicitaria.
                </p>
              </div>
              <Link
                href="/pixeles"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
              >
                <span>Ir a Píxeles</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </section>

          {/* Servicios & Entidades del Ecosistema */}
          <section className="space-y-5 bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-2.5 text-accent">
              <Plug size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Servicios del Ecosistema
              </h3>
            </div>

            <p className="text-xs text-muted-foreground">
              Entidades tributarias y servicios centrales con interfaz de configuración especializada.
            </p>

            <div className="space-y-3">
              {services.map((srv) => (
                <div
                  key={srv.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-sunken/60 rounded-xl border border-border/60"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <CheckCircle
                      size={16}
                      className={`mt-0.5 shrink-0 ${srv.configured ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{srv.name}</p>
                        <Badge variant={srv.configured ? 'success' : 'default'}>
                          {srv.statusLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{srv.subtitle}</p>
                    </div>
                  </div>

                  <Link
                    href={srv.href}
                    className="inline-flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors border border-primary/20 shrink-0"
                  >
                    <span>Gestionar</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
