import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNotifyCafLowFolios = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock('@/lib/notifications/enqueue-transactional', () => ({
  notifyCafLowFolios: (...args: unknown[]) => mockNotifyCafLowFolios(...args),
}));

import { monitorCafFolios, resolveFiscalAlertRecipients } from './caf-alert-worker';

function makeChain(finalValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ['select', 'eq', 'in', 'maybeSingle']) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain.maybeSingle = vi.fn().mockResolvedValue(finalValue);
  return chain;
}

function makeQueryableChain(finalValue: unknown) {
  const chain = makeChain(finalValue) as Record<string, unknown>;
  chain.then = (resolve: (value: unknown) => void) => resolve(finalValue);
  return chain;
}

describe('caf-alert-worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    delete process.env.SII_CAF_ALERT_THRESHOLD;
  });

  it('resolveFiscalAlertRecipients deduplicates empresa email and owners', async () => {
    const admin = { from: vi.fn((table: string) => {
      if (table === 'empresas') return makeChain({ data: { email: 'empresa@oyz.cl' }, error: null });
      if (table === 'usuarios_empresas') {
        return makeQueryableChain({
          data: [
            { user_id: 'user-1', profiles: { email: 'owner@oyz.cl' } },
            { user_id: 'user-2', profiles: { email: 'empresa@oyz.cl' } },
          ],
          error: null,
        });
      }
      throw new Error(`unexpected table ${table}`);
    }) } as any;

    const recipients = await resolveFiscalAlertRecipients(admin, 'emp-1');

    expect(recipients).toEqual([
      { email: 'empresa@oyz.cl', userId: null },
      { email: 'owner@oyz.cl', userId: 'user-1' },
    ]);
  });

  it('monitorCafFolios queues alert when folios below threshold', async () => {
    mockNotifyCafLowFolios.mockResolvedValue({ skipped: false, emailQueued: true, inAppCreated: false });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'sii_caf') {
        return makeQueryableChain({
          data: [{
            id: 'caf-1',
            empresa_id: 'emp-1',
            tipo_dte: 46,
            folio_desde: 1,
            folio_hasta: 100,
            folio_actual: 60,
          }],
          error: null,
        });
      }
      if (table === 'empresas') {
        return makeChain({
          data: { email: 'fiscal@oyz.cl', razon_social: 'OYZ SpA' },
          error: null,
        });
      }
      if (table === 'usuarios_empresas') {
        return makeQueryableChain({ data: [], error: null });
      }
      throw new Error(`unexpected table ${table}`);
    });

    const result = await monitorCafFolios();

    expect(result.scanned).toBe(1);
    expect(result.alertsQueued).toBe(1);
    expect(mockNotifyCafLowFolios).toHaveBeenCalledWith(
      expect.objectContaining({ from: mockFrom }),
      expect.objectContaining({
        empresaId: 'emp-1',
        foliosRestantes: 40,
        tipoDte: 46,
        cafId: 'caf-1',
      }),
    );
  });
});