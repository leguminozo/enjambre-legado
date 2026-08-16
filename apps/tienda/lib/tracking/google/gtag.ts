/**
 * Google Ads (gtag.js). Carga solo con consentimiento de marketing.
 * Sin `NEXT_PUBLIC_GOOGLE_ADS_ID` (AW-…) no inyecta nada.
 * Purchase dispara además `conversion` si hay `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL`.
 */

import type { MetaEventName, TrackedContentItem } from '@/lib/tracking/types';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const AW_ID_RE = /^AW-\d+$/i;
const AW_DIGITS_RE = /^\d+$/;
const LABEL_RE = /^[\w-]+$/;

export type GoogleAdsTrackInput = {
  eventName: MetaEventName;
  value?: number;
  currency?: string;
  contentIds?: string[];
  contents?: TrackedContentItem[];
  orderId?: string;
};

let gtagLoaded = false;

/** Normaliza `AW-123` o `123`. Rechaza basura para no inyectar un tag inválido. */
export function normalizeGoogleAdsId(raw: string | undefined | null): string | undefined {
  const t = raw?.trim();
  if (!t) return undefined;
  if (AW_ID_RE.test(t)) return `AW-${t.slice(3)}`;
  if (AW_DIGITS_RE.test(t)) return `AW-${t}`;
  return undefined;
}

export function normalizeGoogleAdsLabel(raw: string | undefined | null): string | undefined {
  const t = raw?.trim();
  if (!t || !LABEL_RE.test(t)) return undefined;
  return t;
}

export function getGoogleAdsId(): string | undefined {
  return normalizeGoogleAdsId(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID);
}

export function getGoogleAdsPurchaseLabel(): string | undefined {
  return normalizeGoogleAdsLabel(process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL);
}

export function getGoogleAdsPurchaseSendTo(): string | undefined {
  const id = getGoogleAdsId();
  const label = getGoogleAdsPurchaseLabel();
  if (!id || !label) return undefined;
  return `${id}/${label}`;
}

export function mapMetaEventToGtagName(eventName: MetaEventName): string {
  switch (eventName) {
    case 'ViewContent':
      return 'view_item';
    case 'AddToCart':
      return 'add_to_cart';
    case 'InitiateCheckout':
      return 'begin_checkout';
    case 'Purchase':
      return 'purchase';
  }
}

export function buildGtagEcommercePayload(
  input: Omit<GoogleAdsTrackInput, 'eventName'>,
): Record<string, unknown> {
  const items: Array<{ item_id: string; quantity: number; price?: number }> = (
    input.contents ?? []
  ).map((c) => ({
    item_id: c.id,
    quantity: c.quantity,
    ...(c.itemPrice != null ? { price: c.itemPrice } : {}),
  }));
  if (!items.length && input.contentIds?.length) {
    for (const id of input.contentIds) items.push({ item_id: id, quantity: 1 });
  }

  const payload: Record<string, unknown> = {};
  if (input.value != null) payload.value = input.value;
  if (input.currency) payload.currency = input.currency;
  if (input.orderId) payload.transaction_id = input.orderId;
  if (items.length) payload.items = items;
  return payload;
}

export function buildPurchaseConversionParams(input: {
  adsId: string;
  label: string;
  value?: number;
  currency?: string;
  orderId?: string;
}): Record<string, unknown> {
  return {
    send_to: `${input.adsId}/${input.label}`,
    ...(input.value != null ? { value: input.value } : {}),
    currency: input.currency ?? 'CLP',
    ...(input.orderId ? { transaction_id: input.orderId } : {}),
  };
}

/**
 * Inyecta gtag.js + `config` del conversion ID. Idempotente.
 * El llamador ya verificó consentimiento de marketing.
 */
export function loadGoogleAds(adsId: string): void {
  if (gtagLoaded || typeof window === 'undefined') return;
  gtagLoaded = true;

  window.dataLayer = window.dataLayer || [];
  // gtag.js lee el objeto Arguments, no un array real.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(adsId)}`;
  script.onerror = () => {
    console.error('[google-ads] fallo al cargar gtag.js');
  };
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  });
  // PageView lo dispara el loader por ruta (SPA).
  window.gtag('config', adsId, { send_page_view: false });
}

export function fireGooglePageView(): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view');
}

/**
 * Evento ecommerce + conversión Purchase. No-op si gtag no cargó.
 * El gate de consentimiento vive en la capa llamadora.
 */
export function fireGoogleAdsEvent(input: GoogleAdsTrackInput): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', mapMetaEventToGtagName(input.eventName), buildGtagEcommercePayload(input));

  if (input.eventName !== 'Purchase') return;
  const adsId = getGoogleAdsId();
  const label = getGoogleAdsPurchaseLabel();
  if (!adsId || !label) return;
  window.gtag(
    'event',
    'conversion',
    buildPurchaseConversionParams({
      adsId,
      label,
      value: input.value,
      currency: input.currency,
      orderId: input.orderId,
    }),
  );
}
