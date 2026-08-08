'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useShellLayout, type ShellLayoutMode } from '@/hooks/use-shell-layout';

/**
 * Estado del área de trabajo (núcleo del sistema adaptativo):
 * - sidebarColapsado (persistido; el CSS del entorno responde con data-attributes)
 * - densidad compacto/espacioso (persistido)
 * - modo foco por ruta (persistido por herramienta)
 * - drawer del sidebar en tablet (rescate del contrato drawer muerto de Sidebar)
 * - contentMode: ancho medido del área de contenido (ResizeObserver + rAF).
 *   SetState solo al cruzar umbrales — misma filosofía matchMedia de useShellLayout,
 *   sin re-render por frame en hardware legacy (iPhone 7).
 */

export type Density = 'cozy' | 'compact';
export type ContentMode = 'narrow' | 'medium' | 'wide';

/** Umbrales del ancho MEDIDO del contenido (no del viewport): px */
export const CONTENT_NARROW_MAX = 640;
export const CONTENT_MEDIUM_MAX = 960;

export interface WorkspaceLayoutValue {
  shellMode: ShellLayoutMode;
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  density: Density;
  toggleDensity: () => void;
  focusMode: boolean;
  toggleFocusMode: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  contentMode: ContentMode;
  /** Ref del área de contenido real (page-content--shell); la mide el provider */
  registerContentRef: (el: HTMLElement | null) => void;
}

const WorkspaceLayoutContext = createContext<WorkspaceLayoutValue | null>(null);

export function useWorkspaceLayout(): WorkspaceLayoutValue {
  const value = useContext(WorkspaceLayoutContext);
  if (!value) {
    throw new Error('useWorkspaceLayout debe usarse dentro de <WorkspaceLayoutProvider>');
  }
  return value;
}

export function WorkspaceLayoutProvider({ children }: { children: React.ReactNode }) {
  const shellMode = useShellLayout();
  const pathname = usePathname();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [density, setDensity] = useState<Density>('cozy');
  const [focusMode, setFocusMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contentMode, setContentMode] = useState<ContentMode>('medium');
  const contentEl = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number>(0);

  // Hidratación de preferencias persistidas (la key del sidebar se mantiene por compat)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSidebarCollapsed(localStorage.getItem('desktopSidebarCollapsed') === 'true');
    setDensity(localStorage.getItem('nucleo:density') === 'compact' ? 'compact' : 'cozy');
  }, []);

  // Modo foco: por ruta (cada herramienta recuerda su propio modo)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setFocusMode(localStorage.getItem(`nucleo:focus:${pathname}`) === 'true');
  }, [pathname]);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('desktopSidebarCollapsed', String(next));
      return next;
    });
  }, []);

  const toggleDensity = useCallback(() => {
    setDensity((prev) => {
      const next: Density = prev === 'cozy' ? 'compact' : 'cozy';
      localStorage.setItem('nucleo:density', next);
      return next;
    });
  }, []);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const next = !prev;
      localStorage.setItem(`nucleo:focus:${pathname}`, String(next));
      return next;
    });
  }, [pathname]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const registerContentRef = useCallback((el: HTMLElement | null) => {
    contentEl.current = el;
  }, []);

  // Medición del área de contenido: RO + throttle rAF; setState solo al cruzar umbral
  useEffect(() => {
    const el = contentEl.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      const next: ContentMode =
        width < CONTENT_NARROW_MAX ? 'narrow' : width < CONTENT_MEDIUM_MAX ? 'medium' : 'wide';
      setContentMode((prev) => (prev === next ? prev : next));
    };
    let pending = false;
    const onResize = () => {
      if (pending) return;
      pending = true;
      rafRef.current = requestAnimationFrame(() => {
        pending = false;
        update();
      });
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(el);
    update();
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Cierre con Escape del drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // Bloqueo de scroll con el drawer abierto (mismo mecanismo que MobileNavSheet)
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const value = useMemo<WorkspaceLayoutValue>(
    () => ({
      shellMode,
      sidebarCollapsed,
      toggleSidebarCollapsed,
      density,
      toggleDensity,
      focusMode,
      toggleFocusMode,
      drawerOpen,
      openDrawer,
      closeDrawer,
      contentMode,
      registerContentRef,
    }),
    [
      shellMode,
      sidebarCollapsed,
      toggleSidebarCollapsed,
      density,
      toggleDensity,
      focusMode,
      toggleFocusMode,
      drawerOpen,
      openDrawer,
      closeDrawer,
      contentMode,
      registerContentRef,
    ],
  );

  return <WorkspaceLayoutContext.Provider value={value}>{children}</WorkspaceLayoutContext.Provider>;
}
