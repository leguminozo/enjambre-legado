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
  Power,
  Settings,
  ArrowUpRight,
  Target,
} from 'lucide-react';
import { toast, Badge, Skeleton, ImmersiveModal } from '@enjambre/ui';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ViewShell } from '@/components/layout/ViewShell';

export interface IntegrationRow {
  key: string;
  name: string;
  enabled: boolean;
  configured: boolean;
  hasPixelId?: boolean;
  hasCapiToken?: boolean;
  pixelId?: string;
  testEventCode?: string;
  hasAdsId?: boolean;
  adsId?: string;
  hasPurchaseLabel?: boolean;
  purchaseLabel?: string;
  mode?: 'live' | 'stub';
}

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
  integrations?: IntegrationRow[];
}

export type IntegracionesViewProps = Record<string, never>;

export function IntegracionesView(_props: IntegracionesViewProps = {}) {
  const apiFetch = useApiFetch();
  const [purging, setPurging] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  // Modales de configuración
  const [editingModal, setEditingModal] = useState<'meta_ads' | 'google_ads' | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Formulario Meta Ads
  const [metaEnabled, setMetaEnabled] = useState(false);
  const [metaPixelId, setMetaPixelId] = useState('');
  const [metaCapiToken, setMetaCapiToken] = useState('');
  const [metaTestCode, setMetaTestCode] = useState('');

  // Formulario Google Ads
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleAdsId, setGoogleAdsId] = useState('');
  const [googlePurchaseLabel, setGooglePurchaseLabel] = useState('');

  const integrationsQuery = useQuery({
    queryKey: ['system', 'integrations'],
    queryFn: async (): Promise<IntegrationsApiResponse> => {
      const res = await apiFetch('/api/admin-system/integrations');
      if (!res.ok) throw new Error('Falló la carga de integraciones');
      return (await res.json()) as IntegrationsApiResponse;
    },
  });

  const handleOpenConfig = (row: IntegrationRow) => {
    if (row.key === 'meta_ads') {
      setMetaEnabled(row.enabled);
      setMetaPixelId(row.pixelId ?? '');
      setMetaCapiToken(''); // En blanco para mantener el existente si no se modifica
      setMetaTestCode(row.testEventCode ?? '');
      setEditingModal('meta_ads');
    } else if (row.key === 'google_ads') {
      setGoogleEnabled(row.enabled);
      setGoogleAdsId(row.adsId ?? '');
      setGooglePurchaseLabel(row.purchaseLabel ?? '');
      setEditingModal('google_ads');
    }
  };

  const handleSaveConfig = async () => {
    if (!editingModal) return;
    setSavingConfig(true);
    try {
      const payload: { enabled: boolean; config: Record<string, unknown> } = {
        enabled: editingModal === 'meta_ads' ? metaEnabled : googleEnabled,
        config:
          editingModal === 'meta_ads'
            ? {
                pixel_id: metaPixelId.trim(),
                ...(metaCapiToken.trim() ? { capi_token: metaCapiToken.trim() } : {}),
                test_event_code: metaTestCode.trim(),
              }
            : {
                ads_id: googleAdsId.trim(),
                purchase_label: googlePurchaseLabel.trim(),
              },
      };

      const res = await apiFetch(`/api/admin-system/integrations/${editingModal}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falló al guardar la configuración');
      }

      toast('Configuración guardada y sincronizada con la tienda', { type: 'success' });
      setEditingModal(null);
      await integrationsQuery.refetch();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error guardando configuración', { type: 'error' });
    } finally {
      setSavingConfig(false);
    }
  };

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

  const gateways = integrationsQuery.data?.gateways ?? [];
  const services = integrationsQuery.data?.services ?? [];
  const adsIntegrations = (integrationsQuery.data?.integrations ?? []).filter(
    (r) => r.key === 'meta_ads' || r.key === 'google_ads',
  );

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
                  Invalida toda la caché estática en la red de borde. Utilizar si los cambios de catálogo, stock o píxeles tardan en reflejarse.
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

        {/* Columna Derecha: Marketing & Servicios */}
        <div className="space-y-6">
          {/* Píxeles & Medición */}
          <section className="space-y-5 bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-accent">
                <Target size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Píxeles de Medición &amp; Adquisición
                </h3>
              </div>
              <Link
                href="/pixeles"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Abrir en Tienda Web</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              Configuración de Pixel, Conversions API y etiquetas de conversión para la tienda pública.
            </p>

            {integrationsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-sunken">
                    <div className="space-y-1">
                      <Skeleton variant="text" className="w-32 h-4" />
                      <Skeleton variant="text" className="w-48 h-3" />
                    </div>
                    <Skeleton variant="rectangular" className="w-16 h-6 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {adsIntegrations.map((row) => {
                  const isMeta = row.key === 'meta_ads';
                  const isGoogle = row.key === 'google_ads';

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
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenConfig(row)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors border border-border bg-surface-sunken hover:bg-muted text-foreground cursor-pointer min-h-9"
                        >
                          <Settings size={13} />
                          <span>Configurar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleIntegration(row)}
                          disabled={togglingKey === row.key}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors border cursor-pointer min-h-9 ${
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* Modal Configuración Meta Ads */}
      <ImmersiveModal
        open={editingModal === 'meta_ads'}
        onClose={() => setEditingModal(null)}
        title="Configuración de Meta Ads (Pixel + CAPI)"
      >
        <div className="py-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Configura el seguimiento de Meta Ads para la tienda. Los eventos se emitirán desde el navegador (Pixel) y desde el servidor (Conversions API) con deduplicación segura.
          </p>

          <label className="flex items-center gap-3 p-3 bg-surface-sunken/60 rounded-xl border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={metaEnabled}
              onChange={(e) => setMetaEnabled(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Habilitar integración en la tienda</p>
              <p className="text-xs text-muted-foreground">
                Control maestro: si está inactivo, ningún pixel ni llamada de servidor será emitida.
              </p>
            </div>
          </label>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Identificador del Pixel (Pixel ID)
            </label>
            <input
              type="text"
              value={metaPixelId}
              onChange={(e) => setMetaPixelId(e.target.value)}
              placeholder="ej. 1234567890123456"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-sunken border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Token de Conversions API (CAPI)
            </label>
            <input
              type="password"
              value={metaCapiToken}
              onChange={(e) => setMetaCapiToken(e.target.value)}
              placeholder="•••••••••••••••• (dejar en blanco para conservar actual)"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-sunken border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Código de evento de prueba (Test Event Code - opcional)
            </label>
            <input
              type="text"
              value={metaTestCode}
              onChange={(e) => setMetaTestCode(e.target.value)}
              placeholder="ej. TEST12345"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-sunken border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setEditingModal(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingConfig && <Loader2 size={13} className="animate-spin" />}
              <span>{savingConfig ? 'Guardando…' : 'Guardar'}</span>
            </button>
          </div>
        </div>
      </ImmersiveModal>

      {/* Modal Configuración Google Ads */}
      <ImmersiveModal
        open={editingModal === 'google_ads'}
        onClose={() => setEditingModal(null)}
        title="Configuración de Google Ads (gtag)"
      >
        <div className="py-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Configura el identificador y etiqueta de conversión de Google Ads.
          </p>

          <label className="flex items-center gap-3 p-3 bg-surface-sunken/60 rounded-xl border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={googleEnabled}
              onChange={(e) => setGoogleEnabled(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Habilitar integración en la tienda</p>
              <p className="text-xs text-muted-foreground">
                Control maestro: si está inactivo, el tag no se cargará en la tienda.
              </p>
            </div>
          </label>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Identificador Google Ads (AW-…)
            </label>
            <input
              type="text"
              value={googleAdsId}
              onChange={(e) => setGoogleAdsId(e.target.value)}
              placeholder="ej. AW-123456789"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-sunken border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Etiqueta de conversión de compra (Purchase Conversion Label)
            </label>
            <input
              type="text"
              value={googlePurchaseLabel}
              onChange={(e) => setGooglePurchaseLabel(e.target.value)}
              placeholder="ej. AbC-D_efGhi123456"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-sunken border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setEditingModal(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {savingConfig && <Loader2 size={13} className="animate-spin" />}
              <span>{savingConfig ? 'Guardando…' : 'Guardar'}</span>
            </button>
          </div>
        </div>
      </ImmersiveModal>
    </div>
  );
}
