'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
      className={`sticky top-0 z-50 h-14 sm:h-16 print:hidden flex items-center justify-between gap-4 px-5 sm:px-10 lg:px-16 xl:px-24 transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? 'bg-background/85 backdrop-blur-xl border-b border-border/50'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <Link
        href="/"
        className="min-h-11 flex items-center gap-2.5 min-w-0 group"
        aria-label="Registro Apícola de Chiloé — inicio"
      >
        <TerritorioLogo className="w-8 h-8 shrink-0 transition-transform duration-300 group-hover:scale-105" />
        <span className="text-sm font-medium tracking-tight text-foreground truncate">
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
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center px-3.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Entrar
        </Link>
        <Link
          href="/login?mode=signup"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 sm:px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95 shadow-sm"
        >
          Inscribirse
        </Link>
      </nav>
    </header>
  );
}
