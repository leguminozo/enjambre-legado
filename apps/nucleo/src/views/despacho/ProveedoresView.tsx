'use client';

import { Users, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { ViewLoading } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useLogisticaDashboard } from '@/components/logistica/use-logistica-dashboard';

export function ProveedoresView() {
  const { dashboard, isLoading } = useLogisticaDashboard();
  const { proveedores, stats } = dashboard;

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Despacho"
        title="Proveedores"
        subtitle="Red de proveedores de insumos y empaques: próximos despachos y urgencias."
        icon={<Users size={20} />}
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalProveedores}</div>
          <div className="stat-label">Proveedores</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${stats.urgentProviders > 0 ? 'text-destructive' : ''}`}>
            {stats.urgentProviders}
          </div>
          <div className="stat-label">Urgentes</div>
        </div>
      </div>

      {isLoading ? (
        <ViewLoading variant="view" label="Proveedores" hideLabel />
      ) : proveedores.length > 0 ? (
        <div className="card space-y-2 p-4">
          {proveedores.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-sunken border border-border"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  p.urgent
                    ? 'bg-destructive/15 text-destructive border border-destructive/30'
                    : 'bg-success/15 text-success border border-success/30'
                }`}
              >
                {p.urgent ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
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
        <div className="card text-center py-12 text-muted-foreground text-sm">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          Aún no hay proveedores en la red
        </div>
      )}
    </div>
  );
}
