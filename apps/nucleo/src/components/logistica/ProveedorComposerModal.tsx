'use client';

import { useState } from 'react';
import { Users, Loader2, AlertCircle } from 'lucide-react';
import { ImmersiveModal, toast } from '@enjambre/ui';

export interface ProveedorFormState {
  name: string;
  item: string;
  next_delivery: string;
  urgent: boolean;
}

interface ProveedorComposerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: ProveedorFormState) => Promise<void>;
  submitting?: boolean;
}

export function ProveedorComposerModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
}: ProveedorComposerModalProps) {
  const [form, setForm] = useState<ProveedorFormState>({
    name: '',
    item: '',
    next_delivery: '',
    urgent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }
    if (!form.item.trim()) {
      toast.error('El insumo o empaque es obligatorio');
      return;
    }

    try {
      await onSubmit(form);
      setForm({ name: '', item: '', next_delivery: '', urgent: false });
      onClose();
    } catch {
      // Error handled in view
    }
  };

  const canSubmit = Boolean(form.name.trim() && form.item.trim() && !submitting);

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      size="md"
      eyebrow="Despacho"
      title="Nuevo Proveedor"
      titleId="proveedor-composer-title"
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
              'Guardar Proveedor'
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto py-2">
        <div className="space-y-1.5">
          <label htmlFor="prov-name" className="text-xs font-medium text-foreground block">
            Nombre del Proveedor <span className="text-destructive">*</span>
          </label>
          <input
            id="prov-name"
            type="text"
            placeholder="Ej: Envases Vidrio del Sur, Imprenta Chiloé..."
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="prov-item" className="text-xs font-medium text-foreground block">
            Insumo o Empaque <span className="text-destructive">*</span>
          </label>
          <input
            id="prov-item"
            type="text"
            placeholder="Ej: Frascos 250g, Cajas cartón, Etiquetas Cera Virgin..."
            value={form.item}
            onChange={(e) => setForm((prev) => ({ ...prev, item: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="prov-next-delivery" className="text-xs font-medium text-foreground block">
            Próximo Despacho / Entrega <span className="text-muted-foreground font-normal">(Opcional)</span>
          </label>
          <input
            id="prov-next-delivery"
            type="text"
            placeholder="Ej: 15 de Agosto, En 3 días, 2026-08-15..."
            value={form.next_delivery}
            onChange={(e) => setForm((prev) => ({ ...prev, next_delivery: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="pt-2">
          <label
            htmlFor="prov-urgent"
            className="flex items-center gap-3 p-3 rounded-xl bg-surface-sunken border border-border cursor-pointer select-none"
          >
            <input
              id="prov-urgent"
              type="checkbox"
              checked={form.urgent}
              onChange={(e) => setForm((prev) => ({ ...prev, urgent: e.target.checked }))}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <AlertCircle size={14} className={form.urgent ? 'text-destructive' : 'text-muted-foreground'} />
                Marcar como Urgente
              </div>
              <div className="text-[11px] text-muted-foreground">
                Resalta al proveedor en rojo por falta crítica de stock o entrega retrasada.
              </div>
            </div>
          </label>
        </div>
      </form>
    </ImmersiveModal>
  );
}
