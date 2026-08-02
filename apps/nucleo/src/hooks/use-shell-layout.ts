'use client';

import { useEffect, useState } from 'react';

export const BREAKPOINT_MOBILE = 768;
export const BREAKPOINT_DESKTOP = 1024;

export type ShellLayoutMode = 'mobile' | 'tablet' | 'desktop';

/**
 * matchMedia en vez de 'resize': el listener de resize dispara setState en cada
 * tick al arrastrar la ventana (re-render completo de la shell por frame).
 * matchMedia solo emite 'change' al cruzar un breakpoint — coste despreciable
 * en hardware viejo y sin scroll/jank durante el redimensionado.
 */
export function useShellLayout(): ShellLayoutMode {
  // Prefer mobile on first paint to avoid missing bottom-nav on phones (SSR → client).
  // Desktop/tablet correct themselves on the first client effect frame.
  const [mode, setMode] = useState<ShellLayoutMode>('mobile');

  useEffect(() => {
    const mqMobile = window.matchMedia(`(max-width: ${BREAKPOINT_MOBILE - 1}px)`)
    const mqTablet = window.matchMedia(
      `(min-width: ${BREAKPOINT_MOBILE}px) and (max-width: ${BREAKPOINT_DESKTOP - 1}px)`,
    )
    const mqDesktop = window.matchMedia(`(min-width: ${BREAKPOINT_DESKTOP}px)`)
    const mqls = [mqMobile, mqTablet, mqDesktop]

    const update = () => {
      if (mqMobile.matches) setMode('mobile')
      else if (mqTablet.matches) setMode('tablet')
      else setMode('desktop')
    }

    update()
    mqls.forEach((mq) => mq.addEventListener('change', update))
    return () => mqls.forEach((mq) => mq.removeEventListener('change', update))
  }, []);

  return mode;
}
