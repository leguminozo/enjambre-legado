'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { viewLoadingFallback } from '@enjambre/ui';

export { viewLoadingFallback };

const CHUNK_RELOAD_KEY = 'enjambre-chunk-reload';

/**
 * Si un deploy deja chunks viejos en cache, recarga una vez.
 * Evita pantallas en blanco por ChunkLoadError.
 */
function withChunkRetry<T>(loader: () => Promise<T>): () => Promise<T> {
  return async () => {
    try {
      const mod = await loader();
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        } catch {
          /* ignore */
        }
      }
      return mod;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isChunk =
        (err instanceof Error && err.name === 'ChunkLoadError') ||
        /Loading chunk|Failed to load chunk|ChunkLoadError/i.test(msg);

      if (isChunk && typeof window !== 'undefined') {
        try {
          if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
            sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
            window.location.reload();
            // Promise never resolves while reloading
            return new Promise(() => undefined) as Promise<T>;
          }
        } catch {
          /* ignore storage */
        }
      }
      throw err;
    }
  };
}

/** Code-split de vistas pesadas — mantiene shell instantáneo al cambiar de pestaña */
export function lazyView<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  label?: string,
) {
  return dynamic(withChunkRetry(loader), {
    loading: () => viewLoadingFallback(label),
    ssr: false,
  });
}
