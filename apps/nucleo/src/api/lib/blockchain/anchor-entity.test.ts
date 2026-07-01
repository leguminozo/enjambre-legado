import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/lib/blockchain/anchor-entity', () => ({
  anchorEntity: vi.fn().mockResolvedValue({ success: true, txHash: '0xabc123' }),
}));

import { anchorEntity } from '@/api/lib/blockchain/anchor-entity';

describe('Blockchain Anchor Entity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls anchorEntity with correct parameters', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    };

    const result = await anchorEntity(
      mockSupabase as any,
      'empresa-1',
      'colmena',
      'colmena-1',
      { estado: 'optima' }
    );

    expect(result.success).toBe(true);
    expect(result.txHash).toBe('0xabc123');
  });
});