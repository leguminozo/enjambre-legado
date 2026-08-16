'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useConsent } from '@/components/shop/consent/consent-provider';
import {
  fireGooglePageView,
  getGoogleAdsId,
  loadGoogleAds,
} from '@/lib/tracking/google/gtag';

/**
 * Carga gtag de Google Ads solo con consentimiento de marketing y dispara
 * page_view en cada ruta (SPA). Sin consentimiento o sin AW-: no inyecta nada.
 */
export function GoogleAdsLoader() {
  const { marketingConsented } = useConsent();
  const pathname = usePathname();
  const adsId = getGoogleAdsId();

  useEffect(() => {
    if (marketingConsented && adsId) {
      loadGoogleAds(adsId);
    }
  }, [marketingConsented, adsId]);

  useEffect(() => {
    if (marketingConsented && adsId) {
      fireGooglePageView();
    }
  }, [pathname, marketingConsented, adsId]);

  return null;
}
