'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Boxes,
  BookOpen,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileCheck2,
  ArrowRight,
  Move,
  Maximize2,
} from 'lucide-react';
import type { ColmenaWithRelations } from '@/lib/apicultor-types';
import { GemeloApiario } from '@/components/apicultor/GemeloApiario';

function createDemoColmena({
  id,
  name,
  alzas,
  marcos_cria,
  marcos_miel,
  peso_kg,
  varroa_level,
  notes,
}: {
  id: string;
  name: string;
  alzas: number;
  marcos_cria: number;
  marcos_miel: number;
  peso_kg: number;
  varroa_level: number;
  notes: string;
}): ColmenaWithRelations {
  return {
    id,
    name,
    alzas,
    apiario_id: 'apiario-pureo',
    apiario_name: 'La manga · Pureo',
    blockchain_hash: null,
    created_at: '2026-01-10T00:00:00Z',
    floracion: alzas > 0 ? 'Ulmo' : null,
    health: 'optimal',
    last_inspection: '2026-03-28',
    lote_activo: null,
    notes,
    nucleos_candidatos: false,
    origen_colmena_madre: null,
    origen_detalle: null,
    origen_fecha: null,
    origen_tipo: null,
    production_total: alzas > 1 ? 19 : alzas > 0 ? 12 : 0,
    queen: 'activa',
    updated_at: '2026-03-28T00:00:00Z',
    user_id: 'demo-user',
    inspecciones: [
      {
        id: `insp-${id}`,
        colmena_id: id,
        date: '2026-03-28',
        marcos_cria,
        marcos_miel,
        poblacion: 'alta',
        reina: true,
        varroa: varroa_level,
        notes,
        user_id: 'demo-user',
        created_at: '2026-03-28T12:00:00Z',
        inspector: 'Gabriel Gómez',
        fase: 'produccion',
        enjambrazon_riesgo: 'bajo',
        foto_url: null,
      },
    ],
    varroa_records: [
      {
        id: `var-${id}`,
        colmena_id: id,
        date: '2026-03-28',
        level: varroa_level,
        method: 'azucar_flor',
        user_id: 'demo-user',
        created_at: '2026-03-28T12:00:00Z',
      },
    ],
    peso_records: [
      {
        id: `peso-${id}`,
        colmena_id: id,
        date: '2026-03-28',
        kg: peso_kg,
        note: null,
        user_id: 'demo-user',
        created_at: '2026-03-28T12:00:00Z',
      },
    ],
  };
}

// Datos realistas de demostración para el apiario Pureo en Chiloé
const DEMO_COLMENAS: ColmenaWithRelations[] = [
  createDemoColmena({
    id: 'c-4',
    name: 'Colmena # 4',
    alzas: 1,
    marcos_cria: 6,
    marcos_miel: 5,
    peso_kg: 34.2,
    varroa_level: 1.1,
    notes: 'Cámara de cría estable. Postura regular y abundante pecoreo en bosque.',
  }),
  createDemoColmena({
    id: 'c-5',
    name: 'Colmena # 5',
    alzas: 2,
    marcos_cria: 7,
    marcos_miel: 8,
    peso_kg: 42.5,
    varroa_level: 0.8,
    notes: 'Segunda alza melaria con operculado avanzado de miel de ulmo.',
  }),
  createDemoColmena({
    id: 'c-1',
    name: 'Colmena # 1',
    alzas: 1,
    marcos_cria: 6,
    marcos_miel: 4,
    peso_kg: 29.8,
    varroa_level: 1.4,
    notes: 'Buena postura concéntrica. Cámara limpia y reservas suficientes.',
  }),
  createDemoColmena({
    id: 'c-2',
    name: 'Colmena # 2',
    alzas: 0,
    marcos_cria: 5,
    marcos_miel: 3,
    peso_kg: 22.4,
    varroa_level: 1.2,
    notes: 'Núcleo de temporada pasada completando cámara de cría.',
  }),
  createDemoColmena({
    id: 'c-3',
    name: 'Colmena # 3',
    alzas: 1,
    marcos_cria: 6,
    marcos_miel: 5,
    peso_kg: 33.1,
    varroa_level: 1.0,
    notes: 'Alza de media alza completada. Comportamiento higiénico sobresaliente.',
  }),
];

import type { TerritorioHerramientasContent } from '@/lib/territorio-cms';

type ShowcaseTab = 'apiario' | 'cuaderno' | 'territorio';

export interface HerramientasApicolasShowcaseProps {
  content?: TerritorioHerramientasContent;
}

export function HerramientasApicolasShowcase({ content }: HerramientasApicolasShowcaseProps = {}) {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('apiario');
  const [selectedColmenaId, setSelectedColmenaId] = useState<string>('c-4');
  const [isInteracting3D, setIsInteracting3D] = useState(false);

  const selectedColmena =
    DEMO_COLMENAS.find((c) => c.id === selectedColmenaId) ?? DEMO_COLMENAS[0];

  const badge = content?.badge || 'Herramientas de trabajo apícola';
  const title = content?.title || 'Tu apiario en orden: colección de colmenas y cuaderno digital';
  const description =
    content?.description ||
    'Todo lo necesario para ordenar tus cajones, llevar tu historial sanitario y cumplir la normativa apícola oficial sin papeles sueltos que se deterioren en el bosque. Sin costo para siempre.';

  return (
    <section
      id="herramientas"
      data-cms-section="territorio_herramientas"
      className="px-6 sm:px-10 lg:px-16 xl:px-24 py-20 sm:py-28 border-b border-border/60"
    >
      <div className="max-w-6xl mx-auto">
        {/* Cabecera de la sección */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase font-semibold">
              {badge}
            </span>
            <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-mono font-medium">
              Suelo Base $0
            </span>
          </div>
          <h2 className="section-reveal text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground font-existencial mb-4">
            {title}
          </h2>
          <p className="section-reveal text-muted-foreground leading-relaxed text-base sm:text-lg">
            {description}
          </p>
        </div>

        {/* Selector de pestañas interactivas */}
        <div className="flex flex-wrap items-center gap-2 mb-8 p-1.5 rounded-xl bg-surface-sunken/80 border border-border/70 max-w-fit shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('apiario')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'apiario'
                ? 'bg-surface-raised text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Boxes className="w-4 h-4 text-primary" />
            <span>Colección y Apiario Digital (3D)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cuaderno')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'cuaderno'
                ? 'bg-surface-raised text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Cuaderno de Campo Digital (Res. SAG 4.590)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('territorio')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'territorio'
                ? 'bg-surface-raised text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapPin className="w-4 h-4 text-primary" />
            <span>Capas y Asistente SAG de Octubre</span>
          </button>
        </div>

        {/* ─── PESTAÑA 1: COLECCIÓN Y APIARIO DIGITAL ─── */}
        {activeTab === 'apiario' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Tarjetas superiores de colmenas activas (Fiel a la vista de patio) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DEMO_COLMENAS.slice(0, 3).map((colmena) => {
                const isSelected = selectedColmena.id === colmena.id;
                const insp = colmena.inspecciones?.[0];
                const nAlzas = colmena.alzas ?? 0;
                return (
                  <div
                    key={colmena.id}
                    onClick={() => setSelectedColmenaId(colmena.id)}
                    className={`rounded-xl border p-4 transition-all cursor-pointer text-left relative ${
                      isSelected
                        ? 'border-primary/80 bg-surface-raised shadow-md ring-1 ring-primary/30'
                        : 'border-border/70 bg-card/70 hover:border-border hover:bg-surface-sunken/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                        <h4 className="font-existencial font-bold text-base text-foreground">
                          {colmena.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                        Estable
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      {nAlzas === 0
                        ? 'Cámara de cría · Sin floración activa'
                        : `${nAlzas} alza${nAlzas > 1 ? 's' : ''} melaria${nAlzas > 1 ? 's' : ''} · Floración activa`}
                    </p>

                    <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-border/50 text-xs font-mono">
                      <div>
                        <div className="text-[9px] text-muted-foreground uppercase">Peso</div>
                        <div className="font-semibold text-foreground">{colmena.peso_records?.[0]?.kg ?? '—'}k</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-muted-foreground uppercase">Varroa</div>
                        <div className="font-semibold text-emerald-500">{colmena.varroa_records?.[0]?.level}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-muted-foreground uppercase">Visita</div>
                        <div className="font-semibold text-foreground">Reciente</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-muted-foreground uppercase">Cría</div>
                        <div className="font-semibold text-primary">{insp?.marcos_cria ?? '—'}m</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contenedor del Apiario Digital 3D */}
            <div className="relative rounded-xl overflow-hidden border border-border/80 bg-background shadow-lg">
              <div
                className={`relative w-full ${
                  isInteracting3D ? 'pointer-events-auto' : 'pointer-events-none sm:pointer-events-auto'
                }`}
              >
                <GemeloApiario
                  colmenas={DEMO_COLMENAS}
                  apiarioName="La manga · Pureo"
                  titleLabel="Apiario Digital · Chiloé"
                  subtitleLabel="Arquitectura Langstroth de madera y zinc · telemetría de patio sin sensores invasivos"
                  onSelectColmena={(c) => setSelectedColmenaId(c.id)}
                />
              </div>

              {/* Touch Guard para móviles (evita capturar el scroll) */}
              {!isInteracting3D && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsInteracting3D(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsInteracting3D(true);
                    }
                  }}
                  aria-label="Tocar para interactuar con el apiario digital 3D"
                  className="sm:hidden absolute inset-0 bg-background/25 backdrop-blur-[0.5px] flex items-center justify-center p-4 cursor-pointer"
                >
                  <div className="bg-background/95 border border-border/80 text-foreground px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium active:scale-95 transition-transform">
                    <Move className="w-3.5 h-3.5 text-primary" />
                    <span>Toca para explorar el apiario digital 3D</span>
                  </div>
                </div>
              )}

              {isInteracting3D && (
                <div className="sm:hidden absolute top-3 right-3 z-20 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInteracting3D(false)}
                    className="bg-background/95 text-foreground border border-border/70 text-[11px] px-3 py-1.5 rounded-md shadow-md font-medium"
                  >
                    Bloquear scroll
                  </button>
                </div>
              )}
            </div>

            {/* Puntos clave del apiario digital */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-border/60 bg-surface-sunken/40 space-y-1.5">
                <span className="font-mono text-xs text-primary uppercase font-bold tracking-wider">
                  Cero Sensores Invasivos
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El estado de cada colmena se proyecta desde tus notas de inspección y visitas reales, sin instalar hardware costoso ni alterar el nido de cría.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-surface-sunken/40 space-y-1.5">
                <span className="font-mono text-xs text-primary uppercase font-bold tracking-wider">
                  Fidelidad Langstroth
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cámaras de cría, alzas melarias apiladas, pisos de madera y cubiertas de zinc galvanizado sobre suelo húmedo de bosque nativo.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-surface-sunken/40 space-y-1.5">
                <span className="font-mono text-xs text-primary uppercase font-bold tracking-wider">
                  Poder de Decisión Rápido
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Identifica al instante cajones con alza madura lista para recolección, colmenas con reina por revisar o necesidad de intervención fitosanitaria.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── PESTAÑA 2: CUADERNO DE CAMPO DIGITAL (RES. SAG 4.590/2025) ─── */}
        {activeTab === 'cuaderno' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="rounded-xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-md">
              {/* Encabezado foliado del cuaderno */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/70">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
                      Hoja de Inspección Foliada
                    </span>
                    <span className="text-[10px] font-mono bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded">
                      Folio #2026-CH-048
                    </span>
                  </div>
                  <h3 className="font-existencial text-xl sm:text-2xl font-bold text-foreground">
                    Apiario Pureo · Colmena # 5
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Visita realizada el 28 de marzo de 2026 · Inspector: Gabriel Gómez (Titular del Apiario)
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-mono font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Conforme Res. SAG 4.590/2025
                  </span>
                </div>
              </div>

              {/* Cuerpo de la hoja: Desglose de Bastidores */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">
                    1. Clasificación Funcional de Bastidores
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-surface-sunken border border-border/60">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase block">Cría abierta</span>
                      <span className="text-lg font-bold text-foreground font-mono">4 marcos</span>
                      <span className="text-[10px] text-primary block mt-0.5">Postura en espiral</span>
                    </div>

                    <div className="p-3 rounded-lg bg-surface-sunken border border-border/60">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase block">Cría cerrada</span>
                      <span className="text-lg font-bold text-foreground font-mono">3 marcos</span>
                      <span className="text-[10px] text-primary block mt-0.5">Operculado parejo</span>
                    </div>

                    <div className="p-3 rounded-lg bg-surface-sunken border border-border/60">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase block">Miel nativa</span>
                      <span className="text-lg font-bold text-foreground font-mono">8 marcos</span>
                      <span className="text-[10px] text-accent block mt-0.5">Ulmo y tiaca</span>
                    </div>

                    <div className="p-3 rounded-lg bg-surface-sunken border border-border/60">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase block">Cera labrada</span>
                      <span className="text-lg font-bold text-foreground font-mono">5 marcos</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Estructura limpia</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-raised/60 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Estado de la Reina:</span>
                      <span className="text-foreground font-bold font-mono">RV (Reina Vista) · Marcada 2025</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Comportamiento del nido:</span>
                      <span className="text-foreground font-medium">Mansedumbre óptima · Sin enjambrazón</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Alzas instaladas:</span>
                      <span className="text-primary font-bold">2 Cuerpos melarios</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">
                    2. Trazabilidad Sanitaria y Resguardo
                  </h4>

                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Alerta de Período de Retiro: Inocuidad Total</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sin tratamientos con químicos residuales activos. El apiario se encuentra habilitado para postura de alzas melarias y recolección para consumo humano.
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-muted-foreground border-t border-emerald-500/20">
                      <span>Muestreo Varroa:</span>
                      <span className="text-emerald-500 font-bold">0.8% (Óptimo)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/60 bg-surface-sunken/40 space-y-2">
                    <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                      <FileCheck2 className="w-4 h-4 shrink-0" />
                      <span>Exportación Oficial Foliada</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Genera el informe oficial en PDF en cualquier momento, listo para ser exhibido ante fiscalizaciones del SAG sin depender de hojas de papel en el patio.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dictado por voz en patio */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Dictado por voz libre en terreno (sin quitarte los guantes)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Habla en el apiario de la colmena 4, salta a la 5 y vuelve a la 1; el sistema reconoce cada colmena por voz y organiza las fichas en orden cronológico.
                  </p>
                </div>
                <div className="text-xs font-mono text-primary font-semibold shrink-0 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                  Tolerante a desconexión
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── PESTAÑA 3: CAPAS TERRITORIALES Y ASISTENTE SAG ─── */}
        {activeTab === 'territorio' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Capa de pecoreo y distancias */}
              <div className="rounded-xl border border-border/80 bg-card p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-existencial text-lg font-bold text-foreground mb-1">
                    Capa de Distanciamiento Legal (Ley 21.489)
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Si un colmenar trashumante declara su ingreso en la comuna, el sistema calcula de inmediato las distancias perimetrales mínimas fijadas por ley para evitar saturación de la flora y transmisión de patógenos.
                  </p>
                </div>
                <div className="pt-2 border-t border-border/60 text-xs font-mono text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Zona de pecoreo:</span>
                    <span className="text-foreground font-semibold">Radio difuso ~1 km protegido</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coordenada GPS exacta:</span>
                    <span className="text-primary font-semibold">Privada y encriptada</span>
                  </div>
                </div>
              </div>

              {/* Capa de alertas fitosanitarias */}
              <div className="rounded-xl border border-border/80 bg-card p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-existencial text-lg font-bold text-foreground mb-1">
                    Capa de Alertas Fitosanitarias (Res. SAG 7.068/2024)
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Canal confidencial para enterarte si un predio agrícola vecino aplicará plaguicidas, con hasta 48 horas de anticipación para cerrar piqueras o proteger tu colmenar.
                  </p>
                </div>
                <div className="pt-2 border-t border-border/60 text-xs font-mono text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Anticipación de aviso:</span>
                    <span className="text-foreground font-semibold">Hasta 48 horas</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Radio de resguardo:</span>
                    <span className="text-amber-500 font-semibold">3 a 5 km directos</span>
                  </div>
                </div>
              </div>

              {/* Asistente SAG de Octubre */}
              <div className="rounded-xl border border-border/80 bg-card p-6 space-y-4 md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-existencial text-lg font-bold text-foreground">
                      Asistente para la Declaración Anual SAG de Octubre
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Cumple con la obligación anual del Servicio Agrícola y Ganadero sin cálculos manuales de última hora.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-sunken border border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Existencias consolidadas:</span>
                    <span className="font-bold text-foreground font-mono text-sm">Cómputo en 1 clic</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Suma de cajones activos por apiario</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Formulario SIPEC pre-llenado:</span>
                    <span className="font-bold text-foreground font-mono text-sm">Datos ordenados</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Comuna, sector, RUP y georreferencia</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Costo administrativo:</span>
                    <span className="font-bold text-primary font-mono text-sm">$0 CLP</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Incluido en el censo universal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Llamado a la acción inferior */}
        <div className="mt-12 p-6 sm:p-8 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h4 className="font-existencial text-lg sm:text-xl font-bold text-foreground">
              Comienza a gestionar tu apiario y tus colmenas hoy
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Inscríbete gratis en el Registro Territorial y accede de inmediato a tu cuaderno digital, fichas de cajones y mapa de pecoreo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/login?mode=signup"
              className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95 transition-opacity shadow-sm"
            >
              <span>Inscribirme y usar herramientas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/planes-territoriales"
              className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver planes avanzados
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
