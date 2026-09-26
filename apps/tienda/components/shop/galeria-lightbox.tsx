'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useModalFocusTrap, cn } from '@enjambre/ui';
import { useOverlayLock } from '@/lib/hooks/use-overlay-lock';
import type { GaleriaImage } from './galeria-grid';

export interface GaleriaLightboxProps {
  images: GaleriaImage[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  kicker?: string;
}

export function GaleriaLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  kicker = 'Galería Territorial',
}: GaleriaLightboxProps) {
  const isOpen = currentIndex !== null && currentIndex >= 0 && currentIndex < images.length;
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useOverlayLock(isOpen);
  useModalFocusTrap({ open: isOpen, onClose, containerRef });

  const total = images.length;
  const currentImage = isOpen && currentIndex !== null ? images[currentIndex] : null;

  const goToNext = useCallback(() => {
    if (currentIndex === null || total <= 1) return;
    onNavigate((currentIndex + 1) % total);
  }, [currentIndex, total, onNavigate]);

  const goToPrev = useCallback(() => {
    if (currentIndex === null || total <= 1) return;
    onNavigate((currentIndex - 1 + total) % total);
  }, [currentIndex, total, onNavigate]);

  // Manejo de teclas de navegación y escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNext, goToPrev, onClose]);

  // Scroll automático a la miniatura activa en la tira
  useEffect(() => {
    if (isOpen && activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentIndex, isOpen]);

  // Manejo táctil para swipe en móviles y tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Deslizamiento horizontal prioritario para avanzar/retroceder
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    } else if (deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
      // Swipe hacia abajo para descartar/cerrar el visor
      onClose();
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  if (!isOpen || !currentImage || typeof document === 'undefined') return null;

  const currentNumber = String((currentIndex ?? 0) + 1).padStart(2, '0');
  const totalNumber = String(total).padStart(2, '0');

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={currentImage.titulo ? `Fotografía: ${currentImage.titulo}` : 'Visor de galería'}
      className="fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden bg-background/95 backdrop-blur-2xl h-[var(--vh-full)] min-h-[var(--vh-full)] animate-in fade-in duration-300 motion-reduce:animate-none select-none text-foreground"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Barra superior minimalista: contador editorial y botón de cierre */}
      <header className="relative z-30 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-border/40 bg-background/40 px-4 sm:px-8 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground font-medium hidden sm:inline-block">
            {kicker}
          </span>
          <span className="hidden sm:inline-block text-border">·</span>
          <div className="flex items-center gap-1.5 font-display text-base tracking-widest tabular-nums text-foreground/90">
            <span>{currentNumber}</span>
            <span className="text-muted-foreground/60 text-xs">/</span>
            <span className="text-muted-foreground">{totalNumber}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-11 min-w-11 h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-border/50 bg-card/50 hover:bg-card hover:border-foreground/40 text-foreground flex items-center justify-center transition-colors"
          title="Cerrar (Esc)"
          aria-label="Cerrar visor"
        >
          <X size={20} />
        </button>
      </header>

      {/* Escenario central: fotografía a máxima escala */}
      <main className="relative flex-1 min-h-0 w-full flex items-center justify-center px-2 sm:px-14 py-2 sm:py-4 overflow-hidden">
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrev}
              className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 min-h-11 min-w-11 h-11 w-11 sm:h-13 sm:w-13 rounded-full border border-border/60 bg-card/75 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-card hover:border-foreground/50 hover:scale-105 active:scale-95 transition-all shadow-xl"
              aria-label="Fotografía anterior"
              title="Anterior (Flecha izquierda)"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              type="button"
              onClick={goToNext}
              className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 min-h-11 min-w-11 h-11 w-11 sm:h-13 sm:w-13 rounded-full border border-border/60 bg-card/75 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-card hover:border-foreground/50 hover:scale-105 active:scale-95 transition-all shadow-xl"
              aria-label="Siguiente fotografía"
              title="Siguiente (Flecha derecha)"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        <div className="relative w-full h-full max-w-[94vw] flex items-center justify-center overflow-hidden">
          {currentImage.url && !failedUrls[currentImage.url] ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={currentImage.url}
                alt={currentImage.titulo || 'Fotografía de la galería'}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 94vw"
                onError={() => setFailedUrls((prev) => ({ ...prev, [currentImage.url]: true }))}
              />
            </div>
          ) : (
            <div className="flex h-64 sm:h-80 w-full max-w-md flex-col items-center justify-center rounded-2xl border border-border bg-card/60 p-6 text-center text-muted-foreground backdrop-blur-md">
              <span className="font-display text-xl font-medium text-foreground">
                {currentImage.titulo || 'Fotografía de la galería'}
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Pie de foto editorial centrado y tira de miniaturas */}
      <footer className="relative z-30 shrink-0 border-t border-border/40 bg-background/70 backdrop-blur-xl">
        {/* Leyenda editorial centrada */}
        <div className="px-4 sm:px-8 py-3 sm:py-4 flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full">
          <h2 className="font-display text-lg sm:text-2xl text-foreground font-light tracking-wide text-balance text-center">
            {currentImage.titulo || 'Captura de Origen'}
          </h2>
          {currentImage.descripcion ? (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 text-pretty max-w-2xl line-clamp-2 sm:line-clamp-none whitespace-pre-line text-center">
              {currentImage.descripcion}
            </p>
          ) : null}
        </div>

        {/* Tira horizontal de miniaturas (filmstrip) */}
        {total > 1 && (
          <div className="border-t border-border/30 px-4 py-2.5">
            <div
              className="flex items-center gap-2 overflow-x-auto tienda-filter-scroll justify-start sm:justify-center py-1"
              role="tablist"
              aria-label="Tira de miniaturas de la galería"
            >
              {images.map((img, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={img.id || idx}
                    ref={isActive ? activeThumbRef : null}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Ver imagen ${idx + 1}: ${img.titulo || 'Fotografía'}`}
                    onClick={() => onNavigate(idx)}
                    className={cn(
                      'relative h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden border-2 transition-all shrink-0',
                      isActive
                        ? 'border-accent ring-2 ring-accent/40 scale-105 opacity-100'
                        : 'border-border/40 opacity-50 hover:opacity-90 hover:border-border'
                    )}
                  >
                    {img.url && !failedUrls[img.url] ? (
                      <Image
                        src={img.url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-card text-[9px] text-muted-foreground">
                        {idx + 1}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </footer>
    </div>,
    document.body
  );
}
