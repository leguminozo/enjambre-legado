'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

/** Prefetch de rutas en hover — complementa Link prefetch de Next.js */
export function useRoutePrefetch() {
  const router = useRouter();
  const prefetched = useRef(new Set<string>());

  const prefetch = useCallback(
    (href: string) => {
      if (!href || href.startsWith('http') || prefetched.current.has(href)) return;
      prefetched.current.add(href);
      void router.prefetch(href);
    },
    [router],
  );

  const prefetchMany = useCallback(
    (hrefs: string[]) => {
      for (const href of hrefs) prefetch(href);
    },
    [prefetch],
  );

  return { prefetch, prefetchMany };
}