'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';
import { useCartLines, useCartPricing } from '@/components/shop/cart-context';
import { useState } from 'react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { Lock, Shield, Truck, CheckCircle, Leaf, Trees, User, EyeOff, Star } from 'lucide-react';
import { friendlyApiError } from '@enjambre/ui';
import { useAuth } from '@/components/providers/auth-context';
import { useLoyaltyPoints } from '@/lib/hooks/use-loyalty-points';
import { useCartAbandonmentTracking } from '@/lib/hooks/use-cart-abandonment';

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
  useCartAbandonmentTracking(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceConflicts, setPriceConflicts] = useState<string[] | null>(null);
  const [shipping, setShipping] = useState<ShippingForm>(initialShipping);
  const [touched, setTouched] = useState(false);
  const [buyerMode, setBuyerMode] = useState<BuyerMode>('privada');
  const [usarPuntos, setUsarPuntos] = useState(false);
  
  const formRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const totalCompra = pricing?.total ?? 0;
  const {
    loyaltyData,
    loading: loyaltyLoading,
    puntosACanjear,
    setPuntosACanjear,
    descuentoPorPuntos,
    canMaxPoints,
  } = useLoyaltyPoints(totalCompra);

  useEffect(() => {
    if (isAuthenticated && user) {
      setBuyerMode('legado');
      setShipping((prev) => ({
        ...prev,
        email: prev.email || user.email,
        nombre: prev.nombre || user.name,
      }));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const ctx = gsap.context(() => {
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

    return () => ctx.revert();
  }, []);

  const validationErrors = touched ? fieldError(shipping) : {};
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const startCheckout = async () => {
    setTouched(true);
    const ve = fieldError(shipping);
    if (Object.keys(ve).length > 0) {
      setError('Completa todos los campos de envío requeridos.');
      return;
    }

    setLoading(true);
    setError(null);
    setPriceConflicts(null);

    if (lines.length === 0) {
      setError('Tu carrito está vacío.');
      setLoading(false);
      return;
    }

    const returnUrl = `${window.location.origin}/checkout/resultado`;

    const NUCLEO_URL = process.env.NEXT_PUBLIC_NUCLEO_API_URL || 'http://localhost:3001';
    
    let token: string | undefined;
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }
    } catch (e) {
      // Allow guest checkout if token fetch fails
    }

    const payloadCart = pricing?.line_items.map(l => ({
      productId: l.product_id,
      slug: l.slug,
      name: l.name,
      unitPrice: l.unit_price,
      quantity: l.quantity,
    })) || [];

    let res: Response;
    try {
      res = await fetch(`${NUCLEO_URL}/api/checkout/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ cart: payloadCart, shipping, returnUrl, buyerMode }),
      });
    } catch (networkError) {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
      setLoading(false);
      return;
    }

    const json = (await res.json()) as {
      url?: string;
      token?: string;
      buyOrder?: string;
      total?: number;
      provider?: string;
      error?: string;
      details?: string[];
      verifiedCart?: { productId: string; name: string; unitPrice: number; quantity: number }[];
    };

    if (!res.ok) {
      if (res.status === 409 && json.verifiedCart) {
        setPriceConflicts(json.details ?? ['Algunos productos cambiaron de precio']);
        setError('Algunos productos cambiaron de precio. Revisa el carrito.');
      } else {
        setError(json.error ? friendlyApiError(undefined, json.error) : 'No se pudo iniciar el pago');
      }
      setLoading(false);
      return;
    }

    if (!json.url || !json.token) {
      setError('No se pudo iniciar el pago');
      setLoading(false);
      return;
    }

  sessionStorage.setItem(
    'oyz_pending_checkout',
    JSON.stringify({
      buyOrder: json.buyOrder,
      provider: json.provider,
    }),
  );

    gsap.to(buttonRef.current, {
      scale: 0.98,
      duration: 0.2,
      onComplete: () => {
        if (json.provider === 'flow' && json.url) {
          window.location.href = `${json.url}?token=${json.token}`;
        } else if (json.url && json.token) {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = json.url;
          const tokenInput = document.createElement('input');
          tokenInput.type = 'hidden';
          tokenInput.name = 'token_ws';
          tokenInput.value = json.token;
          form.appendChild(tokenInput);
          document.body.appendChild(form);
          form.submit();
        }
      },
    });
  };

  const updateField = (key: keyof ShippingForm, value: string) => {
    setShipping((prev) => ({ ...prev, [key]: value }));
  };

  const inputCls = (key: keyof ShippingForm) =>
    `w-full rounded-lg border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all ${
      validationErrors[key] ? 'border-destructive' : 'border-border'
    }`;

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[60vh] bg-background pb-16 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="border-b border-border px-4 py-10 sm:px-6 relative z-10">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Leaf className="h-5 w-5 text-accent" />
              </div>
              <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">Checkout Seguro</h1>
            </div>
            <p className="text-muted-foreground">Tu pedido será procesado de forma segura. Cada compra contribuye a regenerar el bosque nativo de Chiloé.</p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 relative z-10" ref={formRef}>
          {pricingError && !pricingLoading ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center">
              <p className="text-destructive mb-4">{pricingError}</p>
              <Link href="/catalogo" className="inline-block text-sm font-semibold text-accent underline hover:text-accent/80 transition-colors">
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
              <Link href="/catalogo" className="inline-block text-sm font-semibold text-accent underline hover:text-accent/80 transition-colors">
                Explorar creaciones
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Cart summary */}
              <section className="checkout-section" ref={summaryRef}>
                <h2 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  Tu pedido
                </h2>
                <ul className="divide-y divide-border rounded-xl border border-border bg-card/40 px-5 py-2">
                  {pricing.line_items.map((line) => (
                    <li key={line.product_id} className="flex justify-between gap-4 py-4 text-sm">
                      <span className="text-foreground/80">
                        <span className="font-medium">{line.name}</span>
                        <span className="text-muted-foreground"> × {line.quantity}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-foreground">
                        ${line.line_total.toLocaleString('es-CL')}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-surface-sunken px-6 py-5 mt-4">
                  <div className="flex flex-col">
                    <span className="font-display text-lg text-foreground">Total a pagar</span>
                    {pricing.discount_amount > 0 && (
                      <span className="text-xs text-accent">Incluye -${pricing.discount_amount.toLocaleString('es-CL')} descuento por Guardianía</span>
                    )}
                    {usarPuntos && descuentoPorPuntos > 0 && (
                      <span className="text-xs text-accent">Incluye -${descuentoPorPuntos.toLocaleString('es-CL')} descuento por puntos</span>
                    )}
                  </div>
                  <span className="font-display text-2xl font-semibold tabular-nums text-accent">
                    ${(pricing.total - (usarPuntos ? descuentoPorPuntos : 0)).toLocaleString('es-CL')}
                  </span>
                </div>
              </section>

              {/* Loyalty points section */}
              {isAuthenticated && loyaltyData && (
                <section className="checkout-section">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-accent" />
                    <h2 className="font-display text-lg text-foreground">Puntos de Fidelización</h2>
                  </div>
                  <div className="rounded-xl border border-accent/40 bg-surface-sunken p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Puntos disponibles</p>
                        <p className="font-display text-2xl font-semibold text-foreground">
                          {loyaltyData.puntos.toLocaleString('es-CL')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Nivel actual</p>
                        <p className="text-sm font-medium text-accent capitalize">
                          {loyaltyData.nivel_actual}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Descuento disponible</span>
                      <span className="font-medium text-foreground">
                        ${loyaltyData.descuento_disponible.toLocaleString('es-CL')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ganarás con esta compra</span>
                      <span className="font-medium text-accent">
                        +{loyaltyData.puntos_ganados_compra} puntos
                      </span>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <label className="flex items-center gap-3 cursor-pointer">
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
                          className="w-5 h-5 rounded border-border bg-surface text-accent focus:ring-accent"
                        />
                        <span className="text-sm text-foreground">
                          Usar puntos para descuento
                        </span>
                      </label>

                      {usarPuntos && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Puntos a canjear</span>
                            <span className="font-medium text-foreground">
                              {puntosACanjear.toLocaleString('es-CL')}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={canMaxPoints}
                            step="100"
                            value={puntosACanjear}
                            onChange={(e) => setPuntosACanjear(Number(e.target.value))}
                            className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
                          />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Descuento aplicado</span>
                            <span className="font-medium text-accent">
                              -${descuentoPorPuntos.toLocaleString('es-CL')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Buyer mode */}
              <section className="checkout-section">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-accent" />
                  <h2 className="font-display text-lg text-foreground">Tu compra</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setBuyerMode('legado')}
                    className={`rounded-xl border p-5 text-left transition-all ${
                      buyerMode === 'legado'
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-card/40 hover:border-accent/40'
                    }`}
                  >
                    <p className="font-display text-sm text-foreground mb-1">Continuar mi legado</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Guardamos tu historial, impacto y direcciones para futuras visitas.
                    </p>
                    {!isAuthenticated && buyerMode === 'legado' && (
                      <p className="mt-3 text-xs text-accent">
                        <Link href="/login?returnTo=/checkout" className="underline underline-offset-2">
                          Inicia sesión
                        </Link>
                        {' '}o{' '}
                        <Link href="/register?returnTo=/checkout" className="underline underline-offset-2">
                          crea tu cuenta
                        </Link>
                      </p>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuyerMode('privada')}
                    className={`rounded-xl border p-5 text-left transition-all ${
                      buyerMode === 'privada'
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-card/40 hover:border-accent/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="font-display text-sm text-foreground">Compra privada</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Entrega puntual sin cuenta. Tus datos no quedan en tu perfil.
                    </p>
                  </button>
                </div>
              </section>

              {/* Shipping address */}
              <section className="checkout-section">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5 text-accent" />
                  <h2 className="font-display text-lg text-foreground">Datos de envío</h2>
                </div>
                <div className="rounded-xl border border-border bg-card/40 p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Nombre completo *</label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
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
                        className={inputCls('telefono')}
                        value={shipping.telefono}
                        onChange={(e) => updateField('telefono', e.target.value)}
                        placeholder="+56 9 1234 5678"
                      />
                      {validationErrors.telefono && <p className="text-xs text-destructive mt-1">{validationErrors.telefono}</p>}
                    </div>
                    <div className="sm:col-span-2 form-field">
                      <label className="block text-xs text-muted-foreground mb-1">Dirección *</label>
                      <input
                        type="text"
                        id="direccion"
                        name="direccion"
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
                      <label className="block text-xs text-muted-foreground mb-1">Código postal</label>
                      <input
                        type="text"
                        id="codigoPostal"
                        name="codigoPostal"
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

              {priceConflicts && (
                <div className="rounded-xl border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-warning">
                  <p className="font-medium mb-1">Productos con cambios:</p>
                  <ul className="list-disc pl-4">
                    {priceConflicts.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                  <p className="mt-2">Vuelve al catálogo para actualizar precios.</p>
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-accent" aria-hidden />
                  Pago encriptado
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-accent" aria-hidden />
                  Transacción segura
                </span>
              </div>

              {error ? (
                <p className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive/80">
                  {error}
                </p>
              ) : null}

                <button
                ref={buttonRef}
                type="button"
                className="checkout-button w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50"
                disabled={loading || !pricing}
                onClick={() => void startCheckout()}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Conectando con la pasarela…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    Pagar ahora — ${(pricing?.total || 0).toLocaleString('es-CL')}
                  </span>
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Al completar tu compra, aceptas nuestros{' '}
                <Link href="/terminos" className="text-accent underline hover:text-accent/80">
                  Términos del Servicio
                </Link>
                . Tu pago está protegido con encriptación de grado bancario.
              </p>
            </div>
          )}
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}