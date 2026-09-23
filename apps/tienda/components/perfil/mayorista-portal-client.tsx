'use client';

import React, { useState, useMemo, useTransition } from 'react';
import {
  WHOLESALE_PRODUCTS_2025_2026,
  WHOLESALE_COMMERCIAL_RULES,
  WHOLESALE_INVESTMENT_TIERS,
  calculateWholesaleOrder,
  type WholesaleOrderLineInput,
  type WholesaleProductItem,
  type WholesaleCommercialRules,
  type WholesaleInvestmentTier,
} from '@enjambre/pricing';
import { toast, Button } from '@enjambre/ui';
import {
  Store,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Truck,
  FileText,
  Download,
  Plus,
  Minus,
  ShieldCheck,
  Package,
  TrendingUp,
} from 'lucide-react';

interface MayoristaPortalClientProps {
  userEmail?: string | null;
  perfil: {
    razon_social?: string | null;
    rut?: string | null;
    tipo_negocio?: string | null;
    estado?: string | null;
    direccion?: string | null;
    region?: string | null;
  } | null;
  rules?: WholesaleCommercialRules;
  investmentTiers?: readonly WholesaleInvestmentTier[];
}

export function MayoristaPortalClient({
  userEmail,
  perfil,
  rules = WHOLESALE_COMMERCIAL_RULES,
  investmentTiers = WHOLESALE_INVESTMENT_TIERS,
}: MayoristaPortalClientProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    WHOLESALE_PRODUCTS_2025_2026.forEach((p) => {
      initial[p.id] = 0;
    });
    return initial;
  });

  const [isPending, startTransition] = useTransition();

  // Actualizar cantidad de un producto
  const updateQuantity = (productId: string, delta: number, step = 12) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta * step);
      return { ...prev, [productId]: next };
    });
  };

  const setExactQuantity = (productId: string, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  // Líneas activas para el cálculo
  const orderLines: WholesaleOrderLineInput[] = useMemo(() => {
    return Object.entries(quantities)
      .filter(([_, q]) => q > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
  }, [quantities]);

  // Cálculo en tiempo real con motor oficial @enjambre/pricing
  const quote = useMemo(() => {
    return calculateWholesaleOrder(orderLines, WHOLESALE_PRODUCTS_2025_2026, {
      rules,
      investmentTiers,
    });
  }, [orderLines, rules, investmentTiers]);

  const handleSendOrder = () => {
    if (orderLines.length === 0) {
      toast('Agrega al menos un producto a tu pedido mayorista', { type: 'error' });
      return;
    }

    if (!quote.cumpleMoqGeneral) {
      toast(`El pedido aún no cumple los mínimos de compra mayorista (${rules.moqFrascosMixtos} frascos o ${rules.moqSachets} sachets)`, {
        type: 'error',
      });
      return;
    }

    startTransition(async () => {
      const subject = encodeURIComponent('Pedido Mayorista B2B — Enjambre Legado');
      const body = encodeURIComponent(
        `Razón Social: ${perfil?.razon_social || 'N/A'}\nRUT: ${perfil?.rut || 'N/A'}\nEmail: ${userEmail || 'N/A'}\n\nDetalle del pedido:\n${orderLines.map(l => {
          const prod = WHOLESALE_PRODUCTS_2025_2026.find(p => p.id === l.productId);
          return `- ${prod?.nombre || l.productId}: ${l.quantity} un.`;
        }).join('\n')}\n\nTotal Neto: ${formatClp(quote.subtotalNetoFinalClp)}\nTotal Facturable (IVA incl.): ${formatClp(quote.totalFacturableIvaIncluidoClp)}`
      );
      window.location.href = `mailto:ventas@enjambrelegado.cl?subject=${subject}&body=${body}`;
      toast('Se abrirá tu cliente de correo con el detalle del pedido. Nuestro equipo comercial te contactará.', { type: 'info' });
    });
  };

  const formatClp = (val: number) => `$${Math.round(val).toLocaleString('es-CL')}`;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Header institucional */}
      <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent-text">
                <Store size={22} />
              </div>
              <div>
                <span className="text-[0.65rem] font-mono uppercase tracking-[0.25em] text-accent-text block">
                  Portal Aliado Mayorista B2B
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-foreground font-light">
                  {perfil?.razon_social || 'Comercio Asociado'}
                </h2>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {perfil?.rut ? `RUT: ${perfil.rut}` : userEmail ? `Cuenta: ${userEmail}` : 'Acceso Autorizado'} ·{' '}
              <span className="capitalize">{perfil?.tipo_negocio || 'Cafetería / Tienda Gourmet'}</span> · Región:{' '}
              {perfil?.region || 'Metropolitana / Los Lagos'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-success/10 border border-success/20 flex items-center gap-2">
              <ShieldCheck size={16} className="text-success" />
              <span className="text-xs font-semibold text-success">
                Condiciones Activas 2025–2026
              </span>
            </div>
          </div>
        </div>

        {/* Escala de volumen banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-border/60">
          <div className="rounded-xl bg-surface-sunken/60 border border-border/60 p-3.5 space-y-1">
            <p className="text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground">Mínimo Apertura (MOQ)</p>
            <p className="text-xs font-medium text-foreground">{rules.moqFrascosMixtos} frascos o {rules.moqSachets} sachets</p>
          </div>
          <div className="rounded-xl bg-surface-sunken/60 border border-border/60 p-3.5 space-y-1">
            <p className="text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground">Escala por Inversión Neta</p>
            <p className="text-xs font-medium text-foreground">
              {investmentTiers
                .filter((t) => t.descuentoPct > 0)
                .map((t) => `${Math.round(t.descuentoPct * 100)}% (≥ $${Math.round(t.desdeClp / 1000)}k)`)
                .join(' · ') || 'Tarifa neta directa'}
            </p>
          </div>
          <div className="rounded-xl bg-surface-sunken/60 border border-border/60 p-3.5 space-y-1">
            <p className="text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground">Despacho Gratuito RM</p>
            <p className="text-xs font-medium text-foreground">Desde {formatClp(rules.umbralDespachoGratisRmNetoClp)} netos</p>
          </div>
        </div>
      </div>

      {/* Matriz de Pedido y Calculadora */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Catálogo de Productos B2B */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground font-display text-xl">
              <Package size={20} className="text-accent" />
              <h3>Catálogo Mayorista Oficial</h3>
            </div>
            <span className="text-xs text-muted-foreground font-mono">Precios Netos Mayoristas</span>
          </div>

          <div className="space-y-4">
            {WHOLESALE_PRODUCTS_2025_2026.map((prod: WholesaleProductItem) => {
              const qty = quantities[prod.id] || 0;
              const step = prod.categoria === 'sachet' ? 50 : 12;
              const lineSubtotal = prod.precioNetoBaseClp * qty;

              return (
                <div
                  key={prod.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 ${
                    qty > 0 ? 'bg-card border-accent/40 shadow-md' : 'bg-card/60 border-border hover:border-border/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-foreground">{prod.nombre}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          {prod.formato}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{prod.descripcion}</p>
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                        <span>Neto Mayorista: <strong className="text-foreground">{formatClp(prod.precioNetoBaseClp)}</strong></span>
                        <span>·</span>
                        <span>PVP Sugerido: <strong className="text-accent-text">{formatClp(prod.pvpRecomendadoClp)}</strong></span>
                        <span>·</span>
                        <span>Mínimo: {prod.minimoCompraUnidades} un.</span>
                      </div>
                    </div>

                    {/* Selector de cantidad */}
                    <div className="flex items-center gap-4 shrink-0 sm:self-center">
                      <div className="flex items-center border border-border rounded-xl bg-background overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(prod.id, -1, step)}
                          disabled={qty === 0}
                          className="px-3 py-2 text-xs hover:bg-muted transition-colors disabled:opacity-30 text-foreground"
                          title={`Restar ${step} unidades`}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min={0}
                          step={step}
                          value={qty}
                          onChange={(e) => setExactQuantity(prod.id, parseInt(e.target.value, 10) || 0)}
                          className="w-20 text-center text-base md:text-xs font-mono font-bold bg-transparent text-foreground focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(prod.id, 1, step)}
                          className="px-3 py-2 text-xs hover:bg-muted transition-colors text-foreground"
                          title={`Sumar ${step} unidades`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="w-24 text-right">
                        <span className="text-xs font-mono font-bold text-foreground block">
                          {formatClp(lineSubtotal)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">neto base</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen de Cotización / Margen */}
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl space-y-6 sticky top-6">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Calculator size={18} className="text-accent" />
              <h3 className="font-display text-lg text-foreground font-semibold">Resumen de Inversión</h3>
            </div>

            {/* Validación MOQ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Volumen total frascos:</span>
                <span className="font-mono font-bold text-foreground">
                  {quote.totalUnidadesFrascos} / {rules.moqFrascosMixtos} un.
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Volumen total sachets:</span>
                <span className="font-mono font-bold text-foreground">
                  {quote.totalUnidadesSachets} / {rules.moqSachets} un.
                </span>
              </div>

              {!quote.cumpleMoqGeneral && orderLines.length > 0 && (
                <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs flex items-start gap-2 mt-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>Se requiere un mínimo de {rules.moqFrascosMixtos} frascos o {rules.moqSachets} sachets para cursar pedido con tarifa mayorista.</span>
                </div>
              )}
            </div>

            {/* Desglose Económico */}
            <div className="space-y-2.5 pt-4 border-t border-border/60 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal Neto Base:</span>
                <span className="font-mono text-foreground">{formatClp(quote.subtotalNetoBaseClp)}</span>
              </div>

              {quote.descuentoInversionPct > 0 && (
                <div className="flex justify-between text-success font-medium">
                  <span>Descuento Volumen ({Math.round(quote.descuentoInversionPct * 100)}%):</span>
                  <span className="font-mono">-{formatClp(quote.descuentoInversionClp)}</span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal Neto Facturable:</span>
                <span className="font-mono text-foreground font-semibold">{formatClp(quote.subtotalNetoFinalClp)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>IVA (19%):</span>
                <span className="font-mono text-foreground">{formatClp(quote.iva19PctClp)}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
                <span>Total Facturable:</span>
                <span className="font-mono text-lg text-accent-text">{formatClp(quote.totalFacturableIvaIncluidoClp)}</span>
              </div>
            </div>

            {/* Proyección de Margen para el Revendedor */}
            {quote.subtotalNetoFinalClp > 0 && (
              <div className="p-4 rounded-2xl bg-secondary/60 border border-border space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <TrendingUp size={14} className="text-success" />
                  <span>Tu Ganancia Estimada (PVP)</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground">Margen Bruto Total:</span>
                  <span className="font-mono text-base font-bold text-success">
                    {formatClp(quote.margenComercialRevendedorClp)} ({quote.margenComercialRevendedorPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Despacho */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck size={15} className="text-accent shrink-0" />
              <span>
                {quote.despachoGratisRm
                  ? '✨ Despacho Gratuito a RM Aplicado'
                  : `Faltan ${formatClp(quote.montoFaltanteDespachoGratisClp)} para despacho gratis en RM.`}
              </span>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-2.5">
              <Button
                type="button"
                disabled={isPending || orderLines.length === 0 || !quote.cumpleMoqGeneral}
                onClick={handleSendOrder}
                className="w-full py-4 text-xs uppercase tracking-[0.25em] font-bold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {isPending ? 'Procesando…' : 'Solicitar Pedido con Factura B2B'}
              </Button>

              <button
                type="button"
                disabled={orderLines.length === 0}
                onClick={() => {
                  toast('La descarga automática de cotizaciones proforma estará disponible próximamente. Contacta a ventas@enjambrelegado.cl', { type: 'info' });
                }}
                className="w-full py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border/80 rounded-xl transition-colors disabled:opacity-30"
              >
                Descargar Cotización Proforma
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Centro de Documentación y Descargas */}
      <div className="p-8 rounded-3xl bg-secondary/40 border border-border space-y-6">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-accent" />
          <h3 className="font-display text-xl text-foreground font-semibold">Documentación y Fichas Técnicas Oficiales</h3>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          Ponemos a disposición de nuestros aliados comerciales las resoluciones sanitarias, fichas organolépticas y certificados de origen y patrimonio forestal para acreditación en cartas gastronómicas y retail.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Ficha Técnica Ulmo</p>
              <p className="text-[10px] text-muted-foreground font-mono">PDF · Origen Chiloé</p>
            </div>
            <button
              type="button"
              onClick={() => toast('Documentación en preparación. Contacta a ventas@enjambrelegado.cl para solicitar esta ficha.', { type: 'info' })}
              className="p-2 rounded-lg bg-accent/10 text-accent-text hover:bg-accent/20 transition-colors"
            >
              <Download size={16} />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Ficha Crema de Miel</p>
              <p className="text-[10px] text-muted-foreground font-mono">PDF · Formatos Sachets</p>
            </div>
            <button
              type="button"
              onClick={() => toast('Documentación en preparación. Contacta a ventas@enjambrelegado.cl para solicitar esta ficha.', { type: 'info' })}
              className="p-2 rounded-lg bg-accent/10 text-accent-text hover:bg-accent/20 transition-colors"
            >
              <Download size={16} />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Resolución Sanitaria</p>
              <p className="text-[10px] text-muted-foreground font-mono">SEREMI Los Lagos</p>
            </div>
            <button
              type="button"
              onClick={() => toast('Documentación en preparación. Contacta a ventas@enjambrelegado.cl para solicitar esta ficha.', { type: 'info' })}
              className="p-2 rounded-lg bg-accent/10 text-accent-text hover:bg-accent/20 transition-colors"
            >
              <Download size={16} />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Certificado Origen</p>
              <p className="text-[10px] text-muted-foreground font-mono">Sello de Origen</p>
            </div>
            <button
              type="button"
              onClick={() => toast('Documentación en preparación. Contacta a ventas@enjambrelegado.cl para solicitar esta ficha.', { type: 'info' })}
              className="p-2 rounded-lg bg-accent/10 text-accent-text hover:bg-accent/20 transition-colors"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
