'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  FlaskConical,
  Tag,
  Box,
  Hexagon,
  Droplets,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import { Button, ImmersiveModal, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  INVENTARIO_CLASES,
  UNIDADES_INVENTARIO,
  type InventarioClaseId,
  type InventarioItemClase,
} from '@/lib/inventario-types';
import { cn } from '@/lib/cn';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  package: Package,
  flask: FlaskConical,
  tag: Tag,
  box: Box,
  hexagon: Hexagon,
  droplets: Droplets,
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (clase: InventarioClaseId) => void;
  /** Prefill category if opened from a tab */
  initialClase?: InventarioClaseId | null;
};

/**
 * Flujo único: Nuevo inventario → elegir categoría → crear ítem
 * (o ir a Productos si es SKU de venta).
 */
export function NuevoInventarioWizard({ open, onClose, onCreated, initialClase = null }: Props) {
  const apiFetch = useApiFetch();
  const [step, setStep] = useState<'clase' | 'form'>(initialClase && initialClase !== 'producto' ? 'form' : 'clase');
  const [clase, setClase] = useState<InventarioClaseId | null>(
    initialClase && initialClase !== 'producto' ? initialClase : null,
  );
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    unidad: 'unidad',
    stock: 0,
    stock_minimo: 0,
    costo_unitario: 0,
    proveedor_nota: '',
    notas: '',
    sku_code: '',
    // entrada inicial con doc opcional
    doc_tipo: '' as string,
    doc_numero: '',
    doc_fecha: '',
  });

  const reset = () => {
    setStep('clase');
    setClase(null);
    setForm({
      nombre: '',
      unidad: 'unidad',
      stock: 0,
      stock_minimo: 0,
      costo_unitario: 0,
      proveedor_nota: '',
      notas: '',
      sku_code: '',
      doc_tipo: '',
      doc_numero: '',
      doc_fecha: '',
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickClase = (id: InventarioClaseId) => {
    setClase(id);
    if (id === 'producto') {
      // Productos se crean en catálogo (ficha de tienda)
      return;
    }
    setStep('form');
  };

  const meta = clase ? INVENTARIO_CLASES.find((c) => c.id === clase) : null;

  const save = async () => {
    if (!clase || clase === 'producto') return;
    if (!form.nombre.trim()) {
      toast('Nombre obligatorio', { type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/api/inventario/items', {
        method: 'POST',
        body: JSON.stringify({
          clase: clase as InventarioItemClase,
          nombre: form.nombre.trim(),
          unidad: form.unidad,
          stock: form.stock,
          stock_minimo: form.stock_minimo,
          costo_unitario: form.costo_unitario,
          proveedor_nota: form.proveedor_nota.trim() || null,
          notas: form.notas.trim() || null,
          sku_code: form.sku_code.trim() || null,
          doc_tipo: form.doc_tipo || null,
          doc_numero: form.doc_numero.trim() || null,
          doc_fecha: form.doc_fecha || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'No se pudo crear');

      toast(`${meta?.label ?? 'Ítem'} creado`, { type: 'success' });
      onCreated(clase);
      handleClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al crear', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ImmersiveModal
      open={open}
      onClose={handleClose}
      eyebrow="Inventario"
      title={
        step === 'clase'
          ? 'Nuevo inventario'
          : `Nuevo · ${meta?.label ?? ''}`
      }
      size="lg"
    >
      {step === 'clase' && (
        <div className="space-y-4 p-1">
          <p className="text-sm text-muted-foreground">
            Elige qué tipo de stock vas a registrar. Todo queda centralizado en Inventario.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INVENTARIO_CLASES.map((c) => {
              const Icon = ICONS[c.icon] ?? Package;
              const isProducto = c.id === 'producto';
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickClase(c.id)}
                  className={cn(
                    'text-left rounded-xl border border-border/70 bg-card p-4 min-h-[5.5rem]',
                    'hover:border-primary/40 hover:bg-primary/5 transition-colors touch-manipulation',
                    'flex gap-3 items-start',
                  )}
                >
                  <span className="rounded-lg bg-primary/10 text-primary p-2 shrink-0">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground flex items-center gap-2">
                      {c.label}
                      <ArrowRight size={14} className="text-muted-foreground" />
                    </span>
                    <span className="text-xs text-muted-foreground block mt-1 leading-snug">
                      {isProducto
                        ? 'Abre el catálogo para crear la ficha de tienda (luego cargas stock aquí).'
                        : c.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {clase === 'producto' && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
              <p className="text-sm text-foreground">
                Los <strong>productos de venta</strong> se crean en el catálogo (nombre, foto, precio)
                y el stock se gestiona en la pestaña Productos de este Inventario.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/catalogo"
                  onClick={handleClose}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground min-h-11"
                >
                  Ir a crear producto
                </Link>
                <Button variant="outline" className="min-h-11" onClick={() => setClase(null)}>
                  Elegir otra categoría
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'form' && clase && clase !== 'producto' && (
        <div className="space-y-3 p-1">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground min-h-11"
            onClick={() => {
              setStep('clase');
              setClase(null);
            }}
          >
            <ChevronLeft size={16} /> Cambiar categoría
          </button>

          <Field label="Nombre *">
            <input
              className="input-field w-full min-h-11"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder={
                clase === 'etiqueta'
                  ? 'Ej. Etiqueta Ulmo 500g temporada 2026'
                  : clase === 'insumo'
                    ? 'Ej. Cera estampada / Timol / Miel a granel'
                    : 'Nombre del ítem'
              }
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Unidad">
              <select
                className="input-field w-full min-h-11"
                value={form.unidad}
                onChange={(e) => setForm({ ...form, unidad: e.target.value })}
              >
                {UNIDADES_INVENTARIO.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Código / SKU interno">
              <input
                className="input-field w-full min-h-11"
                value={form.sku_code}
                onChange={(e) => setForm({ ...form, sku_code: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Stock inicial">
              <input
                type="number"
                min={0}
                className="input-field w-full min-h-11 tabular-nums"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Stock mínimo (alerta)">
              <input
                type="number"
                min={0}
                className="input-field w-full min-h-11 tabular-nums"
                value={form.stock_minimo}
                onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) || 0 })}
              />
            </Field>
          </div>

          <Field label="Costo unitario (CLP)">
            <input
              type="number"
              min={0}
              className="input-field w-full min-h-11 tabular-nums"
              value={form.costo_unitario}
              onChange={(e) =>
                setForm({ ...form, costo_unitario: parseInt(e.target.value, 10) || 0 })
              }
            />
          </Field>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Documento de referencia (opcional)
            </p>
            <p className="text-xs text-muted-foreground">
              Orientación funcional: factura, orden o comprobante. No reemplaza el registro SII.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                className="input-field min-h-11 text-sm"
                value={form.doc_tipo}
                onChange={(e) => setForm({ ...form, doc_tipo: e.target.value })}
              >
                <option value="">Sin documento</option>
                <option value="factura">Factura</option>
                <option value="boleta">Boleta</option>
                <option value="guia">Guía de despacho</option>
                <option value="orden_compra">Orden de compra</option>
                <option value="comprobante">Comprobante</option>
                <option value="otro">Otro</option>
              </select>
              <input
                className="input-field min-h-11 text-sm"
                placeholder="Nº documento"
                value={form.doc_numero}
                onChange={(e) => setForm({ ...form, doc_numero: e.target.value })}
              />
              <input
                type="date"
                className="input-field min-h-11 text-sm"
                value={form.doc_fecha}
                onChange={(e) => setForm({ ...form, doc_fecha: e.target.value })}
              />
            </div>
          </div>

          <Field label="Proveedor / nota">
            <input
              className="input-field w-full min-h-11"
              value={form.proveedor_nota}
              onChange={(e) => setForm({ ...form, proveedor_nota: e.target.value })}
            />
          </Field>
          <Field label="Notas">
            <textarea
              className="input-field w-full"
              rows={2}
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
          </Field>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button variant="outline" className="min-h-11" onClick={handleClose}>
              Cancelar
            </Button>
            <Button className="min-h-11" disabled={saving} onClick={() => void save()}>
              {saving ? 'Creando…' : 'Crear en inventario'}
            </Button>
          </div>
        </div>
      )}
    </ImmersiveModal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
