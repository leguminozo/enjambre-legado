'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings2,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { type SlideData, type SlideAspectRatio } from './slide-studio-core';
import { SlidePreviewCard } from './SlidePreviewCard';

export interface LivePresenterKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: SlideData[];
  aspectRatio: SlideAspectRatio;
  onAspectRatioChange?: (ratio: SlideAspectRatio) => void;
}

export function LivePresenterKioskModal({
  isOpen,
  onClose,
  slides,
  aspectRatio,
  onAspectRatioChange,
}: LivePresenterKioskModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalSec, setIntervalSec] = useState<number>(8);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [activeSlideIds, setActiveSlideIds] = useState<string[]>(slides.map((s) => s.id));

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Sincronizar láminas activas si cambia la lista en el editor
  useEffect(() => {
    setActiveSlideIds((prev) => {
      const existing = new Set(slides.map((s) => s.id));
      const filtered = prev.filter((id) => existing.has(id));
      // Si se agregaron nuevas, incluirlas por defecto
      for (const s of slides) {
        if (!prev.includes(s.id)) filtered.push(s.id);
      }
      return filtered.length > 0 ? filtered : slides.map((s) => s.id);
    });
  }, [slides]);

  // Lista de láminas filtradas para la presentación
  const presentableSlides = slides.filter((s) => activeSlideIds.includes(s.id));
  const activeSlide = presentableSlides[currentIndex] ?? presentableSlides[0] ?? slides[0];

  // Ajustar índice si la lista cambia
  useEffect(() => {
    if (currentIndex >= presentableSlides.length) {
      setCurrentIndex(Math.max(0, presentableSlides.length - 1));
    }
  }, [presentableSlides.length, currentIndex]);

  const handleNext = useCallback(() => {
    if (presentableSlides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % presentableSlides.length);
    setProgress(0);
  }, [presentableSlides.length]);

  const handlePrev = useCallback(() => {
    if (presentableSlides.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + presentableSlides.length) % presentableSlides.length);
    setProgress(0);
  }, [presentableSlides.length]);

  // Auto-play timer
  useEffect(() => {
    if (!isOpen || !isPlaying || presentableSlides.length <= 1) {
      setProgress(0);
      return;
    }

    const stepMs = 100;
    const totalSteps = (intervalSec * 1000) / stepMs;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / totalSteps;
        if (next >= 100) {
          handleNext();
          return 0;
        }
        return next;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, intervalSec, presentableSlides.length, handleNext]);

  // Atajos de teclado para presentación de sala
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'Escape') {
        if (showConfig) {
          setShowConfig(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, showConfig, onClose]);

  // Soporte de gestos táctiles (Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartXRef.current = null;
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fallback
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {
        // Fallback
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#060706] text-[#F2EEE6] flex flex-col justify-between overflow-hidden select-none animate-in fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Barra de Control Superior */}
      <header className="px-4 py-3 border-b border-[#1A201B] bg-[#0A0B0A]/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-medium">
            <Radio size={12} className="animate-pulse" />
            <span>EN VIVO (SALA)</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span>{presentableSlides.length} láminas activas</span>
            <span>•</span>
            <span className="text-[#D6AA5C]">{activeSlide?.badge || 'DOCUMENTO DE ORIGEN'}</span>
          </div>
        </div>

        {/* Acciones y Configuración de Sala */}
        <div className="flex items-center gap-2">
          {/* Conmutador de Proporción Rápido */}
          {onAspectRatioChange && (
            <div className="hidden md:flex items-center p-0.5 rounded-lg border border-border bg-surface-sunken">
              {(['4:5', '9:16', '1:1', '16:9'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => onAspectRatioChange(ratio)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                    aspectRatio === ratio
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          )}

          {/* Botón Auto-Play con Barra de Progreso */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#262C27] bg-[#101310]">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-[#D6AA5C] hover:text-[#F2EEE6] transition-colors p-0.5"
              title={isPlaying ? 'Pausar auto-avance' : 'Iniciar auto-avance'}
              aria-label={isPlaying ? 'Pausar auto-avance' : 'Iniciar auto-avance'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <select
              value={intervalSec}
              onChange={(e) => setIntervalSec(Number(e.target.value))}
              className="bg-transparent text-[10px] font-mono text-muted-foreground focus:outline-none cursor-pointer"
              title="Intervalo por lámina"
            >
              <option value={5} className="bg-[#101310] text-[#F2EEE6]">5s</option>
              <option value={8} className="bg-[#101310] text-[#F2EEE6]">8s</option>
              <option value={12} className="bg-[#101310] text-[#F2EEE6]">12s</option>
            </select>
          </div>

          {/* Configuración de Láminas */}
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`btn btn-ghost btn-sm h-8 px-2.5 text-xs flex items-center gap-1 font-mono ${
              showConfig ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
            }`}
            title="Configurar láminas visibles"
          >
            <Settings2 size={14} />
            <span className="hidden sm:inline">Configurar</span>
          </button>

          {/* Pantalla Completa */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="btn btn-ghost btn-sm h-8 w-8 p-0 text-muted-foreground hover:text-foreground flex items-center justify-center"
            title="Pantalla completa"
            aria-label="Pantalla completa"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Kiosco Web Standalone */}
          <button
            type="button"
            onClick={() => window.open('/kiosco', '_blank')}
            className="btn btn-ghost btn-sm h-8 px-2.5 text-xs text-muted-foreground hover:text-amber-400 flex items-center gap-1.5 font-mono"
            title="Abrir Kiosco Web en nueva pestaña (para tablet o pantalla de mesón)"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">Kiosco Web</span>
          </button>

          {/* Salir */}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex items-center justify-center"
            title="Cerrar presentación (Esc)"
            aria-label="Cerrar presentación"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Barra de progreso de auto-play */}
      {isPlaying && (
        <div className="w-full h-0.5 bg-[#1A201B]">
          <div
            className="h-full bg-gradient-to-r from-[#A07E44] to-[#D6AA5C] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 2. Área Central de Presentación */}
      <main className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {/* Botón flotante izquierda */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={presentableSlides.length <= 1}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-full border border-[#262C27] bg-[#101310]/80 backdrop-blur text-muted-foreground hover:text-foreground hover:border-[#D6AA5C]/60 flex items-center justify-center transition-all disabled:opacity-30 shadow-2xl"
          aria-label="Lámina anterior"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Lámina Central con escalado responsivo */}
        <div className="w-full max-w-[420px] transition-all duration-300 ease-out transform animate-in fade-in zoom-in-95">
          {activeSlide ? (
            <SlidePreviewCard
              slide={activeSlide}
              index={currentIndex}
              total={presentableSlides.length}
              aspectRatio={aspectRatio}
              className="mx-auto shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-[#333C34]"
            />
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-[#262C27] text-center text-muted-foreground">
              No hay láminas seleccionadas para exhibir.
            </div>
          )}
        </div>

        {/* Botón flotante derecha */}
        <button
          type="button"
          onClick={handleNext}
          disabled={presentableSlides.length <= 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-full border border-[#262C27] bg-[#101310]/80 backdrop-blur text-muted-foreground hover:text-foreground hover:border-[#D6AA5C]/60 flex items-center justify-center transition-all disabled:opacity-30 shadow-2xl"
          aria-label="Lámina siguiente"
        >
          <ChevronRight size={24} />
        </button>

        {/* Modal Desplegable de Configuración de Láminas de Sala */}
        {showConfig && (
          <div className="absolute right-4 top-4 z-40 w-80 max-h-[80vh] overflow-y-auto p-4 rounded-2xl border border-border bg-card shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-xs font-mono font-semibold uppercase text-foreground">
                Láminas a Exhibir
              </span>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Activa o desactiva qué láminas entran en la rotación de sala sin alterar el orden del editor.
            </p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {slides.map((s, idx) => {
                const isSelected = activeSlideIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-border/60 hover:bg-surface-sunken/40 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          if (activeSlideIds.length > 1) {
                            setActiveSlideIds(activeSlideIds.filter((id) => id !== s.id));
                          }
                        } else {
                          setActiveSlideIds([...activeSlideIds, s.id]);
                        }
                      }}
                      className="rounded border-border text-primary focus:ring-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] text-primary truncate">
                        {String(idx + 1).padStart(2, '0')} // {s.kickerLeft || 'ORIGEN'}
                      </p>
                      <p className="text-foreground truncate text-[11px]">{s.title || 'Sin título'}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="pt-2 border-t border-border/60 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveSlideIds(slides.map((s) => s.id))}
                className="text-[10px] font-mono text-primary hover:underline"
              >
                Activar Todas
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="btn btn-primary btn-xs text-[11px] px-3"
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. Barra Inferior con Paginación e Indicadores */}
      <footer className="px-4 py-3 border-t border-[#1A201B] bg-[#0A0B0A]/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px] sm:max-w-md">
          {activeSlide?.title}
        </div>

        {/* Puntos de Navegación Interactivos */}
        <div className="flex items-center gap-1.5">
          {presentableSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                setProgress(0);
              }}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-6 bg-[#D6AA5C]'
                  : 'w-2 bg-[#262C27] hover:bg-[#8E9690]'
              }`}
              title={`Ir a lámina ${idx + 1}`}
              aria-label={`Ir a lámina ${idx + 1}`}
            />
          ))}
        </div>

        <div className="text-[11px] font-mono font-semibold text-[#D6AA5C]">
          [{String(currentIndex + 1).padStart(2, '0')} // {String(presentableSlides.length).padStart(2, '0')}]
        </div>
      </footer>
    </div>
  );
}
