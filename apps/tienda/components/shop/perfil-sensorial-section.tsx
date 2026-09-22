'use client';

import { useId, useState, useMemo } from 'react';
import { UtensilsCrossed, Clock, Sparkles, Compass, ShieldCheck } from 'lucide-react';
import type { ShopProduct } from '@/lib/shop/products';

export interface PerfilSensorialSectionProps {
  productName: string;
  perfilSensorial?: ShopProduct['perfil_sensorial'];
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
  perfilSensorial,
}: PerfilSensorialSectionProps) {
  const chartId = useId();

  // 1. Capa Exoesqueleto (Laboratorio / Parámetros biofísicos objetivos del lote)
  const labData = useMemo(() => [8.5, 9.0, 7.5, 6.2, 4.2, 8.0, 7.2, 9.4], []);

  // 2. Capa Núcleo Curatorial (Calibración oficial del sommelier / maestro apícola)
  const curatorData = useMemo(() => {
    const int = (perfilSensorial?.intensidad ?? 78) / 10;
    const dulz = (perfilSensorial?.dulzor_acidez ?? 62) / 10;
    const text = (perfilSensorial?.textura ?? 85) / 10;
    const acidez = Math.max(1.5, Number((10 - dulz).toFixed(1)));

    return [
      8.0, // Madurez Enzimática
      8.6, // Complejidad Botánica
      dulz, // Dulzor
      text, // Textura
      acidez, // Tensión Ácida
      int, // Densidad Metabólica
      7.6, // Sinergia Cafeínica
      9.0, // Vector Territorial
    ];
  }, [perfilSensorial]);

  // 3. Capa Nebulosa (Tu Aporte & Percepción Viva de la Comunidad)
  const [userSliders, setUserSliders] = useState({
    dulzor: 6.5,
    textura: 7.2,
    tension: 5.0,
    synergy: 6.0,
  });

  const userData = useMemo(() => [
    6.8, // Madurez Enzimática
    7.5, // Complejidad Botánica
    userSliders.dulzor, // Dulzor (slider)
    userSliders.textura, // Textura (slider)
    userSliders.tension, // Tensión Ácida (slider)
    7.0, // Densidad Metabólica
    userSliders.synergy, // Sinergia Cafeínica (slider)
    8.0, // Vector Territorial
  ], [userSliders]);

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

  const notasAromaticas =
    perfilSensorial?.notas_aromaticas && perfilSensorial.notas_aromaticas.length > 0
      ? perfilSensorial.notas_aromaticas
      : ['Flor de Ulmo', 'Corteza de Tiaca', 'Avellana Tostada', 'Notas Balsámicas', 'Caramelo Crudo'];

  const maridajes = perfilSensorial?.maridajes ?? [];

  const handleDejarHuella = () => {
    // Desplaza suavemente hacia el bloque de reseñas y dispara apertura del compositor
    const vocesEl = document.getElementById('voces-del-bosque');
    if (vocesEl) {
      vocesEl.scrollIntoView({ behavior: 'smooth' });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('enjambre:open-resena-composer', {
          detail: {
            intensidad: Math.round(userData[5]),
            dulzor: Math.round(userData[2]),
            textura: Math.round(userData[3]),
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
            <Sparkles size={13} className="text-primary" />
            <span>Expresión Botánica de Origen</span>
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mt-1">
            Constelación Sensorial de Cata
          </h2>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
          <ShieldCheck size={13} />
          <span>Sistema Dinámico de Triangulación</span>
        </span>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
        Triangulación sensorial de origen para <strong className="text-foreground">{productName}</strong>.
        Convergen tres capas de lectura: el análisis biofísico de laboratorio, la calibración canónica de curaduría
        y la nebulosa viva de percepciones compartidas.
      </p>

      {/* Visualización Principal: Radar + Controles de Interacción */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface-sunken/40 rounded-2xl p-5 sm:p-7 border border-border/40">
        
        {/* Columna Izquierda: Radar SVG */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[350px] aspect-square">
            <svg
              viewBox="0 0 350 350"
              className="w-full h-full select-none overflow-visible"
              aria-label={`Constelación sensorial para ${productName}`}
            >
              {/* Filtro de resplandor para la nebulosa */}
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

              {/* Capa 1: Exoesqueleto (Laboratorio / Análisis biofísico objetivo) */}
              <polygon
                points={toPolygonPoints(labData)}
                fill="none"
                stroke="rgba(6, 182, 212, 0.75)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="transition-all duration-700 ease-out"
              />

              {/* Capa 2: Núcleo (Curador / Calibración Oficial) */}
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

              {/* Capa 3: Nebulosa (Tu Aporte & Comunidad Viva) */}
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
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full border border-cyan-400 border-dashed bg-cyan-400/20" />
              <span>Exoesqueleto (Lab)</span>
            </div>
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-foreground font-medium">Núcleo Curatorial</span>
            </div>
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              <span className="text-rose-400 font-medium">Tu Aporte (Nebulosa)</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Deslizadores de Interacción del Cliente */}
        <div className="lg:col-span-5 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-border/40 pt-5 lg:pt-0 lg:pl-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Compass size={15} className="text-primary" />
              <span>Explora y Habita la Constelación</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Modula los deslizadores para proyectar tu percepción sobre el nodo colectivo.
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Slider 1: Dulzor */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Arquitectura del Dulzor</span>
                <span className="text-rose-400 font-semibold">{userSliders.dulzor} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={userSliders.dulzor}
                onChange={(e) =>
                  setUserSliders((prev) => ({ ...prev, dulzor: parseFloat(e.target.value) }))
                }
                className="w-full accent-rose-500 h-1.5 bg-border rounded-lg cursor-pointer"
                aria-label="Arquitectura del Dulzor"
              />
            </div>

            {/* Slider 2: Textura */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Textura & Persistencia</span>
                <span className="text-rose-400 font-semibold">{userSliders.textura} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={userSliders.textura}
                onChange={(e) =>
                  setUserSliders((prev) => ({ ...prev, textura: parseFloat(e.target.value) }))
                }
                className="w-full accent-rose-500 h-1.5 bg-border rounded-lg cursor-pointer"
                aria-label="Textura & Persistencia"
              />
            </div>

            {/* Slider 3: Tensión Ácida */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Tensión Amargo / Ácida</span>
                <span className="text-rose-400 font-semibold">{userSliders.tension} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={userSliders.tension}
                onChange={(e) =>
                  setUserSliders((prev) => ({ ...prev, tension: parseFloat(e.target.value) }))
                }
                className="w-full accent-rose-500 h-1.5 bg-border rounded-lg cursor-pointer"
                aria-label="Tensión Amargo / Ácida"
              />
            </div>

            {/* Slider 4: Sinergia Cafeínica */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Sinergia Cafeínica & Maridaje</span>
                <span className="text-rose-400 font-semibold">{userSliders.synergy} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={userSliders.synergy}
                onChange={(e) =>
                  setUserSliders((prev) => ({ ...prev, synergy: parseFloat(e.target.value) }))
                }
                className="w-full accent-rose-500 h-1.5 bg-border rounded-lg cursor-pointer"
                aria-label="Sinergia Cafeínica"
              />
            </div>
          </div>

          {/* Botón de acción: Dejar Huella */}
          <button
            type="button"
            onClick={handleDejarHuella}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold uppercase tracking-wider transition-all min-h-11 shadow-sm"
          >
            <Sparkles size={14} />
            <span>Dejar Huella en la Expresión Botánica</span>
          </button>
        </div>
      </div>

      {/* Notas Organolépticas de Cata */}
      <div className="pt-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
          Notas Organolépticas de Origen
        </p>
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
