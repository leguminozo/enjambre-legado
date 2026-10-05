'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Sliders,
  AlertTriangle,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Info,
  Wrench,
  Search,
  Zap,
  BookOpen,
  Microscope,
  Compass,
  ShoppingBag,
  Hash,
  TreePine,
  Maximize2,
} from 'lucide-react';
import { toast, cn } from '@enjambre/ui';
import {
  type SlideLayoutType,
  type SlideData,
  type TitleScale,
  type GoldNugget,
  MINA_DE_ORO,
  CAROUSEL_PRESETS,
  PRESET_MANIFIESTO,
  checkBrandCompliance,
  renderSlideToCanvas,
  applyAutoFixToSlide,
  createSlideFromNugget,
  applyNuggetToSlide,
} from './slide-studio-core';

export interface SlideStudioWorkbenchProps {
  initialSlides?: SlideData[];
  className?: string;
  isModal?: boolean;
}

export function SlideStudioWorkbench({
  initialSlides = PRESET_MANIFIESTO,
  className,
  isModal = false,
}: SlideStudioWorkbenchProps) {
  const [slides, setSlides] = useState<SlideData[]>(initialSlides);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Selector de modo de trabajo: 'taller' (herramientas/campos) | 'mina' (corpus de activos)
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState<'taller' | 'mina'>('taller');

  // Filtro de La Mina de Oro
  const [goldSearch, setGoldSearch] = useState('');
  const [goldCategory, setGoldCategory] = useState<
    'todos' | 'sentencias' | 'botanica' | 'laboratorio' | 'territorio' | 'tienda'
  >('todos');

  const activeSlide = slides[activeSlideIndex] ?? slides[0];

  // Reglas de marca en tiempo real
  const brandIssues = useMemo(() => {
    return checkBrandCompliance(activeSlide);
  }, [activeSlide]);

  // Actualizador inmutable de la lámina activa
  const updateActiveSlide = useCallback(
    (partial: Partial<SlideData>) => {
      setSlides((prev) => {
        const updated = [...prev];
        if (!updated[activeSlideIndex]) return prev;
        updated[activeSlideIndex] = { ...updated[activeSlideIndex], ...partial };
        return updated;
      });
    },
    [activeSlideIndex],
  );

  // Aplicar Auto-Fix del Guardián de Marca
  const handleApplyAutoFix = (fix: { target: string; replacement: string }) => {
    const fixedSlide = applyAutoFixToSlide(activeSlide, fix);
    updateActiveSlide(fixedSlide);
    toast.success(`Corrección aplicada: "${fix.target}" → "${fix.replacement}"`);
  };

  // Operaciones de carrusel
  const handleAddSlide = () => {
    const newSlide: SlideData = {
      id: `slide-custom-${Date.now()}`,
      badge: 'NUEVA LÁMINA EDITORIAL',
      kickerLeft: 'ORIGEN SOBERANO',
      kickerRight: 'CHILOÉ · 42°S',
      title: 'Título de la nueva lámina editorial.',
      subtitle: 'Bajada descriptiva en tipografía Cormorant Garamond.',
      titleScale: 'soberano',
      layoutType: 'manifesto',
      manifestoHeader: 'ESTÁNDAR DE MAESTRÍA',
      manifestoLines: [
        'Enunciado fáctico comprobable de extracción.',
        'Detalle técnico de extracción mecánica en frío.',
        'Trazabilidad directa al colmenar insular.',
      ],
      footerLeft: 'obrerayzangano.cl',
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
    toast.success('Nueva lámina añadida al carrusel.');
  };

  const handleDuplicateSlide = () => {
    const clone: SlideData = {
      ...activeSlide,
      id: `slide-copy-${Date.now()}`,
    };
    const updated = [...slides];
    updated.splice(activeSlideIndex + 1, 0, clone);
    setSlides(updated);
    setActiveSlideIndex(activeSlideIndex + 1);
    toast.success('Lámina duplicada con éxito.');
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) {
      toast.error('El carrusel debe contener al menos 1 lámina.');
      return;
    }
    const updated = slides.filter((_, idx) => idx !== activeSlideIndex);
    setSlides(updated);
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
    toast.success('Lámina eliminada.');
  };

  const handleMoveSlide = (direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? activeSlideIndex - 1 : activeSlideIndex + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const updated = [...slides];
    const temp = updated[activeSlideIndex];
    updated[activeSlideIndex] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSlides(updated);
    setActiveSlideIndex(targetIdx);
  };

  // Cargar preset completo
  const handleLoadPreset = (presetId: string) => {
    const preset = CAROUSEL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSlides(preset.slides);
    setActiveSlideIndex(0);
    toast.success(`Preset "${preset.name}" (${preset.slideCount} láminas) cargado.`);
  };

  // Inyectar pepita de oro en la lámina activa
  const handleInjectNuggetToActive = (nugget: GoldNugget) => {
    const updated = applyNuggetToSlide(activeSlide, nugget);
    updateActiveSlide(updated);
    setActiveWorkbenchTab('taller');
    toast.success(`Activo inyectado en lámina actual: "${nugget.title}".`);
  };

  // Insertar pepita de oro como nueva lámina
  const handleAppendNuggetAsSlide = (nugget: GoldNugget) => {
    const newSlide = createSlideFromNugget(nugget);
    const updated = [...slides];
    updated.splice(activeSlideIndex + 1, 0, newSlide);
    setSlides(updated);
    setActiveSlideIndex(activeSlideIndex + 1);
    setActiveWorkbenchTab('taller');
    toast.success(`Nueva lámina creada desde activo: "${nugget.title}".`);
  };

  // Exportar PNG individual
  const handleExportSinglePNG = async () => {
    try {
      setIsExporting(true);
      const canvas = await renderSlideToCanvas(activeSlide, activeSlideIndex + 1, slides.length);
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Error al generar la imagen de la lámina.');
          setIsExporting(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `oyz_slide_${String(activeSlideIndex + 1).padStart(2, '0')}.png`;
        link.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        toast.success(`Lámina ${activeSlideIndex + 1} exportada en 1080 × 1350 px.`);
      }, 'image/png');
    } catch {
      setIsExporting(false);
      toast.error('No se pudo procesar la exportación gráfica.');
    }
  };

  // Exportar todas las láminas
  const handleExportAllPNGs = async () => {
    try {
      setIsExporting(true);
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const canvas = await renderSlideToCanvas(slide, i + 1, slides.length);
        await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `oyz_slide_${String(i + 1).padStart(2, '0')}.png`;
              link.click();
              URL.revokeObjectURL(url);
            }
            setTimeout(resolve, 300);
          }, 'image/png');
        });
      }
      setIsExporting(false);
      toast.success(`Carrusel completo (${slides.length} láminas) exportado con éxito.`);
    } catch {
      setIsExporting(false);
      toast.error('Error durante la descarga del carrusel.');
    }
  };

  // Copiar Caption para Instagram/X
  const handleCopyCaption = () => {
    const caption = [
      'La miel cruda no es un producto estandarizado: es la memoria biológica y química del bosque nativo de Chiloé.',
      '',
      'Desde 2004 en el paralelo 42° Sur, documentamos y analizamos cada recolección estacional bajo normas auditables de pureza:',
      '• 0% pasteurización térmica (< 35 °C en todo el ciclo).',
      '• Actividad enzimática (diastasa e invertasa) intacta certificada por laboratorio.',
      '• Filtrado mecánico grueso que retiene cera virgen y polen nativo.',
      '• Trazabilidad por código de lote y balance de cuenca forestal.',
      '',
      'En obrerayzangano.cl puedes acceder al registro analítico completo, monografías botánicas y a la reserva de Miel Cruda y Crema de Miel batida en frío.',
      '',
      '#LaObreraYElZangano #Chiloe #MielCruda #PurezaDeOrigen #SelvaValdiviana #EstandarDeOrigen',
    ].join('\n');

    navigator.clipboard.writeText(caption);
    setIsCopied(true);
    toast.success('Caption editorial copiado al portapapeles.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Filtrado de pepitas de oro
  const filteredNuggets = useMemo(() => {
    return MINA_DE_ORO.filter((nugget) => {
      const matchesCat = goldCategory === 'todos' || nugget.category === goldCategory;
      const matchesQuery =
        !goldSearch.trim() ||
        nugget.title.toLowerCase().includes(goldSearch.toLowerCase()) ||
        nugget.subtitle.toLowerCase().includes(goldSearch.toLowerCase()) ||
        nugget.mainTitle.toLowerCase().includes(goldSearch.toLowerCase()) ||
        nugget.badge.toLowerCase().includes(goldSearch.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [goldCategory, goldSearch]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* ── BARRA SUPERIOR DE ACCIONES Y PRESETS ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider font-mono text-muted-foreground mr-1 flex items-center gap-1.5">
            <Layers size={13} className="text-[#D6AA5C]" />
            Colecciones:
          </span>
          {CAROUSEL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="btn btn-outline btn-xs h-8 px-3 text-xs"
              onClick={() => handleLoadPreset(preset.id)}
            >
              {preset.name} ({preset.slideCount})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm flex items-center gap-1.5 text-xs"
            onClick={handleCopyCaption}
          >
            {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            Copiar Caption
          </button>
          <button
            type="button"
            disabled={isExporting}
            className="btn btn-outline btn-sm flex items-center gap-1.5 text-xs"
            onClick={handleExportSinglePNG}
          >
            <Download size={14} />
            Descargar Lámina Actual (PNG)
          </button>
          <button
            type="button"
            disabled={isExporting}
            className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-semibold"
            onClick={handleExportAllPNGs}
          >
            <Layers size={14} />
            {isExporting ? 'Generando...' : `Descargar Carrusel (${slides.length})`}
          </button>
        </div>
      </div>

      {/* ── SELECTOR PRINCIPAL DE ENTORNO: TALLER VS LA MINA DE ORO ───────── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-border bg-surface-sunken/60 w-fit">
        <button
          type="button"
          onClick={() => setActiveWorkbenchTab('taller')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all',
            activeWorkbenchTab === 'taller'
              ? 'bg-[#0A0B0A] text-[#F2EEE6] border border-[#262C27] shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Wrench size={14} className="text-[#D6AA5C]" />
          <span>Taller de Construcción (Picos & Palas)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveWorkbenchTab('mina')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all',
            activeWorkbenchTab === 'mina'
              ? 'bg-[#D6AA5C]/15 text-[#D6AA5C] border border-[#D6AA5C]/30 shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Sparkles size={14} className="text-[#D6AA5C]" />
          <span>La Mina de Oro (Corpus Ontológico)</span>
          <span className="text-[10px] bg-[#D6AA5C]/20 px-1.5 py-0.2 rounded-full border border-[#D6AA5C]/30">
            {MINA_DE_ORO.length}
          </span>
        </button>
      </div>

      {/* ── CUADRÍCULA DE TRABAJO (2 COLUMNAS) ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.18fr_0.82fr] gap-6 items-start">
        {/* ── COLUMNA IZQUIERDA: HERRAMIENTAS Y EDITORES ─────────────────── */}
        <div className="space-y-6">
          {/* GUARDIÁN DE MARCA ANTI-SLOP (SIEMPRE ACTIVO Y AUDITABLE) */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={16}
                  className={brandIssues.length === 0 ? 'text-emerald-400' : 'text-amber-400'}
                />
                <span className="text-xs font-medium text-foreground">
                  Guardián de Marca (Doctrina Anti-Slop y Vocabulario Sagrado)
                </span>
              </div>
              <span
                className={cn(
                  'text-[10px] font-mono uppercase px-2 py-0.5 rounded border',
                  brandIssues.length === 0
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                    : 'border-amber-500/20 bg-amber-500/10 text-amber-300',
                )}
              >
                {brandIssues.length === 0 ? 'Verificado' : `${brandIssues.length} alertas`}
              </span>
            </div>

            {brandIssues.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3.5 py-2.5 rounded-xl border border-emerald-500/20">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>
                  Estándar editorial verificado: Cero slop, tono de soberanía territorial, recolección (cero cosecha) y fechas absolutas.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {brandIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'text-xs p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                      issue.severity === 'error'
                        ? 'bg-destructive/10 border-destructive/20 text-destructive'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-300',
                    )}
                  >
                    <div className="space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertTriangle size={13} />
                        {issue.title}
                      </div>
                      <div className="text-[11px] opacity-90">{issue.description}</div>
                      {issue.suggestion && (
                        <div className="text-[11px] font-mono opacity-80 pt-0.5">
                          👉 {issue.suggestion}
                        </div>
                      )}
                    </div>

                    {issue.autoFix && (
                      <button
                        type="button"
                        onClick={() => handleApplyAutoFix(issue.autoFix!)}
                        className="btn btn-xs shrink-0 bg-background/80 hover:bg-background border border-current text-[11px] font-mono flex items-center gap-1"
                      >
                        <Zap size={12} />
                        Corregir automáticamente
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECUENCIA DEL CARRUSEL (FILMSTRIP / NAVEGADOR DE LÁMINAS) */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground flex items-center gap-1.5">
                <Layers size={13} />
                Secuencia de Láminas ({slides.length} láminas en carrusel)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={activeSlideIndex === 0}
                  onClick={() => handleMoveSlide('left')}
                  className="btn btn-ghost btn-xs h-7 px-2"
                  title="Mover lámina hacia atrás"
                >
                  <ArrowLeft size={13} />
                </button>
                <button
                  type="button"
                  disabled={activeSlideIndex === slides.length - 1}
                  onClick={() => handleMoveSlide('right')}
                  className="btn btn-ghost btn-xs h-7 px-2"
                  title="Mover lámina hacia adelante"
                >
                  <ArrowRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateSlide}
                  className="btn btn-ghost btn-xs h-7 px-2"
                  title="Duplicar lámina actual"
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  disabled={slides.length <= 1}
                  onClick={handleDeleteSlide}
                  className="btn btn-ghost btn-xs h-7 px-2 text-destructive hover:text-destructive"
                  title="Eliminar lámina actual"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Carrusel de Píldoras Limpias */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5">
              {slides.map((s, idx) => {
                const layoutTag =
                  s.layoutType === 'stat_hero'
                    ? 'STAT'
                    : s.layoutType === 'pillars'
                    ? 'PILARES'
                    : s.layoutType === 'metrics'
                    ? 'TABLA'
                    : s.layoutType === 'botany'
                    ? 'BOTÁNICA'
                    : s.layoutType === 'essay'
                    ? 'ENSAYO'
                    : s.layoutType === 'comparison'
                    ? 'COMPARAR'
                    : s.layoutType === 'cta'
                    ? 'PORTAL'
                    : 'MANIF';

                return (
                  <button
                    key={s.id || idx}
                    type="button"
                    onClick={() => {
                      setActiveSlideIndex(idx);
                      setActiveWorkbenchTab('taller');
                    }}
                    className={cn(
                      'px-3.5 py-2 rounded-xl border text-xs font-mono transition-all shrink-0 flex items-center gap-2.5',
                      activeSlideIndex === idx
                        ? 'border-[#D6AA5C] bg-[#D6AA5C]/15 text-[#D6AA5C] font-semibold shadow-sm'
                        : 'border-border bg-card hover:bg-surface-raised text-muted-foreground',
                    )}
                  >
                    <span className="font-bold text-[13px]">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/50 border border-border/60">
                      {layoutTag}
                    </span>
                    <span className="text-[11px] opacity-80 truncate max-w-[80px]">
                      {s.kickerLeft || s.title}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleAddSlide}
                className="px-3.5 py-2 rounded-xl border border-dashed border-border hover:border-[#D6AA5C]/50 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Añadir</span>
              </button>
            </div>
          </div>

          {/* ── TAB: LA MINA DE ORO (CORPUS COMPLETO DE ACTIVOS) ─────────── */}
          {activeWorkbenchTab === 'mina' && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-5 animate-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#D6AA5C]" />
                  <h3 className="font-semibold text-sm text-foreground">
                    La Mina de Oro — Corpus de Activos y Verdades Ontológicas
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Repositorio de monografías botánicas, parámetros Codex de laboratorio y verdades soberanas de La Obrera y el Zángano. Insértalos con 1 clic en cualquier lámina.
                </p>
              </div>

              {/* Filtros de Categoría */}
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'todos', label: 'Todos los Activos', icon: Sparkles },
                    { id: 'sentencias', label: 'Sentencias', icon: BookOpen },
                    { id: 'botanica', label: 'Botánica Chiloé', icon: TreePine },
                    { id: 'laboratorio', label: 'Laboratorio Codex', icon: Microscope },
                    { id: 'territorio', label: 'Territorio & Clima', icon: Compass },
                    { id: 'tienda', label: 'Tienda Soberana', icon: ShoppingBag },
                  ] as const
                ).map((cat) => {
                  const IconComp = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setGoldCategory(cat.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5',
                        goldCategory === cat.id
                          ? 'border-[#D6AA5C] bg-[#D6AA5C]/15 text-[#D6AA5C] font-semibold'
                          : 'border-border bg-surface-sunken/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <IconComp size={12} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Barra de Búsqueda */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por especie (Ulmo, Tiaca), parámetro (HMF, Diastasa) o concepto..."
                  className="input-field w-full pl-9 text-xs"
                  value={goldSearch}
                  onChange={(e) => setGoldSearch(e.target.value)}
                />
              </div>

              {/* Lista de Pepitas de Oro */}
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                {filteredNuggets.map((nugget) => (
                  <div
                    key={nugget.id}
                    className="p-4 rounded-xl border border-border bg-surface-sunken/40 hover:border-[#D6AA5C]/40 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-background border border-border text-[#D6AA5C]">
                          {nugget.category}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {nugget.suggestedLayout.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInjectNuggetToActive(nugget)}
                          className="btn btn-outline btn-xs text-xs font-mono flex items-center gap-1"
                        >
                          <Zap size={12} className="text-[#D6AA5C]" />
                          Inyectar en lámina actual
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAppendNuggetAsSlide(nugget)}
                          className="btn btn-primary btn-xs text-xs font-mono flex items-center gap-1"
                        >
                          <Plus size={12} />
                          Nueva lámina
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-foreground">{nugget.title}</h4>
                      <p className="text-xs text-muted-foreground">{nugget.subtitle}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-background/80 border border-border/60 text-xs space-y-1.5 font-mono">
                      <div className="text-[#D6AA5C] font-semibold text-[11px] truncate">
                        {nugget.badge}
                      </div>
                      <div className="text-foreground text-xs italic font-serif">
                        "{nugget.mainTitle}"
                      </div>
                      {nugget.content.statNumber && (
                        <div className="text-sm font-bold text-[#D6AA5C] pt-1">
                          {nugget.content.statNumber} — {nugget.content.statLabel}
                        </div>
                      )}
                      {nugget.content.statNarrative && (
                        <div className="text-[11px] text-muted-foreground line-clamp-2">
                          {nugget.content.statNarrative}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {filteredNuggets.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No se encontraron activos que coincidan con la búsqueda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: TALLER DE CONSTRUCCIÓN (PICOS Y PALAS MODULARES) ──────── */}
          {activeWorkbenchTab === 'taller' && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-5 animate-in">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Wrench size={15} className="text-[#D6AA5C]" />
                  <span className="text-xs font-medium uppercase font-mono text-foreground">
                    Edición de Lámina #{activeSlideIndex + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveWorkbenchTab('mina')}
                  className="btn btn-outline btn-xs text-xs font-mono flex items-center gap-1.5 text-[#D6AA5C]"
                >
                  <Sparkles size={12} />
                  Abrir La Mina de Oro
                </button>
              </div>

              {/* Fila 1: Encabezados y Georreferencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                    Kicker Izquierdo (Temática / Categoría)
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-xs font-mono"
                    value={activeSlide.kickerLeft}
                    onChange={(e) => updateActiveSlide({ kickerLeft: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                    Kicker Derecho (Geografía / Coordenada / Fecha)
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-xs font-mono"
                    value={activeSlide.kickerRight}
                    onChange={(e) => updateActiveSlide({ kickerRight: e.target.value })}
                  />
                </div>
              </div>

              {/* Insignia Superior */}
              <div>
                <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                  Insignia Superior (Badge Monospace con Borde)
                </label>
                <input
                  type="text"
                  className="input-field w-full text-xs font-mono"
                  value={activeSlide.badge}
                  onChange={(e) => updateActiveSlide({ badge: e.target.value })}
                />
              </div>

              {/* Título Principal y Escala Tipográfica */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-muted-foreground uppercase block">
                    Título Principal (Cormorant Garamond)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground">Escala:</span>
                    <select
                      className="input-field text-[11px] font-mono py-0.5 px-2 h-7"
                      value={activeSlide.titleScale ?? 'soberano'}
                      onChange={(e) =>
                        updateActiveSlide({ titleScale: e.target.value as TitleScale })
                      }
                    >
                      <option value="monumental">Monumental (74px)</option>
                      <option value="soberano">Soberano (64px)</option>
                      <option value="editorial">Editorial (52px)</option>
                      <option value="condensado">Condensado (42px)</option>
                    </select>
                  </div>
                </div>
                <textarea
                  rows={2}
                  className="input-field w-full text-base font-serif"
                  value={activeSlide.title}
                  onChange={(e) => updateActiveSlide({ title: e.target.value })}
                />
              </div>

              {/* Subtítulo o Bajada Descriptiva */}
              <div>
                <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                  Subtítulo / Bajada Descriptiva
                </label>
                <textarea
                  rows={2}
                  className="input-field w-full text-xs"
                  value={activeSlide.subtitle}
                  onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                />
              </div>

              {/* Selector de Layout / Estructura Visual */}
              <div>
                <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1 flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#D6AA5C]" />
                  Estructura Visual de la Lámina (Layout)
                </label>
                <select
                  className="input-field w-full text-xs"
                  value={activeSlide.layoutType}
                  onChange={(e) =>
                    updateActiveSlide({ layoutType: e.target.value as SlideLayoutType })
                  }
                >
                  <option value="manifesto">Manifiesto / Declaración Ontológica</option>
                  <option value="stat_hero">Cifra Monumental (Stat Hero · &lt; 35°C, 17.2%)</option>
                  <option value="pillars">Pilares de Origen (Bloques Estructurados)</option>
                  <option value="metrics">Tabla de Laboratorio Codex & Normas</option>
                  <option value="botany">Monografía Botánica de Chiloé</option>
                  <option value="essay">Ensayo / Prosa a Sangre sin Recuadro</option>
                  <option value="comparison">Dos Expresiones (Miel Cruda vs. Crema)</option>
                  <option value="cta">Portal Soberano & Enlace Directo</option>
                  <option value="custom">Tarjeta Personalizada Libre</option>
                </select>
              </div>

              {/* ── CUERPO CONTEXTUAL SEGÚN EL LAYOUT ELEGIDO ──────────────── */}
              <div className="p-4 rounded-xl border border-border bg-surface-sunken/40 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Sliders size={14} className="text-[#D6AA5C]" />
                    <span className="text-xs font-semibold uppercase font-mono text-foreground">
                      Campos Específicos: {activeSlide.layoutType.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* 1. STAT HERO (< 35°C, 17.2%, 42°S) */}
                {activeSlide.layoutType === 'stat_hero' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                          Cifra Monumental (ej. &lt; 35 °C, 17.2%, 42°S)
                        </label>
                        <input
                          type="text"
                          className="input-field w-full text-lg font-bold font-mono text-[#D6AA5C]"
                          value={activeSlide.statNumber ?? ''}
                          placeholder="< 35 °C"
                          onChange={(e) => updateActiveSlide({ statNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                          Rótulo de la Cifra (Mono Mayúsculas)
                        </label>
                        <input
                          type="text"
                          className="input-field w-full text-xs font-mono"
                          value={activeSlide.statLabel ?? ''}
                          placeholder="UMBRAL TÉRMICO BIOLÓGICO"
                          onChange={(e) => updateActiveSlide({ statLabel: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                        Narrativa de Demostración Científica
                      </label>
                      <textarea
                        rows={4}
                        className="input-field w-full text-xs leading-relaxed"
                        value={activeSlide.statNarrative ?? ''}
                        placeholder="A temperaturas superiores a 40 °C, las enzimas termolábiles sufren desnaturalización..."
                        onChange={(e) => updateActiveSlide({ statNarrative: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                        Nota de Acento al Pie (Mono)
                      </label>
                      <input
                        type="text"
                        className="input-field w-full text-xs font-mono"
                        value={activeSlide.manifestoAccentNote ?? ''}
                        placeholder="Codex Alimentarius CXS 12-1981 · Ensayo de calidad enzimática."
                        onChange={(e) => updateActiveSlide({ manifestoAccentNote: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* 2. MANIFESTO */}
                {activeSlide.layoutType === 'manifesto' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                        Encabezado de la Declaración
                      </label>
                      <input
                        type="text"
                        className="input-field w-full text-xs font-mono"
                        value={activeSlide.manifestoHeader ?? ''}
                        placeholder="ESTÁNDAR DE EXTRACCIÓN SOBERANA"
                        onChange={(e) => updateActiveSlide({ manifestoHeader: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                        Líneas de la Declaración (un enunciado por renglón)
                      </label>
                      <textarea
                        rows={6}
                        className="input-field w-full text-xs leading-relaxed"
                        value={(activeSlide.manifestoLines ?? []).join('\n')}
                        onChange={(e) =>
                          updateActiveSlide({ manifestoLines: e.target.value.split('\n') })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                        Nota de Acento al Pie (Mono)
                      </label>
                      <input
                        type="text"
                        className="input-field w-full text-xs font-mono"
                        value={activeSlide.manifestoAccentNote ?? ''}
                        placeholder="Registro y constantes biológicas. ->"
                        onChange={(e) => updateActiveSlide({ manifestoAccentNote: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* 3. PILARES DINÁMICOS (CONSTRUCCIÓN CON PICOS Y PALAS) */}
                {activeSlide.layoutType === 'pillars' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Filas de Bloques de Origen ({(activeSlide.pillars ?? []).length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextPillars = [
                            ...(activeSlide.pillars ?? []),
                            { title: 'NUEVO PILAR', desc: 'Descripción fáctica y auditable.' },
                          ];
                          updateActiveSlide({ pillars: nextPillars });
                        }}
                        className="btn btn-outline btn-xs flex items-center gap-1 font-mono text-xs"
                      >
                        <Plus size={12} />
                        Añadir Pilar
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(activeSlide.pillars ?? []).map((pilar, pidx) => (
                        <div
                          key={pidx}
                          className="p-3.5 rounded-xl border border-border bg-card space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase text-[#D6AA5C] font-semibold">
                              Pilar {String(pidx + 1).padStart(2, '0')}
                            </span>
                            <div className="flex items-center gap-1">
                              {pidx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...(activeSlide.pillars ?? [])];
                                    const temp = next[pidx];
                                    next[pidx] = next[pidx - 1];
                                    next[pidx - 1] = temp;
                                    updateActiveSlide({ pillars: next });
                                  }}
                                  className="btn btn-ghost btn-xs h-6 w-6 p-0"
                                  title="Subir"
                                >
                                  <ArrowUp size={12} />
                                </button>
                              )}
                              {pidx < (activeSlide.pillars ?? []).length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...(activeSlide.pillars ?? [])];
                                    const temp = next[pidx];
                                    next[pidx] = next[pidx + 1];
                                    next[pidx + 1] = temp;
                                    updateActiveSlide({ pillars: next });
                                  }}
                                  className="btn btn-ghost btn-xs h-6 w-6 p-0"
                                  title="Bajar"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const next = (activeSlide.pillars ?? []).filter((_, i) => i !== pidx);
                                  updateActiveSlide({ pillars: next });
                                }}
                                className="btn btn-ghost btn-xs h-6 w-6 p-0 text-destructive"
                                title="Eliminar pilar"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                              Título del Pilar (Monospace)
                            </label>
                            <input
                              type="text"
                              placeholder="ej. DESDE EL AÑO 2004"
                              className="input-field w-full text-xs font-mono"
                              value={pilar.title}
                              onChange={(e) => {
                                const next = [...(activeSlide.pillars ?? [])];
                                next[pidx] = { ...next[pidx], title: e.target.value };
                                updateActiveSlide({ pillars: next });
                              }}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                              Descripción Fáctica (Espaciosa, sin recortes)
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Detalle fáctico y verificable..."
                              className="input-field w-full text-xs leading-relaxed"
                              value={pilar.desc}
                              onChange={(e) => {
                                const next = [...(activeSlide.pillars ?? [])];
                                next[pidx] = { ...next[pidx], desc: e.target.value };
                                updateActiveSlide({ pillars: next });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. TABLA DE LABORATORIO (METRICS DINÁMICAS) */}
                {activeSlide.layoutType === 'metrics' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Ensayos Analíticos ({(activeSlide.metrics ?? []).length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextMetrics = [
                            ...(activeSlide.metrics ?? []),
                            {
                              param: 'NUEVO PARÁMETRO',
                              desc: 'Criterio o resultado de laboratorio.',
                            },
                          ];
                          updateActiveSlide({ metrics: nextMetrics });
                        }}
                        className="btn btn-outline btn-xs flex items-center gap-1 font-mono text-xs"
                      >
                        <Plus size={12} />
                        Añadir Parámetro
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(activeSlide.metrics ?? []).map((m, midx) => (
                        <div
                          key={midx}
                          className="p-3.5 rounded-xl border border-border bg-card space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase text-[#D6AA5C] font-semibold">
                              Parámetro {String(midx + 1).padStart(2, '0')}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = (activeSlide.metrics ?? []).filter((_, i) => i !== midx);
                                updateActiveSlide({ metrics: next });
                              }}
                              className="btn btn-ghost btn-xs h-6 w-6 p-0 text-destructive"
                              title="Eliminar parámetro"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                              Nombre del Parámetro (Monospace)
                            </label>
                            <input
                              type="text"
                              placeholder="ej. HMF (HIDROXIMETILFURFURAL)"
                              className="input-field w-full text-xs font-mono"
                              value={m.param}
                              onChange={(e) => {
                                const next = [...(activeSlide.metrics ?? [])];
                                next[midx] = { ...next[midx], param: e.target.value };
                                updateActiveSlide({ metrics: next });
                              }}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                              Criterio / Norma / Resultado
                            </label>
                            <textarea
                              rows={2}
                              placeholder="ej. < 8 mg/kg al envasado. Cero estrés térmico..."
                              className="input-field w-full text-xs leading-relaxed"
                              value={m.desc}
                              onChange={(e) => {
                                const next = [...(activeSlide.metrics ?? [])];
                                next[midx] = { ...next[midx], desc: e.target.value };
                                updateActiveSlide({ metrics: next });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. MONOGRAFÍA BOTÁNICA */}
                {activeSlide.layoutType === 'botany' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Estratos Botánicos ({(activeSlide.botanyBlocks ?? []).length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextBlocks = [
                            ...(activeSlide.botanyBlocks ?? []),
                            {
                              title: 'NUEVA ESPECIE',
                              desc: 'Características de floración y concentración de néctar.',
                            },
                          ];
                          updateActiveSlide({ botanyBlocks: nextBlocks });
                        }}
                        className="btn btn-outline btn-xs flex items-center gap-1 font-mono text-xs"
                      >
                        <Plus size={12} />
                        Añadir Bloque
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(activeSlide.botanyBlocks ?? []).map((b, bidx) => (
                        <div
                          key={bidx}
                          className="p-3.5 rounded-xl border border-border bg-card space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase text-[#D6AA5C] font-semibold">
                              Especie / Estrato {String(bidx + 1).padStart(2, '0')}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = (activeSlide.botanyBlocks ?? []).filter(
                                  (_, i) => i !== bidx,
                                );
                                updateActiveSlide({ botanyBlocks: next });
                              }}
                              className="btn btn-ghost btn-xs h-6 w-6 p-0 text-destructive"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Nombre de la Especie o Estrato"
                            className="input-field w-full text-xs font-mono"
                            value={b.title}
                            onChange={(e) => {
                              const next = [...(activeSlide.botanyBlocks ?? [])];
                              next[bidx] = { ...next[bidx], title: e.target.value };
                              updateActiveSlide({ botanyBlocks: next });
                            }}
                          />
                          <textarea
                            rows={2}
                            placeholder="Detalle botánico, biomasa y período..."
                            className="input-field w-full text-xs leading-relaxed"
                            value={b.desc}
                            onChange={(e) => {
                              const next = [...(activeSlide.botanyBlocks ?? [])];
                              next[bidx] = { ...next[bidx], desc: e.target.value };
                              updateActiveSlide({ botanyBlocks: next });
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                        Nota al Pie del Bloque Botánico
                      </label>
                      <input
                        type="text"
                        className="input-field w-full text-xs font-mono"
                        value={activeSlide.botanyFooterNote ?? ''}
                        placeholder="Polinización libre en bosque sin monocultivo..."
                        onChange={(e) => updateActiveSlide({ botanyFooterNote: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* 6. ENSAYO / PROSA EDITORIAL A SANGRE */}
                {activeSlide.layoutType === 'essay' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                        Párrafos del Ensayo (uno por renglón o separados por doble salto)
                      </label>
                      <textarea
                        rows={8}
                        className="input-field w-full text-sm font-serif leading-relaxed"
                        value={(activeSlide.essayContent ?? []).join('\n\n')}
                        placeholder="Escribe la prosa de reflexión en Cormorant Garamond..."
                        onChange={(e) =>
                          updateActiveSlide({
                            essayContent: e.target.value.split('\n\n').filter(Boolean),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* 7. COMPARISON (LÍQUIDA VS CREMA) */}
                {activeSlide.layoutType === 'comparison' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Estado 01 */}
                      <div className="space-y-2 p-3.5 rounded-xl border border-border bg-card">
                        <span className="text-[11px] font-mono text-[#D6AA5C] font-semibold block">
                          Estado 01 (Líquida Cruda)
                        </span>
                        <input
                          type="text"
                          placeholder="Tag (ej. [ESTADO 01])"
                          className="input-field w-full text-xs font-mono"
                          value={activeSlide.comparisonLeft?.tag ?? ''}
                          onChange={(e) =>
                            updateActiveSlide({
                              comparisonLeft: {
                                tag: e.target.value,
                                title: activeSlide.comparisonLeft?.title ?? '',
                                subtitle: activeSlide.comparisonLeft?.subtitle ?? '',
                                bullets: activeSlide.comparisonLeft?.bullets ?? [],
                              },
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Título (ej. MIEL CRUDA)"
                          className="input-field w-full text-xs font-serif"
                          value={activeSlide.comparisonLeft?.title ?? ''}
                          onChange={(e) =>
                            updateActiveSlide({
                              comparisonLeft: {
                                tag: activeSlide.comparisonLeft?.tag ?? '',
                                title: e.target.value,
                                subtitle: activeSlide.comparisonLeft?.subtitle ?? '',
                                bullets: activeSlide.comparisonLeft?.bullets ?? [],
                              },
                            })
                          }
                        />
                        <textarea
                          rows={4}
                          placeholder="Viñetas descriptivas (una por línea)"
                          className="input-field w-full text-xs"
                          value={(activeSlide.comparisonLeft?.bullets ?? []).join('\n')}
                          onChange={(e) =>
                            updateActiveSlide({
                              comparisonLeft: {
                                tag: activeSlide.comparisonLeft?.tag ?? '',
                                title: activeSlide.comparisonLeft?.title ?? '',
                                subtitle: activeSlide.comparisonLeft?.subtitle ?? '',
                                bullets: e.target.value.split('\n'),
                              },
                            })
                          }
                        />
                      </div>

                      {/* Estado 02 */}
                      <div className="space-y-2 p-3.5 rounded-xl border border-border bg-card">
                        <span className="text-[11px] font-mono text-[#D6AA5C] font-semibold block">
                          Estado 02 (Crema Batida 48h)
                        </span>
                        <input
                          type="text"
                          placeholder="Tag (ej. [ESTADO 02])"
                          className="input-field w-full text-xs font-mono"
                          value={activeSlide.comparisonRight?.tag ?? ''}
                          onChange={(e) =>
                            updateActiveSlide({
                              comparisonRight: {
                                tag: e.target.value,
                                title: activeSlide.comparisonRight?.title ?? '',
                                subtitle: activeSlide.comparisonRight?.subtitle ?? '',
                                bullets: activeSlide.comparisonRight?.bullets ?? [],
                              },
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Título (ej. CREMA DE MIEL)"
                          className="input-field w-full text-xs font-serif"
                          value={activeSlide.comparisonRight?.title ?? ''}
                          onChange={(e) =>
                            updateActiveSlide({
                              comparisonRight: {
                                tag: activeSlide.comparisonRight?.tag ?? '',
                                title: e.target.value,
                                subtitle: activeSlide.comparisonRight?.subtitle ?? '',
                                bullets: activeSlide.comparisonRight?.bullets ?? [],
                              },
                            })
                          }
                        />
                        <textarea
                          rows={4}
                          placeholder="Viñetas descriptivas (una por línea)"
                          className="input-field w-full text-xs"
                          value={(activeSlide.comparisonRight?.bullets ?? []).join('\n')}
                          onChange={(e) =>
                            updateActiveSlide({
                              comparisonRight: {
                                tag: activeSlide.comparisonRight?.tag ?? '',
                                title: activeSlide.comparisonRight?.title ?? '',
                                subtitle: activeSlide.comparisonRight?.subtitle ?? '',
                                bullets: e.target.value.split('\n'),
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                        Nota Compartida al Pie (Mono)
                      </label>
                      <input
                        type="text"
                        className="input-field w-full text-xs font-mono"
                        value={activeSlide.comparisonSharedNote ?? ''}
                        placeholder="AMBAS PRESENTACIONES MANTIENEN SU FIRMA ENZIMÁTICA INTACTA"
                        onChange={(e) =>
                          updateActiveSlide({ comparisonSharedNote: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* 8. CTA (PORTAL SOBERANO) */}
                {activeSlide.layoutType === 'cta' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                          URL del Portal Oficial
                        </label>
                        <input
                          type="text"
                          className="input-field w-full text-xs font-mono"
                          value={activeSlide.ctaUrl ?? ''}
                          placeholder="obrerayzangano.cl"
                          onChange={(e) => updateActiveSlide({ ctaUrl: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                          Subtítulo de la Tarjeta
                        </label>
                        <input
                          type="text"
                          className="input-field w-full text-xs"
                          value={activeSlide.ctaSubtitle ?? ''}
                          placeholder="Tienda oficial y biblioteca botánica abierta."
                          onChange={(e) => updateActiveSlide({ ctaSubtitle: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                        Atributos Clave (uno por renglón)
                      </label>
                      <textarea
                        rows={4}
                        className="input-field w-full text-xs leading-relaxed"
                        value={(activeSlide.ctaBullets ?? []).join('\n')}
                        placeholder="Monografías botánicas de cada floración nativa..."
                        onChange={(e) =>
                          updateActiveSlide({ ctaBullets: e.target.value.split('\n') })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                        Llamado al Enlace (Mono)
                      </label>
                      <input
                        type="text"
                        className="input-field w-full text-xs font-mono"
                        value={activeSlide.ctaSubCall ?? ''}
                        placeholder="ENLACE DIRECTO EN LA BIOGRAFÍA ->"
                        onChange={(e) => updateActiveSlide({ ctaSubCall: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* 9. CUSTOM / LIBRE */}
                {activeSlide.layoutType === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                        Título de la Tarjeta Libre
                      </label>
                      <input
                        type="text"
                        className="input-field w-full text-xs font-mono"
                        value={activeSlide.customCardTitle ?? ''}
                        onChange={(e) => updateActiveSlide({ customCardTitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                        Contenido Libre de la Tarjeta
                      </label>
                      <textarea
                        rows={6}
                        className="input-field w-full text-xs leading-relaxed"
                        value={activeSlide.customCardContent ?? ''}
                        onChange={(e) => updateActiveSlide({ customCardContent: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA: VISTA PREVIA STICKY 4:5 Y FICHA TÉCNICA ───── */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[#D6AA5C]" />
                <span className="text-xs uppercase tracking-widest font-mono text-muted-foreground">
                  Vista Previa en Vivo (4:5)
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#D6AA5C] bg-[#D6AA5C]/10 px-2.5 py-0.5 rounded-lg border border-[#D6AA5C]/20">
                {String(activeSlideIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
            </div>

            {/* Lienzo visual DOM 4:5 Fidedigno */}
            <div className="flex items-center justify-center py-1">
              <div className="w-full max-w-[390px] aspect-[4/5] rounded-2xl border border-[#262C27] bg-[#0A0B0A] text-[#F2EEE6] p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden select-none">
                {/* Header Superior */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-[#D6AA5C] truncate max-w-[210px]">
                      LA OBRERA Y EL ZÁNGANO // {activeSlide.kickerLeft}
                    </span>
                    <span className="text-[#8E9690] shrink-0">{activeSlide.kickerRight}</span>
                  </div>
                  <div className="h-px bg-[#1A201B] w-full" />
                </div>

                {/* Contenido Central */}
                <div className="my-auto space-y-2 py-2">
                  <div className="text-[8.5px] font-mono text-[#D6AA5C] tracking-wide uppercase px-2 py-0.5 rounded border border-[#262C27] bg-[#101310] w-fit">
                    {activeSlide.badge}
                  </div>

                  {/* Título renderizado según escala */}
                  <h3
                    className={cn(
                      'font-serif leading-tight font-semibold text-[#F2EEE6]',
                      activeSlide.titleScale === 'monumental'
                        ? 'text-xl sm:text-2xl'
                        : activeSlide.titleScale === 'soberano'
                        ? 'text-lg sm:text-xl'
                        : activeSlide.titleScale === 'editorial'
                        ? 'text-base sm:text-lg'
                        : 'text-sm sm:text-base',
                    )}
                  >
                    {activeSlide.title}
                  </h3>

                  {activeSlide.subtitle && (
                    <p className="font-serif italic text-[11px] leading-snug text-[#8E9690]">
                      {activeSlide.subtitle}
                    </p>
                  )}

                  {/* Bloque Central Específico por Layout */}
                  <div className="rounded-xl border border-[#262C27] bg-[#101310] p-3 space-y-1.5 mt-1 text-[9px]">
                    {/* STAT HERO */}
                    {activeSlide.layoutType === 'stat_hero' && (
                      <div className="space-y-1.5">
                        <div className="text-2xl sm:text-3xl font-bold font-mono text-[#D6AA5C] tracking-tight">
                          {activeSlide.statNumber || '< 35 °C'}
                        </div>
                        <div className="text-[8px] font-mono text-[#8E9690] tracking-wider uppercase">
                          {activeSlide.statLabel || 'PARÁMETRO BIOLÓGICO'}
                        </div>
                        <div className="text-[8.5px] text-[#F2EEE6] opacity-90 leading-relaxed pt-1">
                          {activeSlide.statNarrative}
                        </div>
                        {activeSlide.manifestoAccentNote && (
                          <div className="text-[7.5px] font-mono text-[#D6AA5C] pt-1 border-t border-[#1A201B]">
                            {activeSlide.manifestoAccentNote}
                          </div>
                        )}
                      </div>
                    )}

                    {/* MANIFESTO */}
                    {activeSlide.layoutType === 'manifesto' && (
                      <>
                        <div className="text-[8px] font-mono text-[#D6AA5C]">
                          {activeSlide.manifestoHeader || 'ESTÁNDAR DE EXTRACCIÓN SOBERANA'}
                        </div>
                        <div className="space-y-1 text-[#F2EEE6] opacity-90 text-[8px] leading-tight">
                          {activeSlide.manifestoLines?.slice(0, 5).map((l, i) => (
                            <div key={i}>{l}</div>
                          ))}
                        </div>
                        {activeSlide.manifestoAccentNote && (
                          <div className="text-[7.5px] font-mono text-[#D6AA5C] pt-1 border-t border-[#1A201B]">
                            {activeSlide.manifestoAccentNote}
                          </div>
                        )}
                      </>
                    )}

                    {/* PILARES */}
                    {activeSlide.layoutType === 'pillars' && (
                      <div className="space-y-1.5">
                        {activeSlide.pillars?.slice(0, 4).map((p, i) => (
                          <div key={i} className="border-b border-[#1A201B] pb-1">
                            <span className="font-mono text-[#D6AA5C] text-[8px] block font-semibold">
                              {p.title}
                            </span>
                            <span className="text-[8.5px] text-[#F2EEE6] opacity-80 leading-tight block">
                              {p.desc}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* METRICS / TABLA */}
                    {activeSlide.layoutType === 'metrics' && (
                      <div className="space-y-1.5">
                        {activeSlide.metrics?.slice(0, 4).map((m, i) => (
                          <div key={i} className="border-b border-[#1A201B] pb-1">
                            <span className="font-mono text-[#D6AA5C] text-[8px] block font-semibold">
                              {m.param}
                            </span>
                            <span className="text-[8.5px] text-[#F2EEE6] opacity-80 leading-tight block">
                              {m.desc}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* BOTANY */}
                    {activeSlide.layoutType === 'botany' && (
                      <div className="space-y-1.5">
                        {activeSlide.botanyBlocks?.slice(0, 3).map((b, i) => (
                          <div key={i} className="border-b border-[#1A201B] pb-1">
                            <span className="font-mono text-[#D6AA5C] text-[8px] block font-semibold">
                              {b.title}
                            </span>
                            <span className="text-[8.5px] text-[#F2EEE6] opacity-80 leading-tight line-clamp-2">
                              {b.desc}
                            </span>
                          </div>
                        ))}
                        {activeSlide.botanyFooterNote && (
                          <div className="text-[7.5px] font-mono text-[#8E9690] pt-0.5">
                            {activeSlide.botanyFooterNote}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ESSAY */}
                    {activeSlide.layoutType === 'essay' && (
                      <div className="space-y-1.5 py-1">
                        {activeSlide.essayContent?.slice(0, 3).map((p, i) => (
                          <p key={i} className="text-[9px] font-serif leading-relaxed text-[#F2EEE6]">
                            {p}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* COMPARISON */}
                    {activeSlide.layoutType === 'comparison' && (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-2 gap-1.5 text-[8px]">
                          <div className="p-1.5 rounded-lg bg-[#0A0B0A] border border-[#262C27]">
                            <span className="text-[#D6AA5C] font-mono text-[7px] block">
                              {activeSlide.comparisonLeft?.tag}
                            </span>
                            <strong className="block font-serif text-[9px] text-[#F2EEE6]">
                              {activeSlide.comparisonLeft?.title}
                            </strong>
                            <div className="text-[7.5px] text-[#8E9690] mt-0.5 line-clamp-2">
                              {(activeSlide.comparisonLeft?.bullets ?? [])[0]}
                            </div>
                          </div>
                          <div className="p-1.5 rounded-lg bg-[#0A0B0A] border border-[#262C27]">
                            <span className="text-[#D6AA5C] font-mono text-[7px] block">
                              {activeSlide.comparisonRight?.tag}
                            </span>
                            <strong className="block font-serif text-[9px] text-[#F2EEE6]">
                              {activeSlide.comparisonRight?.title}
                            </strong>
                            <div className="text-[7.5px] text-[#8E9690] mt-0.5 line-clamp-2">
                              {(activeSlide.comparisonRight?.bullets ?? [])[0]}
                            </div>
                          </div>
                        </div>
                        {activeSlide.comparisonSharedNote && (
                          <div className="text-[7px] font-mono text-[#D6AA5C] text-center">
                            {activeSlide.comparisonSharedNote}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    {activeSlide.layoutType === 'cta' && (
                      <div className="p-2 rounded-lg border border-[#D6AA5C] bg-[#0A0B0A] text-center space-y-1">
                        <div className="font-mono text-[11px] text-[#D6AA5C] font-semibold">
                          {activeSlide.ctaUrl || 'obrerayzangano.cl'}
                        </div>
                        <div className="text-[8px] text-[#F2EEE6] opacity-80">
                          {activeSlide.ctaSubtitle}
                        </div>
                        <div className="text-[7.5px] font-mono text-[#8E9690] pt-0.5">
                          {activeSlide.ctaSubCall || 'ENLACE DIRECTO EN LA BIOGRAFÍA ->'}
                        </div>
                      </div>
                    )}

                    {/* CUSTOM */}
                    {activeSlide.layoutType === 'custom' && (
                      <div className="space-y-0.5">
                        <div className="text-[8px] font-mono text-[#D6AA5C]">
                          {activeSlide.customCardTitle || 'REGISTRO PERSONALIZADO'}
                        </div>
                        <div className="text-[8.5px] text-[#F2EEE6] opacity-90 line-clamp-4">
                          {activeSlide.customCardContent}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Inferior */}
                <div className="space-y-2">
                  <div className="h-px bg-[#1A201B] w-full" />
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-[#8E9690]">{activeSlide.footerLeft}</span>
                    <span className="text-[#D6AA5C]">
                      {String(activeSlideIndex + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ficha de Especificaciones de Salida */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info size={15} className="text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                Especificaciones de Salida
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl border border-border bg-surface-sunken/40">
                <span className="text-[10px] text-muted-foreground block">Resolución</span>
                <span className="font-semibold text-foreground">1080 × 1350 px</span>
              </div>
              <div className="p-2.5 rounded-xl border border-border bg-surface-sunken/40">
                <span className="text-[10px] text-muted-foreground block">Aspect Ratio</span>
                <span className="font-semibold text-foreground">4:5 (IG / X)</span>
              </div>
              <div className="p-2.5 rounded-xl border border-border bg-surface-sunken/40">
                <span className="text-[10px] text-muted-foreground block">Display Tipográfico</span>
                <span className="font-semibold text-foreground">Cormorant Garamond</span>
              </div>
              <div className="p-2.5 rounded-xl border border-border bg-surface-sunken/40">
                <span className="text-[10px] text-muted-foreground block">Metadatos & Código</span>
                <span className="font-semibold text-foreground">JetBrains Mono</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
