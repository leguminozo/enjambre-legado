'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useConsent } from '@/components/shop/consent/consent-provider';
import { useAdsConfig } from '@/components/shop/ads-config-provider';
import {
  fireMetaPageView,
  getMetaPixelId,
  loadMetaPixel,
} from '@/lib/tracking/meta/pixel';

/**
 * Carga el Meta Pixel solo con consentimiento de marketing y cuando la integración
 * está habilitada. Dispara PageView en cada cambio de ruta SPA.
 */
export function MetaPixelLoader() {
  const { marketingConsented } = useConsent();
  const { metaAds } = useAdsConfig();
  const pathname = usePathname();

  const pixelId = metaAds.pixelId || getMetaPixelId();
  const isEnabled = metaAds.enabled ?? Boolean(pixelId);

  useEffect(() => {
    if (marketingConsented && isEnabled && pixelId) {
      loadMetaPixel(pixelId);
    }
  }, [marketingConsented, isEnabled, pixelId]);

  useEffect(() => {
    if (marketingConsented && isEnabled && pixelId) {
      fireMetaPageView();
    }
  }, [pathname, marketingConsented, isEnabled, pixelId]);

  return null;
}
