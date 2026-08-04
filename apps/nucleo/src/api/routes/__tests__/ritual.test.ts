import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../../../../app/api/[[...routes]]/route';

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: vi.fn().mockResolvedValue({
      data: {
        deliveries_healed: 0,
        marked_past_due: 1,
        engine: 'subscription_renewal_v3_flow',
      },
      error: null,
    }),
  }),
}));

describe('replenishment cron', () => {
  beforeEach(() => {
    vi.stubEnv('INTERNAL_API_SECRET', 'test-internal-secret');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fallback-not-used');
  });

  for (const path of ['/api/replenishment/cron/process']) {
    it(`rechaza sin x-internal-key (${path})`, async () => {
      const res = await app.request(path, { method: 'POST' });
      expect(res.status).toBe(401);
    });

    it(`procesa renovaciones con clave interna (${path})`, async () => {
      const res = await app.request(path, {
        method: 'POST',
        headers: { 'x-internal-key': 'test-internal-secret' },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      // v3: ya no agenda entregas gratis; heala pagadas y marca past_due
      expect(json.result).toMatchObject({ engine: 'subscription_renewal_v3_flow' });
      expect(json.result.deliveries_healed).toBe(0);
      expect(json.result.marked_past_due).toBe(1);
    });
  }
});