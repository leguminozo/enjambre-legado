'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useConsent } from '@/components/shop/consent/consent-provider';
import {
  fireMetaPageView,
  getMetaPixelId,
  loadMetaPixel,
} from '@/lib/tracking/meta/pixel';

/**
 * Carga el Meta Pixel solo con consentimiento de marketing y dispara
 * PageView en cada ruta (SPA). Sin consentimiento: no inyecta nada.
 */
export function MetaPixelLoader() {
  const { marketingConsented } = useConsent();
  const pathname = usePathname();
  const pixelId = getMetaPixelId();

  useEffect(() => {
    if (marketingConsented && pixelId) {
      loadMetaPixel(pixelId);
    }
  }, [marketingConsented, pixelId]);

  useEffect(() => {
    if (marketingConsented && pixelId) {
      fireMetaPageView();
    }
  }, [pathname, marketingConsented, pixelId]);

  return null;
}
