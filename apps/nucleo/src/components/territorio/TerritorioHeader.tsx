'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@enjambre/ui';
import { TerritorioLogo } from './TerritorioLogo';
import {
  DEFAULT_TERRITORIO_HEADER,
  type TerritorioHeaderContent,
} from '@/lib/territorio-cms';

export interface TerritorioHeaderProps {
  content?: TerritorioHeaderContent;
}

/**
 * Header público del territorio — marca + entrar + inscribirse.
 * Editable y configurable desde CMS (Registro Territorial -> Cabecera y Navegación).
 */
export function TerritorioHeader({ content }: TerritorioHeaderProps = {}) {
  const [scrolled, setScrolled] = useState(false);
  const cfg = { ...DEFAULT_TERRITORIO_HEADER, ...(content ?? {}) };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      data-cms-section="territorio_header"
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
        {cfg.show_carta && cfg.carta_label && (
          <Link
            href={cfg.carta_href || '/carta'}
            className="hidden sm:inline-flex min-h-11 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {cfg.carta_label}
          </Link>
        )}
        {cfg.show_mapa && cfg.mapa_label && (
          <Link
            href={cfg.mapa_href || '/mapa-chiloe'}
            className="hidden md:inline-flex min-h-11 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {cfg.mapa_label}
          </Link>
        )}
        {cfg.show_municipios && cfg.municipios_label && (
          <Link
            href={cfg.municipios_href || '/municipalidades'}
            className="hidden lg:inline-flex min-h-11 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {cfg.municipios_label}
          </Link>
        )}
        {cfg.show_theme_toggle && <ThemeToggle />}
        {cfg.show_login && cfg.login_label && (
          <Link
            href={cfg.login_href || '/login'}
            className="inline-flex min-h-11 items-center px-2.5 sm:px-3.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {cfg.login_label}
          </Link>
        )}
        {cfg.show_signup && cfg.signup_label && (
          <Link
            href={cfg.signup_href || '/login?mode=signup'}
            className="inline-flex min-h-10 sm:min-h-11 items-center justify-center rounded-md bg-primary px-3 sm:px-5 text-xs sm:text-sm font-medium text-primary-foreground transition-all hover:opacity-95 shadow-sm active:scale-[0.98]"
          >
            {cfg.signup_label}
          </Link>
        )}
      </nav>
    </header>
  );
}
