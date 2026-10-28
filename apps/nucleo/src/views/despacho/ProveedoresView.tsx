'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  AlertCircle,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  PackageCheck,
  Search,
  Calendar,
  Phone,
  Mail,
  Truck,
  ExternalLink,
  Tag,
  Clock,
} from 'lucide-react';
import { ViewLoading, toast, Skeleton } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useLogisticaDashboard } from '@/components/logistica/use-logistica-dashboard';
import type { Proveedor } from '@/components/logistica/types';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  ProveedorComposerModal,
  type ProveedorFormState,
} from '@/components/logistica/ProveedorComposerModal';
import { RecepcionInsumosModal } from '@/components/logistica/RecepcionInsumosModal';

export function ProveedoresView() {
  const { dashboard, isLoading, refetch } = useLogisticaDashboard();
  const { proveedores, stats } = dashboard;
  const apiFetch = useApiFetch();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [recepcionProveedor, setRecepcionProveedor] = useState<Proveedor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Búsqueda y Filtros
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'urgentes' | 'proximos'>(() => {
    const f = searchParams.get('filtro');
    if (f === 'urgentes' || f === 'proximos') return f;
    return 'todos';
  });

  const handleSaveProveedor = async (form: ProveedorFormState) => {
    setSubmitting(true);
    try {
      const url = editingProveedor
        ? `/api/logistica/proveedores/${editingProveedor.id}`
        : '/api/logistica/proveedores';
      const method = editingProveedor ? 'PATCH' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Error al procesar proveedor' }));
        throw new Error(errData.message || 'Error al procesar proveedor');
      }

      toast.success(
        editingProveedor
          ? 'Proveedor y datos de despacho actualizados'
          : 'Proveedor agregado exitosamente a la red'
      );
      setEditingProveedor(null);
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar el proveedor';
      toast.error(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProveedor = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al proveedor "${name}" de la red de abastecimiento?`)) return;

    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/logistica/proveedores/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Error al eliminar proveedor' }));
        throw new Error(errData.message || 'Error al eliminar proveedor');
      }

      toast.success(`Proveedor "${name}" eliminado`);
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar el proveedor';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrado reactivo de proveedores
  const proveedoresFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return proveedores.filter((p) => {
      // Filtro de texto
      const matchText =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.item.toLowerCase().includes(q) ||
        (p.rut && p.rut.toLowerCase().includes(q)) ||
        (p.contacto && p.contacto.toLowerCase().includes(q));

      if (!matchText) return false;

      // Filtro de pestaña
      if (filtro === 'urgentes') {
        return Boolean(p.urgent || p.tiene_alerta_stock);
      }
      if (filtro === 'proximos') {
        return Boolean(p.next_delivery || p.next_delivery_date || p.estado_entrega === 'en_camino');
      }
      return true;
    });
  }, [proveedores, search, filtro]);

  const urgentesOEnAlertaCount = proveedores.filter(
    (p) => p.urgent || p.tiene_alerta_stock
  ).length;

  const proximosDespachosCount = proveedores.filter(
    (p) => p.next_delivery || p.next_delivery_date || p.estado_entrega === 'en_camino'
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <ViewShell
        eyebrow="Abastecimiento & Logística de Entrada"
        title="Red de Proveedores"
        subtitle="Insumos, empaques y materias primas para envasado y producción en Chiloé: pedidos en tránsito, recepción a bodega y seguimiento de entregas."
        icon={<Users size={20} />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/produccion/inventario"
              className="px-3 py-2 rounded-lg text-xs font-medium border border-border bg-card hover:border-primary/50 text-foreground transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <Tag size={14} className="text-primary" /> Ver Stock en Bodega
            </Link>
            <button
              type="button"
              onClick={() => {
                setEditingProveedor(null);
                setModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={15} /> Nuevo Proveedor
            </button>
          </div>
        }
      />

      {/* Tarjetas de Métricas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="stat-value">{stats.totalProveedores}</div>
          <div className="stat-label">Proveedores Registrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-primary">{proximosDespachosCount}</div>
          <div className="stat-label">Entregas Programadas</div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por proveedor, insumo, RUT o contacto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 border border-border rounded-xl p-1 bg-surface-sunken self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtro === 'todos'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos ({proveedores.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltro('proximos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filtro === 'proximos'
                ? 'bg-primary/15 text-primary font-semibold border border-primary/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock size={13} /> Despachos ({proximosDespachosCount})
          </button>
        </div>
      </div>

      {/* Lista de Proveedores */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-surface-sunken border border-border space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton variant="rectangular" className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="space-y-1">
                    <Skeleton variant="text" className="w-40 h-4" />
                    <Skeleton variant="text" className="w-24 h-3" />
                  </div>
                </div>
                <Skeleton variant="rectangular" className="w-20 h-6 rounded-full" />
              </div>
              <Skeleton variant="text" className="w-3/4 h-3" />
            </div>
          ))}
        </div>
      ) : proveedoresFiltrados.length > 0 ? (
        <div className="space-y-3">
          {proveedoresFiltrados.map((p) => {
            const esUrgente = p.urgent || p.tiene_alerta_stock;
            const tieneEntrega = Boolean(p.next_delivery_date || p.next_delivery);

            return (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-surface-sunken border border-border group hover:border-primary/40 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        esUrgente
                          ? 'bg-destructive/15 text-destructive border border-destructive/30'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}
                    >
                      {esUrgente ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{p.name}</span>
                        {p.rut && (
                          <span className="text-[0.7rem] px-2 py-0.5 rounded-md bg-card border border-border text-muted-foreground">
                            {p.rut}
                          </span>
                        )}
                        {p.urgent && (
                          <span className="px-2 py-0.5 rounded-md text-[0.68rem] font-semibold bg-destructive/15 text-destructive border border-destructive/30">
                            Urgente
                          </span>
                        )}
                        {p.tiene_alerta_stock && !p.urgent && (
                          <span className="px-2 py-0.5 rounded-md text-[0.68rem] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            Stock Crítico en Bodega
                          </span>
                        )}
                        {p.estado_entrega === 'en_camino' && (
                          <span className="px-2 py-0.5 rounded-md text-[0.68rem] font-medium bg-primary/15 text-primary border border-primary/30 flex items-center gap-1">
                            <Truck size={11} /> En camino
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5">
                        <strong className="text-foreground font-medium">Insumos: </strong>
                        {p.item}
                      </p>
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setRecepcionProveedor(p)}
                      title="Recepcionar pedido en bodega"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-card border border-border hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5 text-foreground shadow-2xs"
                    >
                      <PackageCheck size={14} className="text-primary" /> Recepcionar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProveedor(p);
                        setModalOpen(true);
                      }}
                      title="Editar proveedor y entregas"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProveedor(p.id, p.name)}
                      disabled={deletingId === p.id}
                      title="Eliminar proveedor de la red"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      {deletingId === p.id ? (
                        <Loader2 size={15} className="animate-spin text-destructive" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Chips de Monitoreo de Stock e Insumos Enlazados */}
                {p.insumos_detalle && p.insumos_detalle.length > 0 && (
                  <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-2">
                    <span className="text-[0.7rem] text-muted-foreground font-medium">
                      Stock en bodega:
                    </span>
                    {p.insumos_detalle.map((it) => (
                      <div
                        key={it.id}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[0.7rem] border ${
                          it.en_alerta
                            ? 'bg-destructive/10 text-destructive border-destructive/30 font-medium'
                            : 'bg-card text-foreground border-border'
                        }`}
                      >
                        <span>{it.nombre}:</span>
                        <strong className="font-semibold">{it.stock} {it.unidad}s</strong>
                        {it.en_alerta && <span className="text-[0.65rem] opacity-80">(Bajo mínimo)</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Metadatos de Logística y Contacto */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.72rem] text-muted-foreground pt-1">
                  {tieneEntrega && (
                    <span className="inline-flex items-center gap-1 text-foreground font-medium">
                      <Calendar size={12} className="text-primary" />
                      Próx. despacho:{' '}
                      <span className="text-primary">
                        {p.next_delivery_date || p.next_delivery}
                      </span>
                    </span>
                  )}
                  {p.contacto && (
                    <span className="inline-flex items-center gap-1">
                      Contacto: {p.contacto}
                    </span>
                  )}
                  {p.telefono && (
                    <a
                      href={`tel:${p.telefono}`}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Phone size={11} /> {p.telefono}
                    </a>
                  )}
                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Mail size={11} /> {p.email}
                    </a>
                  )}
                  {p.notas && (
                    <span className="inline-flex items-center gap-1 italic opacity-90 truncate max-w-sm">
                      “{p.notas}”
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12 text-muted-foreground text-sm">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p className="mb-2 font-medium text-foreground">
            {search ? 'No se encontraron proveedores que coincidan con la búsqueda' : 'Aún no hay proveedores en la red'}
          </p>
          <p className="mb-4 text-xs text-muted-foreground max-w-md mx-auto">
            Registra a tus proveedores de frascos de vidrio, etiquetas, tapas, cajas o materias primas
            para coordinar pedidos y recepciones sin redundancias.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingProveedor(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-primary hover:text-foreground transition-colors"
          >
            <Plus size={14} /> Registrar primer proveedor
          </button>
        </div>
      )}

      {/* Modal Compositor / Editor de Proveedor */}
      <ProveedorComposerModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProveedor(null);
        }}
        onSubmit={handleSaveProveedor}
        submitting={submitting}
        initialData={editingProveedor}
      />

      {/* Modal de Recepción en Bodega */}
      <RecepcionInsumosModal
        open={Boolean(recepcionProveedor)}
        onClose={() => setRecepcionProveedor(null)}
        proveedor={recepcionProveedor}
        onSuccess={async () => {
          await refetch();
        }}
      />
    </div>
  );
}
