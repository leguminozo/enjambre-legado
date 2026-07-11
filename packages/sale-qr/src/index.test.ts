import { describe, expect, it, vi } from 'vitest';
import {
  canAssignMoreQrs,
  flattenSaleQrCodes,
  registerDeliveredQrCodes,
  validateQrAssignment,
} from './index';

describe('flattenSaleQrCodes', () => {
  it('aplana, trimea y dedupe', () => {
    expect(
      flattenSaleQrCodes([
        { qr_codes: [' A ', 'B', 'A'] },
        { qr_codes: ['B', ' C '] },
        { qr_codes: null },
        {},
      ]),
    ).toEqual(['A', 'B', 'C']);
  });
});

describe('canAssignMoreQrs / validateQrAssignment', () => {
  it('permite hasta cantidad', () => {
    expect(canAssignMoreQrs(0, 2)).toBe(true);
    expect(canAssignMoreQrs(2, 2)).toBe(false);
  });

  it('valida exceso de QRs', () => {
    expect(validateQrAssignment(['a', 'b'], 1).ok).toBe(false);
    expect(validateQrAssignment(['a'], 2).ok).toBe(true);
  });
});

describe('registerDeliveredQrCodes', () => {
  it('llama rpc por cada código y reporta fallos', async () => {
    const rpc = vi.fn(async ({ p_codigo }: { p_codigo: string }) => {
      if (p_codigo === 'bad') return { error: { message: 'no' } };
      return { error: null };
    });
    const result = await registerDeliveredQrCodes(
      rpc,
      [{ qr_codes: ['good', 'bad'] }],
      'venta-1',
    );
    expect(result.attempted).toBe(2);
    expect(result.failed).toEqual(['bad']);
  });
});
