'use client';

import { useId, useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Clock,
  Compass,
  ShieldCheck,
  FlaskConical,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { resolveLocalized, type PdpSettings } from '@enjambre/shop-chrome';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import type { ShopProduct } from '@/lib/shop/products';
import type { ResenasListResponse } from '@/lib/shop/resenas-api';
import type { AnalisisPublico } from '@/lib/shop/analisis-lote';
import { resolveBotanicalReference } from '@/lib/shop/perfil-sensorial-botanica';

export interface PerfilSensorialSectionProps {
  productName: string;
  productSlug?: string;
  productTags?: string[];
  origenApicola?: string | null;
  nombreLote?: string | null;
  perfilSensorial?: ShopProduct['perfil_sensorial'];
  tipoSensorial?: string | null;
  variantes?: Array<{
    id: string;
    nombre_variante: string;
    tipo_variante: string;
    ingrediente_fortificante?: string | null;
    peso_neto_g?: number | null;
    perfil_sensorial_override?: unknown | null;
  }>;
  resenasData?: ResenasListResponse | null;
  analisisLote?: AnalisisPublico | null;
  pdpSettings?: PdpSettings;
}

// 8 Ejes Canónicos de la Constelación Sensorial de Bosque Nativo
const AXES = [
  'Madurez Enzimática',
  'Complejidad Botánica',
  'Dulzor',
  'Textura',
  'Tensión Ácida',
  'Densidad Metabólica',
  'Sinergia Cafeínica',
  'Vector Territorial',
] as const;

export function PerfilSensorialSection({
  productName,
  productSlug,
  productTags,
  origenApicola,
  nombreLote,
  perfilSensorial,
  tipoSensorial,
  variantes,
  resenasData,
  analisisLote,
  pdpSettings,
}: PerfilSensorialSectionProps) {
  const chartId = useId();
  const activePerfil = perfilSensorial;
  const currentLocale = useLocale();
  const storeChrome = useStoreChrome();
  const activePdp = pdpSettings ?? storeChrome.pdp;

  // Textos y etiquetas configurables desde CMS con defaults de lujo territorial
  const kicker =
    resolveLocalized(activePdp?.sensory_kicker, activePdp?.sensory_kicker_en, currentLocale) ||
    'Expresión Botánica de Origen';
  const title =
    resolveLocalized(activePdp?.sensory_title, activePdp?.sensory_title_en, currentLocale) ||
    'Constelación Sensorial de Cata';
  const introTemplate =
    resolveLocalized(
      activePdp?.sensory_intro_template,
      activePdp?.sensory_intro_template_en,
      currentLocale,
    ) ||
    'Perfil sensorial de origen para {product}. Síntesis contrastada entre botánica de bosque nativo, calibración curatorial y evaluaciones reales de la comunidad.';
  const radarLayer1 =
    resolveLocalized(
      activePdp?.sensory_radar_layer1,
      activePdp?.sensory_radar_layer1_en,
      currentLocale,
    ) || 'Referencia Botánica';
  const radarLayer2 =
    resolveLocalized(
      activePdp?.sensory_radar_layer2,
      activePdp?.sensory_radar_layer2_en,
      currentLocale,
    ) || 'Curaduría Canónica';
  const radarLayer3 =
    resolveLocalized(
      activePdp?.sensory_radar_layer3,
      activePdp?.sensory_radar_layer3_en,
      currentLocale,
    ) || 'Comunidad';
  const sourcesTitle =
    resolveLocalized(
      activePdp?.sensory_sources_title,
      activePdp?.sensory_sources_title_en,
      currentLocale,
    ) || 'Fuentes de Verificación Sensorial';
  const sourcesSubtitle =
    resolveLocalized(
      activePdp?.sensory_sources_subtitle,
      activePdp?.sensory_sources_subtitle_en,
      currentLocale,
    ) || 'Datos contrastados entre botánica del bosque, cata canónica y comunidad.';
  const layer1Label =
    resolveLocalized(
      activePdp?.sensory_layer1_label,
      activePdp?.sensory_layer1_label_en,
      currentLocale,
    ) || 'Referencia Botánica & Lote';
  const layer1Pending =
    resolveLocalized(
      activePdp?.sensory_layer1_pending,
      activePdp?.sensory_layer1_pending_en,
      currentLocale,
    ) || 'Catalogación botánica en curso para esta floración.';
  const layer2Label =
    resolveLocalized(
      activePdp?.sensory_layer2_label,
      activePdp?.sensory_layer2_label_en,
      currentLocale,
    ) || 'Calibración Curatorial de Origen';
  const layer2Pending =
    resolveLocalized(
      activePdp?.sensory_layer2_pending,
      activePdp?.sensory_layer2_pending_en,
      currentLocale,
    ) || 'Calibración curatorial no asignada aún para esta creación.';
  const layer3Label =
    resolveLocalized(
      activePdp?.sensory_layer3_label,
      activePdp?.sensory_layer3_label_en,
      currentLocale,
    ) || 'Evaluación Sensorial Comunitaria';
  const layer3Empty =
    resolveLocalized(
      activePdp?.sensory_layer3_empty,
      activePdp?.sensory_layer3_empty_en,
      currentLocale,
    ) ||
    'Aún no hay registros de cata comunitaria para esta creación. Cada evaluación enriquece este mapa sensorial.';
  const ctaButtonText =
    resolveLocalized(
      activePdp?.sensory_cta_button,
      activePdp?.sensory_cta_button_en,
      currentLocale,
    ) || 'Aportar mi evaluación sensorial';

  // ── 1. Capa Exoesqueleto (Laboratorio / Literatura y Triangulación Botánica) ──
  const botanicalRef = useMemo(() => {
    return resolveBotanicalReference({
      productName,
      productSlug,
      productTags,
      origenApicola,
      nombreLote,
      analisisLote,
    });
  }, [productName, productSlug, productTags, origenApicola, nombreLote, analisisLote]);

  const labData = useMemo(() => {
    return botanicalRef ? botanicalRef.ejes : null;
  }, [botanicalRef]);

  // ── 2. Capa Núcleo Curatorial (Calibración Oficial Humana desde Núcleo) ──────
  const isCuratorCalibrated = useMemo(() => {
    return (
      activePerfil != null &&
      (typeof activePerfil.intensidad === 'number' ||
        typeof activePerfil.dulzor_acidez === 'number' ||
        typeof activePerfil.textura === 'number' ||
        (Array.isArray(activePerfil.notas_aromaticas) && activePerfil.notas_aromaticas.length > 0))
    );
  }, [activePerfil]);

  const curatorData = useMemo(() => {
    if (!isCuratorCalibrated || !activePerfil) return null;

    const int = (activePerfil.intensidad ?? 75) / 10;
    const dulz = (activePerfil.dulzor_acidez ?? 60) / 10;
    const text = (activePerfil.textura ?? 85) / 10;
    const acidez = Math.max(1.5, Number(((100 - (activePerfil.dulzor_acidez ?? 60)) / 10).toFixed(1)));

    // Ejes proyectados desde la calibración curatorial real
    const madurez = Math.min(10, Math.max(2, Number((int * 1.05).toFixed(1))));
    const complejidad = Math.min(10, Math.max(2, Number((int * 1.1).toFixed(1))));
    const sinergia = Math.min(10, Math.max(2, Number(((int + acidez) / 2).toFixed(1))));
    const vector = Math.min(10, Math.max(2, Number((int * 1.15).toFixed(1))));

    return [
      madurez,
      complejidad,
      dulz,
      text,
      acidez,
      int,
      sinergia,
      vector,
    ];
  }, [activePerfil, isCuratorCalibrated]);

  // ── 3. Capa Nebulosa (Percepción Real Colectiva de la Comunidad) ────────────
  const communityStats = useMemo(() => {
    const total = resenasData?.total ?? resenasData?.items?.length ?? 0;
    const items = resenasData?.items ?? [];

    if (total === 0 || items.length === 0) {
      return {
        total: 0,
        data: null,
        avgRating: null,
        consolidated: false,
      };
    }

    const validRatings = items.map((i) => i.rating).filter((r) => typeof r === 'number' && r > 0);
    const avgRating =
      validRatings.length > 0
        ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length
        : null;

    const intensidades = items
      .map((i) => i.intensidad_fondo)
      .filter((v): v is number => typeof v === 'number');

    const avgInt =
      intensidades.length > 0
        ? (intensidades.reduce((a, b) => a + b, 0) / intensidades.length) / 10
        : avgRating
          ? (avgRating / 7) * 8.0
          : 7.0;

    let dulceSum = 0;
    let dulceCount = 0;
    let texturaSum = 0;
    let texturaCount = 0;

    for (const item of items) {
      if (item.percepcion?.pares) {
        for (const p of item.percepcion.pares) {
          if (p.par.includes('dulce') || p.par.includes('acido')) {
            dulceSum += p.valor;
            dulceCount++;
          }
          if (p.par.includes('liquida') || p.par.includes('cremosa') || p.par.includes('sedosa')) {
            texturaSum += p.valor;
            texturaCount++;
          }
        }
      }
    }

    const avgDulz =
      dulceCount > 0 ? (dulceSum / dulceCount) / 10 : curatorData ? curatorData[2] : 6.5;
    const avgText =
      texturaCount > 0 ? (texturaSum / texturaCount) / 10 : curatorData ? curatorData[3] : 7.5;
    const avgAcidez = Math.max(1.5, Number((10 - avgDulz).toFixed(1)));

    const madurez = Math.min(10, Math.max(2, Number((avgInt * 0.95 + 0.5).toFixed(1))));
    const complejidad = Math.min(10, Math.max(2, Number((avgInt * 1.05).toFixed(1))));
    const sinergia = Math.min(10, Math.max(2, Number(((avgInt + avgAcidez) / 2).toFixed(1))));
    const vector = Math.min(10, Math.max(2, Number((avgInt * 1.1).toFixed(1))));

    const data = [
      madurez,
      complejidad,
      Number(avgDulz.toFixed(1)),
      Number(avgText.toFixed(1)),
      Number(avgAcidez.toFixed(1)),
      Number(avgInt.toFixed(1)),
      sinergia,
      vector,
    ];

    return {
      total,
      data,
      avgRating,
      consolidated: total >= 30, // Protocolo ST-CATA: umbral canónico N >= 30
    };
  }, [resenasData, curatorData]);

  const userData = communityStats.data;

  // Notas organolépticas: estrictamente las declaradas por el curador (sin fallbacks hardcoded)
  const notasAromaticas = useMemo(() => {
    if (activePerfil?.notas_aromaticas && Array.isArray(activePerfil.notas_aromaticas)) {
      return activePerfil.notas_aromaticas.filter((n) => typeof n === 'string' && n.trim().length > 0);
    }
    return [];
  }, [activePerfil]);

  const maridajes = activePerfil?.maridajes ?? [];

  // Geometría del Radar SVG
  const cx = 175;
  const cy = 175;
  const maxR = 115;
  const totalAxes = AXES.length;

  const getCoordinates = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / totalAxes;
    const r = (Math.min(Math.max(value, 0), 10) / 10) * maxR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y };
  };

  const toPolygonPoints = (data: number[]) => {
    return data
      .map((val, i) => {
        const { x, y } = getCoordinates(i, val);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Anillos concéntricos de referencia (niveles 2.5, 5, 7.5, 10)
  const gridLevels = [2.5, 5, 7.5, 10];

  const handleDejarHuella = () => {
    // Desplaza suavemente hacia el bloque de reseñas y abre el compositor real
    const vocesEl = document.getElementById('voces-del-bosque');
    if (vocesEl) {
      vocesEl.scrollIntoView({ behavior: 'smooth' });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('enjambre:open-resena-composer', {
          detail: {
            varianteId: null,
          },
        }),
      );
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 space-y-8" id="constelacion-sensorial">
      {/* Encabezado Principal Centrado */}
      <div className="text-center pb-5 border-b border-border/50 space-y-1.5">
        <p className="text-editorial-xs uppercase tracking-[0.25em] text-primary font-medium inline-flex items-center justify-center gap-1.5">
          <Compass size={13} className="text-primary" />
          <span>{kicker}</span>
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          {title}
        </h2>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto text-center">
        {introTemplate.includes('{product}') ? (
          <>
            {introTemplate.split('{product}')[0]}
            <strong className="text-foreground">{productName}</strong>
            {introTemplate.split('{product}')[1] ?? ''}
          </>
        ) : (
          introTemplate
        )}
      </p>

      {/* Visualización Principal: Radar + Información Verificada */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface-sunken/40 rounded-2xl p-5 sm:p-7 border border-border/40">
        
        {/* Columna Izquierda: Radar SVG */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[350px] aspect-square">
            <svg
              viewBox="0 0 350 350"
              className="w-full h-full select-none overflow-visible"
              aria-label={`Constelación sensorial para ${productName}`}
            >
              <defs>
                <filter id={`glow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Anillos de calibración concéntricos */}
              {gridLevels.map((lvl) => {
                const pts = Array.from({ length: totalAxes })
                  .map((_, i) => {
                    const { x, y } = getCoordinates(i, lvl);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={lvl}
                    points={pts}
                    fill="none"
                    stroke="currentColor"
                    className="text-border/60"
                    strokeWidth="1"
                    strokeDasharray={lvl === 10 ? 'none' : '2 3'}
                  />
                );
              })}

              {/* Ejes radiales */}
              {AXES.map((_, i) => {
                const { x, y } = getCoordinates(i, 10);
                return (
                  <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    className="text-border/50"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Capa 1: Exoesqueleto (Laboratorio / Parámetros de Literatura y Lote) */}
              {labData && (
                <polygon
                  points={toPolygonPoints(labData)}
                  fill="none"
                  stroke="rgba(6, 182, 212, 0.75)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="transition-all duration-700 ease-out"
                />
              )}

              {/* Capa 2: Núcleo (Curador / Calibración Oficial en Núcleo) */}
              {curatorData && (
                <>
                  <polygon
                    points={toPolygonPoints(curatorData)}
                    fill="currentColor"
                    stroke="currentColor"
                    className="text-primary/15 stroke-primary"
                    strokeWidth="2"
                    style={{ fillOpacity: 0.18 }}
                  />
                  {curatorData.map((val, i) => {
                    const { x, y } = getCoordinates(i, val);
                    return (
                      <circle
                        key={`curator-pt-${i}`}
                        cx={x}
                        cy={y}
                        r="2.5"
                        className="fill-primary"
                      />
                    );
                  })}
                </>
              )}

              {/* Capa 3: Nebulosa (Comunidad / Percepción Real Registrada) */}
              {userData && (
                <>
                  <polygon
                    points={toPolygonPoints(userData)}
                    fill="rgba(244, 63, 94, 0.22)"
                    stroke="rgba(244, 63, 94, 0.85)"
                    strokeWidth="2"
                    filter={`url(#glow-${chartId})`}
                    className="transition-all duration-300 ease-out"
                  />
                  {userData.map((val, i) => {
                    const { x, y } = getCoordinates(i, val);
                    return (
                      <circle
                        key={`user-pt-${i}`}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="rgba(244, 63, 94, 1)"
                        className="transition-all duration-300 ease-out"
                      />
                    );
                  })}
                </>
              )}

              {/* Etiquetas de los vértices */}
              {AXES.map((axis, i) => {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / totalAxes;
                const labelR = maxR + 18;
                const lx = cx + labelR * Math.cos(angle);
                const ly = cy + labelR * Math.sin(angle);
                return (
                  <text
                    key={axis}
                    x={lx}
                    y={ly + 3}
                    textAnchor="middle"
                    className="text-[9px] sm:text-[10px] fill-muted-foreground font-medium tracking-wide"
                  >
                    {axis}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Leyenda de las 3 capas */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 pt-3 border-t border-border/30 text-xs">
            <div className="inline-flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full border border-dashed ${
                  labData
                    ? 'border-cyan-400 bg-cyan-400/20'
                    : 'border-muted-foreground/40 bg-muted/20'
                }`}
              />
              <span className={labData ? 'text-muted-foreground' : 'text-muted-foreground/50'}>
                {radarLayer1}
              </span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  curatorData ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
              <span
                className={curatorData ? 'text-foreground font-medium' : 'text-muted-foreground/50'}
              >
                {radarLayer2}
              </span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  userData ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-muted-foreground/30'
                }`}
              />
              <span className={userData ? 'text-rose-400 font-medium' : 'text-muted-foreground/50'}>
                {radarLayer3} ({communityStats.total})
              </span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Estado de Verificación de las 3 Fuentes */}
        <div className="lg:col-span-5 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-border/40 pt-5 lg:pt-0 lg:pl-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Compass size={15} className="text-primary" />
              <span>{sourcesTitle}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sourcesSubtitle}
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {/* Fuente 1: Referencia Botánica */}
            <div className="p-3 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-cyan-400 flex items-center gap-1.5 font-semibold">
                  <FlaskConical size={13} />
                  <span>{layer1Label}</span>
                </span>
                {botanicalRef ? (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Verificada
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">En catalogación</span>
                )}
              </div>
              {botanicalRef ? (
                <>
                  <p className="text-xs font-semibold text-foreground">
                    {botanicalRef.nombreComun} · <em>{botanicalRef.nombreCientifico}</em>
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {botanicalRef.resumenBotanico}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                    <span>Ref: {botanicalRef.referenciaLiteratura}</span>
                    {botanicalRef.fuenteUrl && (
                      <Link
                        href={botanicalRef.fuenteUrl}
                        className="text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Monografía</span>
                        <ExternalLink size={9} />
                      </Link>
                    )}
                  </div>
                  {analisisLote && (
                    <div className="text-[10px] font-mono text-cyan-300 pt-0.5">
                      Análisis de lote: Humedad {analisisLote.humedad_pct ?? '<18'}% · Diastasa {analisisLote.diastasa ?? '>14'} DN
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {layer1Pending}
                </p>
              )}
            </div>

            {/* Fuente 2: Curaduría de Origen */}
            <div className="p-3 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-primary flex items-center gap-1.5 font-semibold">
                  <ShieldCheck size={13} />
                  <span>{layer2Label}</span>
                </span>
                {isCuratorCalibrated ? (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Calibrada
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Pendiente</span>
                )}
              </div>
              {isCuratorCalibrated && activePerfil ? (
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-1.5 rounded-lg bg-surface-sunken/60 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">Intensidad</span>
                    <strong className="text-xs text-foreground font-bold">{activePerfil.intensidad ?? 75}%</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-surface-sunken/60 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">Balance</span>
                    <strong className="text-xs text-foreground font-bold">{activePerfil.dulzor_acidez ?? 60}%</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-surface-sunken/60 border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">Textura</span>
                    <strong className="text-xs text-foreground font-bold">{activePerfil.textura ?? 85}%</strong>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {layer2Pending}
                </p>
              )}
            </div>

            {/* Fuente 3: Comunidad Real */}
            <div className="p-3 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-rose-400 flex items-center gap-1.5 font-semibold">
                  <Users size={13} />
                  <span>{layer3Label}</span>
                </span>
                {communityStats.total > 0 ? (
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                      communityStats.consolidated
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {communityStats.consolidated ? 'Consolidada' : 'En construcción'}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">0 registros</span>
                )}
              </div>
              {communityStats.total > 0 ? (
                <>
                  <p className="text-xs text-foreground font-medium">
                    {communityStats.total} {communityStats.total === 1 ? 'evaluación comunitaria registrada' : 'evaluaciones comunitarias registradas'}
                    {communityStats.avgRating ? ` · Promedio: ${communityStats.avgRating.toFixed(1)} / 7` : ''}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {communityStats.consolidated
                      ? 'Perfil colectivo consolidado con trazabilidad comunitaria.'
                      : 'Acumulando sesiones de evaluación sensorial para alcanzar el umbral de consolidación formal (30 registros).'}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {layer3Empty}
                </p>
              )}
            </div>
          </div>

          {/* Botón de acción real: Aportar cata */}
          <button
            type="button"
            onClick={handleDejarHuella}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold uppercase tracking-wider transition-all min-h-11 shadow-sm"
          >
            <Users size={14} />
            <span>{ctaButtonText}</span>
          </button>
        </div>
      </div>

      {/* Notas Organolépticas de Cata (Centradas) */}
      <div className="pt-2 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
          Notas Organolépticas de Origen
        </p>
        {notasAromaticas.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {notasAromaticas.map((nota) => (
              <span
                key={nota}
                className="px-3 py-1 rounded-full border border-border/80 bg-background text-xs text-foreground font-medium"
              >
                {nota}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Sin notas organolépticas específicas declaradas por curaduría para esta creación.
          </p>
        )}
      </div>

      {/* Maridajes Recomendados */}
      {maridajes.length > 0 && (
        <div className="pt-2 border-t border-border/40 space-y-3 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium inline-flex items-center justify-center gap-1.5">
            <UtensilsCrossed size={14} className="text-primary" />
            <span>Maridajes Sugeridos de Origen</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
            {maridajes.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-surface-sunken/60 border border-border/40 space-y-0.5"
              >
                <p className="text-xs font-bold text-foreground">{m.titulo}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{m.detalle}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Momento de Consumo */}
      {perfilSensorial?.momento_consumo && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
          <Clock size={14} className="text-primary shrink-0" />
          <span>
            <strong className="text-foreground">Momento sugerido:</strong> {perfilSensorial.momento_consumo}
          </span>
        </div>
      )}
    </section>
  );
}
