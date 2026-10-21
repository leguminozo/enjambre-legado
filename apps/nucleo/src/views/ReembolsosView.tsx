'use client';

import { useState } from 'react';
import { RotateCcw, Plus, CheckCircle, AlertCircle, Clock, FileText, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast, friendlyError, formatCLP } from '@enjambre/ui';

interface Reembolso {
  id: string;
  estado: 'pendiente' | 'procesando' | 'completado' | 'rechazado' | 'error';
  monto_reembolso: number;
  monto_original: number;
  tipo: 'total' | 'parcial';
  tipo_documento_origen?: 'boleta' | 'factura' | 'sin_dte';
  tipo_dte_origen?: number;
  folio_origen?: number;
  nc_emitida?: boolean;
  nc_folio?: string;
  created_at: string;
  motivo: string;
  venta_id: string;
  cliente?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface VentaCandidata {
  id: string;
  total: number;
  created_at: string;
  channel: string;
  buyer_email?: string;
  cliente?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  dte?: {
    id: string;
    tipo_documento: string;
    tipo_dte: number;
    folio: number;
    estado_sii: string;
  } | null;
}

export type ReembolsosViewProps = Record<string, never>;

export function ReembolsosView(_props: ReembolsosViewProps = {}) {
  const apiFetch = useApiFetch();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [selectedVentaId, setSelectedVentaId] = useState('');
  const [tipoReembolso, setTipoReembolso] = useState<'total' | 'parcial'>('total');
  const [montoReembolso, setMontoReembolso] = useState<number>(0);
  const [motivo, setMotivo] = useState('Devolución de producto');
  const [tipoDocOrigen, setTipoDocOrigen] = useState<'boleta' | 'factura' | 'sin_dte'>('boleta');
  const [folioOrigen, setFolioOrigen] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  // Reembolsos query
  const { data, isLoading, refetch: mutate } = useQuery<{ data: Reembolso[] }>({
    queryKey: ['reembolsos'],
    queryFn: async () => {
      const res = await apiFetch('/api/reembolsos');
      if (!res.ok) throw new Error('Error al consultar reembolsos');
      return res.json();
    },
  });

  // Candidatas query
  const { data: candidatasData, isLoading: loadingCandidatas } = useQuery<{ data: VentaCandidata[] }>({
    queryKey: ['ventas-candidatas'],
    queryFn: async () => {
      const res = await apiFetch('/api/reembolsos/ventas-candidatas');
      if (!res.ok) throw new Error('Error al consultar ventas');
      return res.json();
    },
    enabled: isModalOpen,
  });

  const reembolsos = data?.data || [];
  const ventasCandidatas = candidatasData?.data || [];

  const handleSelectVenta = (ventaId: string) => {
    setSelectedVentaId(ventaId);
    const venta = ventasCandidatas.find((v) => v.id === ventaId);
    if (venta) {
      setMontoReembolso(venta.total);
      if (venta.dte) {
        setTipoDocOrigen(venta.dte.tipo_dte === 33 ? 'factura' : 'boleta');
        setFolioOrigen(venta.dte.folio);
      } else {
        setTipoDocOrigen('boleta');
        setFolioOrigen(undefined);
      }
    }
  };

  const handleProcess = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await apiFetch(`/api/reembolsos/${id}/procesar`, {
        method: 'POST',
      });
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || 'Error al procesar');
      }

      toast.success('Reembolso procesado y Nota de Crédito 61 generada');
      mutate();
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVentaId) {
      toast.error('Selecciona una venta');
      return;
    }
    if (montoReembolso <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/reembolsos', {
        method: 'POST',
        body: JSON.stringify({
          venta_id: selectedVentaId,
          monto_reembolso: montoReembolso,
          tipo: tipoReembolso,
          motivo,
          tipo_documento_origen: tipoDocOrigen,
          tipo_dte_origen: tipoDocOrigen === 'factura' ? 33 : tipoDocOrigen === 'boleta' ? 39 : undefined,
          folio_origen: folioOrigen,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'No se pudo crear el reembolso');
      }

      toast.success('Solicitud de reembolso creada');
      setIsModalOpen(false);
      setSelectedVentaId('');
      mutate();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Finanzas & Soberanía Fiscal"
        title="Reembolsos & Notas de Crédito"
        subtitle="Gestión de devoluciones y anulación tributaria (Boleta DTE 39 o Factura DTE 33 → NC 61)"
        icon={<RotateCcw size={20} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-sm text-muted-foreground font-medium">Reembolsado este mes</p>
          <p className="text-2xl font-bold mt-1 text-foreground">
            {formatCLP(
              reembolsos
                .filter((r) => r.estado === 'completado')
                .reduce((acc, r) => acc + r.monto_reembolso, 0),
            )}
          </p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-sm text-muted-foreground font-medium">Pendientes de proceso</p>
          <p className="text-2xl font-bold mt-1 text-foreground">
            {reembolsos.filter((r) => r.estado === 'pendiente').length}
          </p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-sm text-muted-foreground font-medium">Tasa de éxito</p>
          <p className="text-2xl font-bold mt-1 text-foreground">
            {reembolsos.length
              ? Math.round(
                  (reembolsos.filter((r) => r.estado === 'completado').length / reembolsos.length) * 100,
                )
              : 0}
            %
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-foreground">Historial de Reembolsos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cada reembolso procesado emite una Nota de Crédito 61 referenciando el DTE de origen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> Nuevo Reembolso
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Doc. Origen</th>
                <th className="px-6 py-3">Monto</th>
                <th className="px-6 py-3">NC 61 SII</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Cargando reembolsos...
                  </td>
                </tr>
              ) : reembolsos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No hay reembolsos registrados.
                  </td>
                </tr>
              ) : (
                reembolsos.map((reembolso) => (
                  <tr
                    key={reembolso.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-foreground">
                      {new Date(reembolso.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {reembolso.cliente
                        ? `${reembolso.cliente.first_name || ''} ${reembolso.cliente.last_name || ''}`.trim() ||
                          reembolso.cliente.email
                        : 'Sin cliente registrado'}
                    </td>
                    <td className="px-6 py-4 text-foreground font-mono text-xs">
                      {reembolso.tipo_documento_origen === 'factura' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-text/10 text-accent-text border border-accent-text/20">
                          <FileText size={12} /> Factura #{reembolso.folio_origen || 'S/F'}
                        </span>
                      ) : reembolso.tipo_documento_origen === 'boleta' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                          <FileText size={12} /> Boleta #{reembolso.folio_origen || 'S/F'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sin DTE previo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {formatCLP(reembolso.monto_reembolso)}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {reembolso.nc_folio ? (
                        <span className="text-success font-semibold">{reembolso.nc_folio}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1
                        ${
                          reembolso.estado === 'completado'
                            ? 'bg-success/15 text-success'
                            : reembolso.estado === 'error' || reembolso.estado === 'rechazado'
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-primary/15 text-primary'
                        }`}
                      >
                        {reembolso.estado === 'completado' && <CheckCircle size={12} />}
                        {reembolso.estado === 'pendiente' && <Clock size={12} />}
                        {reembolso.estado === 'error' && <AlertCircle size={12} />}
                        {reembolso.estado.charAt(0).toUpperCase() + reembolso.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {reembolso.estado === 'pendiente' && (
                        <button
                          type="button"
                          onClick={() => handleProcess(reembolso.id)}
                          disabled={processingId === reembolso.id}
                          className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded text-xs font-medium disabled:opacity-50 transition-colors"
                        >
                          {processingId === reembolso.id ? 'Emitiendo NC...' : 'Emitir NC 61'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nuevo Reembolso */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="text-primary" size={18} />
                <h3 className="text-base font-bold text-foreground">Crear Solicitud de Reembolso</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRefund} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Venta a reembolsar
                </label>
                {loadingCandidatas ? (
                  <p className="text-xs text-muted-foreground">Cargando ventas recientes…</p>
                ) : (
                  <select
                    value={selectedVentaId}
                    onChange={(e) => handleSelectVenta(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">-- Seleccionar venta --</option>
                    {ventasCandidatas.map((v) => {
                      const docStr = v.dte
                        ? `${v.dte.tipo_documento} #${v.dte.folio}`
                        : 'Sin DTE asignado';
                      const buyer = v.cliente
                        ? `${v.cliente.first_name || ''} ${v.cliente.last_name || ''}`.trim()
                        : v.buyer_email || 'Cliente';
                      return (
                        <option key={v.id} value={v.id}>
                          {new Date(v.created_at).toLocaleDateString()} — {buyer} ({formatCLP(v.total)}) — [{docStr}]
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Selector de Documento Fiscal de Origen: Boleta o Factura */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-sunken/60 space-y-2.5">
                <label className="block text-xs font-semibold text-foreground">
                  Tipo de Documento Tributario a anular/corregir
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoDocOrigen('boleta')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                      tipoDocOrigen === 'boleta'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    Boleta (DTE 39)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoDocOrigen('factura')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                      tipoDocOrigen === 'factura'
                        ? 'border-accent-text bg-accent-text/10 text-accent-text font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    Factura (DTE 33)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoDocOrigen('sin_dte')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                      tipoDocOrigen === 'sin_dte'
                        ? 'border-border bg-muted text-foreground font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    Sin DTE previo
                  </button>
                </div>
                {tipoDocOrigen !== 'sin_dte' && (
                  <div className="pt-1">
                    <label className="block text-xs text-muted-foreground mb-1">
                      Folio del documento original ({tipoDocOrigen === 'factura' ? 'Factura' : 'Boleta'})
                    </label>
                    <input
                      type="number"
                      value={folioOrigen || ''}
                      onChange={(e) => setFolioOrigen(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Ej. 124"
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Alcance
                  </label>
                  <select
                    value={tipoReembolso}
                    onChange={(e) => setTipoReembolso(e.target.value as 'total' | 'parcial')}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="total">Total (100%)</option>
                    <option value="parcial">Parcial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Monto a reembolsar (CLP)
                  </label>
                  <input
                    type="number"
                    value={montoReembolso || ''}
                    onChange={(e) => setMontoReembolso(Number(e.target.value))}
                    disabled={tipoReembolso === 'total'}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Motivo de la Nota de Crédito / Reembolso
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. Devolución de mercadería / Garantía legal"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedVentaId}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Creando…' : 'Crear Reembolso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
