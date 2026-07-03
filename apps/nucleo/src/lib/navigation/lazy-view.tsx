'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { viewLoadingFallback } from '@enjambre/ui';

export { viewLoadingFallback };

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