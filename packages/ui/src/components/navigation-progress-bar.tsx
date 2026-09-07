'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathnameSnapshot } from '../hooks/use-client-view-loading';

const END_SETTLE_MS = 80;
const FADE_MS = 350;
const SAFETY_MS = 8000;

/**
 * Barra fina superior durante navegaciones cliente (percepción de velocidad).
 * Framework-agnostic: detecta inicio con click en anchors mismo-origen y fin con
 * el patrón de history-patching de `usePathnameSnapshot` (sin next/navigation).
 * Se omite por completo con `prefers-reduced-motion: reduce`.
 */
export function NavigationProgressBar() {
  const pathname = usePathnameSnapshot();
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle');
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathnameRef = useRef(pathname);
  const startPathname = useRef<string | null>(null);
  // eslint-disable-next-line react-hooks/refs -- Intentional ref-sync: event handlers read latest pathname without re-subscribing effects
  pathnameRef.current = pathname;

  const clearTimers = () => {
    if (endTimer.current) clearTimeout(endTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
  };

  // Inicio: click en anchor mismo-origen (captura, antes de que Next lo maneje)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      try {
        if (new URL(href, window.location.href).origin !== window.location.origin) return;
      } catch {
        return;
      }
      clearTimers();
      startPathname.current = pathnameRef.current;
      setPhase('loading');
      safetyTimer.current = setTimeout(() => setPhase('done'), SAFETY_MS);
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clearTimers();
    };
  }, []);

  // Fin: el pathname cambió respecto al inicio de la navegación
  useEffect(() => {
    if (phase !== 'loading') return;
    if (pathname === startPathname.current) return;
    endTimer.current = setTimeout(() => setPhase('done'), END_SETTLE_MS);
    return () => {
      if (endTimer.current) clearTimeout(endTimer.current);
    };
  }, [pathname, phase]);

  // 'done': fade out y desmontaje
  useEffect(() => {
    if (phase !== 'done') return;
    const id = setTimeout(() => setPhase('idle'), FADE_MS);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === 'idle') return null;

  return (
    <div
      className="enj-nav-progress"
      role="progressbar"
      aria-label="Cargando"
      aria-hidden={phase === 'done'}
    >
      <div className={`enj-nav-progress__bar${phase === 'done' ? ' is-done' : ''}`} />
    </div>
  );
}
