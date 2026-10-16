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
}: PerfilSensorialSectionProps) {
  const chartId = useId();
  const [selectedVarianteId, setSelectedVarianteId] = useState<string | null>(null);

  const selectedVariante = useMemo(
    () => variantes?.find((v) => v.id === selectedVarianteId) ?? null,
    [variantes, selectedVarianteId],
  );

  // Perfil activo según variante o base de producto
  const activePerfil = useMemo(() => {
    if (
      selectedVariante?.perfil_sensorial_override &&
      typeof selectedVariante.perfil_sensorial_override === 'object'
    ) {
      return selectedVariante.perfil_sensorial_override as ShopProduct['perfil_sensorial'];
    }
    return perfilSensorial;
  }, [selectedVariante, perfilSensorial]);

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
            varianteId: selectedVarianteId,
          },
        }),
      );
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 space-y-8" id="constelacion-sensorial">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border/50">
        <div>
          <p className="text-editorial-xs uppercase tracking-[0.25em] text-primary font-medium flex items-center gap-1.5">
            <Compass size={13} className="text-primary" />
            <span>Expresión Botánica de Origen</span>
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mt-1">
            Constelación Sensorial de Cata
          </h2>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
          <ShieldCheck size={13} />
          <span>Triangulación Científica & Perceptual</span>
        </span>
      </div>

      {/* Selector de Curaduría por Variante / Fortificación */}
      {variantes && variantes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-surface-sunken/50 border border-border/40">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
            Curaduría por variante:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedVarianteId(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition min-h-[36px] ${
                selectedVarianteId === null
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              Base de Origen
            </button>
            {variantes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVarianteId(v.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition min-h-[36px] ${
                  selectedVarianteId === v.id
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                }`}
              >
                {v.nombre_variante}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
        Triangulación sensorial de origen para <strong className="text-foreground">{selectedVariante ? selectedVariante.nombre_variante : productName}</strong>.
        Convergencia de tres fuentes de verdad: los parámetros biofísicos de la especie por literatura científica y lote, la calibración canónica del curador
        y los registros de cata reales aportados por la comunidad.
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

          {/* Leyenda transparente de las 3 capas */}
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
                Exoesqueleto (Laboratorio)
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
                Núcleo Curatorial
              </span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  userData ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-muted-foreground/30'
                }`}
              />
              <span className={userData ? 'text-rose-400 font-medium' : 'text-muted-foreground/50'}>
                Comunidad ({communityStats.total})
              </span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Estado de Verificación de las 3 Fuentes */}
        <div className="lg:col-span-5 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-border/40 pt-5 lg:pt-0 lg:pl-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Compass size={15} className="text-primary" />
              <span>Triangulación de Origen & Percepción</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Datos trazables basados en ciencia botánica, cata canónica y registros comunitarios reales.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {/* Fuente 1: Laboratorio / Botánica */}
            <div className="p-3 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-cyan-400 flex items-center gap-1.5 font-semibold">
                  <FlaskConical size={13} />
                  <span>Capa 1 · Referencia Botánica & Lote</span>
                </span>
                {botanicalRef ? (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Triangulada
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
                  Referencia botánica en proceso de catalogación científica en Núcleo.
                </p>
              )}
            </div>

            {/* Fuente 2: Núcleo Curatorial */}
            <div className="p-3 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-primary flex items-center gap-1.5 font-semibold">
                  <ShieldCheck size={13} />
                  <span>Capa 2 · Calibración Oficial Curatorial</span>
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
                  Calibración curatorial no asignada aún en Núcleo para esta creación.
                </p>
              )}
            </div>

            {/* Fuente 3: Comunidad Real */}
            <div className="p-3 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-rose-400 flex items-center gap-1.5 font-semibold">
                  <Users size={13} />
                  <span>Capa 3 · Percepción Colectiva Real</span>
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
                    {communityStats.total} {communityStats.total === 1 ? 'cata comunitaria registrada' : 'catas comunitarias registradas'}
                    {communityStats.avgRating ? ` · Promedio: ${communityStats.avgRating.toFixed(1)} / 7` : ''}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {communityStats.consolidated
                      ? 'Perfil colectivo consolidado bajo el protocolo experimental ST-CATA.'
                      : 'Acumulando sesiones de evaluación sensorial para alcanzar el umbral de consolidación formal (30 registros).'}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Aún no hay registros de cata comunitaria para esta creación. Cada evaluación real enriquece la constelación.
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
            <span>Aportar mi Cata a la Constelación</span>
          </button>
        </div>
      </div>

      {/* Notas Organolépticas de Cata (Estrictamente reales o mensaje honesto) */}
      <div className="pt-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
          Notas Organolépticas de Origen
        </p>
        {notasAromaticas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
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
        <div className="pt-2 border-t border-border/40 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
            <UtensilsCrossed size={14} className="text-primary" />
            <span>Maridajes Sugeridos de Origen</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={14} className="text-primary shrink-0" />
          <span>
            <strong className="text-foreground">Momento sugerido:</strong> {perfilSensorial.momento_consumo}
          </span>
        </div>
      )}
    </section>
  );
}
