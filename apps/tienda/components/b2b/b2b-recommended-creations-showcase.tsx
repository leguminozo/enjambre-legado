'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Store,
  Printer,
  CheckCircle2,
  UtensilsCrossed,
  HelpCircle,
  Award,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react';
import {
  getSegmentRecommendedCreations,
  type SegmentRecommendedContent,
} from '@/lib/b2b/segment-creations';

export interface B2BRecommendedCreationsShowcaseProps {
  segmentSlug: string;
  segmentLabel: string;
}

export function B2BRecommendedCreationsShowcase({
  segmentSlug,
  segmentLabel,
}: B2BRecommendedCreationsShowcaseProps) {
  const content: SegmentRecommendedContent = getSegmentRecommendedCreations(segmentSlug);
  const [activeTab, setActiveTab] = useState<'tabletop' | 'briefing' | 'display'>('tabletop');

  const handlePrintTabletop = () => {
    window.print();
  };

  return (
    <section id="kit-editorial" className="py-20 md:py-28 px-4 border-t border-border/20 bg-background scroll-mt-24">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Cabecera de Sección */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.3em] bg-primary/10 border border-primary/20 text-primary">
            <Store size={12} />
            Material Físico & Soporte de Sala Incluido
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-foreground text-balance">
            Herramientas Tangibles para tu Espacio
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
            Al activar tu alianza comercial, recibes todo el material físico listo para operar desde el primer servicio: tarjetas de mesa en papel de alto gramaje con código QR de origen, microespátulas de bambú y la guía de servicio para tu equipo.
          </p>
        </div>

        {/* Selector de Pestañas Interactivas */}
        <div className="flex items-center justify-center gap-2 border-b border-border/40 pb-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('tabletop')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tabletop'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            <UtensilsCrossed size={16} />
            <span>Tarjeta de Mesa & Sala (Imprimible)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('briefing')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'briefing'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            <Award size={16} />
            <span>Ficha del Personal & Respuestas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'display'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            <Layers size={16} />
            <span>Material de Mostrador & Vitrina</span>
          </button>
        </div>

        {/* ── PESTAÑA 1: TARJETA DE MESA & SALA (TABLETOP) ── */}
        {activeTab === 'tabletop' && (
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Maqueta de Tarjeta de Mesa */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-sm rounded-3xl border-2 border-primary/30 bg-card p-7 sm:p-9 shadow-2xl space-y-6 text-center text-foreground relative print:border-black print:bg-white print:text-black">
                <div className="space-y-2 border-b border-border/40 pb-4">
                  <span className="text-[9px] uppercase font-mono tracking-[0.3em] text-primary block">
                    Degustación en Sala
                  </span>
                  <h3 className="font-display text-2xl text-foreground font-light">
                    {content.tabletopKit.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {content.tabletopKit.subtitle}
                  </p>
                </div>

                {/* Código QR Dinámico */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-border/40 shadow-inner w-fit mx-auto">
                  <QRCodeSVG
                    value={content.tabletopKit.qrActionUrl}
                    size={150}
                    level="H"
                    includeMargin={false}
                  />
                  <span className="text-[9px] font-mono text-black font-bold uppercase tracking-wider mt-2">
                    {content.tabletopKit.qrLabel}
                  </span>
                </div>

                {/* Ejes Sensoriales de Mesa */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  {content.tabletopKit.dimensions.map((dim, idx) => (
                    <div key={idx} className="p-2 rounded-lg border border-border/40 bg-surface-raised/60">
                      <span className="block text-[8px] font-mono text-muted-foreground uppercase">
                        {dim.label}
                      </span>
                      <span className="block text-xs font-semibold text-foreground">
                        {dim.value}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-muted-foreground italic leading-snug">
                  {content.tabletopKit.instruction}
                </p>
              </div>
            </div>

            {/* Explicación y Botón de Impresión */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary block">
                  Material de Sala & Mesón
                </span>
                <h3 className="font-display text-3xl font-light text-foreground">
                  Trazabilidad en Cada Mesa sin Fricción
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tus comensales solo apuntan su cámara para conocer la floración del lote, la humedad certificada y el origen en el bosque nativo de Chiloé. No requieren instalar aplicaciones ni crear contraseñas.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-surface-raised/40 p-5 space-y-3">
                <div className="flex items-center gap-2 text-foreground font-medium text-xs">
                  <CheckCircle2 size={16} className="text-primary" />
                  <span>Código de Establecimiento Asociado</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Al completar tu registro de aliado, el código QR se asocia automáticamente a tu establecimiento, permitiendo vincular tu carta con la trazabilidad oficial de la marca.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePrintTabletop}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs uppercase tracking-wider font-medium hover:bg-primary/90 transition-all shadow-md"
                  >
                    <Printer size={16} />
                    <span>Imprimir Tarjeta de Mesa</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PESTAÑA 2: BRIEFING PARA EL EQUIPO DE SALA ── */}
        {activeTab === 'briefing' && (
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Puntos Clave de Servicio */}
            <div className="rounded-3xl border border-border/60 bg-surface-raised/40 p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-primary" />
                <h3 className="font-display text-2xl font-light text-foreground">
                  {content.staffBriefing.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Recomendaciones precisas para capacitar a tus baristas, camareros y dependientes de sala en menos de 5 minutos:
              </p>

              <div className="space-y-3">
                {content.staffBriefing.serviceTips.map((tip, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-border/50 bg-card space-y-1">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                      {tip.title}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-3">
                      {tip.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Preguntas de Comensales Resueltas */}
            <div className="rounded-3xl border border-border/60 bg-surface-raised/40 p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-primary" />
                <h3 className="font-display text-2xl font-light text-foreground">
                  Respuestas a Clientes Exigentes
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Objeciones y consultas habituales resueltas con elegancia y solvencia gastronómica:
              </p>

              <div className="space-y-3">
                {content.staffBriefing.faqForStaff.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-border/50 bg-card space-y-1.5">
                    <span className="text-xs font-semibold text-primary block">
                      «{item.question}»
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PESTAÑA 3: ELEMENTOS FÍSICOS DE MOSTRADOR & VITRINA ── */}
        {activeTab === 'display' && (
          <div className="space-y-8">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-7 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Store size={20} />
                </div>
                <h4 className="font-display text-lg font-medium text-foreground">
                  Exhibidor de Mesón en Madera Nativa
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pieza compacta de madera tratada para exhibir los frascos de vitrina de 150 g en el punto de pago o recepción. Diseñada para activar la compra por impulso al pedir la cuenta.
                </p>
                <div className="pt-2 text-[11px] font-mono text-primary font-semibold">
                  Capacidad: 8 a 12 frascos de 150 g
                </div>
              </div>

              <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-7 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <UtensilsCrossed size={20} />
                </div>
                <h4 className="font-display text-lg font-medium text-foreground">
                  Microespátulas de Bambú
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Espátulas higiénicas biodegradables para acompañar el servicio de la pieza de 25 g en bandeja, permitiendo la cata individual sin alterar la bebida.
                </p>
                <div className="pt-2 text-[11px] font-mono text-primary font-semibold">
                  100 a 500 un. según kit
                </div>
              </div>

              <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-7 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Sparkles size={20} />
                </div>
                <h4 className="font-display text-lg font-medium text-foreground">
                  Fichas Botánicas en Papel Algodón
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Láminas de mesa A6 en papel de alto gramaje con relato del bosque austral, descriptores organolépticos y código de trazabilidad para ubicar en mesas o vitrinas.
                </p>
                <div className="pt-2 text-[11px] font-mono text-primary font-semibold">
                  Impresión editorial resistente
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-surface-raised/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <Download size={14} className="text-primary" />
                  Activos Digitales & Banco Fotográfico Oficial
                </p>
                <p className="text-xs text-muted-foreground">
                  Fotografías de estudio en alta resolución, logotipos y fichas en PDF para tu carta digital o menú disponibles tras activar tu cuenta de aliado.
                </p>
              </div>
              <a
                href="#registro"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card border border-border/80 text-xs font-mono uppercase tracking-wider text-foreground hover:border-primary transition-colors shrink-0"
              >
                Acceder al Catálogo
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
