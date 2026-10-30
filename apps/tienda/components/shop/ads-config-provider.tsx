'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { PublicAdsConfig } from '@/lib/integrations/ads-config';

const DEFAULT_ADS_CONFIG: PublicAdsConfig = {
  metaAds: {
    enabled: false,
    pixelId: '',
    hasCapiToken: false,
  },
  googleAds: {
    enabled: false,
    adsId: '',
  },
};

const AdsConfigContext = createContext<PublicAdsConfig>(DEFAULT_ADS_CONFIG);

export interface AdsConfigProviderProps {
  config: PublicAdsConfig;
  children: React.ReactNode;
}

export function AdsConfigProvider({ config, children }: AdsConfigProviderProps) {
  const value = useMemo(() => config ?? DEFAULT_ADS_CONFIG, [config]);

  return (
    <AdsConfigContext.Provider value={value}>
      {children}
    </AdsConfigContext.Provider>
  );
}

export function useAdsConfig(): PublicAdsConfig {
  return useContext(AdsConfigContext);
}
