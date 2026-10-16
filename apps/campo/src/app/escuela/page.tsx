'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type EscuelaMaterialLocal, type ProductoLocal } from '@/lib/offline/db';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@enjambre/auth';
import {
  GraduationCap,
  Compass,
  UtensilsCrossed,
  HelpCircle,
  Maximize2,
  Minimize2,
  ChevronDown,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Volume2,
  Award,
} from 'lucide-react';
import { formatCLP } from '@enjambre/ui';
import { PosHeader } from '@/components/pos/pos-header';

interface ObjecionGuia {
  id: string;
  categoria: 'pureza' | 'precio' | 'cristalizacion' | 'origen' | 'salud';
  pregunta: string;
  respuestaCorta: string;
  fundamento: string;
}

const OBJECIONES_CANONICAS: ObjecionGuia[] = [
  {
    id: 'cristalizacion',
    categoria: 'cristalizacion',
    pregunta: '¿Por qué la miel se pone sólida o cristaliza?',
    respuestaCorta: 'Es el certificado biológico de pureza. La miel virgen y cruda siempre cristaliza.',
    fundamento:
      'La cristalización natural ocurre porque los azúcares vivos y el polen nativo no fueron destruidos por sobrecalentamiento. Si una miel comercial permanece líquida todo el año en el supermercado, ha sido pasteurizada a altas temperaturas, perdiendo sus enzimas bioactivas. Si prefiere textura fluida, basta templar a baño María bajo 40°C.',
  },
  {
    id: 'precio',
    categoria: 'precio',
    pregunta: '¿Por qué tiene un valor más alto que otras mieles?',
    respuestaCorta: 'Representa una recolección estacional limitada de bosque nativo virgen en Chiloé.',
    fundamento:
      'No practicamos trashumancia forzada ni alimentamos las colmenas con jarabes de fructosa industrial para inflar volumen. Cada frasco es un extracto monofloral de árboles milenarios (Ulmo, Tiaca, Tepú) recolectado por abejas vírgenes en fiordos protegidos. Es maestría apícola de alta gama con trazabilidad verificable.',
  },
  {
    id: 'pureza',
    categoria: 'pureza',
    pregunta: '¿Está mezclada o tiene azúcar añadida?',
    respuestaCorta: '100% miel cruda de abeja virgen, sin mezclas, aditivos ni conservantes.',
    fundamento:
      'Cada lote tiene un análisis de humedad estricto inferior al 18% (garantía de maduración natural en panal) y extracción por centrifugado en frío. Puede escanear el código QR del envase para auditar el lote y el apiario de origen.',
  },
  {
    id: 'ninos',
    categoria: 'salud',
    pregunta: '¿Pueden consumirla niños pequeños?',
    respuestaCorta: 'Apta para toda la familia a partir de 1 año de edad.',
    fundamento:
      'Por recomendación médica de la OMS y el MINSAL para cualquier miel natural en el mundo, no debe administrarse a lactantes menores de 12 meses debido a la inmadurez de su flora digestiva. Para mayores de un año, es un alimento noble de máxima bioactividad.',
  },
  {
    id: 'conservacion',
    categoria: 'pureza',
    pregunta: '¿Cómo debo guardarla en casa?',
    respuestaCorta: 'En despensa, en lugar fresco, seco y oscuro. Jamás en el refrigerador.',
    fundamento:
      'La miel no vence si se mantiene bien cerrada. El frío del refrigerador acelera una cristalización áspera y absorbe olores ajenos. En un rincón de su despensa conservará todos sus aromas florales intactos por años.',
  },
];

interface QuizPregunta {
  pregunta: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

// Fallback canónico offline: Núcleo puede editar el banco (escuela_material),
// Campo lo precarga en Dexie cuando hay señal.
const CANONICAL_QUIZ: QuizPregunta[] = [
  {
    pregunta: 'Un cliente dice que la miel se puso sólida. ¿Qué respondes?',
    opciones: [
      'Es el certificado de pureza: la miel cruda siempre cristaliza',
      'Está vencida, hay que descartarla',
      'Le falta filtrado industrial',
      'Se guardó en un lugar muy caliente',
    ],
    correcta: 0,
    explicacion: 'La cristalización prueba que no fue sobrecalentada ni pasteurizada.',
  },
  {
    pregunta: '¿Por qué vale más que la miel de supermercado?',
    opciones: [
      'Recolección estacional limitada de bosque nativo, sin jarabes ni trashumancia forzada',
      'Porque el envase es más bonito',
      'Porque se importa',
      'Porque tiene conservantes premium',
    ],
    correcta: 0,
    explicacion: 'Monofloral de Ulmo/Tiaca/Tepú con trazabilidad verificable.',
  },
  {
    pregunta: '¿Cómo respaldas que no tiene azúcar añadida?',
    opciones: [
      'Humedad menor a 18% y QR de trazabilidad al lote y apiario',
      'Por el color dorado',
      'Por la marca del supermercado',
      'No se puede respaldar',
    ],
    correcta: 0,
    explicacion: 'Análisis de humedad y centrifugado en frío, auditable por QR.',
  },
  {
    pregunta: '¿Desde qué edad la recomiendas?',
    opciones: [
      'Desde 1 año (nunca en lactantes menores de 12 meses)',
      'Desde el nacimiento',
      'Solo adultos',
      'Solo mayores de 60',
    ],
    correcta: 0,
    explicacion: 'OMS/MINSAL: ninguna miel en menores de 12 meses.',
  },
  {
    pregunta: '¿Cómo debe guardarla el cliente?',
    opciones: [
      'Despensa fresca, seca y oscura; jamás refrigerador',
      'En el refrigerador',
      'Cerca de la cocina caliente',
      'En el congelador',
    ],
    correcta: 0,
    explicacion: 'El frío acelera cristalización áspera y absorbe olores.',
  },
];

const GUIONES_APERTURA = [
  {
    tipo: 'Apertura Rápida (15 Segundos)',
    contexto: 'Cliente que pasa mirando o se detiene brevemente',
    guion:
      '«Hola, buenos días. ¿Te gustaría degustar miel cruda de floración de Ulmo de los bosques nativos de Chiloé? Es miel virgen, centrifugada en frío sin pasteurizar.»',
    consejo: 'Ofrecer inmediatamente la paleta degustadora. El sabor habla antes que las palabras.',
  },
  {
    tipo: 'Propuesta de Origen (60 Segundos)',
    contexto: 'Cliente interesado que pregunta por la marca o diferencia',
    guion:
      '«Enjambre Legado trabaja exclusivamente con abejas vírgenes en el archipiélago de Chiloé. No trasladamos colmenas a monocultivos agrícolas con pesticidas; recolectamos únicamente cuando los árboles del bosque templado lluvioso abren su floración. Esta que pruebas es de Ulmo: notas a caramelo suave, textura cremosa y un perfil floral inconfundible.»',
    consejo: 'Destacar la pureza del bosque austral y la ausencia de pesticidas o jarabes.',
  },
];

type EscuelaTab = 'argumentarios' | 'objeciones' | 'guiones' | 'atril' | 'quiz';
type EscuelaAccion = 'apertura_guia_cata' | 'consulta_objecion' | 'modo_atril' | 'quiz_completado';

export interface EscuelaDeVentaPageProps {}

export default function EscuelaDeVentaPage(_props: EscuelaDeVentaPageProps = {}) {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<EscuelaTab>('argumentarios');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [filtroObjecion, setFiltroObjecion] = useState<string>('todas');
  const [expandedObjecion, setExpandedObjecion] = useState<string | null>('cristalizacion');
  const [isAtrilFullscreen, setIsAtrilFullscreen] = useState(false);

  // Consulta offline directa a Dexie
  const productos = useLiveQuery(
    () => db.productos.filter((p) => p.visible !== false).toArray(),
    [],
  );

  // Seleccionar primer producto por defecto cuando cargue
  useEffect(() => {
    if (productos && productos.length > 0 && !selectedProductId) {
      setSelectedProductId(productos[0].id);
    }
  }, [productos, selectedProductId]);

  const selectedProduct: ProductoLocal | undefined = useMemo(() => {
    return productos?.find((p) => p.id === selectedProductId) || productos?.[0];
  }, [productos, selectedProductId]);

  // Telemetría offline-first: intento directo y, sin señal, outbox Dexie
  // que se vacía al reconectar (antes se perdía en feria sin red).
  const flushEscuelaOutbox = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    try {
      const pendientes = await db.escuela_outbox.orderBy('created_at').toArray();
      for (const item of pendientes) {
        const { id, ...row } = item;
        const { error } = await supabase.from('rep_ventas_capacitacion_logs').insert(row);
        if (error) return;
        if (id != null) await db.escuela_outbox.delete(id);
      }
    } catch (err) {
      console.warn('[escuela] Error al vaciar outbox offline:', err);
    }
  }, []);

  const registrarTelemetria = useCallback(async (accion: EscuelaAccion, detalle: Record<string, unknown>) => {
    if (!selectedProduct) return;
    const row = {
      user_id: user?.id || null,
      producto_id: selectedProduct.id,
      producto_nombre: selectedProduct.nombre || 'Producto',
      accion,
      detalle,
    };
    try {
      const { error } = await supabase.from('rep_ventas_capacitacion_logs').insert(row);
      if (error) throw error;
      void flushEscuelaOutbox();
    } catch (err) {
      console.warn('[Escuela] Falló registro online, guardando en outbox offline:', err);
      await db.escuela_outbox.add({ ...row, created_at: Date.now() });
    }
  }, [selectedProduct, user?.id, flushEscuelaOutbox]);

  // Material de Núcleo (banco de quiz) + vaciado de outbox al volver la señal.
  const materialQuiz = useLiveQuery(
    () => db.escuela_material.where('tipo').equals('quiz_pregunta').sortBy('orden'),
    [],
  );

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('escuela_material')
          .select('id, tipo, titulo, cuerpo, orden, activo, updated_at')
          .eq('activo', true)
          .order('orden');
        if (!cancelado && data && data.length > 0) {
          await db.escuela_material.bulkPut(data as EscuelaMaterialLocal[]);
        }
      } catch (err) {
        console.warn('[escuela] Offline: usando material local de Dexie:', err);
      }
      if (!cancelado) void flushEscuelaOutbox();
    })();
    const onOnline = () => void flushEscuelaOutbox();
    window.addEventListener('online', onOnline);
    return () => {
      cancelado = true;
      window.removeEventListener('online', onOnline);
    };
  }, [flushEscuelaOutbox]);

  const quiz: QuizPregunta[] = useMemo(() => {
    const desdeNucleo = (materialQuiz ?? []).map((m) => m.cuerpo as unknown as QuizPregunta)
      .filter((q) => q && typeof q.pregunta === 'string' && Array.isArray(q.opciones) && q.opciones.length >= 2);
    return desdeNucleo.length > 0 ? desdeNucleo : CANONICAL_QUIZ;
  }, [materialQuiz]);

  const [quizIdx, setQuizIdx] = useState(0);
  const [quizRespuestas, setQuizRespuestas] = useState<number[]>([]);
  const [quizInicio, setQuizInicio] = useState<number | null>(null);
  const [quizTerminado, setQuizTerminado] = useState(false);
  const [mejorPuntaje, setMejorPuntaje] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('escuela_quiz_mejor');
      if (raw != null) setMejorPuntaje(Number(raw));
    } catch (err) {
      console.warn('[escuela] LocalStorage no disponible para cargar récord:', err);
    }
  }, []);

  const iniciarQuiz = () => {
    setQuizIdx(0);
    setQuizRespuestas([]);
    setQuizInicio(Date.now());
    setQuizTerminado(false);
  };

  const responderQuiz = (opcion: number) => {
    const siguiente = [...quizRespuestas, opcion];
    setQuizRespuestas(siguiente);
    if (siguiente.length >= quiz.length) {
      const puntaje = siguiente.filter((r, i) => r === quiz[i]?.correcta).length;
      setQuizTerminado(true);
      try {
        if (mejorPuntaje == null || puntaje > mejorPuntaje) {
          localStorage.setItem('escuela_quiz_mejor', String(puntaje));
          setMejorPuntaje(puntaje);
        }
      } catch (err) {
        console.warn('[escuela] LocalStorage no disponible para guardar récord:', err);
      }
      void registrarTelemetria('quiz_completado', {
        puntaje,
        total: quiz.length,
        duracion_seg: quizInicio ? Math.round((Date.now() - quizInicio) / 1000) : null,
        origen: 'escuela_venta',
      });
    } else {
      setQuizIdx(siguiente.length);
    }
  };

  const handleTabChange = (tab: EscuelaTab) => {
    setActiveTab(tab);
    if (tab === 'atril') {
      void registrarTelemetria('modo_atril', { origen: 'escuela_venta' });
    }
    if (tab === 'quiz' && !quizTerminado && quizRespuestas.length === 0) {
      setQuizInicio(Date.now());
    }
  };

  const handleOpenObjecion = (id: string) => {
    setExpandedObjecion((prev) => (prev === id ? null : id));
    void registrarTelemetria('consulta_objecion', { objecion_id: id });
  };

  const objecionesFiltradas = useMemo(() => {
    if (filtroObjecion === 'todas') return OBJECIONES_CANONICAS;
    return OBJECIONES_CANONICAS.filter((o) => o.categoria === filtroObjecion);
  }, [filtroObjecion]);

  return (
    <div className="min-h-[var(--vh-full)] bg-background flex flex-col">
      {!isAtrilFullscreen && <PosHeader />}

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {!isAtrilFullscreen && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                <GraduationCap size={16} /> Escuela de Venta & Maestría
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-light text-foreground">
                Capacitación en Terreno
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Argumentarios botánicos, respuestas a objeciones y modo atril de exhibición para ferias.
              </p>
            </div>

            <Link
              href="/pos/catalogo"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors self-start sm:self-auto"
            >
              <ArrowLeft size={14} /> Volver al POS
            </Link>
          </div>
        )}

        {/* Tab selector */}
        {!isAtrilFullscreen && (
          <div className="flex overflow-x-auto gap-2 border-b border-border pb-2 no-scrollbar">
            <button
              type="button"
              onClick={() => handleTabChange('argumentarios')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                activeTab === 'argumentarios'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              Argumentarios de Miel
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('objeciones')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                activeTab === 'objeciones'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              Objeciones en Feria
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('guiones')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                activeTab === 'guiones'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              Guiones de Apertura
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('atril')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                activeTab === 'atril'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              Modo Atril (Exhibición)
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('quiz')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                activeTab === 'quiz'
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              Quiz de Maestría
            </button>
          </div>
        )}

        {/* ── 1. Argumentarios por Miel ── */}
        {activeTab === 'argumentarios' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Lista de productos para seleccionar */}
            <div className="lg:col-span-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Selecciona la variedad
              </h3>
              <div className="space-y-2">
                {productos?.map((p) => {
                  const isSelected = p.id === selectedProduct?.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProductId(p.id);
                        void registrarTelemetria('apertura_guia_cata', { producto_id: p.id });
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-card hover:border-muted-foreground/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm text-foreground leading-tight">
                          {p.nombre}
                        </span>
                        <span className="text-xs font-mono font-medium text-primary shrink-0 ml-2">
                          {formatCLP(p.precio || 0)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {p.lote?.variedad_floral || p.origen_apicola || 'Bosque Nativo de Chiloé'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ficha sensorial y argumentario del producto seleccionado */}
            <div className="lg:col-span-8 space-y-6">
              {selectedProduct ? (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
                  <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                        {selectedProduct.formato || 'Frasco de Origen'}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-display font-light text-foreground mt-0.5">
                        {selectedProduct.nombre}
                      </h2>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Humedad: {selectedProduct.lote?.analisis_humedad ? `${selectedProduct.lote.analisis_humedad}%` : '< 18%'}
                    </div>
                  </div>

                  {/* Relato central del producto */}
                  <div className="p-4 rounded-xl bg-surface-sunken/60 border border-border/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-text">
                      <BookOpen size={14} /> Relato de Origen para el Cliente
                    </div>
                    <p className="text-sm text-foreground leading-relaxed italic font-display">
                      «{selectedProduct.descripcion_corta ||
                        selectedProduct.descripcion_regenerativa ||
                        'Miel virgen recolectada en los bosques templados lluviosos de Chiloé. Centrifugada en frío, biológicamente activa y sin pasteurización.'}»
                    </p>
                  </div>

                  {/* Perfil sensorial si existe */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Compass size={14} /> Perfil en Paladar
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border border-border bg-background">
                        <span className="text-[10px] text-muted-foreground block uppercase">Intensidad</span>
                        <span className="text-sm font-semibold text-foreground">
                          {selectedProduct.perfil_sensorial?.descriptores_intensidad?.der || 'Equilibrada & Profunda'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border border-border bg-background">
                        <span className="text-[10px] text-muted-foreground block uppercase">Textura</span>
                        <span className="text-sm font-semibold text-foreground">
                          {selectedProduct.perfil_sensorial?.descriptores_textura?.der || 'Cremosa & Untable'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border border-border bg-background">
                        <span className="text-[10px] text-muted-foreground block uppercase">Dulzor</span>
                        <span className="text-sm font-semibold text-foreground">
                          {selectedProduct.perfil_sensorial?.descriptores_dulzor?.der || 'Silvestre & Suave'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notas aromáticas y maridaje */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-surface-raised/40 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Volume2 size={14} /> Notas Aromáticas Clave
                      </h4>
                      {selectedProduct.perfil_sensorial?.notas_aromaticas && selectedProduct.perfil_sensorial.notas_aromaticas.length > 0 ? (
                        <ul className="space-y-1 text-xs text-foreground">
                          {selectedProduct.perfil_sensorial.notas_aromaticas.map((n, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="text-primary">•</span> {n}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Notas en proceso de calibración curatorial para este producto.
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-surface-raised/40 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-accent-text flex items-center gap-1.5">
                        <UtensilsCrossed size={14} /> Maridaje Recomendado
                      </h4>
                      <p className="text-xs text-foreground leading-relaxed">
                        Quesos maduros salinos, frutos secos tostados, té negro puro o tostadas de masa madre con mantequilla de campo.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Cargando catálogo offline…</p>
              )}
            </div>
          </div>
        )}

        {/* ── 2. Manejo de Objeciones ── */}
        {activeTab === 'objeciones' && (
          <div className="space-y-6">
            {/* Filtros por categoría */}
            <div className="flex flex-wrap gap-2">
              {['todas', 'cristalizacion', 'precio', 'pureza', 'salud'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFiltroObjecion(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors ${
                    filtroObjecion === cat
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Acordeón de objeciones */}
            <div className="space-y-3">
              {objecionesFiltradas.map((obj) => {
                const isExpanded = expandedObjecion === obj.id;
                return (
                  <div
                    key={obj.id}
                    className="border border-border rounded-2xl bg-card overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenObjecion(obj.id)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                          <HelpCircle size={18} />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                            Pregunta habitual en feria
                          </span>
                          <h3 className="text-base font-semibold text-foreground mt-0.5">
                            {obj.pregunta}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {obj.respuestaCorta}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="p-5 border-t border-border bg-surface-sunken/40 space-y-3 animate-in fade-in">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-text block">
                            Respuesta Inmediata (Impacto Rápido)
                          </span>
                          <p className="text-sm font-semibold text-foreground mt-0.5">
                            «{obj.respuestaCorta}»
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Fundamento Técnico (Poder Silencioso)
                          </span>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                            {obj.fundamento}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 3. Guiones de Apertura ── */}
        {activeTab === 'guiones' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Regla Inviolable de Marca:</strong> Nunca uses lenguaje de lástima obrera o súplica ecológica. Proyecta maestría apícola, elegancia y el estándar incomparable del bosque de Chiloé.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {GUIONES_APERTURA.map((g, idx) => (
                <div key={idx} className="border border-border rounded-2xl bg-card p-6 space-y-4 shadow-sm">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                      {g.tipo}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground mt-1">
                      {g.contexto}
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-sunken/60 border border-border/80">
                    <p className="text-sm font-display italic text-foreground leading-relaxed">
                      {g.guion}
                    </p>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
                    <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                    <span><strong>Consejo clave:</strong> {g.consejo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. Modo Atril de Exhibición ── */}
        {activeTab === 'atril' && selectedProduct && (
          <div
            className={`transition-all ${
              isAtrilFullscreen
                ? 'fixed inset-0 z-50 bg-background p-6 md:p-12 flex flex-col justify-between overflow-y-auto'
                : 'border border-border rounded-3xl bg-card p-6 md:p-10 space-y-8 shadow-xl'
            }`}
          >
            <div className="flex justify-between items-center border-b border-border/60 pb-4">
              <div className="flex items-center gap-2 text-primary">
                <Award size={20} />
                <span className="text-xs font-mono uppercase tracking-widest font-bold">
                  Enjambre Legado · Predio Pureo, Chiloé
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAtrilFullscreen((prev) => !prev)}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                title={isAtrilFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa para atril'}
              >
                {isAtrilFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-4">
              <div className="md:col-span-8 space-y-4">
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-accent-text block">
                  {selectedProduct.lote?.variedad_floral || 'Recolección Monofloral Virgen'}
                </span>
                <h2 className="text-3xl sm:text-5xl font-display font-light text-foreground tracking-tight">
                  {selectedProduct.nombre}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-display italic max-w-2xl">
                  «{selectedProduct.descripcion_corta ||
                    'Centrifugada en frío directamente del panal en los fiordos de Chiloé. Sin pasteurizar, sin jarabes añadidos y con su carga enzimática intacta.'}»
                </p>

                <div className="grid grid-cols-3 gap-4 pt-4 max-w-md">
                  <div className="border-l-2 border-primary pl-3">
                    <span className="text-[10px] text-muted-foreground block uppercase">Origen</span>
                    <span className="text-xs sm:text-sm font-semibold text-foreground">Bosque Austral</span>
                  </div>
                  <div className="border-l-2 border-primary pl-3">
                    <span className="text-[10px] text-muted-foreground block uppercase">Humedad</span>
                    <span className="text-xs sm:text-sm font-semibold text-foreground">Maduración Natural</span>
                  </div>
                  <div className="border-l-2 border-primary pl-3">
                    <span className="text-[10px] text-muted-foreground block uppercase">Extracción</span>
                    <span className="text-xs sm:text-sm font-semibold text-foreground">En Frío</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-sunken/60 border border-border text-center space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Sello de Autenticidad
                </span>
                <div className="p-3 bg-foreground rounded-xl shadow">
                  <div className="w-28 h-28 flex items-center justify-center font-mono text-[10px] text-background">
                    [QR de Origen]
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground max-w-[180px]">
                  Escanea para conocer el análisis de laboratorio y activar tus sellos del Club Legado.
                </p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-2">
              <span>Pureza verificada por norma Codex Alimentarius y SAG</span>
              <span className="font-mono text-primary font-bold">{formatCLP(selectedProduct.precio || 0)}</span>
            </div>
          </div>
        )}

        {/* ── 5. Quiz de Maestría (offline, puntaje local) ── */}
        {activeTab === 'quiz' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Quiz de Maestría</h3>
                <p className="text-xs text-muted-foreground">
                  {quiz.length} preguntas · {materialQuiz && materialQuiz.length > 0 ? 'Banco de Núcleo' : 'Banco canónico offline'}
                  {mejorPuntaje != null ? ` · Tu mejor: ${mejorPuntaje}/${quiz.length}` : ''}
                </p>
              </div>
              {(quizTerminado || quizRespuestas.length > 0) && (
                <button
                  type="button"
                  onClick={iniciarQuiz}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0"
                >
                  Reiniciar
                </button>
              )}
            </div>

            {!quizTerminado && quizIdx < quiz.length && (
              <div className="border border-border rounded-2xl bg-card p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">Pregunta {quizIdx + 1}/{quiz.length}</span>
                  <span className="font-mono">
                    Aciertos: {quizRespuestas.filter((r, i) => r === quiz[i]?.correcta).length}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(quizRespuestas.length / quiz.length) * 100}%` }}
                  />
                </div>
                <p className="text-base font-semibold text-foreground leading-snug">
                  {quiz[quizIdx]?.pregunta}
                </p>
                <div className="space-y-2">
                  {quiz[quizIdx]?.opciones.map((opcion, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => responderQuiz(i)}
                      className="w-full text-left p-3.5 rounded-xl border border-border bg-background hover:border-primary hover:bg-primary/5 transition-all text-sm text-foreground"
                    >
                      {opcion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quizTerminado && (
              <div className="border border-border rounded-2xl bg-card p-6 space-y-5 shadow-sm text-center">
                <Award size={32} className="mx-auto text-primary" />
                <div>
                  <p className="text-2xl font-display font-light text-foreground">
                    {quizRespuestas.filter((r, i) => r === quiz[i]?.correcta).length}/{quiz.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {quizRespuestas.filter((r, i) => r === quiz[i]?.correcta).length === quiz.length
                      ? 'Maestría total. El bosque habla por ti.'
                      : 'Sigue practicando: el resultado quedó registrado para tu coordinador.'}
                  </p>
                </div>
                <div className="space-y-3 text-left">
                  {quiz.map((q, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-surface-sunken/60 border border-border/60 text-xs space-y-1">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        {quizRespuestas[i] === q.correcta
                          ? <CheckCircle2 size={14} className="text-success shrink-0" />
                          : <CheckCircle2 size={14} className="text-destructive shrink-0" />}
                        {q.pregunta}
                      </p>
                      <p className="text-muted-foreground">{q.explicacion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
