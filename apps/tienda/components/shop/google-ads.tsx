'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useConsent } from '@/components/shop/consent/consent-provider';
import { useAdsConfig } from '@/components/shop/ads-config-provider';
import {
  fireGooglePageView,
  getGoogleAdsId,
  loadGoogleAds,
} from '@/lib/tracking/google/gtag';

/**
 * Carga gtag de Google Ads solo con consentimiento de marketing y cuando la integración
 * está habilitada. Dispara page_view en cada cambio de ruta SPA.
 */
export function GoogleAdsLoader() {
  const { marketingConsented } = useConsent();
  const { googleAds } = useAdsConfig();
  const pathname = usePathname();

  const adsId = googleAds.adsId || getGoogleAdsId();
  const isEnabled = googleAds.enabled ?? Boolean(adsId);

  useEffect(() => {
    if (marketingConsented && isEnabled && adsId) {
      loadGoogleAds(adsId);
    }
  }, [marketingConsented, isEnabled, adsId]);

  useEffect(() => {
    if (marketingConsented && isEnabled && adsId) {
      fireGooglePageView();
    }
  }, [pathname, marketingConsented, isEnabled, adsId]);

  return null;
}
