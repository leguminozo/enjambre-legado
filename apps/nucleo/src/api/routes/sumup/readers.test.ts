import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

vi.mock('@/api/lib/sumup-client', () => ({
  resolveSumUpClient: vi.fn(),
}));

import { resolveSumUpClient } from '@/api/lib/sumup-client';
import { readersRouter } from './readers';

describe('sumup readers checkout idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns existing pending checkout for same reference', async () => {
    vi.mocked(resolveSumUpClient).mockResolvedValue({
      ok: true,
      client: {
        createReaderCheckout: vi.fn(),
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
  });
});
