'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Minus,
  Loader2,
  Package,
  MapPin,
  Truck,
  ShoppingCart,
  MessageCircle,
  Search,
  Check,
  User,
  Phone,
  Mail,
  Home,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import {
  CHILEAN_COURIERS,
  DEFAULT_COURIER,
  getCourierLabel,
  CHILE_REGIONES_DPA,
  CHILE_COMUNAS_POR_REGION,
  getComunasPorRegion,
  getRegionDeComuna,
  type CourierCode,
  type ChileRegion,
} from '@enjambre/logistica';
import { ImmersiveModal, ViewLoading, DatePicker, formatCLP } from '@enjambre/ui';
import { MapaDestinoPreview } from './MapaDestinoPreview';

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
  buyer_email?: string | null;
  direccion_envio?: {
    nombre?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    comuna?: string;
    ciudad?: string;
    region?: string;
    instrucciones?: string;
  } | null;
  buy_order?: string | null;
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

export type ClientePayload = {
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  canal?: string;
  guardar_crm?: boolean;
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
  ventasRecientes: VentaReciente[];
  enviosHistoricos?: unknown[];
  onSubmit: (
    form: EnvioFormState,
    lineItems: Array<{ producto_id: string; cantidad: number }>,
    cliente?: ClientePayload,
  ) => void;
  submitting?: boolean;
};

const DESTINOS_FRECUENTES = [
  { label: 'Castro (Chiloé)', comuna: 'Castro', region: 'Los Lagos' },
  { label: 'Ancud (Chiloé)', comuna: 'Ancud', region: 'Los Lagos' },
  { label: 'Dalcahue (Chiloé)', comuna: 'Dalcahue', region: 'Los Lagos' },
  { label: 'Quellón (Chiloé)', comuna: 'Quellón', region: 'Los Lagos' },
  { label: 'Puerto Varas', comuna: 'Puerto Varas', region: 'Los Lagos' },
  { label: 'Puerto Montt', comuna: 'Puerto Montt', region: 'Los Lagos' },
  { label: 'Providencia (RM)', comuna: 'Providencia', region: 'Metropolitana' },
  { label: 'Las Condes (RM)', comuna: 'Las Condes', region: 'Metropolitana' },
  { label: 'Santiago Centro (RM)', comuna: 'Santiago', region: 'Metropolitana' },
  { label: 'Viña del Mar', comuna: 'Viña del Mar', region: 'Valparaíso' },
  { label: 'Concepción', comuna: 'Concepción', region: 'Biobío' },
] as const;

const TODAS_LAS_COMUNAS = Object.values(CHILE_COMUNAS_POR_REGION)
  .flat()
  .sort((a, b) => a.localeCompare(b, 'es'));

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
  ventasRecientes,
  onSubmit,
  submitting,
}: EnvioComposerModalProps) {
  const [tab, setTab] = useState<'tienda' | 'manual'>(
    ventasRecientes.length > 0 ? 'tienda' : 'manual',
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [soloConStock, setSoloConStock] = useState(true);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Datos del cliente para registro manual / CRM
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteComuna, setClienteComuna] = useState('');
  const [clienteRegion, setClienteRegion] = useState('');
  const [clienteCanal, setClienteCanal] = useState<'whatsapp' | 'instagram' | 'telefono' | 'directo'>('whatsapp');
  const [guardarCrm, setGuardarCrm] = useState(true);

  // Retorno de vidrio
  const [retornoFrascos, setRetornoFrascos] = useState(0);

  // Inicializar o sincronizar al abrir
  useEffect(() => {
    if (!open) return;
    if (ventasRecientes.length > 0 && !form.venta_id) {
      setTab('tienda');
    }
    const parsed = form.items
      ? form.items
          .split(',')
          .map((chunk) => {
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
          })
          .filter(Boolean) as LineItem[]
      : [];
    setLineItems(parsed);
  }, [open, form.items, productos, ventasRecientes.length, form.venta_id]);

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
    let serialized = serializeItems(lines);
    if (retornoFrascos > 0) {
      serialized += ` · Retorno Circular: ${retornoFrascos} frascos`;
    }
    onFormChange({ ...form, items: serialized });
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

  // Manejar selección de venta reciente (desde Tienda)
  const handleSelectVenta = (v: VentaReciente) => {
    const dir = v.direccion_envio;
    const destinoParts = [
      dir?.direccion,
      dir?.comuna,
      dir?.ciudad || dir?.region,
    ].filter(Boolean);

    const fullDestino = destinoParts.length > 0 ? destinoParts.join(', ') : 'Destino tienda';

    // Rellenar datos del cliente
    if (dir?.nombre) setClienteNombre(dir.nombre);
    if (dir?.telefono) setClienteTelefono(dir.telefono);
    if (v.buyer_email || dir?.email) setClienteEmail(v.buyer_email || dir?.email || '');
    if (dir?.direccion) setClienteDireccion(dir.direccion);
    if (dir?.comuna) {
      setClienteComuna(dir.comuna);
      const reg = dir.region || getRegionDeComuna(dir.comuna);
      if (reg) setClienteRegion(reg);
    }

    // Mapear productos
    let lines: LineItem[] = [];
    if (Array.isArray(v.items) && v.items.length > 0) {
      lines = v.items.map((i) => {
        const prod = productos.find((p) => p.nombre.toLowerCase() === i.nombre.toLowerCase());
        return {
          producto_id: prod?.id ?? `venta-prod-${i.nombre}`,
          nombre: i.nombre,
          cantidad: i.cantidad,
          stock: prod?.stock ?? 999,
        };
      });
    }

    setLineItems(lines);
    const serialized = serializeItems(lines);

    onFormChange({
      ...form,
      venta_id: v.id,
      destino: fullDestino,
      items: serialized || 'Pedido tienda',
      status: 'Empacando',
      tracking_code: form.tracking_code || `LEG-${v.id.slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    });
  };

  const comunasDisponibles = useMemo(() => {
    if (clienteRegion) {
      return getComunasPorRegion(clienteRegion);
    }
    return TODAS_LAS_COMUNAS;
  }, [clienteRegion]);

  const updateFullDestino = (calle: string, comuna: string, region: string) => {
    const parts = [calle.trim(), comuna.trim(), region.trim()].filter(Boolean);
    patchForm({ destino: parts.join(', ') });
  };

  const handleComunaChange = (comunaInput: string) => {
    setClienteComuna(comunaInput);
    const detectedRegion = getRegionDeComuna(comunaInput);
    const targetRegion = detectedRegion || clienteRegion;
    if (detectedRegion && detectedRegion !== clienteRegion) {
      setClienteRegion(detectedRegion);
    }
    updateFullDestino(clienteDireccion, comunaInput, targetRegion);
  };

  const handleRegionChange = (newRegion: string) => {
    setClienteRegion(newRegion);
    let nextComuna = clienteComuna;
    if (newRegion) {
      const comunasDeNuevaRegion = getComunasPorRegion(newRegion);
      if (clienteComuna && !comunasDeNuevaRegion.some((c) => c.toLowerCase() === clienteComuna.toLowerCase())) {
        nextComuna = '';
        setClienteComuna('');
      }
    }
    updateFullDestino(clienteDireccion, nextComuna, newRegion);
  };

  const handleDireccionChange = (calleInput: string) => {
    setClienteDireccion(calleInput);
    updateFullDestino(calleInput, clienteComuna, clienteRegion);
  };

  const handleSelectDestinoFrecuente = (item: { comuna: string; region: string }) => {
    setClienteComuna(item.comuna);
    setClienteRegion(item.region);
    updateFullDestino(clienteDireccion, item.comuna, item.region);
  };

  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      if (soloConStock && p.stock <= 0) return false;
      if (searchQuery.trim()) {
        return p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [productos, soloConStock, searchQuery]);

  const totalUnidades = useMemo(() => {
    return lineItems.reduce((acc, curr) => acc + curr.cantidad, 0);
  }, [lineItems]);

  const canSubmit = Boolean(
    form.destino.trim() &&
      lineItems.length > 0 &&
      form.tracking_code.trim() &&
      !submitting,
  );

  const handleGenerateInternalCode = () => {
    const code = `LEG-${Math.floor(1000 + Math.random() * 9000)}`;
    patchForm({ tracking_code: code });
  };

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      size="xl"
      eyebrow="Centro de despacho"
      title="Nuevo despacho"
      titleId="envio-composer-title"
      aside={
        <div className="flex flex-col h-full space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-accent" /> Ruta y destino de entrega
            </h3>
            <p className="text-[11px] text-muted-foreground mb-3">
              Previsualización en tiempo real de la localidad de despacho.
            </p>
          </div>

          <div className="flex-1 min-h-[220px]">
            <MapaDestinoPreview
              destino={form.destino}
              destinatario={clienteNombre || undefined}
              courierLabel={getCourierLabel(form.courier_code)}
              height="100%"
            />
          </div>

          {/* Resumen del paquete */}
          <div className="rounded-xl border border-border bg-surface-sunken p-3.5 space-y-2.5 text-xs">
            <div className="text-[10px] uppercase font-bold tracking-wider text-accent flex items-center justify-between">
              <span>Resumen de empaque</span>
              <span className="text-foreground">{totalUnidades} unidad(es)</span>
            </div>

            <div className="space-y-1.5 text-muted-foreground text-[11px]">
              <div className="flex justify-between">
                <span>Destinatario:</span>
                <span className="text-foreground font-medium truncate max-w-[150px]">
                  {clienteNombre || 'No especificado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Transporte:</span>
                <span className="text-foreground font-medium">
                  {getCourierLabel(form.courier_code)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Seguimiento / OT:</span>
                <span className="text-accent font-mono font-medium">
                  {form.tracking_code || 'Pendiente'}
                </span>
              </div>
            </div>

            {retornoFrascos > 0 && (
              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-accent">
                <span className="flex items-center gap-1">
                  <RotateCcw size={12} /> Frascos a recolectar:
                </span>
                <span className="font-semibold">{retornoFrascos} u.</span>
              </div>
            )}
          </div>
        </div>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:border-accent/50 transition-colors"
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
                  .filter((l) => l.cantidad > 0 && !l.producto_id.startsWith('custom-') && !l.producto_id.startsWith('venta-prod-'))
                  .map((l) => ({ producto_id: l.producto_id, cantidad: l.cantidad })),
                tab === 'manual'
                  ? {
                      nombre: clienteNombre,
                      telefono: clienteTelefono,
                      email: clienteEmail,
                      direccion: clienteDireccion,
                      canal: clienteCanal,
                      guardar_crm: guardarCrm,
                    }
                  : undefined,
              )
            }
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 transition-all shadow-sm"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
            Registrar despacho
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Selector de modo: Tienda vs Manual */}
        <div className="flex items-center gap-2 p-1 bg-surface-sunken border border-border rounded-xl">
          <button
            type="button"
            onClick={() => setTab('tienda')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === 'tienda'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingCart size={14} />
            <span>Desde pedido de Tienda</span>
            {ventasRecientes.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-background/30 font-bold">
                {ventasRecientes.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === 'manual'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageCircle size={14} />
            <span>Registro manual (WhatsApp / Directo)</span>
          </button>
        </div>

        {/* MODO TIENDA: Pedidos pendientes */}
        {tab === 'tienda' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ShoppingCart size={14} className="text-accent" /> Ventas recientes por despachar
              </h3>
              <span className="text-[11px] text-muted-foreground">Selecciona para autocompletar</span>
            </div>

            {ventasRecientes.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {ventasRecientes.map((v) => {
                  const isSelected = form.venta_id === v.id;
                  const buyer = v.direccion_envio?.nombre || v.buyer_email || 'Cliente tienda';
                  const comuna = v.direccion_envio?.comuna || v.direccion_envio?.ciudad || 'Chile';

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVenta(v)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/15 text-foreground shadow-sm ring-1 ring-accent'
                          : 'border-border bg-surface-sunken hover:border-accent/40 text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-medium text-xs truncate">{buyer}</span>
                        <span className="text-accent font-semibold text-xs">
                          {formatCLP(Number(v.total))}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {comuna} · {v.items?.length ?? 0} producto(s)
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-border bg-surface-sunken/40 text-center text-xs text-muted-foreground">
                No hay ventas pendientes de despacho en este momento. Puedes ingresar un despacho manual en la otra pestaña.
              </div>
            )}
          </section>
        )}

        {/* MODO MANUAL: Datos de contacto y entrega */}
        {tab === 'manual' && (
          <section className="space-y-3 rounded-xl border border-border bg-surface-sunken/60 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User size={14} className="text-accent" /> Datos del destinatario & canal
              </h3>
              <div className="flex items-center gap-1">
                {(['whatsapp', 'instagram', 'telefono', 'directo'] as const).map((canal) => (
                  <button
                    key={canal}
                    type="button"
                    onClick={() => setClienteCanal(canal)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border transition-colors ${
                      clienteCanal === canal
                        ? 'bg-accent/20 border-accent text-accent'
                        : 'border-border text-muted-foreground hover:border-accent/30'
                    }`}
                  >
                    {canal}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <label className="space-y-1 block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <User size={11} /> Nombre completo
                </span>
                <input
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Ej. Francisca Pérez"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Phone size={11} /> Teléfono / WhatsApp
                </span>
                <input
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>

              <label className="space-y-1 block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Mail size={11} /> Correo electrónico (opcional, para notificaciones)
                </span>
                <input
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  placeholder="cliente@ejemplo.cl"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>

              {/* Destinos frecuentes (1 clic) */}
              <div className="space-y-1 sm:col-span-2 pt-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <MapPin size={11} className="text-accent" /> Destinos frecuentes (1 clic para autocompletar)
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {DESTINOS_FRECUENTES.map((dest) => {
                    const isSelected =
                      clienteComuna.toLowerCase() === dest.comuna.toLowerCase() &&
                      clienteRegion.toLowerCase() === dest.region.toLowerCase();
                    return (
                      <button
                        key={`${dest.comuna}-${dest.region}`}
                        type="button"
                        onClick={() => handleSelectDestinoFrecuente(dest)}
                        className={`text-[10px] px-2.5 py-1 rounded-md border transition-all ${
                          isSelected
                            ? 'bg-accent/20 border-accent text-accent font-semibold shadow-sm'
                            : 'border-border/80 bg-background/50 hover:border-accent/40 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {dest.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector de Región */}
              <label className="space-y-1 block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Región de destino
                </span>
                <select
                  value={clienteRegion}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">Selecciona región o escribe comuna directa...</option>
                  {CHILE_REGIONES_DPA.map((r) => (
                    <option key={r.id} value={r.nombre}>
                      {r.nombreOficial} ({r.romano})
                    </option>
                  ))}
                </select>
              </label>

              {/* Autocompletado de Comuna */}
              <label className="space-y-1 block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Comuna {clienteRegion ? `(${clienteRegion})` : 'de Chile'}
                </span>
                <div className="relative">
                  <input
                    list="comunas-chile-list"
                    value={clienteComuna}
                    onChange={(e) => handleComunaChange(e.target.value)}
                    placeholder="Escribe o selecciona comuna..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <datalist id="comunas-chile-list">
                    {comunasDisponibles.map((com) => (
                      <option key={com} value={com} />
                    ))}
                  </datalist>
                </div>
              </label>

              {/* Calle y número */}
              <label className="space-y-1 block sm:col-span-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Home size={11} /> Calle, número y depto / villa
                </span>
                <input
                  value={clienteDireccion}
                  onChange={(e) => handleDireccionChange(e.target.value)}
                  placeholder="Ej. Gamboa 450, depto 201"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border/80">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground select-none">
                <input
                  type="checkbox"
                  checked={guardarCrm}
                  onChange={(e) => setGuardarCrm(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent h-3.5 w-3.5 bg-background"
                />
                <span>Guardar este contacto en el directorio interno de clientes (CRM)</span>
              </label>
            </div>
          </section>
        )}

        {/* DESTINO CONFIRMADO (SI SELECCIONÓ TIENDA) */}
        {tab === 'tienda' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <MapPin size={11} className="text-accent" /> Dirección de destino (extraída del pedido)
              </span>
              {clienteComuna && (
                <span className="text-[10px] text-accent bg-accent/15 px-2 py-0.5 rounded border border-accent/30 font-medium">
                  {clienteComuna} {clienteRegion ? `· ${clienteRegion}` : ''}
                </span>
              )}
            </div>
            <input
              value={form.destino}
              onChange={(e) => patchForm({ destino: e.target.value })}
              placeholder="Dirección, comuna o ciudad de entrega"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}

        {/* SECCIÓN DE PRODUCTOS / INVENTARIO */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Package size={14} className="text-accent" /> Contenido del paquete
            </h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSoloConStock(!soloConStock)}
                className={`text-[11px] px-2 py-0.5 rounded-lg border transition-colors ${
                  soloConStock
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {soloConStock ? 'Solo con unidades disponibles' : 'Todos los productos'}
              </button>
            </div>
          </div>

          {/* Buscador de producto */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto por nombre..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Lista de productos para agregar */}
          {productosLoading ? (
            <ViewLoading variant="inline" label="Inventario" hideLabel />
          ) : filteredProductos.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              No se encontraron productos disponibles con ese criterio.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredProductos.slice(0, 16).map((p) => {
                const enCanasta = lineItems.find((l) => l.producto_id === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    disabled={p.stock <= 0}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors min-h-[42px] ${
                      enCanasta
                        ? 'border-accent/50 bg-accent/10 text-foreground'
                        : 'border-border bg-surface-sunken hover:border-accent/40 text-foreground disabled:opacity-40'
                    }`}
                  >
                    <span className="truncate font-medium">{p.nombre}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                      {p.stock > 0 ? `${p.stock} disp.` : 'Agotado'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Canasta de empaque con cantidades */}
          {lineItems.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border bg-surface-sunken p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Artículos incluidos en este despacho:
              </span>
              {lineItems.map((line) => (
                <div
                  key={line.producto_id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-background/60 border border-border/60"
                >
                  <span className="text-xs font-medium text-foreground truncate flex-1">
                    {line.nombre}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      className="h-7 w-7 rounded border border-border inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/40"
                      aria-label="Disminuir"
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
                    <span className="w-7 text-center text-xs font-mono font-bold tabular-nums text-foreground">
                      {line.cantidad}
                    </span>
                    <button
                      type="button"
                      className="h-7 w-7 rounded border border-border inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/40 disabled:opacity-40"
                      aria-label="Aumentar"
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
                </div>
              ))}
            </div>
          )}

          {/* Declaración de retorno de frascos de vidrio */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-surface-sunken/40">
            <div className="flex items-center gap-2">
              <RotateCcw size={14} className="text-accent" />
              <div>
                <div className="text-xs font-medium text-foreground">Retorno de frascos de vidrio</div>
                <div className="text-[10px] text-muted-foreground">Recolectar envases en entrega</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextVal = Math.max(0, retornoFrascos - 1);
                  setRetornoFrascos(nextVal);
                  syncItems(lineItems);
                }}
                className="h-7 w-7 rounded border border-border inline-flex items-center justify-center text-muted-foreground"
              >
                <Minus size={12} />
              </button>
              <span className="w-6 text-center text-xs font-mono font-bold">{retornoFrascos}</span>
              <button
                type="button"
                onClick={() => {
                  const nextVal = retornoFrascos + 1;
                  setRetornoFrascos(nextVal);
                  syncItems(lineItems);
                }}
                className="h-7 w-7 rounded border border-border inline-flex items-center justify-center text-muted-foreground"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </section>

        {/* TRANSPORTE, COURIER & OT */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Truck size={14} className="text-accent" /> Transporte & Operador logístico
          </h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="space-y-1 block">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Courier / Transportista
              </span>
              <select
                value={form.courier_code}
                onChange={(e) => patchForm({ courier_code: e.target.value as CourierCode })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {CHILEAN_COURIERS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                    {c.code === DEFAULT_COURIER ? ' (predeterminado)' : ''}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-1 block">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Número de seguimiento (OT)
                </span>
                <button
                  type="button"
                  onClick={handleGenerateInternalCode}
                  className="text-[10px] text-accent hover:underline inline-flex items-center gap-1"
                >
                  <RefreshCw size={10} /> Código interno
                </button>
              </div>
              <input
                value={form.tracking_code}
                onChange={(e) => patchForm({ tracking_code: e.target.value })}
                placeholder="Ej. número de orden de transporte del courier"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent font-mono"
              />
            </div>

            <label className="space-y-1 block">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Estado inicial
              </span>
              <select
                value={form.status}
                onChange={(e) => patchForm({ status: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="Empacando">Empacando / Preparación</option>
                <option value="En tránsito">En tránsito / En camino</option>
                <option value="Programado">Programado</option>
                <option value="Entregado">Entregado</option>
              </select>
            </label>

            <label className="space-y-1 block">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Compromiso estimado de entrega
              </span>
              <DatePicker
                value={form.eta}
                onChange={(val) => patchForm({ eta: val })}
                className="w-full"
              />
            </label>
          </div>
        </section>
      </div>
    </ImmersiveModal>
  );
}
