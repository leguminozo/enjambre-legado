'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@enjambre/ui';
import { TerritorioLogo } from './TerritorioLogo';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_TERRITORIO_HEADER,
  type TerritorioHeaderContent,
} from '@/lib/territorio-cms';

export interface TerritorioHeaderProps {
  content?: TerritorioHeaderContent;
}

const STORAGE_KEY = 'enj_territorio_header_cfg';
let memoryHeaderCache: TerritorioHeaderContent | null = null;

function resolveInitialContent(propContent?: TerritorioHeaderContent): TerritorioHeaderContent {
  if (propContent) {
    memoryHeaderCache = propContent;
    return propContent;
  }
  if (memoryHeaderCache) {
    return memoryHeaderCache;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<TerritorioHeaderContent>;
        if (parsed && typeof parsed === 'object') {
          const merged: TerritorioHeaderContent = { ...DEFAULT_TERRITORIO_HEADER, ...parsed };
          memoryHeaderCache = merged;
          return merged;
        }
      }
    } catch {
      // Ignorar error de parsing en storage
    }
  }
  return DEFAULT_TERRITORIO_HEADER;
}

/**
 * Header público del territorio — marca + entrar + inscribirse.
 * Editable y configurable desde CMS (Registro Territorial -> Cabecera y Navegación).
 * Se auto-sincroniza en páginas cliente y recibe contenido vía SSR en páginas servidor.
 */
export function TerritorioHeader({ content }: TerritorioHeaderProps = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [headerContent, setHeaderContent] = useState<TerritorioHeaderContent>(() =>
    resolveInitialContent(content),
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (content) {
      memoryHeaderCache = content;
      setHeaderContent(content);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
        } catch {}
      }
      return;
    }

    let cancelled = false;
    async function syncHeaderFromDb() {
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('content')
          .eq('section_key', 'territorio_header')
          .eq('is_active', true)
          .maybeSingle();

        if (!cancelled && !error && data?.content) {
          const merged: TerritorioHeaderContent = {
            ...DEFAULT_TERRITORIO_HEADER,
            ...(data.content as Partial<TerritorioHeaderContent>),
          };
          memoryHeaderCache = merged;
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch {}
          }
          setHeaderContent(merged);
        }
      } catch {
        // Fallback silencioso
      }
    }

    void syncHeaderFromDb();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setHeaderContent({ ...DEFAULT_TERRITORIO_HEADER, ...parsed });
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', handleStorage);
    };
  }, [content]);

  const cfg = content ?? headerContent;

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
