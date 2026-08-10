import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dispatchMetaCapiEvent,
  normalizeEmail,
  normalizePhone,
  sha256Hash,
} from './capi';

// sha256("hello") — vector conocido
const SHA256_HELLO = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';

describe('normalización + hashing (spec Meta)', () => {
  it('email: minúsculas + trim antes de hashear', () => {
    expect(normalizeEmail('  USER@Example.COM ')).toBe('user@example.com');
  });

  it('phone: solo dígitos (E.164)', () => {
    expect(normalizePhone('+56 9 1234 5678')).toBe('56912345678');
  });

  it('sha256 hex conocido', () => {
    expect(sha256Hash('hello')).toBe(SHA256_HELLO);
  });
});

describe('dispatchMetaCapiEvent', () => {
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

  const baseEvent = {
    eventName: 'AddToCart' as const,
    eventId: '6b7f6b3c-9f3e-4f2e-9b1a-3f2e9b1a3f2e',
    value: 9990,
    currency: 'CLP' as const,
    contents: [{ id: 'p1', quantity: 2, item_price: 4995 }],
  };

  it('stub: sin credenciales no llama a Meta', async () => {
    delete process.env.META_CAPI_TOKEN;
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const result = await dispatchMetaCapiEvent(baseEvent);
    expect(result).toEqual({ ok: false, mode: 'stub', message: expect.any(String) });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('live: POST a graph.facebook.com con pixel, token, event_id y PII hasheada', async () => {
    process.env.META_CAPI_TOKEN = 'token-secreto';
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '1234567890';
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ events_received: 1 }), { status: 200 }));

    const result = await dispatchMetaCapiEvent({
      ...baseEvent,
      email: '  Comprador@Ejemplo.cl ',
      fbp: 'fb.1.123',
      clientIp: '1.2.3.4',
      userAgent: 'test-agent',
      testEventCode: 'TEST123',
    });

    expect(result).toEqual({ ok: true, mode: 'live', status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('graph.facebook.com/v21.0/1234567890/events');
    expect(url).toContain('access_token=token-secreto');

    const body = JSON.parse(String(init.body)) as {
      data: Array<Record<string, unknown>>;
      test_event_code?: string;
    };
    expect(body.test_event_code).toBe('TEST123');
    const event = body.data[0]!;
    expect(event.event_name).toBe('AddToCart');
    expect(event.event_id).toBe(baseEvent.eventId);
    expect(event.action_source).toBe('website');
    expect((event.custom_data as Record<string, unknown>).value).toBe(9990);
    expect((event.custom_data as Record<string, unknown>).currency).toBe('CLP');
    const userData = event.user_data as Record<string, string>;
    // email hasheado (minúsculas + trim), nunca en claro
    expect(userData.em).toBe(sha256Hash('comprador@ejemplo.cl'));
    expect(userData.em).not.toContain('@');
    expect(userData.fbp).toBe('fb.1.123');
    expect(userData.client_ip_address).toBe('1.2.3.4');
    expect(userData.client_user_agent).toBe('test-agent');
  });

  it('error: respuesta no-ok de Meta → mode error con status', async () => {
    process.env.META_CAPI_TOKEN = 'token-secreto';
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '1234567890';
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'invalid token' } }), { status: 400 }),
    );

    const result = await dispatchMetaCapiEvent(baseEvent);
    expect(result).toEqual({
      ok: false,
      mode: 'error',
      status: 400,
      message: expect.stringContaining('invalid token'),
    });
  });

  it('error: fallo de red → mode error sin status', async () => {
    process.env.META_CAPI_TOKEN = 'token-secreto';
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '1234567890';
    fetchMock.mockRejectedValue(new Error('network down'));

    const result = await dispatchMetaCapiEvent(baseEvent);
    expect(result).toEqual({ ok: false, mode: 'error', message: 'network down' });
  });
});
