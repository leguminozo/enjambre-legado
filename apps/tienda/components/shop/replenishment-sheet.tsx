'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  CreditCard,
  Minus,
  Plus,
  FileText,
  Calendar as CalendarIcon,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@enjambre/ui';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/providers/auth-context';
import type { ShopProduct } from '@/lib/shop/products';
import type { ClienteDireccion } from '@/lib/shop/direcciones-schema';
import { formatCLP } from '@/lib/shop/format';
import { validarRUT, formatearRUT } from '@/lib/shop/rut';
import { TiendaModal } from '@/components/shop/tienda-modal';
import {
  PlanIntervalPicker,
  type ReplenishmentIntervalKey,
  type CustomFrequencyOption,
} from '@/components/shop/plan-interval-picker';
import { ReplenishmentCalendar } from '@/components/shop/replenishment-calendar';
import {
  ReplenishmentAddressField,
  type ReplenishmentShippingData,
} from '@/components/shop/replenishment-address-field';
import {
  loadReplenishmentAddress,
  saveReplenishmentAddress,
} from '@/lib/shop/replenishment-address';
import { startSubscriptionCheckout } from '@/lib/shop/subscription-checkout-client';

type ReplenishmentSheetProps = {
  open: boolean;
  onClose: () => void;
  product: ShopProduct;
  initialQuantity?: number;
};

const CADENCE_LABELS: Record<ReplenishmentIntervalKey, string> = {
  monthly: 'Mensual (cada 1 mes)',
  quarterly: 'Trimestral (cada 3 meses)',
  annual: 'Anual (cada 1 año)',
  custom: 'Personalizada',
};

const CUSTOM_CADENCE_LABELS: Record<CustomFrequencyOption, string> = {
  biweekly: 'Quincenal (cada 2 semanas)',
  bimonthly: 'Bimestral (cada 2 meses)',
  fourmonthly: 'Cuatrimestral (cada 4 meses)',
  semiannual: 'Semestral (cada 6 meses)',
};

function formatDeliveryDate(date: Date): string {
  const weekday = new Intl.DateTimeFormat('es-CL', { weekday: 'long' }).format(date);
  const day = date.getDate();
  const month = new Intl.DateTimeFormat('es-CL', { month: 'long' }).format(date);
  const year = date.getFullYear();
  return `${weekday}, ${day} de ${month} de ${year}`;
}

export function ReplenishmentSheet({
  open,
  onClose,
  product,
  initialQuantity = 1,
}: ReplenishmentSheetProps) {
  const t = useTranslations('perfil.reposicion');
  const tSheet = useTranslations('perfil.reposicion.sheet');
  const { user } = useAuth();

  // 1. Cantidad de producto
  const [quantity, setQuantity] = useState(initialQuantity);
  const maxAvailable = product.stock != null && product.stock > 0 ? Math.min(product.stock, 24) : 24;

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () => setQuantity((q) => Math.min(maxAvailable, q + 1));

  // 2. Intervalo y cadencia
  const [selectedInterval, setSelectedInterval] = useState<ReplenishmentIntervalKey>('monthly');
  const [customFrequency, setCustomFrequency] = useState<CustomFrequencyOption>('bimonthly');

  // 3. Primera entrega (Calendario) — Por defecto 3 días a futuro
  const [firstDeliveryDate, setFirstDeliveryDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // 4. Destino / Dirección
  const [address, setAddress] = useState('');
  const [shippingDetails, setShippingDetails] = useState<ReplenishmentShippingData | null>(null);
  const [direcciones, setDirecciones] = useState<ClienteDireccion[]>([]);

  // 5. Documento Tributario (Boleta vs Factura B2B)
  const [tipoDte, setTipoDte] = useState<'boleta' | 'factura'>('boleta');
  const [facturaData, setFacturaData] = useState({
    rut: '',
    razonSocial: '',
    giro: '',
    direccion: '',
  });

  const [loading, setLoading] = useState(false);

  // Inicializar al abrir
  useEffect(() => {
    if (!open) return;
    setQuantity(initialQuantity > 0 ? initialQuantity : 1);
    setSelectedInterval('monthly');
    setCustomFrequency('bimonthly');

    // Primera entrega por defecto en 3 días
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(0, 0, 0, 0);
    setFirstDeliveryDate(d);

    const saved = loadReplenishmentAddress();
    setAddress(saved);

    const supabase = createClient();
    supabase
      .from('cliente_direcciones')
      .select('*')
      .order('es_predeterminada', { ascending: false })
      .then((res: { data: unknown }) => {
        const data = res.data as ClienteDireccion[] | null;
        if (data && data.length > 0) {
          setDirecciones(data);
          const def = data.find((item) => item.es_predeterminada) || data[0];
          if (def) {
            const formatted = [def.direccion, def.comuna, def.ciudad, def.region].filter(Boolean).join(', ');
            setAddress(formatted);
            setShippingDetails({
              nombre: def.nombre || user?.name || '',
              email: user?.email || '',
              telefono: def.telefono || '',
              direccion: def.direccion,
              comuna: def.comuna,
              ciudad: def.ciudad || def.comuna,
              region: def.region,
              codigoPostal: def.codigo_postal || '',
              instrucciones: def.instrucciones || '',
            });
          }
        }
      })
      .catch(() => {
        /* fallback al address cargado localmente */
      });
  }, [open, initialQuantity, user]);

  const unitPrice = product.price ?? 0;
  const cycleTotalPrice = unitPrice * quantity;

  const cadenceLabel = useMemo(() => {
    if (selectedInterval === 'custom') {
      return `Personalizada: ${CUSTOM_CADENCE_LABELS[customFrequency]}`;
    }
    return CADENCE_LABELS[selectedInterval];
  }, [selectedInterval, customFrequency]);

  const handleAddressChange = (formatted: string, details?: ReplenishmentShippingData) => {
    setAddress(formatted);
    if (details) {
      setShippingDetails(details);
    }
  };

  const handleConfirm = async () => {
    const trimmedAddress = address.trim();
    if (trimmedAddress.length < 5) {
      toast('Por favor ingresa o selecciona una dirección de entrega válida.', { type: 'error' });
      return;
    }

    if (tipoDte === 'factura') {
      if (!validarRUT(facturaData.rut)) {
        toast('El RUT de empresa ingresado para Factura B2B no es válido.', { type: 'error' });
        return;
      }
      if (!facturaData.razonSocial.trim()) {
        toast('La Razón Social de empresa es requerida para emitir Factura.', { type: 'error' });
        return;
      }
      if (!facturaData.giro.trim()) {
        toast('El Giro comercial es requerido para emitir Factura.', { type: 'error' });
        return;
      }
    }

    saveReplenishmentAddress(trimmedAddress);
    setLoading(true);

    // Mapear frecuencia a backend
    const backendFrequency: 'monthly' | 'quarterly' | 'annual' =
      selectedInterval === 'custom'
        ? customFrequency === 'semiannual'
          ? 'annual'
          : 'monthly'
        : selectedInterval;

    // Metadatos de entrega y fiscales
    const deliveryNotes = [
      trimmedAddress,
      `[Primera Entrega: ${formatDeliveryDate(firstDeliveryDate)}]`,
      selectedInterval === 'custom' ? `[Ritmo solicitado: ${CUSTOM_CADENCE_LABELS[customFrequency]}]` : '',
      tipoDte === 'factura'
        ? `[DTE: FACTURA RUT ${facturaData.rut} | ${facturaData.razonSocial} | Giro: ${facturaData.giro}]`
        : '[DTE: BOLETA]',
      shippingDetails?.instrucciones ? `[Instrucciones: ${shippingDetails.instrucciones}]` : '',
    ]
      .filter(Boolean)
      .join(' · ');

    const result = await startSubscriptionCheckout(undefined, {
      productId: product.id,
      frequency: backendFrequency,
      quantity,
      deliveryAddress: deliveryNotes,
    });

    if (!result.ok) {
      toast(result.message, { type: 'error' });
      setLoading(false);
    }
  };

  const footer = (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between text-sm sm:text-base border-b border-border/50 pb-3">
        <span className="text-muted-foreground font-medium">{tSheet('total')} por ciclo</span>
        <span className="font-display text-xl sm:text-2xl text-accent font-semibold tracking-wide">
          {formatCLP(cycleTotalPrice)}
        </span>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => void handleConfirm()}
        className="w-full rounded-2xl bg-accent px-6 py-4 text-xs font-bold uppercase tracking-[0.25em] text-accent-foreground transition hover:shadow-glow disabled:opacity-50 cursor-pointer shadow-md"
      >
        {loading ? t('processing') : t('confirm')}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Cobro según intervalo. Pausa o cancelación en tu perfil en cualquier momento.
      </p>
    </div>
  );

  return (
    <TiendaModal
      open={open}
      onClose={onClose}
      size="xl"
      headerCentered
      kicker={tSheet('kicker')}
      testId="replenishment-sheet"
      title={tSheet('title')}
      subtitle={product.name}
      footer={footer}
      bodyClassName="px-4 sm:px-8 py-6 space-y-8"
    >
      {/* 1. SECCIÓN PRODUCTO Y CANTIDAD */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="tienda-replenishment-section-label">{tSheet('product')}</h4>
          <span className="text-xs text-muted-foreground font-mono">
            {formatCLP(unitPrice)} c/u
          </span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {product.photos[0] ? (
              <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-surface-sunken">
                <Image
                  src={product.photos[0]}
                  alt={product.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-surface-sunken text-muted-foreground">
                <ShoppingBag size={20} />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display font-semibold text-foreground text-sm sm:text-base truncate">
                {product.name}
              </p>
              {product.format && (
                <p className="text-xs text-muted-foreground mt-0.5">{product.format}</p>
              )}
              <p className="mt-1 font-mono text-xs font-semibold text-accent">
                {formatCLP(unitPrice)}
              </p>
            </div>
          </div>

          {/* Selector de cantidad */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
            <span className="text-xs text-muted-foreground font-medium sm:hidden">Cantidad:</span>
            <div className="flex items-center rounded-full border border-border/80 bg-secondary/40 p-1 shadow-xs">
              <button
                type="button"
                aria-label="Disminuir unidades por reposición"
                onClick={decrement}
                disabled={quantity <= 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 hover:bg-surface-raised hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="w-9 text-center font-mono text-sm font-semibold tabular-nums text-foreground">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Aumentar unidades por reposición"
                onClick={increment}
                disabled={quantity >= maxAvailable}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 hover:bg-surface-raised hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECCIÓN INTERVALO */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="tienda-replenishment-section-label">{tSheet('interval')}</h4>
          <span className="text-xs text-muted-foreground">Ciclo de reposición periódica</span>
        </div>

        <PlanIntervalPicker
          selectedInterval={selectedInterval}
          onSelectInterval={setSelectedInterval}
          customFrequency={customFrequency}
          onChangeCustomFrequency={setCustomFrequency}
        />
      </section>

      {/* 3. SECCIÓN PROGRAMAR PRIMERA ENTREGA (CALENDARIO) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="tienda-replenishment-section-label">
            <span className="inline-flex items-center gap-2">
              <CalendarIcon size={14} className="text-accent" />
              Programar Primera Entrega
            </span>
          </h4>
          <span className="text-xs text-muted-foreground">Elige el día exacto de inicio</span>
        </div>

        <ReplenishmentCalendar
          value={firstDeliveryDate}
          onChange={setFirstDeliveryDate}
        />
      </section>

      {/* 4. SECCIÓN DESTINO / DIRECCIÓN DE ENVÍO */}
      <ReplenishmentAddressField
        value={address}
        onChange={handleAddressChange}
        direcciones={direcciones}
        initialUserData={{
          name: user?.name,
          email: user?.email,
        }}
      />

      {/* 5. SECCIÓN DOCUMENTO TRIBUTARIO */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="tienda-replenishment-section-label">
            <span className="inline-flex items-center gap-2">
              <FileText size={14} className="text-accent" />
              Documento Tributario
            </span>
          </h4>
          <span className="text-xs text-muted-foreground">Boleta o Factura con RUT</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div>
              <p className="text-xs font-semibold text-foreground">Tipo de Comprobante</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Emitido automáticamente en cada ciclo recurrente
              </p>
            </div>
            <div className="flex items-center p-1 rounded-xl bg-secondary/60 border border-border">
              <button
                type="button"
                onClick={() => setTipoDte('boleta')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  tipoDte === 'boleta'
                    ? 'bg-accent text-accent-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Boleta
              </button>
              <button
                type="button"
                onClick={() => setTipoDte('factura')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  tipoDte === 'factura'
                    ? 'bg-accent text-accent-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Factura B2B
              </button>
            </div>
          </div>

          {tipoDte === 'factura' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 animate-in fade-in duration-200">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">RUT Empresa *</label>
                <input
                  type="text"
                  value={facturaData.rut}
                  onChange={(e) =>
                    setFacturaData((prev) => ({ ...prev, rut: formatearRUT(e.target.value) }))
                  }
                  placeholder="76.123.456-7"
                  className="w-full min-h-10 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Razón Social *</label>
                <input
                  type="text"
                  autoComplete="organization"
                  value={facturaData.razonSocial}
                  onChange={(e) =>
                    setFacturaData((prev) => ({ ...prev, razonSocial: e.target.value }))
                  }
                  placeholder="Cafetería & Hotel SpA"
                  className="w-full min-h-10 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Giro Comercial *</label>
                <input
                  type="text"
                  value={facturaData.giro}
                  onChange={(e) => setFacturaData((prev) => ({ ...prev, giro: e.target.value }))}
                  placeholder="Servicios gastronómicos / Comercio"
                  className="w-full min-h-10 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Dirección Tributaria</label>
                <input
                  type="text"
                  value={facturaData.direccion}
                  onChange={(e) => setFacturaData((prev) => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Opcional (si difiere de despacho)"
                  className="w-full min-h-10 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. SECCIÓN PAGO SEGURO */}
      <section className="space-y-3">
        <h4 className="tienda-replenishment-section-label">
          <span className="inline-flex items-center gap-2">
            <CreditCard size={14} className="text-accent" />
            {tSheet('payment')}
          </span>
        </h4>
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-sm space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent" />
            <p className="text-xs sm:text-sm font-semibold text-foreground">Webpay o Flow</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            El cobro recurrente se procesa de forma segura a través de pasarelas bancarias autorizadas. No almacenamos datos de tarjeta en nuestros servidores.
          </p>
        </div>
      </section>

      {/* 7. SECCIÓN RESUMEN COMPLETO */}
      <section className="rounded-2xl border border-border bg-secondary/20 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <h4 className="tienda-replenishment-section-label">Resumen de Reposición</h4>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent">
            <CheckCircle2 size={13} />
            <span>Confirmación Lista</span>
          </span>
        </div>

        <dl className="space-y-2.5 text-xs sm:text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Producto</dt>
            <dd className="text-foreground text-right font-medium">
              {product.name} × {quantity} {quantity === 1 ? 'unidad' : 'unidades'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Intervalo</dt>
            <dd className="text-foreground text-right font-medium">{cadenceLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Primera entrega</dt>
            <dd className="text-foreground text-right font-medium text-accent">
              {formatDeliveryDate(firstDeliveryDate)}
            </dd>
          </div>
          {address ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Destino</dt>
              <dd className="text-foreground text-right font-medium max-w-[60%] truncate">
                {address}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Documento Tributario</dt>
            <dd className="text-foreground text-right font-medium">
              {tipoDte === 'boleta' ? 'Boleta Electrónica' : `Factura B2B (${facturaData.rut || 'RUT'})`}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-3">
            <dt className="text-foreground font-semibold">Total por ciclo</dt>
            <dd className="font-display text-base sm:text-lg text-accent font-bold">
              {formatCLP(cycleTotalPrice)}
            </dd>
          </div>
        </dl>
      </section>
    </TiendaModal>
  );
}
