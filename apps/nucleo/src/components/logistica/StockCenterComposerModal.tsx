'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Warehouse, MapPin, UserCheck, ShieldCheck } from 'lucide-react';
import { ImmersiveModal, toast } from '@enjambre/ui';
import {
  CHILE_COMUNAS_POR_REGION,
  getRegionDeComuna,
} from '@enjambre/logistica';
import type { StockCenterTipo, StockCenter } from './types';

const DESTINOS_FRECUENTES_STOCK = [
  { label: 'Pureo (Queilén)', comuna: 'Queilén' },
  { label: 'Castro', comuna: 'Castro' },
  { label: 'Ancud', comuna: 'Ancud' },
  { label: 'Dalcahue', comuna: 'Dalcahue' },
  { label: 'Quellón', comuna: 'Quellón' },
  { label: 'Puerto Varas', comuna: 'Puerto Varas' },
  { label: 'Puerto Montt', comuna: 'Puerto Montt' },
  { label: 'Santiago (Hub Central)', comuna: 'Santiago' },
  { label: 'Providencia (RM)', comuna: 'Providencia' },
] as const;

const TODAS_LAS_COMUNAS_STOCK = Object.values(CHILE_COMUNAS_POR_REGION)
  .flat()
  .sort((a, b) => a.localeCompare(b, 'es'));

export interface StockCenterFormState {
  name: string;
  tipo: StockCenterTipo;
  comuna: string;
  direccion: string;
  responsable: string;
  contacto: string;
  notas: string;
  ok: boolean;
  sachets?: number;
  frascos?: number;
  cofres?: number;
}

interface StockCenterComposerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: StockCenterFormState) => Promise<void>;
  submitting?: boolean;
  initialData?: StockCenter | null;
}

const TIPO_OPTIONS: Array<{ value: StockCenterTipo; label: string; desc: string }> = [
  {
    value: 'bodega',
    label: 'Bodega Secundaria',
    desc: 'Almacén de respaldo territorial o acopio general.',
  },
  {
    value: 'despacho',
    label: 'Punto de Despacho D2C',
    desc: 'Preparación y empaque de pedidos a clientes finales.',
  },
  {
    value: 'acopio',
    label: 'Punto de Acopio Territorial',
    desc: 'Recepción y consolidación de insumos o extracciones.',
  },
  {
    value: 'feria',
    label: 'Punto de Venta / Feria',
    desc: 'Stock móvil o temporal para eventos territoriales.',
  },
  {
    value: 'consignacion',
    label: 'Consignación / Alianza',
    desc: 'Punto de exhibición y venta en local asociado.',
  },
  {
    value: 'otro',
    label: 'Otro recinto operativo',
    desc: 'Instalación logística complementaria.',
  },
];

export function StockCenterComposerModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  initialData = null,
}: StockCenterComposerModalProps) {
  const [form, setForm] = useState<StockCenterFormState>({
    name: initialData?.name ?? '',
    tipo: (initialData?.tipo as StockCenterTipo) ?? 'bodega',
    comuna: initialData?.comuna ?? '',
    direccion: initialData?.direccion ?? '',
    responsable: initialData?.responsable ?? '',
    contacto: initialData?.contacto ?? '',
    notas: initialData?.notas ?? '',
    ok: initialData?.ok ?? true,
    sachets: initialData?.sachets ?? 0,
    frascos: initialData?.frascos ?? 0,
    cofres: initialData?.cofres ?? 0,
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: initialData?.name ?? '',
        tipo: (initialData?.tipo as StockCenterTipo) ?? 'bodega',
        comuna: initialData?.comuna ?? '',
        direccion: initialData?.direccion ?? '',
        responsable: initialData?.responsable ?? '',
        contacto: initialData?.contacto ?? '',
        notas: initialData?.notas ?? '',
        ok: initialData?.ok ?? true,
        sachets: initialData?.sachets ?? 0,
        frascos: initialData?.frascos ?? 0,
        cofres: initialData?.cofres ?? 0,
      });
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('El nombre del centro es obligatorio');
      return;
    }

    try {
      await onSubmit(form);
      setForm({
        name: '',
        tipo: 'bodega',
        comuna: '',
        direccion: '',
        responsable: '',
        contacto: '',
        notas: '',
        ok: true,
        sachets: 0,
        frascos: 0,
        cofres: 0,
      });
      onClose();
    } catch {
      // Error handled in caller view
    }
  };

  const canSubmit = Boolean(form.name.trim() && !submitting);

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      size="md"
      eyebrow="Despacho · Red Territorial"
      title={initialData ? 'Editar Centro de Stock' : 'Nuevo Centro de Stock'}
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
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Guardando...
              </>
            ) : initialData ? (
              'Actualizar Centro'
            ) : (
              'Guardar Centro'
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto py-2">
        {!initialData && (
          <div className="rounded-xl border border-border/70 bg-surface-sunken p-3 text-xs text-muted-foreground space-y-1">
            <div className="font-medium text-foreground flex items-center gap-1.5">
              <Warehouse size={13} className="text-primary" />
              <span>Registro de recinto logístico</span>
            </div>
            <p>
              El centro se creará con 0 ítems. Una vez registrado, podrás transferir stock trazable desde la Bodega Matriz (Pureo) o dar de alta insumos locales.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="sc-name" className="text-xs font-medium text-foreground block">
            Nombre del Centro de Stock <span className="text-destructive">*</span>
          </label>
          <input
            id="sc-name"
            type="text"
            placeholder="Ej: Bodega Central Ancud, Punto Acopio Castro, Despacho Santiago..."
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sc-tipo" className="text-xs font-medium text-foreground block">
            Rol Operativo / Clasificación <span className="text-destructive">*</span>
          </label>
          <select
            id="sc-tipo"
            value={form.tipo}
            onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value as StockCenterTipo }))}
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {TIPO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Atajos de comunas frecuentes */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground flex items-center gap-1">
            <MapPin size={11} className="text-accent" /> Ubicaciones frecuentes (1 clic)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DESTINOS_FRECUENTES_STOCK.map((dest) => (
              <button
                key={dest.label}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, comuna: dest.comuna }))}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                  form.comuna.toLowerCase() === dest.comuna.toLowerCase()
                    ? 'bg-accent/20 border-accent text-accent font-semibold shadow-sm'
                    : 'border-border/80 bg-surface-sunken hover:border-accent/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {dest.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="sc-comuna" className="text-xs font-medium text-foreground flex items-center gap-1">
              <MapPin size={12} className="text-muted-foreground" />
              <span>Comuna o Ciudad</span>
            </label>
            <div className="relative">
              <input
                id="sc-comuna"
                type="text"
                list="stock-center-comunas-list"
                placeholder="Ej: Castro, Ancud, Santiago..."
                value={form.comuna}
                onChange={(e) => setForm((prev) => ({ ...prev, comuna: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <datalist id="stock-center-comunas-list">
                {TODAS_LAS_COMUNAS_STOCK.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sc-responsable" className="text-xs font-medium text-foreground flex items-center gap-1">
              <UserCheck size={12} className="text-muted-foreground" />
              <span>Responsable o Encargado</span>
            </label>
            <input
              id="sc-responsable"
              type="text"
              placeholder="Ej: Gabriel C., Encargado local..."
              value={form.responsable}
              onChange={(e) => setForm((prev) => ({ ...prev, responsable: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="sc-contacto" className="text-xs font-medium text-foreground block">
              Canal de contacto
            </label>
            <input
              id="sc-contacto"
              type="text"
              placeholder="Ej: +56 9 1234 5678 o correo..."
              value={form.contacto}
              onChange={(e) => setForm((prev) => ({ ...prev, contacto: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sc-direccion" className="text-xs font-medium text-foreground block">
              Dirección de acceso (opcional)
            </label>
            <input
              id="sc-direccion"
              type="text"
              placeholder="Ej: San Martín 450, Módulo 3..."
              value={form.direccion}
              onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sc-notas" className="text-xs font-medium text-foreground block">
            Notas operativas y condiciones de guarda
          </label>
          <textarea
            id="sc-notas"
            rows={2}
            placeholder="Ej: Horario de recepción, condiciones de humedad/temperatura, indicaciones de entrega..."
            value={form.notas}
            onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface-sunken border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="pt-1">
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
                <ShieldCheck size={14} className={form.ok ? 'text-success' : 'text-destructive'} />
                <span>Estado Operativo Óptimo</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Desmarca esta opción si el recinto presenta mantenciones, alertas de stock bajo o falta de capacidad.
              </div>
            </div>
          </label>
        </div>
      </form>
    </ImmersiveModal>
  );
}
