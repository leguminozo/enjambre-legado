'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

export function viewLoadingFallback(label = 'Cargando módulo') {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2 className="animate-spin text-accent" size={22} />
      <span className="text-sm font-datos">{label}</span>
    </div>
  );
}

/** Code-split de vistas pesadas — mantiene shell instantáneo al cambiar de pestaña */
export function lazyView<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  label?: string,
) {
  return dynamic(loader, {
    loading: () => viewLoadingFallback(label),
    ssr: false,
  });
}