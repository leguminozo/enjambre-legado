import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../../../../app/api/[[...routes]]/route';

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: vi.fn().mockResolvedValue({
      data: { deliveries_scheduled: 2 },
      error: null,
    }),
  }),
}));

describe('ritual cron', () => {
  beforeEach(() => {
    vi.stubEnv('INTERNAL_API_SECRET', 'test-internal-secret');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fallback-not-used');
  });

  it('rechaza sin x-internal-key', async () => {
    const res = await app.request('/api/ritual/cron/process', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('procesa renovaciones con clave interna', async () => {
    const res = await app.request('/api/ritual/cron/process', {
      method: 'POST',
      headers: { 'x-internal-key': 'test-internal-secret' },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.result).toMatchObject({ deliveries_scheduled: 2 });
  });
});