'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  Share2,
  Copy,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  MessageSquare,
  UtensilsCrossed,
  HelpCircle,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { toast } from '@enjambre/ui';
import {
  getSegmentRecommendedCreations,
  type SegmentRecommendedContent,
  type SegmentCreationSlide,
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
  const [activeTab, setActiveTab] = useState<'carousel' | 'tabletop' | 'briefing'>('carousel');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const slides = content.socialCarousel.slides;
  const currentSlide: SegmentCreationSlide = slides[currentSlideIndex] || slides[0];

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleCopyCaption = async () => {
    const fullText = `${content.socialCarousel.suggestedCaption}\n\n${content.socialCarousel.suggestedHashtags.join(' ')}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedCaption(true);
      toast.success('Texto y hashtags copiados para tus redes sociales');
      setTimeout(() => setCopiedCaption(false), 3000);
    } catch {
      toast.error('No se pudo copiar automáticamente. Por favor selecciónalo manualmente.');
    }
  };

  const handlePrintTabletop = () => {
    window.print();
  };

  return (
    <section id="kit-editorial" className="py-20 md:py-28 px-4 border-t border-border/20 bg-background scroll-mt-24">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Cabecera de Sección */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.3em] bg-primary/10 border border-primary/20 text-primary">
            <Sparkles size={12} />
            Kit de Comunicación Incluido
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-foreground text-balance">
            {content.headline}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
            Al activar tu alianza con nosotros, recibes material listo para tus mesas y tus redes: carruseles visuales, códigos QR interactivos para tus comensales y manual de servicio para tu equipo.
          </p>
        </div>

        {/* Selector de Pestañas Interactivas */}
        <div className="flex items-center justify-center gap-2 border-b border-border/40 pb-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('carousel')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'carousel'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            <Share2 size={16} />
            <span>Carrusel para Redes ({slides.length} Láminas)</span>
          </button>
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
        </div>

        {/* ── PESTAÑA 1: CARRUSEL PARA REDES ── */}
        {activeTab === 'carousel' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Visualizador de Lámina (Estilo Feed 4:5) */}
            <div className="lg:col-span-7 flex flex-col items-center space-y-4">
              <div className="w-full max-w-md aspect-[4/5] rounded-3xl border border-border/60 bg-card p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden text-foreground">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/10 pointer-events-none" />

                {/* Header de Lámina */}
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground border-b border-border/40 pb-2">
                    <span className="truncate">{currentSlide.kickerLeft}</span>
                    <span className="truncate text-primary font-bold">{currentSlide.kickerRight}</span>
                  </div>
                  {currentSlide.badge && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest bg-primary/15 text-primary border border-primary/30">
                      {currentSlide.badge}
                    </span>
                  )}
                  <h3 className="font-display text-2xl sm:text-3xl font-light text-foreground leading-tight pt-1">
                    {currentSlide.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {currentSlide.subtitle}
                  </p>
                </div>

                {/* Contenido Central Dinámico */}
                <div className="space-y-3 my-auto relative z-10 py-2">
                  {currentSlide.quote && (
                    <blockquote className="p-3.5 rounded-xl border border-primary/20 bg-surface-raised/60 text-xs italic text-foreground font-serif leading-relaxed">
                      {currentSlide.quote}
                    </blockquote>
                  )}

                  {currentSlide.highlights && currentSlide.highlights.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentSlide.highlights.map((h, i) => (
                        <div key={i} className="p-2.5 rounded-lg border border-border/40 bg-surface-raised/40 space-y-0.5">
                          <span className="block text-[9px] font-mono text-primary uppercase tracking-wider font-semibold">
                            {h.label}
                          </span>
                          <span className="block text-[11px] text-muted-foreground leading-snug">
                            {h.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer de Lámina */}
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground border-t border-border/40 pt-3 relative z-10">
                  <span className="truncate">{currentSlide.footerLeft}</span>
                  <span className="truncate text-foreground font-semibold">{currentSlide.footerRight}</span>
                </div>
              </div>

              {/* Controles de Navegación del Carrusel */}
              <div className="flex items-center justify-between w-full max-w-md px-2">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="btn btn-outline btn-sm rounded-full h-9 w-9 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Lámina anterior"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1.5">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        currentSlideIndex === idx ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground'
                      }`}
                      aria-label={`Ir a lámina ${idx + 1}`}
                    />
                  ))}
                  <span className="text-[11px] font-mono text-muted-foreground ml-2">
                    {currentSlideIndex + 1} / {slides.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="btn btn-outline btn-sm rounded-full h-9 w-9 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Lámina siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Panel de Copia & Texto Recomendado */}
            <div className="lg:col-span-5 rounded-3xl border border-border/60 bg-surface-raised/40 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-primary" />
                    <h3 className="font-display text-xl text-foreground font-light">
                      Copia & Caption Recomendado
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-xs font-mono text-primary hover:bg-primary/10 transition-colors"
                  >
                    {copiedCaption ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    <span>{copiedCaption ? '¡Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Texto redactado con precisión técnica y tono de alta gastronomía, listo para pegar en la descripción de tu publicación de Instagram o Facebook:
                </p>

                <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 font-mono text-xs leading-relaxed text-foreground max-h-[300px] overflow-y-auto whitespace-pre-line">
                  {content.socialCarousel.suggestedCaption}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                    Hashtags Recomendados:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {content.socialCarousel.suggestedHashtags.map((h, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-surface-sunken border border-border/40 text-[10px] font-mono text-muted-foreground"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/40 pt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Kit Oficial para {segmentLabel}</span>
                <span className="text-primary font-semibold">Listo para Compartir</span>
              </div>
            </div>
          </div>
        )}

        {/* ── PESTAÑA 2: TARJETA DE MESA & SALA (TABLETOP) ── */}
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
                  Material de Sala & Counter
                </span>
                <h3 className="font-display text-3xl font-light text-foreground">
                  Fidelización en Cada Mesa sin Fricción
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tus comensales solo apuntan su cámara para registrar su cata en el protocolo oficial. No requieren instalar aplicaciones ni crear contraseñas. Cada evaluación nutre el índice sensorial de tu local y les entrega puntos y timbres de bienvenida.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-surface-raised/40 p-5 space-y-3">
                <div className="flex items-center gap-2 text-foreground font-medium text-xs">
                  <CheckCircle2 size={16} className="text-primary" />
                  <span>Código de Establecimiento Único</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Al completar tu registro, este código QR se vincula directamente a tu ID de local para que las reseñas aparezcan acreditadas a tu cafetería o establecimiento.
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

        {/* ── PESTAÑA 3: BRIEFING PARA EL EQUIPO DE SALA ── */}
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
                Objeciones y consultas habituales resueltas con elegancia y solvencia técnica:
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
      </div>
    </section>
  );
}
