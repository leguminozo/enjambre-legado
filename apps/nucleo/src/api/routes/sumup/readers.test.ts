import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

vi.mock('@/api/lib/sumup-client', () => ({
  resolveSumUpClient: vi.fn(),
}));

import { resolveSumUpClient } from '@/api/lib/sumup-client';
import { readersRouter, normalizeReaderStatus } from './readers';

describe('normalizeReaderStatus', () => {
  it('maps SumUp variants to online', () => {
    expect(normalizeReaderStatus('paired')).toBe('online');
    expect(normalizeReaderStatus('READY')).toBe('online');
    expect(normalizeReaderStatus('')).toBe('online');
    expect(normalizeReaderStatus('offline')).toBe('offline');
    expect(normalizeReaderStatus('busy')).toBe('busy');
  });
});

describe('sumup readers checkout idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns existing pending checkout for same reference when still pending at SumUp', async () => {
    const getCheckout = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'chk-existing', status: 'PENDING' },
    });
    const createReaderCheckout = vi.fn();

    vi.mocked(resolveSumUpClient).mockResolvedValue({
      ok: true,
      client: {
        createReaderCheckout,
        getCheckout,
      } as any,
      config: {} as any,
    });

    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        checkout_id: 'chk-existing',
        reader_id: 'r1',
        amount: 5000,
        status: 'pending',
      },
      error: null,
    });
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle,
      update: vi.fn().mockReturnThis(),
    };
    const supabase = { from: vi.fn(() => chain) };

    const app = new Hono<{ Variables: { empresaId: string; supabase: typeof supabase } }>();
    app.use('*', async (c, next) => {
      c.set('empresaId', 'emp-1');
      c.set('supabase', supabase as any);
      await next();
    });
    app.route('/readers', readersRouter);

    const res = await app.request('/readers/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reader_id: 'r1',
        amount: 5000,
        currency: 'CLP',
        checkout_reference: 'POS-abc-1',
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.checkout_id).toBe('chk-existing');
    expect(json.data.idempotent).toBe(true);
    expect(createReaderCheckout).not.toHaveBeenCalled();
    expect(getCheckout).toHaveBeenCalledWith('chk-existing');
  });

  it('creates new checkout when stored pending is expired at SumUp', async () => {
    const getCheckout = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 'chk-old', status: 'EXPIRED' },
    });
    const createReaderCheckout = vi.fn().mockResolvedValue({
      success: true,
      data: { checkout_id: 'chk-new' },
    });

    vi.mocked(resolveSumUpClient).mockResolvedValue({
      ok: true,
      client: { createReaderCheckout, getCheckout } as any,
      config: {} as any,
    });

    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        checkout_id: 'chk-old',
        reader_id: 'r1',
        amount: 5000,
        status: 'pending',
      },
      error: null,
    });
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle,
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };
    const supabase = { from: vi.fn(() => chain) };

    const app = new Hono<{ Variables: { empresaId: string; supabase: typeof supabase } }>();
    app.use('*', async (c, next) => {
      c.set('empresaId', 'emp-1');
      c.set('supabase', supabase as any);
      await next();
    });
    app.route('/readers', readersRouter);

    const res = await app.request('/readers/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reader_id: 'r1',
        amount: 5000,
        currency: 'CLP',
        checkout_reference: 'POS-abc-1',
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.checkout_id).toBe('chk-new');
    expect(createReaderCheckout).toHaveBeenCalled();
  });
});
