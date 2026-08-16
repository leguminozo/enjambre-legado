/**
 * Resolución de modo de Google Ads (mismo patrón que meta-ads.ts).
 * - 'live': hay conversion ID público (NEXT_PUBLIC_GOOGLE_ADS_ID)
 * - 'stub': sin ID — no se carga gtag
 * No hay token de servidor: gtag corre solo en el navegador.
 */

import { getGoogleAdsId } from '@/lib/tracking/google/gtag';

export type GoogleAdsMode = 'live' | 'stub';

export function resolveGoogleAdsMode(): GoogleAdsMode {
  return getGoogleAdsId() ? 'live' : 'stub';
}
