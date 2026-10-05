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
  MapPin,
  UserCheck,
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

const TIPO_LABELS: Record<string, { label: string; badgeClass: string }> = {
  bodega: { label: 'Bodega', badgeClass: 'bg-primary/10 text-primary border-primary/20' },
  despacho: { label: 'Despacho D2C', badgeClass: 'bg-accent/20 text-accent-foreground border-accent/30' },
  acopio: { label: 'Acopio Territorial', badgeClass: 'bg-surface-raised text-foreground border-border' },
  feria: { label: 'Punto Feria', badgeClass: 'bg-warning/15 text-warning border-warning/30' },
  consignacion: { label: 'Consignación', badgeClass: 'bg-muted text-muted-foreground border-border' },
  otro: { label: 'Recinto Logístico', badgeClass: 'bg-muted text-muted-foreground border-border' },
};

/**
 * Centros de stock logísticos (red multicentro de acopio y despacho territorial).
 * El inventario se abastece de forma trazable mediante derivación desde la Bodega Matriz Pureo.
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

      const resJson = (await res.json().catch(() => null)) as { data?: { id?: string } } | null;
      const createdId = resJson?.data?.id;

      toast.success(editingCenter ? 'Centro de stock actualizado' : 'Centro de stock registrado exitosamente');
      setEditingCenter(null);
      await refetch();

      if (createdId) {
        // Expandir de inmediato el centro nuevo para que el operador pueda abastecerlo
        setExpandedCenterIds((prev) => new Set(prev).add(createdId));
      }
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

  const totalUnidadesEnRed = stockCenters.reduce(
    (sum, sc) => sum + (sc.items ?? []).reduce((acc, it) => acc + Number(it.cantidad || 0), 0),
    0
  );

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Despacho · Red Territorial"
        title="Centros de stock"
        subtitle="Puntos de acopio, bodegas y centros de distribución territorial."
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
          <div className="stat-label">Centros en red</div>
        </div>
        <div className="stat-card">
          <div className="stat-value font-display">{totalUnidadesEnRed.toLocaleString('es-CL')}</div>
          <div className="stat-label">Unidades en custodia</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${stats.lowStockCenters > 0 ? 'text-destructive' : ''}`}>
            {stats.lowStockCenters}
          </div>
          <div className="stat-label">Con stock bajo o revisión</div>
        </div>
      </div>

      {isLoading ? (
        <ViewLoading variant="view" label="Centros" hideLabel />
      ) : stockCenters.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-sunken text-xs uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
            <div className="col-span-4">Centro Logístico & Rol</div>
            <div className="col-span-3">Territorio & Custodio</div>
            <div className="col-span-2 text-right">Inventario</div>
            <div className="col-span-1 text-center">Estado</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>
          <div className="divide-y divide-border">
            {stockCenters.map((sc) => {
              const isExpanded = expandedCenterIds.has(sc.id);
              const items = sc.items ?? [];
              const itemsCount = items.length;
              const totalUnits = items.reduce((acc, it) => acc + Number(it.cantidad || 0), 0);
              const itemsUnderMin = items.filter(
                (it) => it.stock_minimo > 0 && it.cantidad <= it.stock_minimo
              ).length;
              const tipoMeta = TIPO_LABELS[sc.tipo || 'bodega'] ?? TIPO_LABELS.otro;

              return (
                <div key={sc.id} className="transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 md:px-6 items-center hover:bg-surface-sunken/40">
                    {/* Centro y rol */}
                    <div className="col-span-1 md:col-span-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{sc.name}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${tipoMeta.badgeClass}`}
                        >
                          {tipoMeta.label}
                        </span>
                      </div>
                      {sc.direccion && (
                        <p className="text-[11px] text-muted-foreground truncate">{sc.direccion}</p>
                      )}
                    </div>

                    {/* Territorio & Custodio */}
                    <div className="col-span-1 md:col-span-3 space-y-0.5">
                      <div className="text-xs text-foreground flex items-center gap-1">
                        <MapPin size={11} className="text-primary shrink-0" />
                        <span>{sc.comuna || 'Territorio Central'}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <UserCheck size={11} className="text-muted-foreground shrink-0" />
                        <span className="truncate">{sc.responsable || 'Sin custodio asignado'}</span>
                        {sc.contacto && <span className="truncate">· {sc.contacto}</span>}
                      </div>
                    </div>

                    {/* Inventario */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-baseline md:flex-col md:items-end">
                      <span className="text-xs text-muted-foreground md:hidden">Inventario:</span>
                      <div className="text-xs font-semibold text-foreground">
                        {itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-display">
                        {totalUnits.toLocaleString('es-CL')} unidades
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="col-span-1 md:col-span-1 flex justify-between md:justify-center items-center">
                      <span className="text-xs text-muted-foreground md:hidden">Estado:</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          sc.ok
                            ? 'bg-success/15 text-success border-success/30'
                            : 'bg-muted/40 text-muted-foreground border-border'
                        }`}
                      >
                        <CheckCircle2 size={11} />
                        {sc.ok ? 'Operativo' : 'En mantención'}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                      <button
                        type="button"
                        onClick={() => toggleExpandCenter(sc.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border bg-surface-sunken hover:border-primary/40 text-foreground transition-colors"
                        title={isExpanded ? 'Ocultar inventario' : 'Ver inventario'}
                      >
                        <Package size={12} className="text-primary" />
                        <span>{isExpanded ? 'Cerrar' : 'Inventario'}</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingCenter(sc);
                          setModalOpen(true);
                        }}
                        title="Editar centro de stock"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors shrink-0"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteStockCenter(sc.id, sc.name)}
                        disabled={deletingId === sc.id}
                        title="Eliminar centro de stock"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 disabled:opacity-50"
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
        initialData={editingCenter ? { ...editingCenter, tipo: editingCenter.tipo ?? undefined } : null}
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
