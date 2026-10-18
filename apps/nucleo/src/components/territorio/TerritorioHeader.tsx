'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@enjambre/ui';
import { TerritorioLogo } from './TerritorioLogo';

/**
 * Header público del territorio — marca + entrar + inscribirse.
 */
export function TerritorioHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 h-14 sm:h-16 print:hidden flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-10 lg:px-16 xl:px-24 transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? 'bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <Link
        href="/"
        className="min-h-11 flex items-center gap-2.5 sm:gap-3.5 min-w-0 group shrink"
        aria-label="Registro Apícola de Chiloé — inicio"
      >
        <TerritorioLogo className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_12px_rgba(212,154,42,0.2)]" />
        <span className="font-existencial font-semibold tracking-tight text-sm sm:text-base text-foreground truncate">
          <span className="hidden sm:inline">Registro Apícola Chiloé</span>
          <span className="sm:hidden">Registro Chiloé</span>
        </span>
      </Link>

      <nav className="flex items-center gap-1 sm:gap-2 shrink-0" aria-label="Navegación pública">
        <Link
          href="/carta"
          className="hidden sm:inline-flex min-h-11 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Carta Territorial
        </Link>
        <Link
          href="/mapa-chiloe"
          className="hidden md:inline-flex min-h-11 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Mapa
        </Link>
        <Link
          href="/municipalidades"
          className="hidden lg:inline-flex min-h-11 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Municipios
        </Link>
        <ThemeToggle />
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center px-2.5 sm:px-3.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Entrar
        </Link>
        <Link
          href="/login?mode=signup"
          className="inline-flex min-h-10 sm:min-h-11 items-center justify-center rounded-md bg-primary px-3 sm:px-5 text-xs sm:text-sm font-medium text-primary-foreground transition-all hover:opacity-95 shadow-sm active:scale-[0.98]"
        >
          Inscribirse
        </Link>
      </nav>
    </header>
  );
}
