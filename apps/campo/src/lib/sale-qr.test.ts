import { describe, expect, it, vi } from 'vitest';
import {
  canAssignMoreQrs,
  flattenSaleQrCodes,
  registerDeliveredQrCodes,
  validateQrAssignment,
} from './sale-qr';

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

  it('ignora no-strings', () => {
    expect(
      flattenSaleQrCodes([{ qr_codes: ['ok', 1 as unknown as string, '', '  '] }]),
    ).toEqual(['ok']);
  });
});

describe('canAssignMoreQrs / validateQrAssignment', () => {
  it('permite hasta cantidad', () => {
    expect(canAssignMoreQrs(0, 2)).toBe(true);
    expect(canAssignMoreQrs(2, 2)).toBe(false);
    expect(canAssignMoreQrs(1, 0)).toBe(false);
  });

  it('valida exceso de QRs', () => {
    expect(validateQrAssignment(['a', 'b'], 1).ok).toBe(false);
    expect(validateQrAssignment(['a'], 2).ok).toBe(true);
    expect(validateQrAssignment(undefined, 1).count).toBe(0);
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
    expect(rpc).toHaveBeenCalledWith({
      p_codigo: 'good',
      p_evento: 'entregado',
      p_metadata: { venta_id: 'venta-1' },
    });
  });
});
