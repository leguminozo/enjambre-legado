'use client';

import { useEffect, useRef } from 'react';
import type gsap from 'gsap';
import Link from 'next/link';
import { useCartLines, useCartPricing } from '@/components/shop/cart-context';
import { useState } from 'react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { alignToClass } from '@/lib/shop/store-chrome';
import { CheckoutCinematicOverlay } from '@/components/shop/checkout-cinematic-overlay';
import { Lock, Shield, Truck, CheckCircle, Leaf, Trees, User, EyeOff, Star, Tag, MapPin, RotateCcw, Sparkles, ChevronDown } from 'lucide-react';
import {
  DEFAULT_COURIER,
  getCheckoutCourierOptions,
  getCourier,
  type CourierCode,
} from '@enjambre/logistica';
import { HexagonLoader, formatCLP } from '@enjambre/ui';
import {
  friendlyCheckoutApiMessage,
  isCheckoutShippingReady,
  shouldBlockCheckoutPayment,
} from '@/lib/shop/checkout-errors';
import { usePwaStandalone } from '@/lib/hooks/use-pwa-standalone';
import { startCartCheckout } from '@/lib/shop/cart-checkout-client';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';
import { useAuth } from '@/components/providers/auth-context';
import { useLoyaltyPoints } from '@/lib/hooks/use-loyalty-points';
import { useCartAbandonmentTracking } from '@/lib/hooks/use-cart-abandonment';
import { CHECKOUT_RESULTADO_PATH } from '@/lib/shop/store-routes';
import {
  CREATOR_REF_CODE_KEY,
  PENDING_CHECKOUT_STORAGE_KEY,
  PURCHASE_SNAPSHOT_STORAGE_KEY,
  writeCommerceStorage,
} from '@/lib/shop/commerce-storage';
import { useMetaTracking } from '@/lib/tracking/client';
import { getDirecciones } from '@/app/actions/direcciones';
import type { ClienteDireccion } from '@/lib/shop/direcciones-schema';
import { validarRUT, formatearRUT } from '@/lib/shop/rut';

type BuyerMode = 'legado' | 'privada';

type ShippingForm = {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  region: string;
  codigoPostal: string;
  instrucciones: string;
};

const REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble',
  'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
];

const initialShipping: ShippingForm = {
  nombre: '',
  email: '',
  telefono: '',
  direccion: '',
  comuna: '',
  ciudad: '',
  region: '',
  codigoPostal: '',
  instrucciones: '',
};

function fieldError(form: ShippingForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (form.nombre.trim().length < 2) e.nombre = 'Nombre requerido';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
  if (form.telefono.trim().length < 8) e.telefono = 'Teléfono requerido';
  if (form.direccion.trim().length < 5) e.direccion = 'Dirección requerida';
  if (form.comuna.trim().length < 2) e.comuna = 'Comuna requerida';
  if (form.ciudad.trim().length < 2) e.ciudad = 'Ciudad requerida';
  if (form.region.trim().length < 2) e.region = 'Región requerida';
  return e;
}

export function CheckoutClient() {
  const { lines } = useCartLines();
  const { pricing, isLoading: pricingLoading, pricingError } = useCartPricing();
  const { isAuthenticated, user } = useAuth();
  const track = useMetaTracking();
  // Copy del checkout editable desde el Editor de Tienda (checkout_settings)
  const { checkout } = useStoreChrome();
  useCartAbandonmentTracking(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceConflicts, setPriceConflicts] = useState<string[] | null>(null);
  const [shipping, setShipping] = useState<ShippingForm>(initialShipping);
  const [courierCode, setCourierCode] = useState<CourierCode>(DEFAULT_COURIER);
  const [touched, setTouched] = useState(false);
  const [buyerMode, setBuyerMode] = useState<BuyerMode>('privada');
  const [usarPuntos, setUsarPuntos] = useState(false);
  const [retornoActivo, setRetornoActivo] = useState(false);
  const [frascosARetornar, setFrascosARetornar] = useState(1);
  const [codigoDescuento, setCodigoDescuento] = useState('');
  const [codigoAplicado, setCodigoAplicado] = useState<string | null>(null);
  const [codigoCreador, setCodigoCreador] = useState('');
  const [creadorAplicado, setCreadorAplicado] = useState<string | null>(null);

  // Prefill embajador ref capturado en catálogo (?ref= / ?codigo=) → canal de creador
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(CREATOR_REF_CODE_KEY)?.trim();
      if (stored && stored.length >= 2) {
        setCodigoCreador(stored);
        setCreadorAplicado(stored.toUpperCase());
      }
    } catch {
      // ignore
    }
  }, []);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<ClienteDireccion[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Documento Tributario (Boleta vs Factura Electrónica B2B)
  const [tipoDte, setTipoDte] = useState<'boleta' | 'factura'>('boleta');
  const [facturaData, setFacturaData] = useState({
    rut: '',
    razonSocial: '',
    giro: '',
    direccion: '',
    comuna: '',
  });

  // Autocompletar datos de empresa si el usuario tiene revendedor_profile activo
  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: revendedor } = await supabase
          .from('revendedor_profile')
          .select('razon_social, rut, tipo_negocio, direccion')
          .eq('user_id', user.id)
          .maybeSingle();

        if (revendedor) {
          setFacturaData((prev) => ({
            ...prev,
            rut: revendedor.rut || prev.rut,
            razonSocial: revendedor.razon_social || prev.razonSocial,
            giro: revendedor.tipo_negocio || prev.giro,
            direccion: revendedor.direccion || prev.direccion,
          }));
          setTipoDte('factura');
        }
      } catch {
        // fail-soft
      }
    })();
  }, [user]);

  const [quote, setQuote] = useState<{
    subtotal: number;
    discountClp: number;
    shippingCost: number;
    loyaltyDiscountClp: number;
    creadorDiscountClp: number;
    total: number;
    retornoReward?: {
      count: number;
      puntosBase: number;
      puntosBono: number;
      totalPuntos: number;
      totalCiclos: number;
      lotesDe10: number;
      valorEquivalenteClp: number;
    };
  } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const subtotalCompra = pricing?.subtotal ?? pricing?.total ?? 0;
  const totalCompra = quote?.total ?? pricing?.total ?? 0;
  const shippingCost = quote?.shippingCost ?? 0;
  const promoDiscount = quote?.discountClp ?? 0;
  const creadorDiscountClp = quote?.creadorDiscountClp ?? 0;
  const {
    loyaltyData,
    loading: loyaltyLoading,
    error: loyaltyError,
    puntosACanjear,
    setPuntosACanjear,
    descuentoPorPuntos,
    canMaxPoints,
    redemptionConfig,
  } = useLoyaltyPoints(subtotalCompra - promoDiscount);
  const isPwa = usePwaStandalone();
  const [redirectStalled, setRedirectStalled] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);

  useEffect(() => {
    if (!pricing || subtotalCompra <= 0) {
      setQuote(null);
      return;
    }

    const region = shipping.region.trim();
    if (region.length < 2) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    const controller = new AbortController();
    const NUCLEO_URL = getNucleoApiUrl();
    if (!NUCLEO_URL) {
      setQuoteError('Pago no disponible. Intenta en unos minutos.');
      setQuoteLoading(false);
      return;
    }

    const fetchQuote = async () => {
      setQuoteLoading(true);
      setQuoteError(null);

      try {
        let token: string | undefined;
        if (isAuthenticated) {
          const { createClient } = await import('@/utils/supabase/client');
          const supabase = createClient();
          // getUser() validates JWT with Supabase Auth server
          await supabase.auth.getUser();
          const { data: sessionData } = await supabase.auth.getSession();
          token = sessionData?.session?.access_token;
        }

        const res = await fetch(`${NUCLEO_URL}/api/checkout/quote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            subtotal: subtotalCompra,
            region,
            courierCode,
            codigoDescuento: codigoAplicado ?? undefined,
            codigoCreador: creadorAplicado ?? undefined,
            puntosACanjear: usarPuntos ? puntosACanjear : 0,
            retornoFrascosDeclarados: retornoActivo ? frascosARetornar : 0,
          }),
          signal: controller.signal,
        });

        const json = (await res.json()) as {
          code?: string;
          subtotal?: number;
          discountClp?: number;
          shippingCost?: number;
          loyaltyDiscountClp?: number;
          descuentoCreadorClp?: number;
          total?: number;
          message?: string;
          retornoReward?: {
            count: number;
            puntosBase: number;
            puntosBono: number;
            totalPuntos: number;
            totalCiclos: number;
            lotesDe10: number;
            valorEquivalenteClp: number;
          };
        };

        if (!res.ok) {
          const friendly = friendlyCheckoutApiMessage(json.code, json.message, 'quote');
          const promoInvalid =
            codigoAplicado &&
            (json.message?.toLowerCase().includes('descuento') ||
              json.message?.toLowerCase().includes('código') ||
              json.message?.toLowerCase().includes('codigo') ||
              json.message?.toLowerCase().includes('discount'));
          if (promoInvalid) {
            setCodigoAplicado(null);
          }
          if (json.code === 'invalid_creador_code') {
            setCreadorAplicado(null);
          }
          setQuoteError(friendly);
          setQuote(null);
          return;
        }

        setQuote({
          subtotal: json.subtotal ?? subtotalCompra,
          discountClp: json.discountClp ?? 0,
          shippingCost: json.shippingCost ?? 0,
          loyaltyDiscountClp: json.loyaltyDiscountClp ?? 0,
          creadorDiscountClp: json.descuentoCreadorClp ?? 0,
          total: json.total ?? subtotalCompra,
          retornoReward: json.retornoReward,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setQuoteError('No se pudo calcular envío y descuentos');
        }
      } finally {
        setQuoteLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void fetchQuote();
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [
    pricing,
    subtotalCompra,
    shipping.region,
    courierCode,
    codigoAplicado,
    creadorAplicado,
    usarPuntos,
    puntosACanjear,
    retornoActivo,
    frascosARetornar,
    isAuthenticated,
  ]);

  const applyPromoCode = () => {
    const code = codigoDescuento.trim();
    if (code.length < 2) {
      setQuoteError('Ingresa un código válido');
      return;
    }
    setQuoteError(null);
    setCodigoAplicado(code.toUpperCase());
  };

  const applyCreadorCode = () => {
    const code = codigoCreador.trim().toUpperCase();
    if (code.length < 2) {
      setQuoteError('Ingresa un código de creador válido');
      return;
    }
    setQuoteError(null);
    setCreadorAplicado(code);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      setBuyerMode('legado');
      setShipping((prev) => ({
        ...prev,
        email: prev.email || user.email,
        nombre: prev.nombre || user.name,
      }));

      void (async () => {
        try {
          const { createClient } = await import('@/utils/supabase/client');
          const supabase = createClient();
          // Preferencia de courier y direcciones son independientes: en paralelo (antes en cascada)
          const [profileResult, direcciones] = await Promise.all([
            supabase.from('profiles').select('courier_preferido').eq('id', user.id).maybeSingle(),
            getDirecciones(),
          ]);
          const profile = profileResult.data;
          if (profile?.courier_preferido) {
            setCourierCode(profile.courier_preferido as CourierCode);
          }

          setSavedAddresses(direcciones);

          const defaultAddr = direcciones.find(d => d.es_predeterminada) || direcciones[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setShipping((prev) => ({
              ...prev,
              nombre: defaultAddr.nombre,
              telefono: defaultAddr.telefono,
              direccion: defaultAddr.direccion,
              comuna: defaultAddr.comuna,
              ciudad: defaultAddr.ciudad,
              region: defaultAddr.region,
              codigoPostal: defaultAddr.codigo_postal ?? '',
              instrucciones: defaultAddr.instrucciones ?? '',
            }));
          }
        } catch {
          // Mantener BlueExpress si no se puede leer preferencia
        }
      })();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    let ctx: gsap.Context | undefined;
    let cancelled = false;
    (async () => {
      const { gsap } = await import('gsap');
      if (cancelled) return;
      ctx = gsap.context(() => {
        gsap.from('.checkout-section', {
          opacity: 0,
          y: 40,
          duration: 1.2,
          stagger: 0.2,
          ease: 'power3.out',
        });
        
        gsap.from('.form-field', {
          opacity: 0,
          x: -20,
          duration: 0.8,
          stagger: 0.05,
          ease: 'power2.out',
        });
        
        gsap.from('.checkout-button', {
          opacity: 0,
          scale: 0.95,
          duration: 0.6,
          ease: 'back.out(1.7)',
          delay: 0.8,
        });
      }, formRef);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  const validationErrors = touched ? fieldError(shipping) : {};
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const paymentBlocked = shouldBlockCheckoutPayment(shipping.region, {
    quoteLoading,
    quote,
    quoteError,
  });
  const shippingReady = isCheckoutShippingReady(shipping);
  const payDisabled = loading || !pricing || paymentBlocked || !shippingReady || !terminosAceptados;

  useEffect(() => {
    if (!loading) {
      setRedirectStalled(false);
      return;
    }
    const timer = window.setTimeout(() => setRedirectStalled(true), 18000);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const startCheckout = async () => {
    setTouched(true);
    const ve = fieldError(shipping);
    if (Object.keys(ve).length > 0) {
      setError('Completa todos los campos de envío requeridos.');
      const firstKey = Object.keys(ve)[0];
      const el = document.getElementById(firstKey);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }

    setLoading(true);
    setError(null);
    setPriceConflicts(null);

    const payloadCart =
      pricing?.line_items.map((l) => ({
        productId: l.product_id,
        slug: l.slug,
        name: l.name,
        unitPrice: l.unit_price,
        quantity: l.quantity,
      })) ?? [];

    if (tipoDte === 'factura') {
      const cleanRut = facturaData.rut.trim();
      if (!cleanRut || !validarRUT(cleanRut)) {
        setError('Por favor ingresa un RUT de empresa válido con dígito verificador (ej. 76.350.040-3).');
        const el = document.getElementById('factura-rut');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
        setLoading(false);
        return;
      }
      if (!facturaData.razonSocial.trim() || facturaData.razonSocial.trim().length < 2) {
        setError('Por favor ingresa la Razón Social de la empresa para la Factura Electrónica.');
        const el = document.getElementById('factura-razonSocial');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
        setLoading(false);
        return;
      }
    }

    const result = await startCartCheckout(payloadCart, shipping, {
      buyerMode,
      courierCode,
      puntosACanjear: usarPuntos ? puntosACanjear : 0,
      codigoDescuento: codigoAplicado ?? undefined,
      codigoCreador: creadorAplicado ?? undefined,
      retornoFrascosDeclarados: retornoActivo ? frascosARetornar : 0,
      returnUrl: `${window.location.origin}${CHECKOUT_RESULTADO_PATH}`,
      puntosGanadosEstimados: loyaltyData?.puntos_ganados_compra,
      billing: {
        tipoDte,
        rut: facturaData.rut.trim() || undefined,
        razonSocial: facturaData.razonSocial.trim() || undefined,
        giro: facturaData.giro.trim() || undefined,
        direccion: facturaData.direccion.trim() || undefined,
      },
    });

    if (!result.ok) {
      if (result.priceConflict) {
        setPriceConflicts(result.priceConflict.details);
      }
      setError(result.message);
      setLoading(false);
      return;
    }

    // Tracking Meta: InitiateCheckout + snapshot para el Purchase (resultado).
    // El snapshot valida buyOrder al confirmar; el facade gatea por consentimiento.
    try {
      const rawPending = sessionStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY);
      if (rawPending) {
        const pending = JSON.parse(rawPending) as { buyOrder?: string };
        const buyOrder = pending.buyOrder;
        if (buyOrder) {
          const items = (pricing?.line_items ?? []).map((l) => ({
            id: l.product_id,
            quantity: l.quantity,
            itemPrice: l.unit_price,
            name: l.name,
            slug: l.slug,
          }));
          const snapshot = {
            buyOrder,
            email: shipping.email,
            nombre: shipping.nombre,
            direccion: shipping.direccion,
            comuna: shipping.comuna,
            ciudad: shipping.ciudad,
            region: shipping.region,
            courier: getCourier(courierCode).label,
            total: totalCompra,
            subtotal: subtotalCompra,
            shippingCost,
            items,
          };
          writeCommerceStorage(PURCHASE_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
          track({
            eventName: 'InitiateCheckout',
            value: Math.round(totalCompra),
            currency: 'CLP',
            contents: items,
            contentIds: items.map((i) => i.id),
            numItems: items.reduce((sum, i) => sum + i.quantity, 0),
            email: shipping.email,
          });
        }
      }
    } catch (err) {
      // El tracking nunca debe interrumpir el checkout
      if (process.env.NODE_ENV !== 'production') {
        console.error('[tracking] InitiateCheckout falló', err);
      }
    }

    // gsap dinámico: feedback táctil del botón sin arrastrar el chunk al shell
    const { gsap } = await import('gsap');
    gsap.to(buttonRef.current, {
      scale: 0.98,
      duration: 0.2,
    });
  };

  const updateField = (key: keyof ShippingForm, value: string) => {
    setShipping((prev) => ({ ...prev, [key]: value }));
  };

  const inputCls = (key: keyof ShippingForm) =>
    `w-full min-h-[44px] rounded-lg border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all ${
      validationErrors[key] ? 'border-destructive' : 'border-border'
    }`;

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[60vh] bg-background pb-32 md:pb-16 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="enj-blur-orb absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
          <div className="enj-blur-orb absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="border-b border-border px-4 pt-[max(2rem,calc(var(--safe-top)+0.75rem))] pb-8 sm:px-6 sm:py-10 relative z-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-accent/10 flex items-center justify-center">
                <Leaf className="h-5 w-5 text-accent" aria-hidden />
              </div>
              <h1 className="font-display text-[clamp(1.5rem,5vw,2.25rem)] font-semibold text-foreground text-balance sm:text-3xl md:text-4xl leading-tight">
                {checkout.title && !checkout.title.toLowerCase().includes('checkout') ? checkout.title : 'Pago Seguro'}
              </h1>
            </div>
            {checkout.subtitle.trim() ? (
              <p className={`text-sm sm:text-base text-muted-foreground text-pretty max-w-2xl leading-relaxed whitespace-pre-line ${alignToClass(checkout.text_align)}`}>
                {checkout.subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 relative z-10 space-y-8 sm:space-y-10" ref={formRef}>
          {pricingError && !pricingLoading ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center">
              <p className="text-destructive mb-4">{pricingError}</p>
              <Link href="/catalogo" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent-text underline hover:text-accent/80 transition-colors">
                Volver al catálogo
              </Link>
            </div>
          ) : pricingLoading || !pricing ? (
            <div className="rounded-xl border border-border bg-card/50 p-8 text-center animate-pulse">
              <Trees className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">Calculando beneficios y disponibilidad...</p>
            </div>
          ) : lines.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
              <Trees className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Tu carrito está vacío.</p>
              <Link href="/catalogo" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent-text underline hover:text-accent/80 transition-colors">
                Explorar creaciones
              </Link>
            </div>
          ) : (
            <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:items-start lg:space-y-0">
              <aside className="min-w-0 lg:order-2 lg:sticky lg:top-24">
                {/* Unified Cart Summary & Instant Pay Card */}
                <section className="checkout-section rounded-2xl border border-accent/30 bg-card/60 p-5 space-y-4 shadow-sm backdrop-blur-sm" ref={summaryRef}>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      Tu pedido
                    </h2>
                    <span className="text-xs text-muted-foreground">{pricing.line_items.length} {pricing.line_items.length === 1 ? 'producto' : 'productos'}</span>
                  </div>

                  <ul className="divide-y divide-border/40 max-h-44 overflow-y-auto pr-1">
                    {pricing.line_items.map((line) => (
                      <li key={line.product_id} className="flex justify-between gap-3 py-2 text-xs">
                        <span className="text-foreground/90">
                          <span className="font-medium">{line.name}</span>
                          <span className="text-muted-foreground"> × {line.quantity}</span>
                        </span>
                        <span className="shrink-0 font-medium tabular-nums text-foreground">
                          {formatCLP(line.line_total)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Entrada ágil de Códigos de Descuento y Embajadores */}
                  <div className="pt-2 border-t border-border/40">
                    <details className="group" open={Boolean(codigoAplicado || creadorAplicado)}>
                      <summary className="flex cursor-pointer items-center justify-between text-xs text-accent-text hover:text-accent list-none py-1 [&::-webkit-details-marker]:hidden">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Tag className="h-3.5 w-3.5 text-accent" />
                          {codigoAplicado || creadorAplicado ? 'Código de beneficio activo' : '¿Tienes un código de descuento o creador?'}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="pt-2 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={codigoDescuento}
                            onChange={(e) => setCodigoDescuento(e.target.value.toUpperCase())}
                            placeholder="Código promocional"
                            className="flex-1 min-h-9 rounded-lg border border-border bg-secondary px-3 text-xs uppercase tracking-wider text-foreground focus:outline-none focus:border-accent/50 font-mono"
                          />
                          <button
                            type="button"
                            onClick={applyPromoCode}
                            className="min-h-9 px-3 rounded-lg border border-accent/40 text-xs font-semibold text-accent-text hover:bg-accent/10 transition-colors"
                          >
                            Aplicar
                          </button>
                        </div>
                        {codigoAplicado && (
                          <div className="flex items-center justify-between text-[11px] text-accent-text bg-accent/10 px-2.5 py-1 rounded-md">
                            <span>Promoción: {codigoAplicado}</span>
                            <button
                              type="button"
                              className="underline hover:text-accent font-medium"
                              onClick={() => {
                                setCodigoAplicado(null);
                                setCodigoDescuento('');
                              }}
                            >
                              Quitar
                            </button>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={codigoCreador}
                            onChange={(e) => setCodigoCreador(e.target.value.toUpperCase())}
                            placeholder="Código de embajador / creador"
                            className="flex-1 min-h-9 rounded-lg border border-border bg-secondary px-3 text-xs uppercase tracking-wider text-foreground focus:outline-none focus:border-accent/50 font-mono"
                          />
                          <button
                            type="button"
                            onClick={applyCreadorCode}
                            className="min-h-9 px-3 rounded-lg border border-accent/40 text-xs font-semibold text-accent-text hover:bg-accent/10 transition-colors"
                          >
                            Aplicar
                          </button>
                        </div>
                        {creadorAplicado && (
                          <div className="flex items-center justify-between text-[11px] text-accent-text bg-accent/10 px-2.5 py-1 rounded-md">
                            <span>Creador: {creadorAplicado}</span>
                            <button
                              type="button"
                              className="underline hover:text-accent font-medium"
                              onClick={() => {
                                setCreadorAplicado(null);
                                setCodigoCreador('');
                              }}
                            >
                              Quitar
                            </button>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>

                  <div className="pt-3 border-t border-border/60 space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="tabular-nums font-mono">{formatCLP(subtotalCompra)}</span>
                    </div>
                    {pricing.discount_amount > 0 && (
                      <div className="flex justify-between text-accent-text">
                        <span>Descuento Guardianía</span>
                        <span className="tabular-nums font-mono">-{formatCLP(pricing.discount_amount)}</span>
                      </div>
                    )}
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-accent-text">
                        <span>Código promocional</span>
                        <span className="tabular-nums font-mono">-{formatCLP(promoDiscount)}</span>
                      </div>
                    )}
                    {creadorDiscountClp > 0 && (
                      <div className="flex justify-between text-accent-text">
                        <span>Código de creador</span>
                        <span className="tabular-nums font-mono">-{formatCLP(creadorDiscountClp)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Envío ({getCourier(courierCode).shortLabel})</span>
                      <span className="tabular-nums font-mono">
                        {quoteLoading && !quote
                          ? '…'
                          : !quote
                            ? 'Por calcular'
                            : shippingCost === 0
                              ? 'Gratis'
                              : formatCLP(shippingCost)}
                      </span>
                    </div>
                    {!quote && !quoteLoading && !quoteError ? (
                      <p className="text-[11px] text-muted-foreground/80">
                        Se calcula al ingresar tu región de despacho.
                      </p>
                    ) : null}
                    {usarPuntos && (quote?.loyaltyDiscountClp ?? descuentoPorPuntos) > 0 && (
                      <div className="flex justify-between text-accent-text">
                        <span>Puntos canjeados</span>
                        <span className="tabular-nums font-mono">
                          -{formatCLP(quote?.loyaltyDiscountClp ?? descuentoPorPuntos)}
                        </span>
                      </div>
                    )}

                    {tipoDte === 'factura' && totalCompra > 0 && (
                      <div className="pt-2 border-t border-border/40 space-y-1 text-[11px] text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Neto Facturable (19% IVA):</span>
                          <span className="font-mono">{formatCLP(Math.round(totalCompra / 1.19))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IVA Débito Fiscal (19%):</span>
                          <span className="font-mono">{formatCLP(totalCompra - Math.round(totalCompra / 1.19))}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total Card */}
                  <div className="pt-3 border-t border-accent/30 flex items-center justify-between">
                    <div>
                      <span className="font-display text-base font-semibold text-foreground block">
                        {tipoDte === 'factura' ? 'Total Factura' : 'Total a pagar'}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {tipoDte === 'factura' ? 'IVA 19% Desglosado DTE 33' : 'Incluye IVA'}
                        {!quote && !quoteLoading && !quoteError ? ' · Más envío' : ''}
                      </span>
                      {quoteError && (
                        <span className="text-[11px] text-destructive block">{quoteError}</span>
                      )}
                    </div>
                    <span
                      data-testid="checkout-total"
                      className="font-display text-2xl font-bold tabular-nums text-accent-text"
                    >
                      {quoteLoading && !quote ? '…' : formatCLP(totalCompra)}
                    </span>
                  </div>

                  {/* Terms & Conditions */}
                  <label className="flex items-start gap-2.5 pt-1 cursor-pointer text-[11px] text-muted-foreground leading-tight">
                    <input
                      type="checkbox"
                      checked={terminosAceptados}
                      onChange={(e) => setTerminosAceptados(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-border bg-surface text-accent-text focus:ring-accent"
                    />
                    <span>
                      {checkout.terms_prefix}{' '}
                      <Link
                        href="/terminos"
                        target="_blank"
                        className="text-accent underline underline-offset-2 hover:text-accent/80"
                      >
                        Términos y Política de Retracto (10 días)
                      </Link>
                    </span>
                  </label>

                  {/* Pay button — DIRECTLY UNDER TOTAL! */}
                  <button
                    ref={buttonRef}
                    type="button"
                    className="checkout-button w-full min-h-12 flex items-center justify-center rounded-full bg-primary py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    disabled={payDisabled}
                    title={
                      !shippingReady
                        ? 'Completa los datos de envío'
                        : paymentBlocked && quoteError
                          ? quoteError
                          : paymentBlocked && quoteLoading
                            ? 'Calculando envío y descuentos…'
                            : undefined
                    }
                    onClick={() => void startCheckout()}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <HexagonLoader size="sm" className="text-primary-foreground" />
                        Conectando con la pasarela…
                      </span>
                    ) : paymentBlocked && quoteLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <HexagonLoader size="sm" className="text-primary-foreground" />
                        Calculando total…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Lock className="h-4 w-4" />
                        Pagar ahora — ${totalCompra.toLocaleString('es-CL')}
                      </span>
                    )}
                  </button>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground/80 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Lock className="h-3 w-3 text-accent" aria-hidden />
                      {checkout.secure_payment_text}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3 w-3 text-accent" aria-hidden />
                      {checkout.secure_transaction_text}
                    </span>
                  </div>

                  {error ? (
                    <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive/90">
                      {error}
                    </p>
                  ) : null}

                  {priceConflicts && (
                    <div className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning">
                      <p className="font-medium mb-1">Productos con cambios:</p>
                      <ul className="list-disc pl-4">
                        {priceConflicts.map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                      </ul>
                      <p className="mt-1">Vuelve al catálogo para actualizar precios.</p>
                    </div>
                  )}
                </section>
              </aside>
              <div className="space-y-8 sm:space-y-10 min-w-0 lg:order-1">

              {/* Paso 1: Tu compra (Identificación) */}
              <section className="checkout-section">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-accent" />
                  <h2 className="font-display text-lg text-foreground">Tu compra</h2>
                </div>
                {isAuthenticated ? (
                  <div className="rounded-2xl border border-accent/40 bg-surface-raised/90 p-5 backdrop-blur-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-accent/20 flex items-center justify-center text-accent-text font-display font-semibold text-base">
                          {(user?.name || user?.email || 'G')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              Comprando como {user?.name || user?.email}
                            </p>
                            {loyaltyData?.nivel_actual && (
                              <span className="text-[10px] bg-accent/20 text-accent-text px-2 py-0.5 rounded-full font-medium capitalize">
                                {loyaltyData.nivel_actual}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {buyerMode === 'legado'
                              ? `Vinculado a tu Billetera: ganarás +${(loyaltyData?.puntos_ganados_compra ?? Math.round(subtotalCompra / 100)).toLocaleString('es-CL')} puntos con este pedido.`
                              : 'Modo compra privada: esta compra no se registrará en tu perfil.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBuyerMode(buyerMode === 'legado' ? 'privada' : 'legado')}
                        className="text-xs text-accent-text underline underline-offset-2 hover:text-accent self-start sm:self-auto min-h-[44px] inline-flex items-center shrink-0"
                      >
                        {buyerMode === 'legado' ? 'Cambiar a compra privada' : 'Vincular a mi cuenta'}
                      </button>
                    </div>

                    {/* Canje de Puntos Legado directo en la identidad del usuario */}
                    {buyerMode === 'legado' && loyaltyData && loyaltyData.puntos > 0 && (
                      <div className="pt-3 border-t border-border/60">
                        <div className="rounded-xl border border-accent/30 bg-surface-sunken p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-accent fill-accent/20" />
                              <span className="text-xs font-semibold text-foreground">
                                {loyaltyData.puntos.toLocaleString('es-CL')} Puntos Legado disponibles
                              </span>
                            </div>
                            <span className="text-xs font-mono text-accent-text font-semibold">
                              Hasta ${loyaltyData.descuento_disponible.toLocaleString('es-CL')} CLP
                            </span>
                          </div>

                          <label className="flex items-center gap-3 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={usarPuntos}
                              onChange={(e) => {
                                setUsarPuntos(e.target.checked);
                                if (e.target.checked) {
                                  setPuntosACanjear(canMaxPoints);
                                } else {
                                  setPuntosACanjear(0);
                                }
                              }}
                              className="h-4 w-4 shrink-0 rounded border-border bg-surface text-accent focus:ring-accent"
                            />
                            <span className="text-foreground font-medium">
                              Canjear puntos para descontar en este pedido
                            </span>
                          </label>

                          {usarPuntos && (
                            <div className="space-y-2 pt-2 border-t border-border/40 animate-in fade-in duration-200">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Puntos a canjear: <strong className="text-foreground font-mono">{puntosACanjear.toLocaleString('es-CL')}</strong></span>
                                <span className="text-accent font-semibold font-mono">-${descuentoPorPuntos.toLocaleString('es-CL')} CLP</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max={canMaxPoints}
                                step={redemptionConfig?.pointsPerBlock ?? 100}
                                value={puntosACanjear}
                                onChange={(e) => setPuntosACanjear(Number(e.target.value))}
                                className="w-full h-1.5 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setBuyerMode('privada')}
                      className={`min-h-11 rounded-2xl border p-5 text-left transition-all ${
                        buyerMode === 'privada'
                          ? 'border-accent bg-accent/5'
                          : 'border-border bg-card/40 hover:border-accent/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                        <p className="font-display text-sm font-semibold text-foreground">{checkout.buyer_private_label}</p>
                      </div>
                      {checkout.buyer_private_desc.trim() ? (
                        <p className={`text-xs text-muted-foreground leading-relaxed whitespace-pre-line ${alignToClass(checkout.text_align)}`}>
                          {checkout.buyer_private_desc}
                        </p>
                      ) : null}
                    </button>

                    <div className="rounded-2xl border border-accent/30 bg-card/40 p-5 text-left flex flex-col justify-between hover:border-accent/50 transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-4 w-4 text-accent fill-accent/20" />
                          <p className="font-display text-sm font-semibold text-foreground">
                            {checkout.buyer_legacy_label || 'Continuar mi legado'}
                          </p>
                        </div>
                        <p className="text-xs text-accent-text font-medium mb-1.5 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-accent" />
                          Ganas +{Math.round(subtotalCompra / 100).toLocaleString('es-CL')} Puntos Legado con esta compra
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Acumula saldo en tu Billetera, accede a certificados de origen y despacha con direcciones guardadas.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-3 text-xs">
                        <Link
                          href="/login?returnTo=/checkout"
                          className="font-semibold text-accent-text hover:text-accent underline underline-offset-2 min-h-11 inline-flex items-center"
                        >
                          Iniciar sesión
                        </Link>
                        <span className="text-muted-foreground">·</span>
                        <Link
                          href="/register?returnTo=/checkout"
                          className="font-semibold text-foreground hover:text-accent underline underline-offset-2 min-h-11 inline-flex items-center"
                        >
                          Crear cuenta en 1 clic
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Paso 2: Despacho y Dirección */}
              <section className="checkout-section">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5 text-accent" />
                  <h2 className="font-display text-lg text-foreground">{checkout.shipping_title}</h2>
                </div>
                <div className="rounded-xl border border-border bg-card/40 p-6 space-y-4">
                  <div className="form-field">
                    <label className="block text-xs text-muted-foreground mb-1">
                      {checkout.courier_label && !checkout.courier_label.toLowerCase().includes('courier') ? checkout.courier_label : 'Operador de Despacho'}
                    </label>
                    <select
                      id="courier"
                      name="courier"
                      className="w-full min-h-11 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                      value={courierCode}
                      onChange={(e) => setCourierCode(e.target.value as CourierCode)}
                    >
                      {getCheckoutCourierOptions().map((courier) => (
                        <option key={courier.code} value={courier.code}>
                          {courier.label}
                          {courier.code === DEFAULT_COURIER ? ' — predeterminado' : ''}
                        </option>
                      ))}
                    </select>
                    {checkout.shipping_note.trim() ? (
                      <p className={`text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line ${alignToClass(checkout.text_align)}`}>
                        {checkout.shipping_note}
                      </p>
                    ) : null}
                    {courierCode === 'retiro_tienda' && (
                      <p className="text-xs text-accent-text mt-2">
                        Te avisaremos cuando tu pedido esté listo para retiro.
                      </p>
                    )}
                    {getCourier(courierCode).integracionApi && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Seguimiento integrado con {getCourier(courierCode).shortLabel}.
                      </p>
                    )}
                  </div>
                  
                  {savedAddresses.length > 0 && buyerMode === 'legado' && (
                    <div className="form-field space-y-3 pt-4 border-t border-border">
                      <label className="block text-sm text-foreground font-medium mb-2">Mis Direcciones Guardadas</label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              setShipping((prev) => ({
                                ...prev,
                                nombre: addr.nombre,
                                telefono: addr.telefono,
                                direccion: addr.direccion,
                                comuna: addr.comuna,
                                ciudad: addr.ciudad,
                                region: addr.region,
                                codigoPostal: addr.codigo_postal ?? '',
                                instrucciones: addr.instrucciones ?? '',
                              }));
                            }}
                            className={`text-left min-h-11 p-4 rounded-xl border transition-all flex items-start gap-3 ${
                              selectedAddressId === addr.id 
                                ? 'border-accent bg-accent/5' 
                                : 'border-border bg-card hover:border-accent/40'
                            }`}
                          >
                            <MapPin className={`h-5 w-5 shrink-0 mt-0.5 ${selectedAddressId === addr.id ? 'text-accent-text' : 'text-muted-foreground'}`} />
                            <div>
                              <p className="font-display text-sm text-foreground flex items-center gap-2">
                                {addr.etiqueta}
                                {addr.es_predeterminada && (
                                  <span className="text-[10px] bg-accent/20 text-accent-text px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-semibold">Predeterminada</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {addr.direccion}, {addr.comuna}, {addr.region}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAddressId(null);
                          setShipping({
                            nombre: user?.name ?? '',
                            email: user?.email ?? '',
                            telefono: '',
                            direccion: '',
                            comuna: '',
                            ciudad: '',
                            region: '',
                            codigoPostal: '',
                            instrucciones: '',
                          });
                        }}
                        className="inline-flex min-h-11 items-center text-sm text-accent-text underline underline-offset-2 mt-1"
                      >
                        + Usar una dirección nueva
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">

                    <div className="sm:col-span-2 form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Nombre completo *</label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        autoComplete="name"
                        className={inputCls('nombre')}
                        value={shipping.nombre}
                        onChange={(e) => updateField('nombre', e.target.value)}
                        placeholder="Tu nombre"
                      />
                      {validationErrors.nombre && <p className="text-xs text-destructive mt-1">{validationErrors.nombre}</p>}
                    </div>
                    <div className="form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        autoComplete="email"
                        inputMode="email"
                        className={inputCls('email')}
                        value={shipping.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="tu@email.com"
                      />
                      {validationErrors.email && <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>}
                    </div>
                    <div className="form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Teléfono *</label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        autoComplete="tel"
                        inputMode="tel"
                        className={inputCls('telefono')}
                        value={shipping.telefono}
                        onChange={(e) => updateField('telefono', e.target.value)}
                        placeholder="+56 9 9123 4567"
                      />
                      {validationErrors.telefono && <p className="text-xs text-destructive mt-1">{validationErrors.telefono}</p>}
                    </div>
                    <div className="sm:col-span-2 form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Dirección *</label>
                      <input
                        type="text"
                        id="direccion"
                        name="direccion"
                        autoComplete="street-address"
                        className={inputCls('direccion')}
                        value={shipping.direccion}
                        onChange={(e) => updateField('direccion', e.target.value)}
                        placeholder="Calle, número, depto"
                      />
                      {validationErrors.direccion && <p className="text-xs text-destructive mt-1">{validationErrors.direccion}</p>}
                    </div>
                    <div className="form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Comuna *</label>
                      <input
                        type="text"
                        id="comuna"
                        name="comuna"
                        autoComplete="address-level2"
                        className={inputCls('comuna')}
                        value={shipping.comuna}
                        onChange={(e) => updateField('comuna', e.target.value)}
                        placeholder="Comuna"
                      />
                      {validationErrors.comuna && <p className="text-xs text-destructive mt-1">{validationErrors.comuna}</p>}
                    </div>
                    <div className="form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Ciudad *</label>
                      <input
                        type="text"
                        id="ciudad"
                        name="ciudad"
                        autoComplete="address-level2"
                        className={inputCls('ciudad')}
                        value={shipping.ciudad}
                        onChange={(e) => updateField('ciudad', e.target.value)}
                        placeholder="Ciudad"
                      />
                      {validationErrors.ciudad && <p className="text-xs text-destructive mt-1">{validationErrors.ciudad}</p>}
                    </div>
                    <div className="form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Región *</label>
                      <select
                        id="region"
                        name="region"
                        autoComplete="address-level1"
                        className={inputCls('region')}
                        value={shipping.region}
                        onChange={(e) => updateField('region', e.target.value)}
                      >
                        <option value="">Seleccionar región</option>
                        {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {validationErrors.region && <p className="text-xs text-destructive mt-1">{validationErrors.region}</p>}
                    </div>
                    <div className="form-field">
                      <label className="block text-xs text-muted-foreground mb-1">{checkout.postal_label}</label>
                      <input
                        type="text"
                        id="codigoPostal"
                        name="codigoPostal"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        className={inputCls('codigoPostal')}
                        value={shipping.codigoPostal}
                        onChange={(e) => updateField('codigoPostal', e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="sm:col-span-2 form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Instrucciones de entrega</label>
                      <textarea
                        id="instrucciones"
                        name="instrucciones"
                        className={inputCls('instrucciones')}
                        value={shipping.instrucciones}
                        onChange={(e) => updateField('instrucciones', e.target.value)}
                        placeholder="Casa con reja verde, dejar en portería..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Paso 3: Documento Tributario (Boleta / Factura B2B) */}
              <section className="rounded-2xl border border-border bg-card/40 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <h3 className="font-display text-base text-foreground font-semibold">Documento Tributario</h3>
                    <p className="text-xs text-muted-foreground">Selecciona si requieres Boleta o Factura con RUT de empresa</p>
                  </div>
                  <div className="flex items-center p-1 rounded-xl bg-secondary border border-border">
                    <button
                      type="button"
                      onClick={() => setTipoDte('boleta')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        tipoDte === 'boleta' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Boleta
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoDte('factura')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        tipoDte === 'factura' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Factura B2B
                    </button>
                  </div>
                </div>

                {tipoDte === 'factura' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-300">
                    <div className="form-field">
                      <label className="block text-xs text-muted-foreground mb-1">RUT Empresa *</label>
                      <input
                        id="factura-rut"
                        type="text"
                        value={facturaData.rut}
                        onChange={(e) => setFacturaData((prev) => ({ ...prev, rut: formatearRUT(e.target.value) }))}
                        placeholder="76.123.456-7"
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        className="w-full min-h-11 rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 font-mono"
                      />
                    </div>
                    <div className="form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Razón Social *</label>
                      <input
                        id="factura-razonSocial"
                        type="text"
                        autoComplete="organization"
                        value={facturaData.razonSocial}
                        onChange={(e) => setFacturaData((prev) => ({ ...prev, razonSocial: e.target.value }))}
                        placeholder="Cafetería & Hotel SpA"
                        className="w-full min-h-11 rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                      />
                    </div>
                    <div className="form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Giro Comercial *</label>
                      <input
                        type="text"
                        value={facturaData.giro}
                        onChange={(e) => setFacturaData((prev) => ({ ...prev, giro: e.target.value }))}
                        placeholder="Servicios gastronómicos / Comercio"
                        className="w-full min-h-11 rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                      />
                    </div>
                    <div className="form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Dirección Tributaria</label>
                      <input
                        type="text"
                        autoComplete="street-address"
                        value={facturaData.direccion}
                        onChange={(e) => setFacturaData((prev) => ({ ...prev, direccion: e.target.value }))}
                        placeholder="Av. Providencia 1234"
                        className="w-full min-h-11 rounded-lg border border-border bg-secondary px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Paso 4: Economía Circular Austral (Devolución de envases de vidrio) */}
              <section className="checkout-section">
                <div className="flex items-center gap-2 mb-4">
                  <RotateCcw className="h-5 w-5 text-accent" />
                  <div>
                    <h2 className="font-display text-lg text-foreground">Economía Circular Austral</h2>
                    <p className="text-xs text-muted-foreground">Devuelve tus envases de vidrio limpios al repartidor y acumula saldo en tu Billetera</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-accent/30 bg-card/40 p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        ¿Tienes envases de vidrio vacíos de Enjambre Legado?
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Entrégalos limpios y con tapa original al repartidor al recibir tu pedido. Se acreditarán Puntos Legado en tu Billetera digital tras la recepción física conforme en taller.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={retornoActivo}
                        onChange={(e) => setRetornoActivo(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-muted-foreground peer-checked:after:bg-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  {retornoActivo && (
                    <div className="pt-4 border-t border-border/50 space-y-4 animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Frascos que entregarás al repartidor:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFrascosARetornar((c) => Math.max(1, c - 1))}
                            className="h-9 w-9 rounded-lg border border-border bg-card flex items-center justify-center font-bold text-sm hover:border-accent text-foreground transition-colors"
                            aria-label="Restar un frasco"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-display text-lg font-bold text-foreground tabular-nums">
                            {frascosARetornar}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFrascosARetornar((c) => Math.min(20, c + 1))}
                            className="h-9 w-9 rounded-lg border border-border bg-card flex items-center justify-center font-bold text-sm hover:border-accent text-foreground transition-colors"
                            aria-label="Añadir un frasco"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => setFrascosARetornar(10)}
                            className={`ml-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                              frascosARetornar === 10
                                ? 'border-accent bg-accent/20 text-accent-text font-semibold'
                                : 'border-border bg-card text-muted-foreground hover:border-accent/50'
                            }`}
                          >
                            Pack 10 Frascos (+Bono)
                          </button>
                        </div>
                      </div>

                      {/* Estimación de recompensa */}
                      {(() => {
                        const lotes = Math.floor(frascosARetornar / 10);
                        const basePts = frascosARetornar * 50;
                        const bonoPts = lotes * 150;
                        const totalPts = basePts + bonoPts;
                        const clpEstimado = totalPts * 10;

                        return (
                          <div className="rounded-xl bg-surface-sunken border border-border/80 p-4 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">Saldo estimado a acreditar:</span>
                              <span className="font-display font-semibold text-accent-text text-sm">
                                +{totalPts.toLocaleString('es-CL')} pts (~{formatCLP(clpEstimado)})
                              </span>
                            </div>
                            {lotes > 0 ? (
                              <p className="text-[11px] text-accent-text flex items-center gap-1.5 font-medium">
                                <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                                ¡Aplica Hito Guardián Austral! Incluye {lotes * 150} pts de bono especial por lote de 10.
                              </p>
                            ) : (
                              <p className="text-[11px] text-muted-foreground">
                                Si juntas 10 frascos obtienes +150 puntos de bono adicional (total 650 pts / $6.500 CLP).
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground/80 pt-1.5 border-t border-border/30">
                              * Condiciones: Envases de vidrio lavados, secos, sin trizaduras y con su tapa original.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </section>

              </div>
            </div>
          )}
        </div>
      </main>

      {lines.length > 0 && pricing && !pricingLoading && (
        <div className="tienda-checkout-sticky-pay md:hidden">
          <div className="tienda-checkout-sticky-pay-inner">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total · incluye IVA</p>
              <p data-testid="checkout-total" className="font-display text-lg font-semibold text-accent-text tabular-nums">
                {quoteLoading && !quote ? '…' : `$${totalCompra.toLocaleString('es-CL')}`}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 min-h-12 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
              disabled={payDisabled}
              onClick={() => void startCheckout()}
            >
              {loading ? '…' : 'Pagar'}
            </button>
          </div>
        </div>
      )}

      <ShopFooter />

      {/* Transición cinematográfica mientras la pasarela procesa el redirect */}
      <CheckoutCinematicOverlay
        open={loading}
        stalled={redirectStalled}
        onRetry={() => setLoading(false)}
      />
    </StoreShell>
  );
}