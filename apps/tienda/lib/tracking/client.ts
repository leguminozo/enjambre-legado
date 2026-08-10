'use client';

import { useCallback } from 'react';
import { useConsent } from '@/components/shop/consent/consent-provider';
import { fireMetaPixelEvent, getMetaPixelId } from '@/lib/tracking/meta/pixel';
import type { MetaTrackPayload } from '@/lib/tracking/types';

/**
 * Facade de tracking: dispara pixel + CAPI con el MISMO eventId (dedupe Meta).
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
  const pixelId = getMetaPixelId();

  return useCallback(
    (payload: TrackInput) => {
      if (!marketingConsented) return;

      const eventId = crypto.randomUUID();

      if (pixelId) {
        fireMetaPixelEvent(payload.eventName, eventId, buildPixelData(payload));
      }

      void fetch('/api/tracking/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCapiBody(payload, eventId)),
        keepalive: true,
        credentials: 'include',
      }).catch((err: unknown) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[tracking] fallo CAPI', err);
        }
      });
    },
    [marketingConsented, pixelId],
  );
}
