'use client';

import { useState } from 'react';
import {
  Activity,
  Database,
  Zap,
  Users,
  Webhook,
  Clock3,
  SlidersHorizontal,
  Loader2,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { friendlyError, toast, Badge, cn } from '@enjambre/ui';
import { supabase } from '@/lib/supabase';
import type { SecurityEvent, SecurityEventType, AppSource } from '@enjambre/auth/security-events';

interface SecurityEventRow {
  id: string;
  event_type: string;
  email: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  app_source: string;
  created_at: string;
}

interface TableSize {
  table: string;
  size_mb: number;
}

interface Umbral {
  warning: number;
  critical: number;
}

interface SaludData {
  db: {
    db_size_bytes: number;
    db_size_mb: number;
    db_limit_mb: number;
    db_usage_pct: number;
    table_sizes: TableSize[];
    total_rows: Record<string, number>;
  } | null;
  sync: {
    ventas_hoy: number;
    ventas_semana: number;
    ventas_offline: number;
    checkout_pendientes: number;
    checkout_expirados_hoy: number;
  } | null;
  loyalty: {
    total_usuarios: number;
    clientes_activos_30d: number;
    eventos_lealtad_7d: number;
    reembolsos_pendientes: number;
    arco_pendientes: number;
  } | null;
  webhooks: {
    sessions_24h: { completed: number; pending: number; expired_24h: number };
    failures_24h: { pending: number; retrying: number; failed: number; resolved_24h: number };
    sessions_7d: { completed: number; expired_7d: number };
    failures_7d: { open: number; resolved_7d: number };
  } | null;
  crons: Record<
    string,
    {
      started_at: string;
      finished_at: string | null;
      duration_ms: number | null;
      success: boolean;
      summary: Record<string, unknown>;
      error: string | null;
      stale_hours: number;
    }
  > | null;
  umbrales: Record<string, Umbral>;
  queue_pending: number | null;
}

type SemType = 'success' | 'warning' | 'destructive';

function sem(valor: number, umbral: Umbral | undefined, fallbackWarn: number, fallbackCrit: number): SemType {
  const w = umbral?.warning ?? fallbackWarn;
  const c = umbral?.critical ?? fallbackCrit;
  if (valor >= c) return 'destructive';
  if (valor >= w) return 'warning';
  return 'success';
}

const SEM_LABEL: Record<SemType, string> = {
  success: 'Saludable',
  warning: 'Atención',
  destructive: 'Crítico',
};

interface StatusIndicatorProps {
  type: SemType;
  label?: string;
}

function StatusIndicator({ type, label }: StatusIndicatorProps) {
  const bgClasses = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    destructive: 'bg-destructive/15 text-destructive',
  };
  const dotClasses = {
    success: 'bg-success animate-pulse',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${bgClasses[type]}`}>
      <div className={`h-2 w-2 rounded-full ${dotClasses[type]}`} /> {label ?? SEM_LABEL[type]}
    </div>
  );
}

export interface MetricProps {
  label: string;
  value: string | number;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

const CRON_JOBS = [
  { key: 'notifications', nombre: 'Notificaciones + ARCO', horario: '08:00 UTC' },
  { key: 'fiscal', nombre: 'Fiscal SII / CAF', horario: '13:00 UTC' },
  { key: 'checkout', nombre: 'Checkout + reposiciones', horario: '14:00 UTC' },
];

const UMBRAL_LABELS: Record<string, string> = {
  db_usage_pct: 'Uso de base de datos (%)',
  checkout_pendientes: 'Pagos pendientes (n)',
  notif_queue_pending: 'Cola de avisos pendiente (n)',
  webhook_fail_rate_pct: 'Falla de webhooks 24h (%)',
  cron_stale_hours: 'Antigüedad de cron (horas)',
};

function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Sin registros';
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface SaludPlataformaViewProps {}

export function SaludPlataformaView(_props: SaludPlataformaViewProps = {}) {
  const apiFetch = useApiFetch();
  const { data, isLoading, error, refetch } = useQuery<SaludData>({
    queryKey: ['salud-plataforma'],
    queryFn: async () => {
      const res = await apiFetch('/api/salud');
      if (!res.ok) throw new Error('Error al consultar salud de plataforma');
      return res.json();
    },
    // Sin Realtime: la actualización ocurre al volver a la pestaña.
    refetchOnWindowFocus: true,
    staleTime: 60_000,
  });

  const [activeTab, setActiveTab] = useState<'recursos' | 'auditoria'>('recursos');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'tienda' | 'campo' | 'nucleo'>('all');

  const securityQuery = useQuery({
    queryKey: ['salud', 'security-events'],
    queryFn: async (): Promise<SecurityEvent[]> => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return ((data ?? []) as unknown as SecurityEventRow[]).map((row) => ({
        id: row.id,
        eventType: row.event_type as SecurityEventType,
        email: row.email,
        userId: row.user_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        details: row.details || {},
        appSource: row.app_source as AppSource,
        createdAt: row.created_at,
      }));
    },
    refetchInterval: 30000,
  });

  const [editingUmbrales, setEditingUmbrales] = useState<Record<string, Umbral>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const saveUmbral = async (key: string) => {
    const draft = editingUmbrales[key];
    if (!draft) return;
    setSavingKey(key);
    try {
      const res = await apiFetch(`/api/salud/umbrales/${key}`, {
        method: 'PATCH',
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || 'Error al guardar');
      }
      toast.success('Umbral actualizado');
      await refetch();
      setEditingUmbrales((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar el umbral');
    } finally {
      setSavingKey(null);
    }
  };

  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <ViewShell
          variant="compact"
          eyebrow="Sistema"
          title="Salud de la Plataforma"
          subtitle="Monitoreo de recursos, operaciones y comunidad"
          icon={<Activity size={20} />}
        />
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
          {friendlyError(error)}
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <ViewShell
          variant="compact"
          eyebrow="Sistema"
          title="Salud de la Plataforma"
          subtitle="Monitoreo de recursos, operaciones y comunidad"
          icon={<Activity size={20} />}
        />
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const { db, sync, loyalty, webhooks, crons, umbrales, queue_pending } = data;

  const dbStatus = db ? sem(db.db_usage_pct, umbrales.db_usage_pct, 60, 80) : 'warning';
  const dbStatusLabel = db ? SEM_LABEL[dbStatus] : 'Sin datos';

  const fail24h = webhooks
    ? webhooks.failures_24h.pending + webhooks.failures_24h.retrying + webhooks.failures_24h.failed
    : 0;
  const ok24h = webhooks?.sessions_24h.completed ?? 0;
  const failRate24h = ok24h + fail24h > 0 ? Math.round((fail24h / (ok24h + fail24h)) * 1000) / 10 : 0;
  const webhookStatus = sem(failRate24h, umbrales.webhook_fail_rate_pct, 5, 20);

  const cronWorstStale = crons
    ? Math.max(0, ...CRON_JOBS.map((j) => crons[j.key]?.stale_hours ?? 0))
    : 0;
  const cronStatus =
    crons && CRON_JOBS.some((j) => crons[j.key] && !crons[j.key].success)
      ? 'destructive'
      : sem(cronWorstStale, umbrales.cron_stale_hours, 26, 50);

  const filteredEvents = (securityQuery.data ?? []).filter((ev) => {
    if (sourceFilter === 'all') return true;
    return ev.appSource === sourceFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <ViewShell
        variant="compact"
        eyebrow="Plataforma"
        title="Salud & Seguridad"
        subtitle="Monitoreo de recursos, métricas de operación y auditoría de seguridad"
        icon={<Activity size={20} />}
      />

      {/* Selector de pestañas */}
      <div className="flex flex-wrap gap-2 border-b border-border/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('recursos')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer',
            activeTab === 'recursos'
              ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          )}
        >
          <Activity size={15} />
          <span>Métricas &amp; Recursos</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('auditoria')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer',
            activeTab === 'auditoria'
              ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          )}
        >
          <ShieldAlert size={15} />
          <span>Auditoría de Seguridad</span>
        </button>
      </div>

      {activeTab === 'recursos' && (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Sección 1: Base de Datos */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Database size={18} className="text-muted-foreground" /> Almacenamiento
            </h3>
            <StatusIndicator type={dbStatus} label={dbStatusLabel} />
          </div>

          {db ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uso de Base de Datos</span>
                  <span className="font-medium text-foreground">{db.db_size_mb} MB / {db.db_limit_mb} MB</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Uso de Base de Datos"
                  aria-valuenow={db.db_usage_pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-3 w-full rounded-full bg-muted overflow-hidden"
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, db.db_usage_pct))}%`,
                      backgroundColor: `var(--${dbStatus})`
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Tablas más grandes</h4>
                <div className="space-y-2">
                  {db.table_sizes.slice(0, 5).map(t => (
                    <div key={t.table} className="flex justify-between text-sm">
                      <span className="text-foreground truncate pr-2" title={t.table}>{t.table}</span>
                      <span className="text-muted-foreground whitespace-nowrap">{t.size_mb} MB</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos de almacenamiento.</p>
          )}

          <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
            Egress y conexiones Realtime se revisan en el panel de Supabase (no se exponen por SQL).
            {' '}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Abrir panel <ExternalLink size={11} />
            </a>
          </p>
        </div>

        {/* Sección 2: Operaciones */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Zap size={18} className="text-muted-foreground" /> Operaciones
            </h3>
            <StatusIndicator
              type={sync && sync.checkout_pendientes > (umbrales.checkout_pendientes?.warning ?? 10) ? 'warning' : 'success'}
              label={sync && sync.checkout_pendientes > (umbrales.checkout_pendientes?.warning ?? 10) ? 'Atención' : 'Saludable'}
            />
          </div>

          {sync ? (
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Ventas Hoy" value={sync.ventas_hoy} />
              <Metric label="Ventas Semana" value={sync.ventas_semana} />
              <Metric label="Sincronización Offline" value={sync.ventas_offline} />
              <Metric label="Pagos Pendientes" value={sync.checkout_pendientes} />
              <Metric label="Avisos en cola" value={queue_pending ?? '—'} />
              <Metric label="Sesiones expiradas hoy" value={sync.checkout_expirados_hoy} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos de operaciones.</p>
          )}
        </div>

        {/* Sección 3: Comunidad */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users size={18} className="text-muted-foreground" /> Comunidad
            </h3>
            <StatusIndicator
              type={loyalty && (loyalty.reembolsos_pendientes > 0 || loyalty.arco_pendientes > 0) ? 'warning' : 'success'}
              label={loyalty && (loyalty.reembolsos_pendientes > 0 || loyalty.arco_pendientes > 0) ? 'Atención' : 'Saludable'}
            />
          </div>

          {loyalty ? (
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Usuarios Totales" value={loyalty.total_usuarios} />
              <Metric label="Activos 30d" value={loyalty.clientes_activos_30d} />
              <Metric label="Eventos Lealtad 7d" value={loyalty.eventos_lealtad_7d} />
              <Metric label="Reembolsos Pendientes" value={loyalty.reembolsos_pendientes} />
              <Metric label="Solicitudes Privacidad" value={loyalty.arco_pendientes} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos de comunidad.</p>
          )}
        </div>

        {/* Sección 4: Webhooks de pago */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Webhook size={18} className="text-muted-foreground" /> Webhooks de pago
            </h3>
            <StatusIndicator type={webhookStatus} label={webhookStatus === 'success' ? `Falla ${failRate24h}%` : SEM_LABEL[webhookStatus]} />
          </div>

          {webhooks ? (
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Cobros OK 24h" value={webhooks.sessions_24h.completed} />
              <Metric label="Fallos abiertos 24h" value={fail24h} />
              <Metric label="Cobros OK 7d" value={webhooks.sessions_7d.completed} />
              <Metric label="Fallos abiertos 7d" value={webhooks.failures_7d.open} />
              <Metric label="Recuperados 24h" value={webhooks.failures_24h.resolved_24h} />
              <Metric label="Expirados 24h" value={webhooks.sessions_24h.expired_24h} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos de webhooks.</p>
          )}
        </div>

        {/* Sección 5: Crons diarios */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock3 size={18} className="text-muted-foreground" /> Crons diarios
            </h3>
            <StatusIndicator type={cronStatus} />
          </div>

          <div className="space-y-3">
            {CRON_JOBS.map((job) => {
              const run = crons?.[job.key];
              return (
                <div key={job.key} className="rounded-xl border border-border/70 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{job.nombre}</span>
                    {run ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                          run.success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {run.success ? 'OK' : 'Falló'}
                      </span>
                    ) : (
                      <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-medium bg-surface-sunken text-muted-foreground">
                        Sin registros
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {job.horario} · último run {formatDateTime(run?.started_at ?? null)}
                    {run ? ` · duró ${formatDuration(run.duration_ms)} · hace ${run.stale_hours} h` : ''}
                  </p>
                  {run?.error ? (
                    <p className="text-xs text-destructive truncate" title={run.error}>{run.error}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección 6: Umbrales del semáforo */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-muted-foreground" /> Umbrales
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(UMBRAL_LABELS).map(([key, label]) => {
              const current = umbrales[key];
              const draft = editingUmbrales[key] ?? current;
              if (!draft) return null;
              return (
                <div key={key} className="rounded-xl border border-border/70 p-3.5 space-y-2">
                  <p className="text-xs font-medium text-foreground">{label}</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      Aviso
                      <input
                        type="number"
                        min={0}
                        value={draft.warning}
                        onChange={(e) =>
                          setEditingUmbrales((prev) => ({
                            ...prev,
                            [key]: { ...draft, warning: Number(e.target.value) },
                          }))
                        }
                        className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      Crítico
                      <input
                        type="number"
                        min={0}
                        value={draft.critical}
                        onChange={(e) =>
                          setEditingUmbrales((prev) => ({
                            ...prev,
                            [key]: { ...draft, critical: Number(e.target.value) },
                          }))
                        }
                        className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void saveUmbral(key)}
                      disabled={!editingUmbrales[key] || savingKey === key}
                      className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-95 disabled:opacity-40"
                    >
                      {savingKey === key ? 'Guardando…' : 'Guardar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Pestaña: Auditoría de Seguridad */}
      {activeTab === 'auditoria' && (
        <section className="space-y-5 bg-card p-6 rounded-2xl border border-border shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-accent" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Auditoría de Seguridad
                </h3>
                {securityQuery.isFetching && (
                  <Loader2 size={14} className="animate-spin text-muted-foreground ml-2" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Eventos de autenticación, revocación de sesiones e intentos de acceso en todo el ecosistema.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filtros de origen */}
              <div className="flex items-center rounded-xl bg-surface-sunken p-1 border border-border/60 text-xs">
                {(['all', 'tienda', 'campo', 'nucleo'] as const).map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setSourceFilter(source)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                      sourceFilter === source
                        ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {source === 'all' ? 'Todos' : source.charAt(0).toUpperCase() + source.slice(1)}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void securityQuery.refetch()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface-raised text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Actualizar eventos"
                aria-label="Actualizar eventos"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {securityQuery.isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : securityQuery.isError ? (
              <div className="text-xs text-destructive p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                Error al consultar los eventos de seguridad.
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-surface-sunken/40 rounded-xl border border-dashed border-border/80">
                No se registran eventos de seguridad para el filtro seleccionado.
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const isThreat = ev.eventType.includes('failed') || ev.eventType.includes('denied');
                return (
                  <div
                    key={ev.id}
                    className="p-4 bg-surface-sunken/50 rounded-xl border border-border/60 flex flex-col gap-2.5 hover:border-border transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={isThreat ? 'danger' : 'default'}>
                          {ev.eventType}
                        </Badge>
                        <span className="text-xs font-medium text-foreground">
                          {ev.email || 'Anónimo'}
                        </span>
                        {ev.ipAddress && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            · IP: {ev.ipAddress}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(ev.createdAt).toLocaleString('es-CL')}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                          {ev.appSource}
                        </span>
                      </div>
                    </div>

                    {ev.details && Object.keys(ev.details).length > 0 && (
                      <pre className="text-[11px] bg-background p-2.5 rounded-lg border border-border/40 overflow-x-auto text-muted-foreground font-mono">
                        {JSON.stringify(ev.details, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}
