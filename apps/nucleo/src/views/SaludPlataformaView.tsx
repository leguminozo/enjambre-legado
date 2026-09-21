'use client';

import { Activity, Database, Zap, Users, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { friendlyError } from '@enjambre/ui';

interface TableSize {
  table: string;
  size_mb: number;
}

interface SaludData {
  db: {
    db_size_bytes: number;
    db_size_mb: number;
    db_limit_mb: number;
    db_usage_pct: number;
    table_sizes: TableSize[];
    total_rows: Record<string, number>;
  };
  sync: {
    ventas_hoy: number;
    ventas_semana: number;
    ventas_offline: number;
    checkout_pendientes: number;
    checkout_expirados_hoy: number;
  };
  loyalty: {
    total_usuarios: number;
    clientes_activos_30d: number;
    eventos_lealtad_7d: number;
    reembolsos_pendientes: number;
    arco_pendientes: number;
  };
}

interface StatusIndicatorProps {
  type: 'success' | 'warning' | 'destructive';
  label: string;
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
      <div className={`h-2 w-2 rounded-full ${dotClasses[type]}`} /> {label}
    </div>
  );
}

export function SaludPlataformaView() {
  const apiFetch = useApiFetch();
  const { data, isLoading, error } = useQuery<SaludData>({
    queryKey: ['salud-plataforma'],
    queryFn: async () => {
      const res = await apiFetch('/api/salud');
      if (!res.ok) throw new Error('Error al consultar salud de plataforma');
      return res.json();
    },
  });

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

  const { db, sync, loyalty } = data;
  const dbStatus = db.db_usage_pct > 80 ? 'destructive' : db.db_usage_pct > 60 ? 'warning' : 'success';
  const dbStatusLabel = db.db_usage_pct > 80 ? 'Crítico' : db.db_usage_pct > 60 ? 'Atención' : 'Saludable';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <ViewShell
        variant="compact"
        eyebrow="Sistema"
        title="Salud de la Plataforma"
        subtitle="Monitoreo de recursos, operaciones y comunidad"
        icon={<Activity size={20} />}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Sección 1: Base de Datos */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Database size={18} className="text-muted-foreground" /> Almacenamiento
            </h3>
            <StatusIndicator type={dbStatus} label={dbStatusLabel} />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uso de Base de Datos</span>
              <span className="font-medium text-foreground">{db.db_size_mb} MB / {db.db_limit_mb} MB</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${db.db_usage_pct}%`, 
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
        </div>

        {/* Sección 2: Operaciones */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Zap size={18} className="text-muted-foreground" /> Operaciones
            </h3>
            <StatusIndicator 
              type={sync.checkout_pendientes > 10 ? 'warning' : 'success'} 
              label={sync.checkout_pendientes > 10 ? 'Atención' : 'Saludable'} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Ventas Hoy</span>
              <p className="text-2xl font-semibold text-foreground">{sync.ventas_hoy}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Ventas Semana</span>
              <p className="text-2xl font-semibold text-foreground">{sync.ventas_semana}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Sincronización Offline</span>
              <p className="text-2xl font-semibold text-foreground">{sync.ventas_offline}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Pagos Pendientes</span>
              <p className="text-2xl font-semibold text-foreground">{sync.checkout_pendientes}</p>
            </div>
          </div>
        </div>

        {/* Sección 3: Comunidad */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users size={18} className="text-muted-foreground" /> Comunidad
            </h3>
            <StatusIndicator 
              type={(loyalty.reembolsos_pendientes > 0 || loyalty.arco_pendientes > 0) ? 'warning' : 'success'} 
              label={(loyalty.reembolsos_pendientes > 0 || loyalty.arco_pendientes > 0) ? 'Atención' : 'Saludable'} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Usuarios Totales</span>
              <p className="text-2xl font-semibold text-foreground">{loyalty.total_usuarios}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Activos 30d</span>
              <p className="text-2xl font-semibold text-foreground">{loyalty.clientes_activos_30d}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Eventos Lealtad 7d</span>
              <p className="text-2xl font-semibold text-foreground">{loyalty.eventos_lealtad_7d}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Reembolsos Pendientes</span>
              <p className="text-2xl font-semibold text-foreground">{loyalty.reembolsos_pendientes}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Solicitudes Privacidad</span>
              <p className="text-2xl font-semibold text-foreground">{loyalty.arco_pendientes}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
