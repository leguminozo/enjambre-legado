import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { serializeConsentCookie, consentForAll, consentEssentialOnly } from '@/lib/tracking/consent';

const VALID_BODY = {
  eventName: 'AddToCart',
  eventId: '6b7f6b3c-9f3e-4f2e-9b1a-3f2e9b1a3f2e',
  value: 9990,
  currency: 'CLP',
  contents: [{ id: 'p1', quantity: 1, item_price: 9990 }],
};

function req(opts?: { cookie?: string; body?: unknown; origin?: string }): NextRequest {
  const headers = new Headers();
  headers.set('origin', opts?.origin ?? 'http://localhost:3001');
  if (opts?.cookie) headers.set('cookie', opts.cookie);
  const init: ConstructorParameters<typeof NextRequest>[1] = { method: 'POST', headers };
  if (opts?.body !== undefined) {
    init.body = JSON.stringify(opts.body);
    headers.set('content-type', 'application/json');
  }
  return new NextRequest('http://localhost:3001/api/tracking/events', init);
}

function consentCookie(categories: ReturnType<typeof consentForAll>): string {
  return serializeConsentCookie(categories).split(';')[0]!;
}

describe('POST /api/tracking/events', () => {
  const envSnapshot = { ...process.env };
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env = { ...envSnapshot };
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
    vi.unstubAllGlobals();
  });

  it('400 con JSON inválido', async () => {
    const res = await POST(req({ cookie: consentCookie(consentForAll()) }));
    // sin body → request.json() falla
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('400 con payload inválido (eventId no UUID)', async () => {
    const res = await POST(
      req({ body: { ...VALID_BODY, eventId: 'no-uuid' }, cookie: consentCookie(consentForAll()) }),
    );
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skipped sin cookie de consentimiento (estricto)', async () => {
    const res = await POST(req({ body: VALID_BODY }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'skipped' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skipped con consentimiento solo esencial', async () => {
    const res = await POST(
      req({ body: VALID_BODY, cookie: consentCookie(consentEssentialOnly()) }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'skipped' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('tracked con consentimiento marketing y CAPI configurado (modo live)', async () => {
    process.env.META_CAPI_TOKEN = 'token-secreto';
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '1234567890';
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ events_received: 1 }), { status: 200 }));

    const res = await POST(req({ body: VALID_BODY, cookie: consentCookie(consentForAll()) }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'tracked', mode: 'live' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toContain('graph.facebook.com');
    expect(url).toContain('access_token=token-secreto');
  });

  it('tracked sin credenciales (modo stub): no llama a Meta pero responde 200', async () => {
    delete process.env.META_CAPI_TOKEN;
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;

    const res = await POST(req({ body: VALID_BODY, cookie: consentCookie(consentForAll()) }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'tracked', mode: 'stub' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
