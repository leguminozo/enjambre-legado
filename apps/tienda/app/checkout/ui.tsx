'use client';

import Link from 'next/link';
import { useCart } from '@/components/shop/cart-context';
import { useState } from 'react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { Lock, Shield, Truck } from 'lucide-react';
import { friendlyApiError } from '@enjambre/ui';

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
  const cart = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceConflicts, setPriceConflicts] = useState<string[] | null>(null);
  const [shipping, setShipping] = useState<ShippingForm>(initialShipping);
  const [touched, setTouched] = useState(false);

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

    if (cart.lines.length === 0) {
      setError('Tu carrito está vacío.');
      setLoading(false);
      return;
    }

    const returnUrl = `${window.location.origin}/checkout/resultado`;

    const res = await fetch('/api/checkout/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ cart: cart.lines, shipping, returnUrl }),
    });

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
        cart: cart.lines,
        total: json.total,
      }),
    );

    if (json.provider === 'flow') {
      window.location.href = `${json.url}?token=${json.token}`;
    } else {
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
      <main className="min-h-[60vh] bg-background pb-16">
        <div className="border-b border-border px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">Checkout</h1>
            <p className="mt-2 text-muted-foreground">Revisión del pedido, datos de envío y pago seguro.</p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          {cart.lines.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">Tu carrito está vacío.</p>
              <Link href="/catalogo" className="mt-4 inline-block text-sm font-semibold text-accent underline">
                Explorar creaciones
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Cart summary */}
              <section>
                <h2 className="font-display text-lg text-foreground mb-4">Tu pedido</h2>
                <ul className="divide-y divide-border rounded-xl border border-border bg-card/40 px-5 py-2">
                  {cart.lines.map((line) => (
                    <li key={line.productId} className="flex justify-between gap-4 py-4 text-sm">
                      <span className="text-foreground/80">
                        <span className="font-medium">{line.name}</span>
                        <span className="text-muted-foreground"> × {line.quantity}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-foreground">
                        ${(line.unitPrice * line.quantity).toLocaleString('es-CL')}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-surface-sunken px-6 py-5 mt-4">
                  <span className="font-display text-lg text-foreground">Total</span>
                  <span className="font-display text-2xl font-semibold tabular-nums text-accent">
                    ${cart.subtotal.toLocaleString('es-CL')}
                  </span>
                </div>
              </section>

              {/* Shipping address */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5 text-accent" />
                  <h2 className="font-display text-lg text-foreground">Datos de envío</h2>
                </div>
                <div className="rounded-xl border border-border bg-card/40 p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">Nombre completo *</label>
                      <input type="text" className={inputCls('nombre')} value={shipping.nombre} onChange={(e) => updateField('nombre', e.target.value)} placeholder="Tu nombre" />
                      {validationErrors.nombre && <p className="text-xs text-destructive mt-1">{validationErrors.nombre}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Email *</label>
                      <input type="email" className={inputCls('email')} value={shipping.email} onChange={(e) => updateField('email', e.target.value)} placeholder="tu@email.com" />
                      {validationErrors.email && <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Teléfono *</label>
                      <input type="tel" className={inputCls('telefono')} value={shipping.telefono} onChange={(e) => updateField('telefono', e.target.value)} placeholder="+56 9 1234 5678" />
                      {validationErrors.telefono && <p className="text-xs text-destructive mt-1">{validationErrors.telefono}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">Dirección *</label>
                      <input type="text" className={inputCls('direccion')} value={shipping.direccion} onChange={(e) => updateField('direccion', e.target.value)} placeholder="Calle, número, depto" />
                      {validationErrors.direccion && <p className="text-xs text-destructive mt-1">{validationErrors.direccion}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Comuna *</label>
                      <input type="text" className={inputCls('comuna')} value={shipping.comuna} onChange={(e) => updateField('comuna', e.target.value)} placeholder="Comuna" />
                      {validationErrors.comuna && <p className="text-xs text-destructive mt-1">{validationErrors.comuna}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Ciudad *</label>
                      <input type="text" className={inputCls('ciudad')} value={shipping.ciudad} onChange={(e) => updateField('ciudad', e.target.value)} placeholder="Ciudad" />
                      {validationErrors.ciudad && <p className="text-xs text-destructive mt-1">{validationErrors.ciudad}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Región *</label>
                      <select className={inputCls('region')} value={shipping.region} onChange={(e) => updateField('region', e.target.value)}>
                        <option value="">Seleccionar región</option>
                        {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {validationErrors.region && <p className="text-xs text-destructive mt-1">{validationErrors.region}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Código postal</label>
                      <input type="text" className={inputCls('codigoPostal')} value={shipping.codigoPostal} onChange={(e) => updateField('codigoPostal', e.target.value)} placeholder="Opcional" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">Instrucciones de entrega</label>
                      <textarea className={inputCls('instrucciones')} value={shipping.instrucciones} onChange={(e) => updateField('instrucciones', e.target.value)} placeholder="Casa con reja verde, dejar en portería..." rows={2} />
                    </div>
                  </div>
                </div>
              </section>

              {priceConflicts && (
                <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
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
                <p className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                className="w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:bg-primary/80 disabled:opacity-50"
                disabled={loading}
                onClick={() => void startCheckout()}
              >
                {loading ? 'Conectando con pasarela de pago…' : 'Pagar ahora'}
              </button>
            </div>
          )}
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
