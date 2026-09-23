'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Truck,
  CheckCircle2,
  Package,
  Store,
  FileText,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { formatCLP, toast, friendlyError } from '@enjambre/ui';
import { CHILE_REGIONES } from '@enjambre/logistica';
import { validarRUT, formatearRUT } from '@/lib/shop/rut';
import type { B2BSegmentSlug, SegmentKit } from '@/lib/b2b/segment-content';

export interface B2BOnboardingWizardProps {
  segmentSlug: B2BSegmentSlug;
  segmentLabel: string;
  initialKitId?: string;
  userEmail: string;
  userName?: string;
  userEstablishment?: string;
  kits: SegmentKit[];
}

const inputClassName =
  'w-full bg-surface-raised border border-border/70 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors';

const labelClassName =
  'block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 font-medium';

export function B2BOnboardingWizard({
  segmentSlug,
  segmentLabel,
  initialKitId,
  userEmail,
  userName,
  userEstablishment,
  kits,
}: B2BOnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Paso 1: Datos Tributarios y Logísticos
  const [razonSocial, setRazonSocial] = useState(userEstablishment || '');
  const [rut, setRut] = useState('');
  const [giro, setGiro] = useState(
    segmentSlug === 'cafeterias'
      ? 'Cafetería de Especialidad / Gastronomía'
      : segmentSlug === 'hoteles'
      ? 'Hotelería y Hospedaje'
      : segmentSlug === 'tiendas-gourmet'
      ? 'Comercio al por menor de alimentos gourmet'
      : 'Comercio General',
  );
  const [direccion, setDireccion] = useState('');
  const [comuna, setComuna] = useState('');
  const [region, setRegion] = useState('Región Metropolitana');
  const [contactoRecepcion, setContactoRecepcion] = useState(userName || '');
  const [telefonoRecepcion, setTelefonoRecepcion] = useState('');
  const [horarioEntrega, setHorarioEntrega] = useState('Lunes a Viernes 09:00 - 14:00');

  // Paso 2: Selección y personalización de pedido
  const [selectedKitId, setSelectedKitId] = useState(initialKitId || kits[0]?.id || '');
  const [notasAdicionales, setNotasAdicionales] = useState('');

  // Estados de proceso
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    trackingCode: string;
    totalFacturable: number;
  } | null>(null);

  const selectedKit = kits.find((k) => k.id === selectedKitId) || kits[0];

  // Cálculo financiero
  const subtotalNeto = selectedKit ? selectedKit.precioNetoClp : 0;
  const iva = Math.round(subtotalNeto * 0.19);
  const totalFacturable = subtotalNeto + iva;

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setRut(raw);
    if (error) setError(null);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!razonSocial.trim() || !rut.trim() || !direccion.trim() || !comuna.trim()) {
      setError('Por favor completa todos los campos requeridos de facturación y despacho.');
      return;
    }

    if (!validarRUT(rut)) {
      setError('El RUT ingresado no es válido. Verifica el número y dígito verificador.');
      return;
    }

    setRut(formatearRUT(rut));
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmOrder = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/b2b/onboarding-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentSlug,
          razonSocial: razonSocial.trim(),
          rut: rut.trim(),
          giro: giro.trim(),
          direccion: direccion.trim(),
          comuna: comuna.trim(),
          region,
          contactoRecepcion: contactoRecepcion.trim(),
          telefonoRecepcion: telefonoRecepcion.trim(),
          horarioEntrega: horarioEntrega.trim(),
          kitId: selectedKit?.id,
          subtotalNeto,
          iva,
          totalFacturable,
          despachoGratis: true,
          notasAdicionales: notasAdicionales.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No se pudo generar el pedido.');
      }

      setOrderResult({
        orderId: data.orderId,
        trackingCode: data.trackingCode,
        totalFacturable: data.totalFacturable,
      });
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast('¡Primer pedido confirmado con éxito! Bienvenido al Legado.', { type: 'success' });
    } catch (err) {
      const msg = friendlyError(err, 'No se pudo procesar el pedido. Intenta nuevamente.');
      setError(msg);
      toast(msg, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      {/* Indicador de pasos */}
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-medium uppercase tracking-[0.25em] bg-primary/10 border border-primary/20 text-primary mb-3">
          <Sparkles className="w-3 h-3" />
          Configuración Inicial de Aliado
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-foreground font-light text-balance">
          {step === 3
            ? '¡Bienvenido a la Red Oficial de Aliados!'
            : `Bienvenido al Legado de ${razonSocial || segmentLabel}`}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {step === 1 && 'Ingresa tus datos fiscales para facturación electrónica DTE 33 y dirección de entrega.'}
          {step === 2 && 'Personaliza la dotación de tu primer pedido y revisa los materiales de cortesía incluidos.'}
          {step === 3 && 'Tu pedido inicial ha sido registrado exitosamente con despacho prioritario.'}
        </p>

        {/* Stepper pills */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono transition-colors ${
              step >= 1 ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-surface-raised text-muted-foreground'
            }`}
          >
            <span>1</span>
            <span className="hidden sm:inline">Facturación & Despacho</span>
          </div>
          <div className="w-4 h-px bg-border/60" />
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono transition-colors ${
              step >= 2 ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-surface-raised text-muted-foreground'
            }`}
          >
            <span>2</span>
            <span className="hidden sm:inline">Primer Pedido</span>
          </div>
          <div className="w-4 h-px bg-border/60" />
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono transition-colors ${
              step === 3 ? 'bg-success/15 text-success border border-success/30' : 'bg-surface-raised text-muted-foreground'
            }`}
          >
            <span>3</span>
            <span className="hidden sm:inline">Activación</span>
          </div>
        </div>
      </div>

      {/* ── PASO 1: Datos Tributarios y Logísticos ── */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="rounded-3xl border border-border/70 bg-card p-6 sm:p-9 shadow-xl space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border/40 pb-3">
            <Building2 className="w-4 h-4 text-primary" />
            <span>Datos Fiscales para Factura Electrónica</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="onb-razon" className={labelClassName}>
                Razón Social / Nombre Empresa <span className="text-destructive">*</span>
              </label>
              <input
                id="onb-razon"
                type="text"
                required
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="Ej. Inversiones Gastronómicas SpA"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="onb-rut" className={labelClassName}>
                RUT Empresa o Personal <span className="text-destructive">*</span>
              </label>
              <input
                id="onb-rut"
                type="text"
                required
                value={rut}
                onChange={handleRutChange}
                placeholder="Ej. 76.123.456-7"
                className={inputClassName}
              />
              <span className="block text-[11px] text-muted-foreground mt-1">
                Con dígito verificador.
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="onb-giro" className={labelClassName}>
              Giro Comercial
            </label>
            <input
              id="onb-giro"
              type="text"
              value={giro}
              onChange={(e) => setGiro(e.target.value)}
              placeholder="Ej. Cafetería, Restaurante, Hotel, Venta al por menor"
              className={inputClassName}
            />
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border/40 pb-3 pt-3">
            <Truck className="w-4 h-4 text-primary" />
            <span>Dirección de Despacho & Recepción</span>
          </div>

          <div>
            <label htmlFor="onb-direccion" className={labelClassName}>
              Dirección de Entrega (Calle y Número) <span className="text-destructive">*</span>
            </label>
            <input
              id="onb-direccion"
              type="text"
              required
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej. Av. Italia 1430, Local 3"
              className={inputClassName}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="onb-comuna" className={labelClassName}>
                Comuna <span className="text-destructive">*</span>
              </label>
              <input
                id="onb-comuna"
                type="text"
                required
                value={comuna}
                onChange={(e) => setComuna(e.target.value)}
                placeholder="Ej. Providencia"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="onb-region" className={labelClassName}>
                Región <span className="text-destructive">*</span>
              </label>
              <select
                id="onb-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className={inputClassName}
              >
                {CHILE_REGIONES.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="onb-contacto" className={labelClassName}>
                Persona que Recibe en Local <span className="text-destructive">*</span>
              </label>
              <input
                id="onb-contacto"
                type="text"
                required
                value={contactoRecepcion}
                onChange={(e) => setContactoRecepcion(e.target.value)}
                placeholder="Nombre del encargado o barista"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="onb-telefono" className={labelClassName}>
                Teléfono de Contacto en Local <span className="text-destructive">*</span>
              </label>
              <input
                id="onb-telefono"
                type="tel"
                required
                value={telefonoRecepcion}
                onChange={(e) => setTelefonoRecepcion(e.target.value)}
                placeholder="+56 9 9123 4567"
                className={inputClassName}
              />
            </div>
          </div>

          <div>
            <label htmlFor="onb-horario" className={labelClassName}>
              Horario Preferente de Recepción
            </label>
            <input
              id="onb-horario"
              type="text"
              value={horarioEntrega}
              onChange={(e) => setHorarioEntrega(e.target.value)}
              placeholder="Ej. Lunes a Viernes 08:30 a 13:00"
              className={inputClassName}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-12 rounded-xl bg-primary text-primary-foreground text-xs uppercase tracking-[0.2em] font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Continuar a Selección del Primer Pedido</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ── PASO 2: Selección y Personalización del Primer Pedido ── */}
      {step === 2 && selectedKit && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/70 bg-card p-6 sm:p-9 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
                <Package className="w-4 h-4 text-primary" />
                <span>Configuración de Dotación Inicial</span>
              </div>
              <span className="text-xs text-primary font-mono font-medium">
                Despacho Gratuito Incluido
              </span>
            </div>

            {/* Selector de Kit */}
            <div className="space-y-3">
              <label className={labelClassName}>Selecciona el Kit de tu Primer Pedido</label>
              <div className="grid sm:grid-cols-2 gap-3">
                {kits.map((kit) => (
                  <button
                    key={kit.id}
                    type="button"
                    onClick={() => setSelectedKitId(kit.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      selectedKitId === kit.id
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm'
                        : 'border-border/60 bg-surface-raised hover:border-border-hover'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-semibold text-foreground">{kit.nombre}</span>
                        <span className="text-[10px] font-mono text-primary uppercase">{kit.badge}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {kit.tagline}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
                      <span className="font-mono text-sm font-medium text-foreground">
                        {formatCLP(kit.precioNetoClp)} <span className="text-[10px] text-muted-foreground">neto</span>
                      </span>
                      <span className="text-[10px] text-primary font-mono">
                        {kit.moqSummary}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Detalle del Kit Seleccionado */}
            <div className="rounded-2xl border border-border/60 bg-surface-raised/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-lg text-foreground font-light">
                    {selectedKit.nombre}
                  </h4>
                  <p className="text-xs text-muted-foreground">{selectedKit.descripcion}</p>
                </div>
              </div>

              {/* Items de Producto */}
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-primary font-semibold mb-2">
                  Formatos de Miel Incluidos
                </span>
                <ul className="space-y-1.5 text-xs text-foreground/90">
                  {selectedKit.componentesFisicos.map((comp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-mono font-bold text-primary shrink-0">
                        {comp.cantidad}
                      </span>
                      <div>
                        <span className="font-medium">{comp.item}</span>
                        {comp.detalle && (
                          <span className="text-muted-foreground ml-1.5">({comp.detalle})</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Materiales de Exhibición de Cortesía */}
              {selectedKit.materialesExhibicion && selectedKit.materialesExhibicion.length > 0 && (
                <div className="border-t border-border/30 pt-3">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-success font-semibold mb-1.5">
                    Materiales de Exhibición & Cortesía (Sin Costo)
                  </span>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {selectedKit.materialesExhibicion.map((mat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                        <span>{mat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Notas opcionales */}
            <div>
              <label htmlFor="onb-notas" className={labelClassName}>
                Instrucciones Especiales para el Despacho (Opcional)
              </label>
              <textarea
                id="onb-notas"
                rows={2}
                value={notasAdicionales}
                onChange={(e) => setNotasAdicionales(e.target.value)}
                placeholder="Ej. Tocar timbre de carga trasera o llamar 15 minutos antes de llegar."
                className={inputClassName}
              />
            </div>

            {/* Cuadro Financiero Transparente */}
            <div className="rounded-2xl border border-primary/20 bg-surface-sunken/80 p-5 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal Neto:</span>
                <span className="text-foreground">{formatCLP(subtotalNeto)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>IVA Crédito Fiscal (19%):</span>
                <span className="text-foreground">{formatCLP(iva)}</span>
              </div>
              <div className="flex justify-between items-center text-success">
                <span>Despacho Asegurado Nacional:</span>
                <span className="font-bold">GRATIS ($0)</span>
              </div>
              <div className="border-t border-border/50 pt-2.5 mt-2 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Total Facturable:
                </span>
                <span className="text-2xl font-light text-primary">
                  {formatCLP(totalFacturable)}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground text-right">
                Se emitirá Factura Electrónica a nombre de {razonSocial} (RUT: {rut}).
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-border/80 text-xs uppercase tracking-wider font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Datos</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmOrder}
                className="flex-1 w-full min-h-12 rounded-xl bg-primary text-primary-foreground text-xs uppercase tracking-[0.2em] font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
              >
                {submitting ? (
                  <span>Registrando pedido oficial…</span>
                ) : (
                  <>
                    <span>Confirmar Primer Pedido & Habilitar Alianza</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 3: Confirmación & Éxito ── */}
      {step === 3 && orderResult && (
        <div className="rounded-3xl border border-success/40 bg-card p-8 sm:p-12 shadow-2xl text-center space-y-7">
          <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-success">
              Pedido B2B Confirmado
            </span>
            <h2 className="font-display text-3xl text-foreground font-light">
              ¡Tu pedido está en camino a preparación!
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Hemos registrado la orden para <strong className="text-foreground">{razonSocial}</strong> en
              nuestro taller de Chiloé. Se ha generado la orden formal con Factura Electrónica.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-surface-raised/70 p-6 max-w-md mx-auto text-left space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Código de Seguimiento:</span>
              <span className="font-bold text-foreground tracking-widest">{orderResult.trackingCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Kit Inicial:</span>
              <span className="text-foreground">{selectedKit?.nombre}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Facturable:</span>
              <span className="text-primary font-bold">{formatCLP(orderResult.totalFacturable)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
              <span>Entrega estimada:</span>
              <span>3 a 5 días hábiles con courier prioritario</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/perfil/mayorista"
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-xs uppercase tracking-[0.2em] font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg"
            >
              <Store className="w-4 h-4" />
              <span>Entrar al Portal Mayorista</span>
            </Link>

            <Link
              href="/catalogo"
              className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border/80 px-6 text-xs uppercase tracking-wider font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Ver Catálogo Completo</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
