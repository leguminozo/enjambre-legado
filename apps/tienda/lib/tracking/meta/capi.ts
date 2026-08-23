/**
 * Dispatcher server-side de Meta Conversions API (CAPI).
 * Solo importable desde Route Handlers / lib servidor: usa node:crypto y
 * lee secretos (META_CAPI_TOKEN) que jamás se exponen al navegador.
 * PII (email/phone) viaja hasheada sha256 (spec Meta).
 */

import { createHash } from 'node:crypto';
import type { MetaTrackBody } from './schema';

export const META_DEFAULT_GRAPH_VERSION = 'v21.0';
export const META_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export type MetaCapiEventInput = MetaTrackBody & {
  /** IP del cliente (x-forwarded-for) para matching. */
  clientIp?: string;
  userAgent?: string;
};

export type MetaCapiDispatchResult =
  | { ok: true; mode: 'live'; status: number }
  | { ok: false; mode: 'stub' | 'error'; status?: number; message: string };

export function getMetaCapiConfig() {
  return {
    pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? '',
    token: process.env.META_CAPI_TOKEN?.trim() ?? '',
    graphVersion: process.env.META_GRAPH_VERSION?.trim() || META_DEFAULT_GRAPH_VERSION,
  };
}

/** sha256 hex (spec Meta: email minúscula+trim, phone solo dígitos). */
export function sha256Hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  // Solo dígitos (mantiene prefijo país si viene en E.164)
  return phone.replace(/\D/g, '');
}

function buildUserData(input: MetaCapiEventInput): Record<string, string> {
  const userData: Record<string, string> = {};
  if (input.email) userData.em = sha256Hash(normalizeEmail(input.email));
  if (input.phone) userData.ph = sha256Hash(normalizePhone(input.phone));
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;
  return userData;
}

function buildCustomData(input: MetaCapiEventInput): Record<string, unknown> {
  const customData: Record<string, unknown> = {};
  if (input.value != null) customData.value = input.value;
  if (input.currency) customData.currency = input.currency;
  if (input.contentIds) customData.content_ids = input.contentIds;
  if (input.contents) customData.contents = input.contents;
  if (input.contentName) customData.content_name = input.contentName;
  if (input.numItems != null) customData.num_items = input.numItems;
  if (input.orderId) customData.order_id = input.orderId;
  return customData;
}

export async function dispatchMetaCapiEvent(
  input: MetaCapiEventInput,
): Promise<MetaCapiDispatchResult> {
  const { pixelId, token, graphVersion } = getMetaCapiConfig();
  if (!pixelId || !token) {
    return {
      ok: false,
      mode: 'stub',
      message: 'Meta Ads no configurado (NEXT_PUBLIC_META_PIXEL_ID / META_CAPI_TOKEN)',
    };
  }

  const event = {
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    event_source_url: input.sourceUrl || META_SITE_URL,
    action_source: 'website',
    user_data: buildUserData(input),
    custom_data: buildCustomData(input),
  };

  const url = `https://graph.facebook.com/${graphVersion}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;

  // Timeout manual (AbortSignal.timeout no está en LegacyBrowserPolyfills)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [event],
        ...(input.testEventCode ? { test_event_code: input.testEventCode } : {}),
      }),
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(
        `[meta-capi] ${input.eventName} ${res.status} — ${text.slice(0, 300)}`,
      );
      return { ok: false, mode: 'error', status: res.status, message: text.slice(0, 300) };
    }

    return { ok: true, mode: 'live', status: res.status };
  } catch (err) {
    console.error(`[meta-capi] ${input.eventName} fetch failed`, err);
    return { ok: false, mode: 'error', message: err instanceof Error ? err.message : 'fetch failed' };
  } finally {
    clearTimeout(timer);
  }
}
