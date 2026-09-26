import { useState } from 'react';
import Link from 'next/link';
import {
  Warehouse,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
} from 'lucide-react';
import { ViewLoading, toast } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useLogisticaDashboard } from '@/components/logistica/use-logistica-dashboard';
import type { StockCenter } from '@/components/logistica/types';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  StockCenterComposerModal,
  type StockCenterFormState,
} from '@/components/logistica/StockCenterComposerModal';
import { StockCenterItemsList } from '@/components/logistica/StockCenterItemsList';

/**
 * Centros de stock logísticos (multicentro de despacho).
 * No confundir con Inventario de Producción (stock de productos de tienda).
 */
export function CentrosStockView() {
  const { dashboard, isLoading, refetch } = useLogisticaDashboard();
  const { stockCenters, stats } = dashboard;
  const apiFetch = useApiFetch();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<StockCenter | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCenterIds, setExpandedCenterIds] = useState<Set<string>>(new Set());

  const toggleExpandCenter = (id: string) => {
    setExpandedCenterIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveStockCenter = async (form: StockCenterFormState) => {

    setSubmitting(true);
    try {
      const url = editingCenter
        ? `/api/logistica/stock-centers/${editingCenter.id}`
        : '/api/logistica/stock-centers';
      const method = editingCenter ? 'PATCH' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Error al procesar centro de stock' }));
        throw new Error(errData.message || 'Error al procesar centro de stock');
      }

      toast.success(editingCenter ? 'Centro de stock actualizado' : 'Centro de stock registrado exitosamente');
      setEditingCenter(null);
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
        subtitle="Stock por centro logístico (sachets, frascos, cofres)."
        icon={<Warehouse size={20} />}
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingCenter(null);
              setModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} /> Nuevo Centro
          </button>
        }
      />

      <Link
        href="/produccion/inventario"
        className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 hover:border-primary/40 transition-colors group"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ArrowLeft size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Inventario General (Bodega Matriz Pureo)</p>
          <p className="text-xs text-muted-foreground">
            Ver catálogo central, insumos, envases y derivar stock hacia centros
          </p>
        </div>
        <ChevronRight size={15} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
      </Link>

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
            {stockCenters.map((sc) => {
              const isExpanded = expandedCenterIds.has(sc.id);
              const itemsCount = sc.items?.length ?? 0;
              return (
                <div key={sc.id} className="transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 md:px-6 items-center hover:bg-surface-sunken/50">
                    <div className="col-span-1 md:col-span-4 flex justify-between md:justify-start items-center gap-2">
                      <span className="text-xs text-muted-foreground md:hidden">Centro:</span>
                      <span className="font-medium text-foreground">{sc.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleExpandCenter(sc.id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border border-border/80 bg-surface-sunken hover:border-primary/40 text-foreground transition-colors"
                      >
                        <Package size={11} className="text-primary" />
                        <span>{itemsCount} ítems</span>
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
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
                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center gap-1.5">
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
                        onClick={() => {
                          setEditingCenter(sc);
                          setModalOpen(true);
                        }}
                        title="Editar centro de stock"
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors shrink-0 ml-auto md:ml-0"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStockCenter(sc.id, sc.name)}
                        disabled={deletingId === sc.id}
                        title="Eliminar centro de stock"
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 disabled:opacity-50"
                      >
                        {deletingId === sc.id ? (
                          <Loader2 size={14} className="animate-spin text-destructive" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 md:px-6 bg-surface-sunken/30">
                      <StockCenterItemsList center={sc} onRefresh={async () => { await refetch(); }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      ) : (
        <div className="card text-center py-12 text-muted-foreground text-sm">
          <Warehouse size={32} className="mx-auto mb-2 opacity-50" />
          <p className="mb-4">Sin centros de stock registrados</p>
          <button
            type="button"
            onClick={() => {
              setEditingCenter(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-primary hover:text-foreground transition-colors"
          >
            <Plus size={14} /> Registrar primer centro
          </button>
        </div>
      )}

      <StockCenterComposerModal
        key={editingCenter?.id ?? (modalOpen ? 'new' : 'closed')}
        open={modalOpen}
        initialData={editingCenter}
        onClose={() => {
          setModalOpen(false);
          setEditingCenter(null);
        }}
        onSubmit={handleSaveStockCenter}
        submitting={submitting}
      />
    </div>
  );
}
