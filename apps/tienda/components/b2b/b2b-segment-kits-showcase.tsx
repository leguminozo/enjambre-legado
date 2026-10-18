'use client';

import React from 'react';
import { formatCLP } from '@enjambre/ui';
import {
  Package,
  QrCode,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  Layers,
  Store,
} from 'lucide-react';
import type { SegmentKit, B2BCodeModule } from '@/lib/b2b/segment-content';
import type { B2BToolItem, B2BCommercialStrategy } from '@enjambre/shop-chrome';

export interface B2BSegmentKitsShowcaseProps {
  kits: SegmentKit[];
  codeModules?: B2BCodeModule[];
  segmentLabel: string;
  segmentSlug: string;
  selectedKitId?: string;
  onSelectKit?: (kitId: string) => void;
}

interface CustomCardSegmentData {
  badge: string;
  title: string;
  tagline: string;
  description: string;
  highlight: string;
  boxTitle: string;
  bullets: string[];
  digitalTitle: string;
  digitalNote: string;
}

const CUSTOM_CARD_CONTENT: Record<string, CustomCardSegmentData> = {
  cafeterias: {
    badge: 'Barra Personalizada & Tostadurías',
    title: 'Convenio de Escala / Obrador Gastronómico',
    tagline: 'Volúmenes de alta rotación, múltiples sucursales o pastelería de autor',
    description: '¿Tu tostaduría opera más de un local, tuesta su propio café o requiere miel cruda en formatos de escala para pastelería y panadería de autor? Diseñamos un convenio de suministro continuo adaptado a tus consumos semanales con trazabilidad analítica de origen.',
    highlight: 'Co-branding con el nombre de tu cafetería en las fichas A6 de mesa, perfiles de maridaje calibrados y facturación consolidada.',
    boxTitle: 'Modalidad Flexible de Abastecimiento',
    bullets: [
      'Surtido libre de las 4 cremas batidas en frío en 25 g y 150 g',
      'Láminas A6 de mesa con el nombre o logo de tu local y código QR de lote',
      'Despacho programado periódico directo desde Chiloé con reposición prioritaria',
    ],
    digitalTitle: 'Integración con tu Carta',
    digitalNote: 'QR de mesa directo a la ficha sensorial de tu cafetería en Núcleo con el protocolo de cata y programa de sellos locales.',
  },
  hoteles: {
    badge: 'Concierge B2B · Lodges & Resorts',
    title: 'Caja Científica de Criterio & Gran Escala',
    tagline: 'Muestreo ejecutivo sin costo o suministro a escala para propiedades de más de 30 habitaciones',
    description: '¿Gestionas un lodge, resort o complejo hotelero con más de 30 habitaciones o deseas evaluar sensorialmente la Matriz Cuádruple antes de emitir una orden de compra? Despachamos la Caja Científica de Criterio directamente a la Gerencia General o coordinamos un acuerdo de suministro continuo auto-liquidable.',
    highlight: 'Incluye las 4 formulaciones en 25 g, 1 frasco de reserva 150 g Cabin-Safe, informe melisopalinológico NCh2981 del lote activo y cálculo de Costo Neto Cero.',
    boxTitle: 'Herramientas de Evaluación & Escala',
    bullets: [
      'Caja Científica de Criterio despachada vía Concierge B2B para evaluación de A&B y GM',
      'Dotación modular continua de 25 g para turndown y catas sin mermas ni cristalizaciones',
      'Reservas de 150 g calibradas a 98 ml para venta de alto margen en recepción al checkout',
    ],
    digitalTitle: 'Pasaporte Botánico & Trazabilidad Bilingüe',
    digitalNote: 'Pasaportes de habitación A6 bilingües (ES/EN) con QR de lote que activa la conversión hacia la boutique del lobby.',
  },
  'tiendas-gourmet': {
    badge: 'Distribución & Concept Stores',
    title: 'Selección Gourmet a Medida',
    tagline: 'Surtido selecto para emporios, tiendas de diseño y cadenas especializadas',
    description: '¿Gestionas una tienda gourmet, vinoteca, emporio o concept store con varias sucursales y buscas exclusividad de marca territorial? Armamos tu selección de frascos de 150g y 500g con condiciones comerciales blindadas y material de punto de venta de alta gama.',
    highlight: 'Displays de vitrina (shelf-talkers) con sello analítico Codex (<17.5% humedad, invertasa viva) y garantía de recolección en frío.',
    boxTitle: 'Condiciones Comerciales de Vitrina',
    bullets: [
      'Margen comercial protegido (40% a 45%+) con escala de descuentos por volumen',
      'Material físico de mostrador: displays A6, atriles y fichas de laboratorio enmarcables',
      'Reposición ágil en 1 clic con facturación inmediata y despacho seguro',
    ],
    digitalTitle: 'Sello Botánico Verificable',
    digitalNote: 'QR en frascos para que tus clientes verifiquen el certificado analítico del polen y el apicultor del lote en tiempo real.',
  },
  ferias: {
    badge: 'Pabellones & Activaciones Pop-Up',
    title: 'Activación de Feria a Medida',
    tagline: 'Presencia de alto impacto en festivales gastronómicos y encuentros de diseño',
    description: '¿Participas en festivales de café, ferias gastronómicas de autor o mercados de diseño de alto flujo? Te abastecemos con stock de impulso de 25g, frascos de 150g y el arsenal operativo de cata para cautivar al público en tu stand.',
    highlight: 'Acceso a la app móvil de venta en terreno (apps/campo) con cobro rápido y sincronización offline en zonas sin cobertura.',
    boxTitle: 'Arsenal Operativo para Terreno',
    bullets: [
      'Formatos de degustación ágil y stock de venta directa listo para entrega al paso',
      'Guía impresa y digital de cata en vivo para capacitar al equipo de atención',
      'Soporte para cobro con tarjeta o transferencia y emisión de comprobante térmico',
    ],
    digitalTitle: 'Fidelización en Vivo en Terreno',
    digitalNote: 'QR de stand para registro de comensales en el Club Legado y acumulación de puntos desde el primer día.',
  },
  revendedores: {
    badge: 'Red Territorial & Embajadores',
    title: 'Convenio de Distribución a Medida',
    tagline: 'Representación exclusiva zonal o acuerdos comerciales para grandes rutas',
    description: '¿Cuentas con una red consolidada de clientes, atiendes comercios locales o deseas desarrollar una zona geográfica con exclusividad? Establecemos un convenio de distribución mayorista con tramos preferentes y acompañamiento continuo.',
    highlight: 'Crédito de retribución acumulable y plataforma de seguimiento de pedidos y clientes en tu portal de embajador.',
    boxTitle: 'Beneficios del Convenio Territorial',
    bullets: [
      'Escala mayorista de descuentos por volumen de compra mensual acumulado',
      'Enlace personalizado de catálogo digital para compartir por WhatsApp y redes',
      'Muestras de degustación bonificadas para apertura de nuevos clientes',
    ],
    digitalTitle: 'Seguimiento de Retribución en Portal',
    digitalNote: 'Portal privado en Núcleo para monitorear tu volumen de compras a 12 meses y comisiones disponibles.',
  },
};

export function B2BSegmentKitsShowcase({
  kits,
  codeModules,
  segmentLabel,
  segmentSlug,
  selectedKitId,
  onSelectKit,
}: B2BSegmentKitsShowcaseProps) {
  if (!kits || kits.length === 0) return null;

  const customData = CUSTOM_CARD_CONTENT[segmentSlug] || CUSTOM_CARD_CONTENT.cafeterias;

  const handleSelect = (kitId: string) => {
    if (onSelectKit) {
      onSelectKit(kitId);
    }
    const target = document.getElementById('registro');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="kits-planificados" className="py-20 md:py-28 px-4 border-t border-border/20 bg-surface-raised/20">
      <div className="max-w-6xl mx-auto">
        {/* ── Kits de Inicio para tu Espacio ── */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-primary font-semibold mb-3">
            Formatos de Selección & Abastecimiento
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-foreground text-balance">
            Kits de Inicio para {segmentLabel}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed text-pretty">
            Selecciones listas de miel cruda y cremas batidas en frío para integrarse directamente a tu espacio, combinando formatos de degustación en mesa, vitrina de venta y trazabilidad digital de lote.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {kits.map((kit) => {
            const isSelected = selectedKitId === kit.id;
            const isRecommended = kit.tier === 'growth' || kit.tier === 'medio';

            return (
              <div
                key={kit.id}
                className={`relative rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  isSelected
                    ? 'border-primary bg-card ring-2 ring-primary/40 shadow-2xl scale-[1.01]'
                    : isRecommended
                    ? 'border-primary/50 bg-card shadow-xl'
                    : 'border-border/60 bg-card/90 hover:border-border-hover'
                }`}
              >
                {/* Badge superior */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-medium uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary">
                    <Sparkles className="w-3 h-3" />
                    {kit.badge}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {kit.moqSummary}
                  </span>
                </div>

                {/* Título y Tagline */}
                <div className="mb-6">
                  <h3 className="font-display text-2xl font-light text-foreground mb-1">
                    {kit.nombre}
                  </h3>
                  <p className="text-xs text-primary font-medium tracking-wide mb-3">
                    {kit.tagline}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {kit.descripcion}
                  </p>

                  {/* Detalle de Despliegue del Kit */}
                  {kit.salesStrategy ? (
                    <div className="rounded-xl border border-border/40 bg-surface-raised/40 p-3 mb-2">
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {kit.salesStrategy}
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Formatos de Miel Incluidos */}
                <div className="rounded-2xl border border-border/40 bg-surface-raised/60 p-4 mb-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                    <Package className="w-4 h-4 text-primary" />
                    <span>Formatos de Miel Incluidos</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {kit.componentesFisicos
                      .filter((comp) => {
                        const lower = comp.item.toLowerCase();
                        return (
                          !lower.includes('tótem') &&
                          !lower.includes('totem') &&
                          !lower.includes('madera') &&
                          !lower.includes('estante') &&
                          !lower.includes('exhibidor') &&
                          !lower.includes('paleta') &&
                          !lower.includes('cuchara') &&
                          !lower.includes('dosificador') &&
                          !lower.includes('tablilla')
                        );
                      })
                      .map((comp, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-mono text-primary font-semibold shrink-0">
                            {comp.cantidad}
                          </span>
                          <div>
                            <span className="text-foreground font-medium">{comp.item}</span>
                            {comp.detalle && (
                              <span className="block text-[11px] text-muted-foreground">
                                {comp.detalle}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Sección Digital & Trazabilidad Local */}
                <div className="rounded-2xl border border-border/40 bg-surface-sunken/40 p-4 mb-6 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                    <QrCode className="w-4 h-4 text-primary" />
                    <span>Trazabilidad Digital de Lote</span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-muted-foreground">
                    {kit.integracionesDigitales.map((dig, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="text-foreground font-medium">{dig.titulo}:</span>{' '}
                          <span>{dig.descripcion}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resumen Financiero & Acción */}
                <div className="border-t border-border/40 pt-5 mt-auto">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                        Inversión Inicial
                      </span>
                      <span className="font-mono text-2xl font-light text-foreground">
                        {formatCLP(kit.precioNetoClp)}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-1">neto</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                        Retorno Estimado
                      </span>
                      <span className="text-xs font-mono font-medium text-primary">
                        ~{kit.margenEstimadoPct}% margen
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        (PVP {formatCLP(kit.pvpEstimadoClp)})
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => handleSelect(kit.id)}
                      className={`w-full min-h-12 rounded-xl text-xs uppercase tracking-[0.2em] font-medium transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : 'border border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Kit Seleccionado</span>
                        </>
                      ) : (
                        <>
                          <span>Seleccionar este Kit</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── Tarjeta de Propuesta a Medida: solo para segmentos con menos de 3 kits en catálogo ── */}
          {segmentSlug !== 'cafeterias' ? (
            <div
              className={`relative rounded-3xl border border-dashed p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                selectedKitId === 'a-medida'
                  ? 'border-primary bg-card ring-2 ring-primary/40 shadow-2xl scale-[1.01]'
                  : 'border-border/80 bg-card/60 hover:border-primary/60 hover:bg-card/90'
              }`}
            >
              {/* Badge superior */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-medium uppercase tracking-wider bg-surface-raised border border-border/80 text-foreground">
                  <Layers className="w-3 h-3 text-primary" />
                  {customData.badge}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  A Convenir
                </span>
              </div>

              {/* Título y Tagline */}
              <div className="mb-6">
                <h3 className="font-display text-2xl font-light text-foreground mb-1">
                  {customData.title}
                </h3>
                <p className="text-xs text-primary font-medium tracking-wide mb-3">
                  {customData.tagline}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {customData.description}
                </p>

                <div className="rounded-xl border border-border/40 bg-surface-raised/40 p-3 mb-2">
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {customData.highlight}
                  </p>
                </div>
              </div>

              {/* Prestaciones incluidas */}
              <div className="rounded-2xl border border-border/40 bg-surface-raised/60 p-4 mb-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                  <Package className="w-4 h-4 text-primary" />
                  <span>{customData.boxTitle}</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {customData.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-primary font-semibold shrink-0">•</span>
                      <span className="text-foreground">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sección Digital & Trazabilidad Local */}
              <div className="rounded-2xl border border-border/40 bg-surface-sunken/40 p-4 mb-6 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                  <QrCode className="w-4 h-4 text-primary" />
                  <span>{customData.digitalTitle}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {customData.digitalNote}
                </p>
              </div>

              {/* Resumen Financiero & Acción */}
              <div className="border-t border-border/40 pt-5 mt-auto">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                      Cotización Directa
                    </span>
                    <span className="font-mono text-xl font-light text-foreground">
                      A Medida
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-1">según volumen</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                      Condición B2B
                    </span>
                    <span className="text-xs font-mono font-medium text-primary">
                      Escala Mayorista
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleSelect('a-medida')}
                    className={`w-full min-h-12 rounded-xl text-xs uppercase tracking-[0.2em] font-medium transition-all flex items-center justify-center gap-2 ${
                      selectedKitId === 'a-medida'
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'border border-border/80 text-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {selectedKitId === 'a-medida' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Propuesta a Medida Seleccionada</span>
                      </>
                    ) : (
                      <>
                        <span>Solicitar Propuesta a Medida</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Footer note para cafeterías: escala y obrador sin sobrecargar la matriz de 3 kits ── */}
        {segmentSlug === 'cafeterias' ? (
          <div className="mt-12 text-center p-6 rounded-2xl border border-border/30 bg-surface-raised/40 max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              ¿Operas múltiples sucursales, una tostaduría de alto volumen o requieres miel cruda en formato de obrador para pastelería de autor?{' '}
              <button
                type="button"
                onClick={() => handleSelect('a-medida')}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline underline-offset-4 transition-colors"
              >
                <span>Solicitar Convenio de Escala / Obrador →</span>
              </button>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

