/**
 * Resolución de modo de la integración Meta Ads (patrón registry.ts del SII).
 * - 'live': CAPI operativo (token + pixel id configurados en env de la tienda)
 * - 'stub': sin credenciales — no llama a Meta, no-op silencioso
 */

import { getMetaCapiConfig } from '@/lib/tracking/meta/capi';

export type MetaAdsMode = 'live' | 'stub';

export function resolveMetaAdsMode(): MetaAdsMode {
  const { pixelId, token } = getMetaCapiConfig();
  return pixelId && token ? 'live' : 'stub';
}
