'use client';

import { useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import {
  CREATOR_REF_CODE_KEY,
  PROMO_DISCOUNT_CODE_KEY,
  writeCommerceStorage,
  writeUtmAttribution,
  readUtmAttribution,
  type UtmAttribution,
} from '@/lib/shop/commerce-storage';

function cleanParam(val: string | null, maxLen = 120): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

/**
 * Captura y persiste parámetros de atribución en sesión y almacenamiento local
 * cuando un visitante llega desde un anuncio o enlace compartido:
 * - Meta Ads / Google Ads: utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, gclid
 * - Red de creadores / embajadores: ?ref= o ?codigo=
 */
export function TrafficAttributionCapture() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Creadores / Embajadores
    const rawRef = searchParams.get('ref') ?? searchParams.get('codigo');
    const creatorCode = cleanParam(rawRef, 40)?.toUpperCase();
    if (creatorCode && creatorCode.length >= 2) {
      writeCommerceStorage(CREATOR_REF_CODE_KEY, creatorCode);
    }

    // 1b. Códigos de descuento o beneficio (?descuento= / ?cupon= / ?promo=)
    const rawPromo = searchParams.get('descuento') ?? searchParams.get('cupon') ?? searchParams.get('promo');
    const promoCode = cleanParam(rawPromo, 40)?.toUpperCase();
    if (promoCode && promoCode.length >= 2) {
      writeCommerceStorage(PROMO_DISCOUNT_CODE_KEY, promoCode);
    }

    // 2. Parámetros UTM y Click IDs (Meta fbclid / Google gclid)
    const source = cleanParam(searchParams.get('utm_source'));
    const medium = cleanParam(searchParams.get('utm_medium'));
    const campaign = cleanParam(searchParams.get('utm_campaign'));
    const content = cleanParam(searchParams.get('utm_content'));
    const term = cleanParam(searchParams.get('utm_term'));
    const fbclid = cleanParam(searchParams.get('fbclid'), 200);
    const gclid = cleanParam(searchParams.get('gclid'), 200);

    const hasNewAttribution = Boolean(
      source || medium || campaign || content || term || fbclid || gclid,
    );

    if (hasNewAttribution) {
      const existing = readUtmAttribution();
      const currentUrl = typeof window !== 'undefined'
        ? `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
        : pathname;

      const newAttribution: UtmAttribution = {
        source: source ?? existing?.source,
        medium: medium ?? existing?.medium,
        campaign: campaign ?? existing?.campaign,
        content: content ?? existing?.content,
        term: term ?? existing?.term,
        fbclid: fbclid ?? existing?.fbclid,
        gclid: gclid ?? existing?.gclid,
        capturedAt: new Date().toISOString(),
        landingUrl: currentUrl,
      };

      writeUtmAttribution(newAttribution);
    }
  }, [searchParams, pathname]);

  return null;
}
