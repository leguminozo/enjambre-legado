'use client';

import { Warehouse, CheckCircle2, AlertCircle } from 'lucide-react';
import { ViewLoading } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useLogisticaDashboard } from '@/components/logistica/use-logistica-dashboard';

/**
 * Centros de stock logísticos (multicentro de despacho).
 * No confundir con Inventario de Producción (stock de productos de tienda).
 */
export function CentrosStockView() {
  const { dashboard, isLoading } = useLogisticaDashboard();
  const { stockCenters, stats } = dashboard;

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Despacho"
        title="Centros de stock"
        subtitle="Stock por centro logístico (sachets, frascos, cofres). El inventario de productos de tienda vive en Producción → Inventario."
        icon={<Warehouse size={20} />}
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalStockCenters}</div>
          <div className="stat-label">Centros</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${stats.lowStockCenters > 0 ? 'text-destructive' : ''}`}>
            {stats.lowStockCenters}
          </div>
          <div className="stat-label">Con stock bajo</div>
        </div>
      </div>

      {isLoading ? (
        <ViewLoading variant="view" label="Centros" hideLabel />
      ) : stockCenters.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-sunken text-xs uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
            <div className="col-span-4">Centro</div>
            <div className="col-span-2 text-right">Sachets</div>
            <div className="col-span-2 text-right">Frascos</div>
            <div className="col-span-2 text-right">Cofres</div>
            <div className="col-span-2 text-right">Estado</div>
          </div>
          <div className="divide-y divide-border">
            {stockCenters.map((sc) => (
              <div
                key={sc.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 md:px-6 items-center hover:bg-surface-sunken/50 transition-colors"
              >
                <div className="col-span-1 md:col-span-4 flex justify-between md:justify-start items-center">
                  <span className="text-xs text-muted-foreground md:hidden">Centro:</span>
                  <span className="font-medium text-foreground">{sc.name}</span>
                </div>
                <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center">
                  <span className="text-xs text-muted-foreground md:hidden">Sachets:</span>
                  <span className="font-display">{sc.sachets.toLocaleString()}</span>
                </div>
                <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center">
                  <span className="text-xs text-muted-foreground md:hidden">Frascos:</span>
                  <span className="font-display">{sc.frascos}</span>
                </div>
                <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center">
                  <span className="text-xs text-muted-foreground md:hidden">Cofres:</span>
                  <span className="font-display">{sc.cofres}</span>
                </div>
                <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center">
                  <span className="text-xs text-muted-foreground md:hidden">Estado:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                      sc.ok
                        ? 'bg-success/15 text-success border-success/30'
                        : 'bg-destructive/15 text-destructive border-destructive/30'
                    }`}
                  >
                    {sc.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {sc.ok ? 'Óptimo' : 'Bajo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 text-muted-foreground text-sm">
          <Warehouse size={32} className="mx-auto mb-2 opacity-50" />
          Sin centros de stock registrados
        </div>
      )}
    </div>
  );
}
