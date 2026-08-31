'use client';

import { useState } from 'react';
import { Warehouse, Loader2, AlertCircle } from 'lucide-react';
import { ImmersiveModal, toast } from '@enjambre/ui';

export interface StockCenterFormState {
  name: string;
  sachets: number;
  frascos: number;
  cofres: number;
  ok: boolean;
}

interface StockCenterComposerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: StockCenterFormState) => Promise<void>;
  submitting?: boolean;
}

export function StockCenterComposerModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
}: StockCenterComposerModalProps) {
  const [form, setForm] = useState<StockCenterFormState>({
    name: '',
    sachets: 0,
    frascos: 0,
    cofres: 0,
    ok: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('El nombre del centro es obligatorio');
      return;
    }

    try {
      await onSubmit(form);
      setForm({ name: '', sachets: 0, frascos: 0, cofres: 0, ok: true });
      onClose();
    } catch {
      // Error handled in view
    }
  };

  const canSubmit = Boolean(form.name.trim() && !submitting);

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      size="md"
      eyebrow="Despacho"
      title="Nuevo Centro de Stock"
      titleId="stock-center-composer-title"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:border-accent/50 text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Guardando...
              </>
            ) : (
              'Guardar Centro'
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto py-2">
        <div className="space-y-1.5">
          <label htmlFor="sc-name" className="text-xs font-medium text-foreground block">
            Nombre del Centro de Stock <span className="text-destructive">*</span>
          </label>
          <input
            id="sc-name"
            type="text"
            placeholder="Ej: Bodega Central Ancud, Punto Acopio Castro..."
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="sc-sachets" className="text-xs font-medium text-foreground block">
              Sachets
            </label>
            <input
              id="sc-sachets"
              type="number"
              min={0}
              value={form.sachets}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sachets: Math.max(0, parseInt(e.target.value) || 0) }))
              }
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-display text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sc-frascos" className="text-xs font-medium text-foreground block">
              Frascos
            </label>
            <input
              id="sc-frascos"
              type="number"
              min={0}
              value={form.frascos}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, frascos: Math.max(0, parseInt(e.target.value) || 0) }))
              }
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-display text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sc-cofres" className="text-xs font-medium text-foreground block">
              Cofres
            </label>
            <input
              id="sc-cofres"
              type="number"
              min={0}
              value={form.cofres}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, cofres: Math.max(0, parseInt(e.target.value) || 0) }))
              }
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-display text-right"
            />
          </div>
        </div>

        <div className="pt-2">
          <label
            htmlFor="sc-ok"
            className="flex items-center gap-3 p-3 rounded-xl bg-surface-sunken border border-border cursor-pointer select-none"
          >
            <input
              id="sc-ok"
              type="checkbox"
              checked={form.ok}
              onChange={(e) => setForm((prev) => ({ ...prev, ok: e.target.checked }))}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <AlertCircle size={14} className={!form.ok ? 'text-destructive' : 'text-success'} />
                Estado Operativo Óptimo
              </div>
              <div className="text-[11px] text-muted-foreground">
                Desmarca esta opción si el centro presenta alertas de stock bajo o falta crítica de espacio.
              </div>
            </div>
          </label>
        </div>
      </form>
    </ImmersiveModal>
  );
}
