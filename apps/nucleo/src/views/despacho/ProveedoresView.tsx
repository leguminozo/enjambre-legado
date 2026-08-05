'use client';

import { useState } from 'react';
import { Users, AlertCircle, CheckCircle2, FileText, Plus, Trash2, Loader2 } from 'lucide-react';
import { ViewLoading, toast } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useLogisticaDashboard } from '@/components/logistica/use-logistica-dashboard';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  ProveedorComposerModal,
  type ProveedorFormState,
} from '@/components/logistica/ProveedorComposerModal';

export function ProveedoresView() {
  const { dashboard, isLoading, refetch } = useLogisticaDashboard();
  const { proveedores, stats } = dashboard;
  const apiFetch = useApiFetch();

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateProveedor = async (form: ProveedorFormState) => {
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/logistica/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Error al crear proveedor' }));
        throw new Error(errData.message || 'Error al crear proveedor');
      }

      toast.success('Proveedor agregado exitosamente');
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
    if (!confirm(`¿Eliminar al proveedor "${name}" de la red?`)) return;

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

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Despacho"
        title="Proveedores"
        subtitle="Red de proveedores de insumos y empaques: próximos despachos y urgencias."
        icon={<Users size={20} />}
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={15} /> Nuevo Proveedor
          </button>
        }
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
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-sunken border border-border group hover:border-accent/40 transition-colors"
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
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-destructive/15 text-destructive border border-destructive/30 shrink-0">
                  Urgente
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDeleteProveedor(p.id, p.name)}
                disabled={deletingId === p.id}
                title="Eliminar proveedor"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 disabled:opacity-50"
              >
                {deletingId === p.id ? (
                  <Loader2 size={15} className="animate-spin text-destructive" />
                ) : (
                  <Trash2 size={15} />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 text-muted-foreground text-sm">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p className="mb-4">Aún no hay proveedores en la red</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-primary hover:text-foreground transition-colors"
          >
            <Plus size={14} /> Registrar primer proveedor
          </button>
        </div>
      )}

      <ProveedorComposerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateProveedor}
        submitting={submitting}
      />
    </div>
  );
}
