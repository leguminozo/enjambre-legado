'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type ConsentCategories,
  consentEssentialOnly,
  consentForAll,
  readConsentFromDocumentCookie,
  serializeConsentCookie,
} from '@/lib/tracking/consent';

/**
 * Estado de consentimiento para tracking (banner estricto).
 * - 'unknown': sin cookie → banner visible, nada se trackea.
 * - 'essential-only': usuario eligió solo esenciales → sin pixel ni CAPI.
 * - 'marketing': consentimiento de marketing → pixel + CAPI habilitados.
 */
export type ConsentStatus = 'unknown' | 'essential-only' | 'marketing';

type ConsentApi = {
  status: ConsentStatus;
  marketingConsented: boolean;
  acceptAll: () => void;
  acceptEssential: () => void;
};

const ConsentContext = createContext<ConsentApi | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConsentStatus>('unknown');

  useEffect(() => {
    const state = readConsentFromDocumentCookie(document.cookie);
    setStatus(state ? (state.marketing ? 'marketing' : 'essential-only') : 'unknown');
  }, []);

  const apply = useCallback((categories: ConsentCategories) => {
    document.cookie = serializeConsentCookie(categories);
    setStatus(categories.marketing ? 'marketing' : 'essential-only');
  }, []);

  const acceptAll = useCallback(() => apply(consentForAll()), [apply]);
  const acceptEssential = useCallback(() => apply(consentEssentialOnly()), [apply]);

  const value = useMemo<ConsentApi>(
    () => ({
      status,
      marketingConsented: status === 'marketing',
      acceptAll,
      acceptEssential,
    }),
    [status, acceptAll, acceptEssential],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent debe usarse dentro de ConsentProvider');
  return ctx;
}
