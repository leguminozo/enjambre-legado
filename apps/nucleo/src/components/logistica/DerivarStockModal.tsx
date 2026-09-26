'use client';

import { useState } from 'react';
import { Warehouse, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { ImmersiveModal, toast, Button } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { StockCenter } from '@/components/logistica/types';

export interface DerivarStockTarget {
  tipo: 'inventario_item' | 'producto';
  id: string;
  nombre: string;
  unidad: string;
  stockDisponible: number;
}

interface DerivarStockModalProps {
  open: boolean;
  onClose: () => void;
  target: DerivarStockTarget | null;
  stockCenters: StockCenter[];
  defaultCenterId?: string;
  onSuccess: () => void;
}

/**
 * Modal para derivar stock desde la matriz (Pureo) hacia un Centro de Stock específico.
 * Descuenta del inventario general de Pureo y asigna las unidades al centro seleccionado.
 */
export function DerivarStockModal({
  open,
  onClose,
  target,
  stockCenters,
  defaultCenterId,
  onSuccess,
}: DerivarStockModalProps) {
  const apiFetch = useApiFetch();
  const [selectedCenterId, setSelectedCenterId] = useState<string>(
    defaultCenterId || (stockCenters[0]?.id ?? '')
  );
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenterId) {
      toast.error('Selecciona un centro de stock de destino');
      return;
    }
    if (cantidad <= 0) {
      toast.error('La cantidad a derivar debe ser mayor a 0');
      return;
    }
    if (cantidad > target.stockDisponible) {
      toast.error(`Stock insuficiente en Pureo (Disponible: ${target.stockDisponible} ${target.unidad})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/logistica/stock-centers/${selectedCenterId}/derivar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origen_tipo: target.tipo,
          origen_id: target.id,
          cantidad,
          motivo: motivo.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Error al derivar stock');
      }

      toast.success(
        `Derivadas ${cantidad} ${target.unidad} hacia el centro de stock correctamente`
      );
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo derivar el stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      size="md"
      eyebrow="Flujo de inventario"
      title={`Derivar a centro · ${target.nombre}`}
      titleId="derivar-stock-modal-title"
      footer={
        <>
          <Button variant="outline" className="min-h-11" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            className="min-h-11 gap-2"
            onClick={handleSubmit}
            disabled={submitting || cantidad <= 0 || cantidad > target.stockDisponible}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Derivando...
              </>
            ) : (
              <>
                <ArrowRight size={16} /> Confirmar derivación
              </>
            )}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="rounded-xl border border-border/70 bg-surface-sunken p-3.5 space-y-1.5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Origen: Bodega Matriz (Pureo)
          </div>
          <div className="text-sm font-medium text-foreground flex items-center justify-between">
            <span>{target.nombre}</span>
            <span className="tabular-nums font-semibold text-primary">
              {target.stockDisponible.toLocaleString('es-CL')} {target.unidad} disponibles
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Las unidades transferidas se descontarán del inventario general de Pureo y quedarán asignadas al centro seleccionado.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="target-center-select" className="text-xs font-medium text-foreground block">
            Centro de Stock Destino <span className="text-destructive">*</span>
          </label>
          <select
            id="target-center-select"
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(e.target.value)}
            className="input-field w-full min-h-11"
            required
          >
            {stockCenters.length === 0 ? (
              <option value="">No hay centros de stock registrados</option>
            ) : (
              stockCenters.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="derivar-cantidad" className="text-xs font-medium text-foreground block">
            Cantidad a transferir ({target.unidad}) <span className="text-destructive">*</span>
          </label>
          <input
            id="derivar-cantidad"
            type="number"
            min={1}
            max={target.stockDisponible}
            step="any"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value) || 0)}
            className="input-field w-full min-h-11 tabular-nums text-lg font-semibold"
            required
          />
          {cantidad > target.stockDisponible && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle size={13} /> La cantidad supera el stock disponible en Pureo.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="derivar-motivo" className="text-xs font-medium text-foreground block">
            Motivo o nota de traslado (opcional)
          </label>
          <input
            id="derivar-motivo"
            type="text"
            placeholder="Ej: Reposición para feria de fin de semana, consignación..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="input-field w-full min-h-11 text-sm"
          />
        </div>
      </form>
    </ImmersiveModal>
  );
}
