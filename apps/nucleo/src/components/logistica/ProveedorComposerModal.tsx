'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2, AlertCircle, Calendar, Phone, Mail, FileText, Check, Plus, X } from 'lucide-react';
import { ImmersiveModal, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { Proveedor } from '@/components/logistica/types';

export interface ProveedorFormState {
  name: string;
  item: string;
  next_delivery?: string | null;
  next_delivery_date?: string | null;
  urgent: boolean;
  tercero_id?: string | null;
  rut?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
  insumos_ids?: string[];
  estado_entrega?: 'pendiente' | 'en_camino' | 'recibido' | 'sin_programar';
}

interface ProveedorComposerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: ProveedorFormState) => Promise<void>;
  submitting?: boolean;
  initialData?: Proveedor | null;
}

type TerceroOption = {
  id: string;
  nombre: string;
  rut: string;
  email?: string | null;
  telefono?: string | null;
};

type InventarioItemOption = {
  id: string;
  nombre: string;
  clase: string;
  unidad: string;
  stock: number;
};

export function ProveedorComposerModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  initialData = null,
}: ProveedorComposerModalProps) {
  const apiFetch = useApiFetch();

  const [form, setForm] = useState<ProveedorFormState>({
    name: '',
    item: '',
    next_delivery_date: '',
    urgent: false,
    tercero_id: null,
    rut: '',
    contacto: '',
    telefono: '',
    email: '',
    notas: '',
    insumos_ids: [],
    estado_entrega: 'pendiente',
  });

  // Terceros disponibles para evitar duplicados
  const [terceros, setTerceros] = useState<TerceroOption[]>([]);
  // Items de inventario disponibles para vincular insumos libremente
  const [inventarioItems, setInventarioItems] = useState<InventarioItemOption[]>([]);
  const [showAdvanceContact, setShowAdvanceContact] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        name: initialData.name,
        item: initialData.item,
        next_delivery_date: initialData.next_delivery_date ?? (initialData.next_delivery?.match(/^\d{4}-\d{2}-\d{2}$/) ? initialData.next_delivery : ''),
        urgent: Boolean(initialData.urgent),
        tercero_id: initialData.tercero_id ?? null,
        rut: initialData.rut ?? '',
        contacto: initialData.contacto ?? '',
        telefono: initialData.telefono ?? '',
        email: initialData.email ?? '',
        notas: initialData.notas ?? '',
        insumos_ids: initialData.insumos_ids ?? [],
        estado_entrega: initialData.estado_entrega ?? 'pendiente',
      });
      if (initialData.rut || initialData.contacto || initialData.telefono || initialData.email) {
        setShowAdvanceContact(true);
      }
    } else {
      setForm({
        name: '',
        item: '',
        next_delivery_date: '',
        urgent: false,
        tercero_id: null,
        rut: '',
        contacto: '',
        telefono: '',
        email: '',
        notas: '',
        insumos_ids: [],
        estado_entrega: 'pendiente',
      });
      setShowAdvanceContact(false);
    }

    // Cargar terceros e inventario de forma asíncrona no bloqueante
    async function loadResources() {
      try {
        const [tercerosRes, inventarioRes] = await Promise.all([
          apiFetch('/api/terceros?tipo=proveedor'),
          apiFetch('/api/inventario/items'),
        ]);

        if (tercerosRes.ok) {
          const tData = await tercerosRes.json();
          setTerceros(Array.isArray(tData) ? tData : []);
        }

        if (inventarioRes.ok) {
          const iData = await inventarioRes.json();
          setInventarioItems((iData.data ?? []) as InventarioItemOption[]);
        }
      } catch {
        /* fallback silencioso */
      }
    }
    void loadResources();
  }, [open, initialData, apiFetch]);

  // Selección de tercero para autocompletar sin duplicar
  const handleSelectTercero = (tId: string) => {
    if (!tId) {
      setForm((prev) => ({ ...prev, tercero_id: null }));
      return;
    }
    const t = terceros.find((x) => x.id === tId);
    if (t) {
      setForm((prev) => ({
        ...prev,
        tercero_id: t.id,
        name: prev.name || t.nombre,
        rut: t.rut || prev.rut,
        email: t.email || prev.email,
        telefono: t.telefono || prev.telefono,
      }));
      setShowAdvanceContact(true);
    }
  };

  // Toggle de insumos vinculados
  const handleToggleInsumo = (itemId: string, itemNombre: string) => {
    setForm((prev) => {
      const currentIds = prev.insumos_ids ?? [];
      const exists = currentIds.includes(itemId);
      const newIds = exists ? currentIds.filter((id) => id !== itemId) : [...currentIds, itemId];

      // Si el campo de texto libre está vacío y agregamos un ítem, lo sugerimos
      let newItemText = prev.item;
      if (!exists && !prev.item.trim()) {
        newItemText = itemNombre;
      }

      return {
        ...prev,
        insumos_ids: newIds,
        item: newItemText,
      };
    });
  };

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
      await onSubmit({
        ...form,
        name: form.name.trim(),
        item: form.item.trim(),
        next_delivery: form.next_delivery_date || null,
        next_delivery_date: form.next_delivery_date || null,
        rut: form.rut?.trim() || null,
        contacto: form.contacto?.trim() || null,
        telefono: form.telefono?.trim() || null,
        email: form.email?.trim() || null,
        notas: form.notas?.trim() || null,
      });
      onClose();
    } catch {
      // Error manejado en la vista
    }
  };

  const canSubmit = Boolean(form.name.trim() && form.item.trim() && !submitting);

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      size="lg"
      eyebrow="Abastecimiento"
      title={initialData ? 'Editar Proveedor' : 'Nuevo Proveedor de Insumos'}
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
            ) : initialData ? (
              'Guardar Cambios'
            ) : (
              'Registrar Proveedor'
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto py-2">
        {/* Selector opcional de Tercero existente para no duplicar */}
        {terceros.length > 0 && (
          <div className="space-y-1.5 p-3 rounded-xl bg-surface-sunken border border-border">
            <div className="flex items-center justify-between">
              <label htmlFor="prov-tercero-select" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users size={14} className="text-primary" /> Proveedor Registrado en Sistema
              </label>
              <span className="text-[0.7rem] text-muted-foreground">Opcional para autocompletar</span>
            </div>
            <select
              id="prov-tercero-select"
              value={form.tercero_id ?? ''}
              onChange={(e) => handleSelectTercero(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">-- Escribir nuevo o elegir de la lista --</option>
              {terceros.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} ({t.rut})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="prov-name" className="text-xs font-medium text-foreground block">
              Nombre o Razón Social <span className="text-destructive">*</span>
            </label>
            <input
              id="prov-name"
              type="text"
              placeholder="Ej: Cristalerías del Sur, Imprenta Chiloé..."
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="prov-rut" className="text-xs font-medium text-foreground block">
              RUT o Identificador Fiscal <span className="text-muted-foreground font-normal">(Opcional)</span>
            </label>
            <input
              id="prov-rut"
              type="text"
              placeholder="Ej: 76.123.456-7"
              value={form.rut ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, rut: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Insumos provistos: Vinculación con inventario_items (Flexible) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground block">
              Insumo, Empaque o Materia Prima <span className="text-destructive">*</span>
            </label>
            <span className="text-[0.7rem] text-muted-foreground">100% editable y configurable</span>
          </div>

          <input
            type="text"
            placeholder="Ej: Frascos 500g, Cajas madera nativa, Tapas doradas, Etiquetas..."
            value={form.item}
            onChange={(e) => setForm((prev) => ({ ...prev, item: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />

          {/* Chips de selección rápida desde inventario_items si existen */}
          {inventarioItems.length > 0 && (
            <div className="pt-1">
              <span className="text-[0.7rem] text-muted-foreground block mb-1.5">
                Vincular a ítems de inventario para monitoreo de stock en vivo:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 rounded-lg border border-border/70 bg-surface-sunken">
                {inventarioItems.map((inv) => {
                  const isSelected = form.insumos_ids?.includes(inv.id);
                  return (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => handleToggleInsumo(inv.id, inv.nombre)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[0.7rem] font-medium border transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border hover:border-accent hover:text-foreground'
                      }`}
                    >
                      {isSelected ? <Check size={11} /> : <Plus size={11} />}
                      <span>{inv.nombre}</span>
                      <span className="opacity-70">({inv.stock} {inv.unidad})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Fecha de Entrega y Estado de Despacho */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="prov-next-delivery-date" className="text-xs font-medium text-foreground block flex items-center gap-1.5">
              <Calendar size={13} className="text-primary" /> Próxima Entrega / Despacho
            </label>
            <input
              id="prov-next-delivery-date"
              type="date"
              value={form.next_delivery_date ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, next_delivery_date: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="prov-estado-entrega" className="text-xs font-medium text-foreground block">
              Estado del Despacho
            </label>
            <select
              id="prov-estado-entrega"
              value={form.estado_entrega ?? 'pendiente'}
              onChange={(e) => setForm((prev) => ({ ...prev, estado_entrega: e.target.value as typeof form.estado_entrega }))}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="pendiente">Pendiente de despacho</option>
              <option value="en_camino">En camino / Tránsito marítimo</option>
              <option value="recibido">Recepcionado en bodega</option>
              <option value="sin_programar">Sin entrega programada</option>
            </select>
          </div>
        </div>

        {/* Toggle para datos de contacto avanzados */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanceContact((prev) => !prev)}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            {showAdvanceContact ? '- Ocultar datos de contacto y logística' : '+ Añadir contacto, teléfono y notas de flete'}
          </button>
        </div>

        {showAdvanceContact && (
          <div className="space-y-3 p-3 rounded-xl bg-surface-sunken border border-border animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label htmlFor="prov-contacto" className="text-[0.7rem] text-muted-foreground block">
                  Persona de Contacto
                </label>
                <input
                  id="prov-contacto"
                  type="text"
                  placeholder="Ej: Rodrigo Valenzuela"
                  value={form.contacto ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, contacto: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prov-tel" className="text-[0.7rem] text-muted-foreground block flex items-center gap-1">
                  <Phone size={10} /> Teléfono
                </label>
                <input
                  id="prov-tel"
                  type="text"
                  placeholder="+56 9 1234 5678"
                  value={form.telefono ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prov-email" className="text-[0.7rem] text-muted-foreground block flex items-center gap-1">
                  <Mail size={10} /> Correo
                </label>
                <input
                  id="prov-email"
                  type="email"
                  placeholder="contacto@proveedor.cl"
                  value={form.email ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="prov-notas" className="text-[0.7rem] text-muted-foreground block flex items-center gap-1">
                <FileText size={10} /> Notas de Logística / Flete a Chiloé
              </label>
              <textarea
                id="prov-notas"
                rows={2}
                placeholder="Ej: Despacho por Starken a sucursal Castro, retirar con número de flete..."
                value={form.notas ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-xs rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>
        )}

        {/* Checkbox de Urgencia */}
        <div className="pt-1">
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
              <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                Destaca este proveedor en la parte superior del tablero y en los recordatorios operativos.
              </p>
            </div>
          </label>
        </div>
      </form>
    </ImmersiveModal>
  );
}
