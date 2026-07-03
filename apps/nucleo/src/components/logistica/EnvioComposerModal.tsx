'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Minus,
  Loader2,
  Navigation,
  Package,
  MapPin,
  Truck,
  ShoppingCart,
} from 'lucide-react';
import {
  CHILEAN_COURIERS,
  DEFAULT_COURIER,
  type CourierCode,
} from '@enjambre/logistica';
import { ImmersiveModal, ViewLoading } from '@enjambre/ui';
import dynamic from 'next/dynamic';
import type { EnvioMapPoint } from './MapaEnviosHistorico';

const MapaEnviosHistorico = dynamic(
  () => import('./MapaEnviosHistorico').then((m) => m.MapaEnviosHistorico),
  { ssr: false, loading: () => <ViewLoading variant="view" label="Mapa" hideLabel /> },
);

export type ProductoInventario = {
  id: string;
  nombre: string;
  stock: number;
  categoria: string | null;
  formato: string | null;
};

export type VentaReciente = {
  id: string;
  total: number;
  channel: string | null;
  created_at: string | null;
  metodo_pago: string | null;
  items?: Array<{ cantidad: number; nombre: string }>;
};

export type EnvioFormState = {
  tracking_code: string;
  destino: string;
  items: string;
  status: string;
  eta: string;
  courier_code: CourierCode;
  venta_id?: string;
};

type LineItem = {
  producto_id: string;
  nombre: string;
  cantidad: number;
  stock: number;
};

type EnvioComposerModalProps = {
  open: boolean;
  onClose: () => void;
  form: EnvioFormState;
  onFormChange: (form: EnvioFormState) => void;
  productos: ProductoInventario[];
  productosLoading?: boolean;
  enviosHistoricos: EnvioMapPoint[];
  ventasRecientes: VentaReciente[];
  onSubmit: (form: EnvioFormState, lineItems: Array<{ producto_id: string; cantidad: number }>) => void;
  submitting?: boolean;
};

function serializeItems(lines: LineItem[]): string {
  return lines
    .filter((l) => l.cantidad > 0)
    .map((l) => `${l.cantidad}x ${l.nombre}`)
    .join(', ');
}

export function EnvioComposerModal({
  open,
  onClose,
  form,
  onFormChange,
  productos,
  productosLoading,
  enviosHistoricos,
  ventasRecientes,
  onSubmit,
  submitting,
}: EnvioComposerModalProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    if (!open) return;
    const parsed = form.items
      ? form.items.split(',').map((chunk) => {
          const match = chunk.trim().match(/^(\d+)x\s+(.+)$/i);
          if (!match) return null;
          const nombre = match[2].trim();
          const producto = productos.find((p) => p.nombre === nombre);
          return {
            producto_id: producto?.id ?? `custom-${nombre}`,
            nombre,
            cantidad: Number(match[1]),
            stock: producto?.stock ?? 999,
          };
        }).filter(Boolean) as LineItem[]
      : [];
    setLineItems(parsed);
  }, [open, form.items, productos]);

  const itemsLabel = useMemo(() => serializeItems(lineItems), [lineItems]);

  const patchForm = (patch: Partial<EnvioFormState>) => {
    const next = { ...form, ...patch };
    if (patch.items === undefined && lineItems.length > 0) {
      next.items = itemsLabel;
    }
    onFormChange(next);
  };

  const syncItems = (lines: LineItem[]) => {
    setLineItems(lines);
    onFormChange({ ...form, items: serializeItems(lines) });
  };

  const addProduct = (producto: ProductoInventario) => {
    const existing = lineItems.find((l) => l.producto_id === producto.id);
    if (existing) {
      syncItems(
        lineItems.map((l) =>
          l.producto_id === producto.id
            ? { ...l, cantidad: Math.min(l.cantidad + 1, producto.stock) }
            : l,
        ),
      );
      return;
    }
    syncItems([
      ...lineItems,
      {
        producto_id: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        stock: producto.stock,
      },
    ]);
  };

  const canSubmit = Boolean(form.destino && itemsLabel && !submitting);

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      eyebrow="Centro de despacho"
      title="Nuevo envío"
      titleId="envio-composer-title"
      aside={
        <>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
            <MapPin size={14} /> Mapa histórico de envíos
          </h3>
          <MapaEnviosHistorico envios={enviosHistoricos} className="flex-1 min-h-[220px]" />
          <p className="mt-3 text-[10px] text-muted-foreground">
            {enviosHistoricos.length} envío(s) trazados · color por estado
          </p>
        </>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:border-accent/50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit(
                { ...form, items: itemsLabel || form.items },
                lineItems
                  .filter((l) => l.cantidad > 0 && !l.producto_id.startsWith('custom-'))
                  .map((l) => ({ producto_id: l.producto_id, cantidad: l.cantidad })),
              )
            }
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Registrar envío
          </button>
        </>
      }
    >
      <div className="space-y-6">
            {form.status === 'En tránsito' && (
              <div className="text-[11px] text-info bg-info/10 border border-info/20 px-3 py-2 rounded-lg flex items-center gap-2">
                <Navigation size={14} />
                Al registrar en tránsito se notifica automáticamente al cliente.
              </div>
            )}

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Truck size={14} /> Datos del envío
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="space-y-1.5 block">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Código</span>
                  <input
                    value={form.tracking_code}
                    onChange={(e) => patchForm({ tracking_code: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">ETA</span>
                  <input
                    type="date"
                    value={form.eta}
                    onChange={(e) => patchForm({ eta: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1.5 block sm:col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Destino</span>
                  <input
                    value={form.destino}
                    onChange={(e) => patchForm({ destino: e.target.value })}
                    placeholder="Ciudad, comuna o dirección"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Estado</span>
                  <select
                    value={form.status}
                    onChange={(e) => patchForm({ status: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="Programado">Programado</option>
                    <option value="Empacando">Empacando</option>
                    <option value="En tránsito">En tránsito</option>
                    <option value="Entregado">Entregado</option>
                  </select>
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Courier</span>
                  <select
                    value={form.courier_code}
                    onChange={(e) => patchForm({ courier_code: e.target.value as CourierCode })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  >
                    {CHILEAN_COURIERS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                        {c.code === DEFAULT_COURIER ? ' (predeterminado)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Package size={14} /> Inventario general
              </h3>
              {productosLoading ? (
                <ViewLoading variant="inline" label="Inventario" hideLabel />
              ) : productos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin productos en inventario.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {productos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      disabled={p.stock <= 0}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-sunken px-3 py-2 text-left text-sm hover:border-accent/40 disabled:opacity-40 transition-colors"
                    >
                      <span className="truncate">{p.nombre}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">stk {p.stock}</span>
                    </button>
                  ))}
                </div>
              )}

              {lineItems.length > 0 && (
                <div className="space-y-2 rounded-xl border border-border bg-surface-sunken/60 p-3">
                  {lineItems.map((line) => (
                    <div key={line.producto_id} className="flex items-center gap-2">
                      <span className="flex-1 text-sm truncate">{line.nombre}</span>
                      <button
                        type="button"
                        className="p-1 rounded border border-border"
                        onClick={() =>
                          syncItems(
                            lineItems
                              .map((l) =>
                                l.producto_id === line.producto_id
                                  ? { ...l, cantidad: Math.max(0, l.cantidad - 1) }
                                  : l,
                              )
                              .filter((l) => l.cantidad > 0),
                          )
                        }
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-mono">{line.cantidad}</span>
                      <button
                        type="button"
                        className="p-1 rounded border border-border"
                        disabled={line.cantidad >= line.stock}
                        onClick={() =>
                          syncItems(
                            lineItems.map((l) =>
                              l.producto_id === line.producto_id
                                ? { ...l, cantidad: Math.min(l.cantidad + 1, l.stock) }
                                : l,
                            ),
                          )
                        }
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {ventasRecientes.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ShoppingCart size={14} /> Ventas recientes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ventasRecientes.slice(0, 6).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        const itemsStr = Array.isArray(v.items)
                          ? v.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ')
                          : 'Pedido tienda';
                        onFormChange({
                          ...form,
                          venta_id: v.id,
                          items: itemsStr,
                          tracking_code: `VNT-${v.id.slice(0, 4)}-${Math.floor(Math.random() * 1000)}`,
                          status: 'Empacando',
                        });
                      }}
                      className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors ${
                        form.venta_id === v.id
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border hover:border-accent/40'
                      }`}
                    >
                      ${Number(v.total).toLocaleString('es-CL')}
                    </button>
                  ))}
                </div>
              </section>
            )}
      </div>
    </ImmersiveModal>
  );
}