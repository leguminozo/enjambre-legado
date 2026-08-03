import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlowClProvider } from './flow-cl';

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetchResponse(body: unknown, ok = true): FetchMock {
  return vi.fn().mockResolvedValue({ ok, json: async () => body });
}

const BASE_INPUT = {
  buyOrder: 'SUB-abc',
  sessionId: 'sess-1',
  firstAmount: 19990,
  recurringAmount: 6666,
  email: 'cliente@test.cl',
  returnUrl: 'https://tienda.cl/perfil/reposicion/resultado',
  confirmationUrl: 'https://nucleo.example.com/api/checkout/webhook/flow',
  planName: 'Reposición Mensual',
};

describe('FlowClProvider recurrente (Pago Automático)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchResponse({}));
    vi.stubEnv('FLOW_API_URL', 'https://api.flow.cl/api/v1');
    vi.stubEnv('FLOW_API_KEY', 'test-api-key');
    vi.stubEnv('FLOW_SECRET', 'test-secret');
    vi.stubEnv('NEXT_PUBLIC_NUCLEO_API_URL', 'https://nucleo.example.com');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('createRecurring envía params correctos y parsea url/token', async () => {
    const fetchMock = mockFetchResponse({ url: 'https://flow.cl/inscripcion/abc', token: 'tok-123' });
    vi.stubGlobal('fetch', fetchMock);

    const result = await new FlowClProvider().createRecurring(BASE_INPUT);

    expect(result.url).toBe('https://flow.cl/inscripcion/abc');
    expect(result.token).toBe('tok-123');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.flow.cl/api/v1/recurring/create');
    const body = new URLSearchParams(init.body as string);
    expect(body.get('apiKey')).toBe('test-api-key');
    expect(body.get('commerceOrder')).toBe('SUB-abc');
    expect(body.get('amount')).toBe('19990');
    expect(body.get('recurringAmount')).toBe('6666');
    expect(body.get('recurringPeriod')).toBe('month');
    expect(body.get('currency')).toBe('CLP');
    expect(body.get('email')).toBe('cliente@test.cl');
    expect(body.get('urlConfirmation')).toBe('https://nucleo.example.com/api/checkout/webhook/flow');
    expect(body.get('urlReturn')).toBe('https://tienda.cl/perfil/reposicion/resultado');
    expect(body.get('s')).toBeTruthy(); // firma HMAC presente
    expect(body.get('optional')).toContain('sess-1'); // metadata de sesión
  });

  it('createRecurring acepta token numérico (Flow a veces lo devuelve como número)', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ url: 'https://flow.cl/x', token: 424242 }));
    const result = await new FlowClProvider().createRecurring(BASE_INPUT);
    expect(result.token).toBe('424242');
  });

  it('createRecurring lanza si la respuesta no matchea el schema', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ url: '', token: '' }));
    await expect(new FlowClProvider().createRecurring(BASE_INPUT)).rejects.toThrow('schema mismatch');
  });

  it('getRecurringStatus: status 2 = pagado, devuelve commerceOrder/flowOrder/amount', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchResponse({
        status: 2,
        commerceOrder: 'SUB-abc',
        flowOrder: 12345,
        paymentData: { amount: 6666 },
      }),
    );

    const status = await new FlowClProvider().getRecurringStatus('tok-x');

    expect(status.status).toBe(2);
    expect(status.commerceOrder).toBe('SUB-abc');
    expect(status.flowOrder).toBe(12345);
    expect(status.amount).toBe(6666);
  });

  it('getRecurringStatus lanza si falta commerceOrder (cargo huérfano)', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ status: 2, flowOrder: 1 }));
    await expect(new FlowClProvider().getRecurringStatus('t')).rejects.toThrow(
      'commerceOrder/flowOrder ausente',
    );
  });

  it('cancelRecurring devuelve ok cuando Flow responde', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({}));
    const result = await new FlowClProvider().cancelRecurring('SUB-abc');
    expect(result.ok).toBe(true);
  });

  it('cancelRecurring devuelve {ok:false} sin lanzar cuando Flow falla (best-effort)', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({}, false));
    const result = await new FlowClProvider().cancelRecurring('SUB-abc');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
