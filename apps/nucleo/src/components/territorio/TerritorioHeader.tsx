'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Map, LogIn } from 'lucide-react';

/**
 * Header sticky del territorio (landing + páginas públicas).
 * El fondo translúcido y el borde inferior aparecen solo al hacer scroll.
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
      className={`sticky top-0 z-50 h-16 print:hidden flex items-center justify-between gap-3 px-4 sm:px-8 lg:px-16 xl:px-24 transition-[background-color,border-color,box-shadow] ${
        scrolled
          ? 'bg-background/90 backdrop-blur-md border-b border-border/60 shadow-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <Link
        href="/"
        className="flex items-center gap-2.5 min-h-12 min-w-0"
        aria-label="Registro Territorial Apícola de Chiloé — inicio"
      >
        <span
          aria-hidden="true"
          className="w-9 h-9 shrink-0 bg-primary text-primary-foreground flex items-center justify-center text-base leading-none [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]"
        >
          🐝
        </span>
        <span className="font-medium text-sm tracking-wide text-foreground truncate">
          <span className="hidden lg:inline">Registro Territorial Apícola de Chiloé</span>
          <span className="lg:hidden">Registro Apícola Chiloé</span>
        </span>
      </Link>

      <nav className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="Navegación pública">
        <Link
          href="/mapa-chiloe"
          className="hidden sm:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11 px-3 py-2 rounded-xl hover:bg-surface-raised"
        >
          <Map className="w-4 h-4" />
          Mapa
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11 px-3 py-2 rounded-xl hover:bg-surface-raised"
        >
          <LogIn className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">Entrar</span>
          <span className="sm:hidden">Entrar</span>
        </Link>
        <Link
          href="/login?mode=signup"
          className="inline-flex items-center justify-center min-h-11 px-4 sm:px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-md shadow-primary/15 hover:bg-primary/90 transition-colors"
        >
          Inscribirse
        </Link>
      </nav>
    </header>
  );
}
