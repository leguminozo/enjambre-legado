'use client';

import { useCallback } from 'react';
import { useConsent } from '@/components/shop/consent/consent-provider';
import { useAdsConfig } from '@/components/shop/ads-config-provider';
import { fireGoogleAdsEvent, getGoogleAdsId } from '@/lib/tracking/google/gtag';
import { fireMetaPixelEvent, getMetaPixelId } from '@/lib/tracking/meta/pixel';
import type { MetaTrackPayload } from '@/lib/tracking/types';

/**
 * Facade de ads: Meta (pixel + CAPI, mismo eventId) y Google Ads (gtag).
 * Gate estricto: sin consentimiento de marketing no firea nada.
 * Fire-and-forget — nunca bloquea la UX ni el checkout.
 */

type TrackInput = Omit<MetaTrackPayload, 'eventId'>;

function readCookie(docCookie: string, name: string): string | undefined {
  const pair = docCookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return pair ? pair.slice(name.length + 1) : undefined;
}

function buildPixelData(payload: TrackInput): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (payload.value != null) data.value = payload.value;
  if (payload.currency) data.currency = payload.currency;
  if (payload.contentIds) data.content_ids = payload.contentIds;
  if (payload.contents) {
    data.contents = payload.contents.map((c) => ({
      id: c.id,
      quantity: c.quantity,
      ...(c.itemPrice != null ? { item_price: c.itemPrice } : {}),
    }));
  }
  if (payload.contentName) data.content_name = payload.contentName;
  if (payload.numItems != null) data.num_items = payload.numItems;
  if (payload.orderId) data.order_id = payload.orderId;
  return data;
}

function buildCapiBody(payload: TrackInput, eventId: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    eventName: payload.eventName,
    eventId,
    sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
  };
  if (payload.value != null) body.value = payload.value;
  if (payload.currency) body.currency = payload.currency;
  if (payload.contentIds) body.contentIds = payload.contentIds;
  if (payload.contents) {
    body.contents = payload.contents.map((c) => ({
      id: c.id,
      quantity: c.quantity,
      ...(c.itemPrice != null ? { item_price: c.itemPrice } : {}),
    }));
  }
  if (payload.contentName != null) body.contentName = payload.contentName;
  if (payload.numItems != null) body.numItems = payload.numItems;
  if (payload.orderId != null) body.orderId = payload.orderId;
  if (payload.email != null) body.email = payload.email;
  if (payload.phone != null) body.phone = payload.phone;
  if (payload.testEventCode != null) body.testEventCode = payload.testEventCode;
  // fbp/fbc los lee el pixel del navegador; los enviamos al CAPI para matching
  const fbp = readCookie(document.cookie, '_fbp');
  const fbc = readCookie(document.cookie, '_fbc');
  if (fbp) body.fbp = fbp;
  if (fbc) body.fbc = fbc;
  return body;
}

export function useMetaTracking() {
  const { marketingConsented } = useConsent();
  const adsConfig = useAdsConfig();
  const pixelId = adsConfig?.metaAds?.pixelId || getMetaPixelId();
  const adsId = adsConfig?.googleAds?.adsId || getGoogleAdsId();
  const metaEnabled = adsConfig?.metaAds?.enabled ?? Boolean(pixelId);
  const googleEnabled = adsConfig?.googleAds?.enabled ?? Boolean(adsId);
  const defaultTestCode = adsConfig?.metaAds?.testEventCode;

  return useCallback(
    (payload: TrackInput) => {
      if (!marketingConsented) return;

      const eventId = crypto.randomUUID();

      if (metaEnabled && pixelId) {
        fireMetaPixelEvent(payload.eventName, eventId, buildPixelData(payload));
      }

      if (googleEnabled && adsId) {
        fireGoogleAdsEvent({
          eventName: payload.eventName,
          value: payload.value,
          currency: payload.currency,
          contentIds: payload.contentIds,
          contents: payload.contents,
          orderId: payload.orderId,
        });
      }

      if (metaEnabled) {
        const enrichedPayload: TrackInput = {
          ...payload,
          testEventCode: payload.testEventCode || defaultTestCode,
        };
        void fetch('/api/tracking/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildCapiBody(enrichedPayload, eventId)),
          keepalive: true,
          credentials: 'include',
        }).catch((err: unknown) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[tracking] fallo CAPI', err);
          }
        });
      }
    },
    [marketingConsented, pixelId, adsId, metaEnabled, googleEnabled, defaultTestCode],
  );
}

/** Alias: el hook cubre Meta + Google Ads. */
export const useAdsTracking = useMetaTracking;
