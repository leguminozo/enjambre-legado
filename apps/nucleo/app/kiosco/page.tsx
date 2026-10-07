'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  type SlideData,
  PRESET_KIT_CAFETERIA,
  PRESET_CLUB_LEGADO,
  PRESET_ULMO_ESTACIONAL,
  PRESET_MANIFIESTO,
} from '@/components/marketing/slide-studio-core';
import { STORAGE_KEY_CURRENT, STORAGE_KEY_TEMPLATES, type UserTemplate } from '@/components/marketing/use-slide-studio';
import { SlidePreviewCard } from '@/components/marketing/SlidePreviewCard';

export default function KioscoPage() {
  const [slides, setSlides] = useState<SlideData[]>(PRESET_KIT_CAFETERIA);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [intervalSec, setIntervalSec] = useState<number>(8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Cargar kit según URL query param o localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const kitParam = params.get('kit');

    if (kitParam === 'club') {
      setSlides(PRESET_CLUB_LEGADO);
    } else if (kitParam === 'ulmo') {
      setSlides(PRESET_ULMO_ESTACIONAL);
    } else if (kitParam === 'manifiesto') {
      setSlides(PRESET_MANIFIESTO);
    } else if (kitParam === 'cafeteria') {
      setSlides(PRESET_KIT_CAFETERIA);
    } else {
      // Intentar cargar el carrusel activo del estudio o plantillas guardadas
      try {
        const rawCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
        if (rawCurrent) {
          const parsed = JSON.parse(rawCurrent) as { slides?: SlideData[] };
          if (Array.isArray(parsed.slides) && parsed.slides.length > 0) {
            setSlides(parsed.slides);
            return;
          }
        }
      } catch {
        // Fallback a cafetería
      }
    }
  }, []);

  // Temporizador de auto-reproducción
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, intervalSec * 1000);

    return () => clearInterval(timer);
  }, [isPlaying, intervalSec, slides.length]);

  // Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
      } else if (e.key === 'p' || e.key === 'P') {
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const activeSlide = slides[currentIndex] || slides[0];

  return (
    <div
      className="fixed inset-0 bg-stone-950 text-stone-100 flex flex-col justify-between overflow-hidden select-none font-sans"
      onMouseMove={() => setControlsVisible(true)}
      onClick={() => setControlsVisible((prev) => !prev)}
    >
      {/* 1. Barra Superior Flotante del Kiosco */}
      <header
        className={`p-4 sm:p-6 flex items-center justify-between transition-opacity duration-300 z-20 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-semibold">
            OBRERA Y ZÁNGANO
          </span>
          <span className="text-stone-600">/</span>
          <span className="font-mono text-xs text-stone-400">KIOSCO DE MESA & BARRA</span>
        </div>

        {/* Controles de Reproducción y Pantalla */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5">
            {[5, 8, 12].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setIntervalSec(sec)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  intervalSec === sec ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-400"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-400"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      {/* 2. Escenario Central de la Lámina */}
      <main
        className="flex-1 flex items-center justify-center p-3 sm:p-6 z-10 w-full overflow-hidden"
        onClick={(e) => {
          e.stopPropagation();
          setCurrentIndex((prev) => (prev + 1) % slides.length);
        }}
      >
        <div className="w-full flex items-center justify-center">
          <SlidePreviewCard
            slide={activeSlide}
            index={currentIndex}
            total={slides.length}
            aspectRatio={activeSlide.aspectRatio || '4:5'}
            className="shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-stone-800"
          />
        </div>
      </main>

      {/* 3. Indicador de Navegación Inferior */}
      <footer
        className={`p-4 flex items-center justify-between z-20 transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
          className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-400"
          aria-label="Lámina anterior"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                currentIndex === i ? 'w-6 bg-amber-400' : 'w-1.5 bg-stone-700 hover:bg-stone-500'
              }`}
              aria-label={`Ir a lámina ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
          className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-400"
          aria-label="Lámina siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </footer>
    </div>
  );
}
