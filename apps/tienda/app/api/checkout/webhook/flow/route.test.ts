import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from './route';

describe('apps/tienda/app/api/checkout/webhook/flow/route', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_NUCLEO_API_URL', 'https://nucleo-theta.vercel.app');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('GET devuelve 200 con identificador de bridge', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, bridge: 'tienda-flow-webhook-bridge' });
  });

  it('POST reenvía el payload a Núcleo BFF transparentemente', async () => {
    const mockResponseText = JSON.stringify({ ok: true, status: 'confirmed' });
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(mockResponseText, {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    globalThis.fetch = mockFetch;

    const req = new NextRequest('https://obrerayzangano.cl/api/checkout/webhook/flow', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-forwarded-for': '1.2.3.4',
      },
      body: 'token=FLOW_TOKEN_123',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [calledUrl, calledInit] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe('https://nucleo-theta.vercel.app/api/checkout/webhook/flow');
    expect(calledInit.method).toBe('POST');
    expect(calledInit.body).toBe('token=FLOW_TOKEN_123');
    expect(calledInit.headers['x-forwarded-for']).toBe('1.2.3.4');
  });
});
