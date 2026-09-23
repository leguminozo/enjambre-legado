'use client';

import { useState } from 'react';
import { formatCLP } from '@enjambre/ui';
import { Check, Truck, ShieldCheck, TrendingUp, FileText, ArrowRight } from 'lucide-react';
import { WHOLESALE_COMMERCIAL_RULES, WHOLESALE_PRODUCTS_2025_2026 } from '@enjambre/pricing';

const product500g = WHOLESALE_PRODUCTS_2025_2026.find(
  (p) => p.id === 'miel-tradicional-reserva-bosque-frasco-mayor-500g',
);
const UNIT_RETAIL_PRICE_CLP = product500g?.pvpRecomendadoClp ?? 14990;
const TASA_IVA_CHILE = WHOLESALE_COMMERCIAL_RULES.tasaIvaChile;
const UMBRAL_DESPACHO_GRATIS_CLP = 150000;

interface TierInfo {
  minQty: number;
  label: string;
  discountPct: number;
  badge: string;
}

const TIERS: TierInfo[] = [
  { minQty: 12, label: 'Cajón Iniciación (12 frascos)', discountPct: 15, badge: '15% Descuento' },
  { minQty: 24, label: 'Caja Maestra (24 frascos)', discountPct: 20, badge: '20% Descuento' },
  { minQty: 48, label: 'Alianza Gourmet (48+ frascos)', discountPct: 25, badge: '25% Descuento' },
];

export interface B2BWholesaleSimulatorProps {}

export function B2BWholesaleSimulator(_props: B2BWholesaleSimulatorProps = {}) {
  const [selectedQty, setSelectedQty] = useState<number>(24);

  // Determinar tier activo
  let activeTier = TIERS[0];
  for (const tier of TIERS) {
    if (selectedQty >= tier.minQty) {
      activeTier = tier;
    }
  }

  const discountDecimal = activeTier.discountPct / 100;
  const unitWholesaleNetPrice = Math.round(UNIT_RETAIL_PRICE_CLP * (1 - discountDecimal));
  const subtotalNeto = unitWholesaleNetPrice * selectedQty;
  const iva = Math.round(subtotalNeto * TASA_IVA_CHILE);
  const totalFacturado = subtotalNeto + iva;
  const potentialRetailGross = UNIT_RETAIL_PRICE_CLP * selectedQty;
  const partnerGrossMargin = potentialRetailGross - totalFacturado;
  const freeShipping = subtotalNeto >= UMBRAL_DESPACHO_GRATIS_CLP;

  return (
    <div className="card p-6 sm:p-8 border border-border bg-card/60 backdrop-blur-md rounded-2xl shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-primary font-mono block">
            Simulador de Pedido Mayorista
          </span>
          <h3 className="font-display text-2xl text-foreground mt-1">
            Condiciones por Volumen B2B
          </h3>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
          <FileText className="w-3.5 h-3.5" />
          <span>Factura Electrónica DTE 33</span>
        </div>
      </div>

      {/* Selector de volumen */}
      <div className="space-y-3">
        <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
          Selecciona el volumen de frascos (500g bosque nativo):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[12, 24, 48, 96].map((qty) => (
            <button
              key={qty}
              type="button"
              onClick={() => setSelectedQty(qty)}
              className={`py-3 px-4 rounded-xl border text-center transition-all ${
                selectedQty === qty
                  ? 'border-primary bg-primary/15 text-primary font-bold shadow-md'
                  : 'border-border bg-surface-raised/40 text-foreground hover:border-border-hover'
              }`}
            >
              <div className="font-mono text-lg">{qty}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {qty === 12 ? '1 Cajón' : qty === 24 ? '1 Master' : `${qty / 24} Masters`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Resumen numérico */}
      <div className="p-5 rounded-xl bg-surface-sunken/60 border border-border/40 space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Precio Público de Referencia:</span>
          <span className="text-foreground line-through opacity-70">
            {formatCLP(UNIT_RETAIL_PRICE_CLP)} / frasco
          </span>
        </div>

        <div className="flex justify-between items-center text-primary font-bold">
          <span>Precio Mayorista Neto ({activeTier.badge}):</span>
          <span className="text-sm">{formatCLP(unitWholesaleNetPrice)} / frasco</span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-border/40">
          <span className="text-muted-foreground">Subtotal Neto:</span>
          <span className="text-foreground font-medium">{formatCLP(subtotalNeto)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">IVA Crédito Fiscal ({Math.round(TASA_IVA_CHILE * 100)}%):</span>
          <span className="text-foreground font-medium">{formatCLP(iva)}</span>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-border/50 text-sm">
          <span className="font-bold text-foreground">Total Facturado:</span>
          <span className="font-bold text-primary text-base">{formatCLP(totalFacturado)}</span>
        </div>
      </div>

      {/* Indicadores de valor para el aliado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-success/10 border border-success/20 flex items-start gap-2.5">
          <TrendingUp className="w-4 h-4 text-success shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-success block">Margen para tu Local</span>
            <span className="text-muted-foreground text-[11px]">
              Al vender a público generas aprox.{' '}
              <strong className="text-foreground font-mono">+{formatCLP(partnerGrossMargin)}</strong> de
              utilidad directa.
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2.5">
          <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-primary block">Despacho Institucional</span>
            <span className="text-muted-foreground text-[11px]">
              {freeShipping
                ? '✦ Envío consolidado bonificado incluido.'
                : 'Tarifa preferencial de transporte refrigerado.'}
            </span>
          </div>
        </div>
      </div>

      {/* Garantías B2B */}
      <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-primary" /> Certificado de laboratorio Codex Alimentarius
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="w-4 h-4 text-success" /> Trazabilidad de origen por lote
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="w-4 h-4 text-success" /> Soporte de carta y maridaje
        </span>
      </div>

      <div className="pt-2">
        <a
          href="#registro-b2b"
          className="btn btn-primary w-full min-h-12 py-3 px-6 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 rounded-xl"
        >
          <span>Solicitar Alta de Cuenta Institucional</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
