import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { jobsRoutes } from './jobs';

describe('sii jobs routes', () => {
  it('lists jobs for tenant and returns open counts', async () => {
    const jobs = [
      {
        id: 'j1',
        source_type: 'venta',
        source_id: 'v1',
        tipo_dte: 39,
        status: 'failed',
        attempts: 2,
        last_error: 'timeout',
        scheduled_at: new Date().toISOString(),
        completed_at: null,
        created_at: new Date().toISOString(),
        idempotency_key: 'k1',
      },
    ];

    const headCount = vi.fn().mockResolvedValue({ count: 1, error: null });
    const chainList = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: jobs, error: null }),
      in: vi.fn().mockReturnThis(),
    };
    // for count heads: select → eq → eq → returns count
    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
        in: vi.fn().mockResolvedValue({ count: 1, error: null }),
      }),
    };

    let fromCalls = 0;
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'sii_document_jobs') {
          fromCalls += 1;
          // first call is list, subsequent are counts
          if (fromCalls === 1) return chainList;
          return countChain;
        }
        throw new Error(`unexpected ${table}`);
      }),
    };

    const app = new Hono<{ Variables: { empresaId: string; supabase: typeof supabase } }>();
    app.use('*', async (c, next) => {
      c.set('empresaId', 'emp-1');
      c.set('supabase', supabase as any);
      await next();
    });
    app.route('/jobs', jobsRoutes);

    const res = await app.request('/jobs');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.jobs).toHaveLength(1);
    expect(json.data.jobs[0].status).toBe('failed');
  });

  it('retries failed job to pending', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'j1', status: 'failed', attempts: 2 },
      error: null,
    });
    const single = vi.fn().mockResolvedValue({
      data: { id: 'j1', status: 'pending', scheduled_at: new Date().toISOString(), attempts: 2 },
      error: null,
    });
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle,
      update: vi.fn().mockReturnThis(),
      single,
    };
    const supabase = { from: vi.fn(() => chain) };

    const app = new Hono<{ Variables: { empresaId: string; supabase: typeof supabase } }>();
    app.use('*', async (c, next) => {
      c.set('empresaId', 'emp-1');
      c.set('supabase', supabase as any);
      await next();
    });
    app.route('/jobs', jobsRoutes);

    const res = await app.request('/jobs/j1/retry', { method: 'POST' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('pending');
    expect(chain.update).toHaveBeenCalled();
  });
});
