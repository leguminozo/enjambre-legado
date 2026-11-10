'use client';

import { useState } from 'react';
import {
  Target,
  Zap,
  CheckCircle,
  Loader2,
  RefreshCw,
  Power,
  Settings,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { toast, Badge, Skeleton, ImmersiveModal } from '@enjambre/ui';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ViewShell } from '@/components/layout/ViewShell';

export interface IntegrationItem {
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

export interface IntegrationsApiResponse {
  integrations?: IntegrationItem[];
  cache?: {
    tiendaConfigured: boolean;
    secretConfigured: boolean;
  };
}

export interface PixelesViewProps {
  embedded?: boolean;
}

export function PixelesView({ embedded = false }: PixelesViewProps) {
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
      if (!res.ok) throw new Error('Falló la carga de configuración de medición');
      return (await res.json()) as IntegrationsApiResponse;
    },
  });

  const metaRow = integrationsQuery.data?.integrations?.find((r) => r.key === 'meta_ads');
  const googleRow = integrationsQuery.data?.integrations?.find((r) => r.key === 'google_ads');

  const handleOpenConfig = (key: 'meta_ads' | 'google_ads') => {
    if (key === 'meta_ads' && metaRow) {
      setMetaEnabled(metaRow.enabled);
      setMetaPixelId(metaRow.pixelId ?? '');
      setMetaCapiToken('');
      setMetaTestCode(metaRow.testEventCode ?? '');
      setEditingModal('meta_ads');
    } else if (key === 'google_ads' && googleRow) {
      setGoogleEnabled(googleRow.enabled);
      setGoogleAdsId(googleRow.adsId ?? '');
      setGooglePurchaseLabel(googleRow.purchaseLabel ?? '');
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

      toast('Medición guardada y propagada a la tienda pública', { type: 'success' });
      setEditingModal(null);
      await integrationsQuery.refetch();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error guardando configuración', { type: 'error' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggle = async (key: 'meta_ads' | 'google_ads', currentEnabled: boolean) => {
    setTogglingKey(key);
    try {
      const res = await apiFetch(`/api/admin-system/integrations/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falló al alternar el estado');
      }
      toast(currentEnabled ? 'Seguimiento pausado' : 'Seguimiento activado', { type: 'success' });
      await integrationsQuery.refetch();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error actualizando estado', { type: 'error' });
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
        throw new Error(data.error || 'Falló la purga de caché');
      }
      toast('Caché de la tienda purgado correctamente', { type: 'success' });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error purgando caché', { type: 'error' });
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {!embedded && (
        <ViewShell
          variant="compact"
          eyebrow="Tienda Web · Adquisición"
          title="Píxeles & Medición"
          subtitle="Seguimiento de conversiones, eventos de compra y audiencias para Meta Ads y Google Ads"
          icon={<Target size={20} />}
        />
      )}

      {/* Grid Principal de Conectores de Medición */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Meta Ads Card */}
        <section className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-accent">
              <Target size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Meta Ads (Pixel + Conversions API)
              </h3>
            </div>
            {metaRow && (
              <div className="flex items-center gap-2">
                <Badge variant={metaRow.enabled ? 'success' : 'default'}>
                  {metaRow.enabled ? 'Activo' : 'Inactivo'}
                </Badge>
                <Badge variant={metaRow.mode === 'live' ? 'success' : 'default'}>
                  {metaRow.mode === 'live' ? 'En Vivo' : 'Modo Seguro (stub)'}
                </Badge>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Medición de doble canal (navegador y servidor) para catalogación de eventos de vista de producto, carritos y compras efectivas en el checkout.
          </p>

          {integrationsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton variant="rectangular" className="w-full h-12 rounded-xl" />
            </div>
          ) : metaRow ? (
            <div className="p-4 bg-surface-sunken/60 rounded-xl border border-border/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Identificador de Pixel</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {metaRow.pixelId ? metaRow.pixelId : 'No configurado'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">Token CAPI (Servidor)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {metaRow.hasCapiToken ? '•••••••• Presente' : 'Pendiente de registrar'}
                  </p>
                </div>
              </div>

              {metaRow.testEventCode && (
                <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  Código de pruebas activo: <span className="font-mono text-foreground">{metaRow.testEventCode}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenConfig('meta_ads')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors border border-border bg-surface-sunken hover:bg-muted text-foreground cursor-pointer min-h-9"
                >
                  <Settings size={13} />
                  <span>Configurar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle('meta_ads', metaRow.enabled)}
                  disabled={togglingKey === 'meta_ads'}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors border cursor-pointer min-h-9 ${
                    metaRow.enabled
                      ? 'bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/20'
                      : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20'
                  }`}
                >
                  {togglingKey === 'meta_ads' ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Power size={13} />
                  )}
                  <span>{metaRow.enabled ? 'Pausar' : 'Activar'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground p-3 bg-surface-sunken rounded-xl">
              Cargando origen de datos de Meta Ads…
            </div>
          )}
        </section>

        {/* Google Ads Card */}
        <section className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-accent">
              <Target size={18} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Google Ads (gtag + Conversión Purchase)
              </h3>
            </div>
            {googleRow && (
              <div className="flex items-center gap-2">
                <Badge variant={googleRow.enabled ? 'success' : 'default'}>
                  {googleRow.enabled ? 'Activo' : 'Inactivo'}
                </Badge>
                <Badge variant={googleRow.mode === 'live' ? 'success' : 'default'}>
                  {googleRow.mode === 'live' ? 'En Vivo' : 'Modo Seguro (stub)'}
                </Badge>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Medición de tráfico publicitario, atribución de clics y reporte de compras en el checkout a la consola de Google Ads.
          </p>

          {integrationsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton variant="rectangular" className="w-full h-12 rounded-xl" />
            </div>
          ) : googleRow ? (
            <div className="p-4 bg-surface-sunken/60 rounded-xl border border-border/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Identificador Google Ads</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {googleRow.adsId ? googleRow.adsId : 'No configurado (AW-…)'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">Etiqueta de Compra</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {googleRow.purchaseLabel ? 'Configurada' : 'Sin etiqueta'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenConfig('google_ads')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors border border-border bg-surface-sunken hover:bg-muted text-foreground cursor-pointer min-h-9"
                >
                  <Settings size={13} />
                  <span>Configurar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle('google_ads', googleRow.enabled)}
                  disabled={togglingKey === 'google_ads'}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors border cursor-pointer min-h-9 ${
                    googleRow.enabled
                      ? 'bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/20'
                      : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20'
                  }`}
                >
                  {togglingKey === 'google_ads' ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Power size={13} />
                  )}
                  <span>{googleRow.enabled ? 'Pausar' : 'Activar'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground p-3 bg-surface-sunken rounded-xl">
              Cargando origen de datos de Google Ads…
            </div>
          )}
        </section>
      </div>

      {/* Sincronización y Purga de Caché */}
      <section className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-accent">
          <Zap size={18} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Sincronización Inmediata con la Tienda
          </h3>
        </div>
        <div className="p-4 bg-surface-sunken/60 rounded-xl border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Invalidación de Caché Edge (Tienda Pública)</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Al modificar identificadores de pixel o etiquetas de conversión, purga el caché de la red de borde para garantizar que todos los visitantes comiencen a emitir con los nuevos IDs sin esperar expiraciones de TTL.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePurgeCache}
            disabled={purging}
            className="shrink-0 inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-colors border border-primary/20 cursor-pointer disabled:opacity-50 min-h-10"
          >
            {purging ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            <span>{purging ? 'Propagando…' : 'Propagar a Tienda'}</span>
          </button>
        </div>
      </section>

      {/* Privacidad y Atribución Responsable */}
      <div className="flex items-start gap-3 p-4 bg-surface-sunken/40 rounded-xl border border-border/60 text-xs text-muted-foreground">
        <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Atribución Respetuosa y Deduplicación</p>
          <p>
            El sistema deduplica eventos de forma simétrica entre el cliente web y la API de conversiones del servidor usando el código identificador de pedido. Los datos personales son procesados con hashing unidireccional conforme a las políticas de privacidad de la plataforma.
          </p>
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
            Configura el seguimiento de Meta Ads para la tienda pública.
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
              placeholder={metaRow?.hasCapiToken ? '•••••••••••••••• (dejar en blanco para conservar actual)' : 'EAAXXXXXXXX...'}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-sunken border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Token del sistema generado en Administrador de Eventos de Meta.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Código de evento de prueba (Test Event Code - opcional)
            </label>
            <input
              type="text"
              value={metaTestCode}
              onChange={(e) => setMetaTestCode(e.target.value)}
              placeholder="ej. TEST12345 (dejar vacío en producción)"
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
              <span>{savingConfig ? 'Guardando…' : 'Guardar y Aplicar'}</span>
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
            Configura el seguimiento de Google Ads para registrar conversiones de compra en la tienda.
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
              Identificador de Conversión (Google Ads ID)
            </label>
            <input
              type="text"
              value={googleAdsId}
              onChange={(e) => setGoogleAdsId(e.target.value)}
              placeholder="ej. AW-123456789"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-sunken border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Empieza con &quot;AW-&quot; seguido de tu identificador numérico de cuenta.
            </p>
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
            <p className="text-[11px] text-muted-foreground">
              Cadena alfanumérica generada al crear una acción de conversión de tipo compra en Google Ads.
            </p>
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
              <span>{savingConfig ? 'Guardando…' : 'Guardar y Aplicar'}</span>
            </button>
          </div>
        </div>
      </ImmersiveModal>
    </div>
  );
}
