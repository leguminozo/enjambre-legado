'use client';

import { useState } from 'react';
import { Warehouse, CheckCircle2, AlertCircle, Plus, Trash2, Loader2 } from 'lucide-react';
import { ViewLoading, toast } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useLogisticaDashboard } from '@/components/logistica/use-logistica-dashboard';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  StockCenterComposerModal,
  type StockCenterFormState,
} from '@/components/logistica/StockCenterComposerModal';

/**
 * Centros de stock logísticos (multicentro de despacho).
 * No confundir con Inventario de Producción (stock de productos de tienda).
 */
export function CentrosStockView() {
  const { dashboard, isLoading, refetch } = useLogisticaDashboard();
  const { stockCenters, stats } = dashboard;
  const apiFetch = useApiFetch();

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateStockCenter = async (form: StockCenterFormState) => {
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/logistica/stock-centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Error al crear centro de stock' }));
        throw new Error(errData.message || 'Error al crear centro de stock');
      }

      toast.success('Centro de stock registrado exitosamente');
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar el centro de stock';
      toast.error(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStockCenter = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el centro de stock "${name}"?`)) return;

    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/logistica/stock-centers/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Error al eliminar centro de stock' }));
        throw new Error(errData.message || 'Error al eliminar centro de stock');
      }

      toast.success(`Centro "${name}" eliminado`);
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar el centro de stock';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Despacho"
        title="Centros de stock"
        subtitle="Stock por centro logístico (sachets, frascos, cofres). El inventario de productos de tienda vive en Producción → Inventario."
        icon={<Warehouse size={20} />}
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} /> Nuevo Centro
          </button>
        }
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
            <div className="col-span-2 text-right">Acciones</div>
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
                <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center gap-2">
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
                  <button
                    type="button"
                    onClick={() => handleDeleteStockCenter(sc.id, sc.name)}
                    disabled={deletingId === sc.id}
                    title="Eliminar centro de stock"
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 disabled:opacity-50 ml-auto md:ml-0"
                  >
                    {deletingId === sc.id ? (
                      <Loader2 size={14} className="animate-spin text-destructive" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 text-muted-foreground text-sm">
          <Warehouse size={32} className="mx-auto mb-2 opacity-50" />
          <p className="mb-4">Sin centros de stock registrados</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-primary hover:text-foreground transition-colors"
          >
            <Plus size={14} /> Registrar primer centro
          </button>
        </div>
      )}

      <StockCenterComposerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateStockCenter}
        submitting={submitting}
      />
    </div>
  );
}
