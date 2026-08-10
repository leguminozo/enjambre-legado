import { NextRequest, NextResponse } from 'next/server';
import { guardMutation } from '@/lib/api-guard';
import { MetaTrackBodySchema } from '@/lib/tracking/meta/schema';
import { dispatchMetaCapiEvent } from '@/lib/tracking/meta/capi';
import {
  CONSENT_COOKIE_NAME,
  isMarketingConsented,
  readConsentFromCookieValue,
} from '@/lib/tracking/consent';

/**
 * POST /api/tracking/events — bridge del navegador al Meta Conversions API.
 * Consentimiento estricto: sin cookie preference-consent con marketing=true
 * el evento se descarta (status 'skipped'). Visitantes anónimos NO se autentican
 * (es el punto del tracking de ads) — solo CSRF + zod.
 */

function clientIpOf(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first) return first;
  return request.headers.get('x-real-ip')?.trim() || undefined;
}

export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  // 1. Consentimiento (server-side, misma fuente que el banner)
  const consent = readConsentFromCookieValue(request.cookies.get(CONSENT_COOKIE_NAME)?.value);
  if (!isMarketingConsented(consent)) {
    return NextResponse.json({ status: 'skipped' });
  }

  // 2. Validación del payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = MetaTrackBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // 3. Dispatch CAPI (nunca bloquea al cliente aunque Meta falle)
  const result = await dispatchMetaCapiEvent({
    ...parsed.data,
    clientIp: clientIpOf(request),
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ status: 'tracked', mode: result.mode });
}
