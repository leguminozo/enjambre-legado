'use client';

import { useEffect, useState } from 'react';

const ROUTE_SETTLE_MS = 80;

function readPathname(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname;
}

/** Observa navegaciones cliente sin depender de `next/navigation`. */
function usePathnameSnapshot(): string {
  const [pathname, setPathname] = useState(readPathname);

  useEffect(() => {
    const sync = () => setPathname(readPathname());

    const { pushState, replaceState } = history;
    history.pushState = function (...args) {
      pushState.apply(this, args);
      sync();
    };
    history.replaceState = function (...args) {
      replaceState.apply(this, args);
      sync();
    };

    window.addEventListener('popstate', sync);
    sync();

    return () => {
      history.pushState = pushState;
      history.replaceState = replaceState;
      window.removeEventListener('popstate', sync);
    };
  }, []);

  return pathname;
}

/**
 * Retrasa el loader de datos cliente tras un cambio de ruta para no apilarlo
 * sobre `loading.tsx` o el fallback de `next/dynamic`.
 */
export function useClientViewLoading(isLoading: boolean): boolean {
  const pathname = usePathnameSnapshot();
  const [routeSettled, setRouteSettled] = useState(false);

  useEffect(() => {
    setRouteSettled(false);
    const id = window.setTimeout(() => setRouteSettled(true), ROUTE_SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [pathname]);

  if (!isLoading) return false;
  return routeSettled;
}