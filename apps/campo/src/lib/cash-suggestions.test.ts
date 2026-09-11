import { describe, expect, it } from 'vitest';
import { getCashBillSuggestions } from './cash-suggestions';

describe('getCashBillSuggestions', () => {
  it('retorna Exacto para cualquier total', () => {
    const suggestions = getCashBillSuggestions(15000);
    expect(suggestions[0].label).toBe('Exacto');
    expect(suggestions[0].val).toBe(15000);
  });

  it('todas las sugerencias son mayores o iguales al total a cobrar', () => {
    const totals = [3500, 12000, 15000, 24000, 48000];
    for (const t of totals) {
      const suggestions = getCashBillSuggestions(t);
      for (const s of suggestions) {
        expect(s.val).toBeGreaterThanOrEqual(t);
      }
    }
  });

  it('para $3.500 sugiere Exacto, $5.000, $10.000, $20.000', () => {
    const suggestions = getCashBillSuggestions(3500);
    expect(suggestions.map((s) => s.val)).toEqual([3500, 5000, 10000, 20000]);
  });

  it('para $12.000 sugiere Exacto, $15.000, $20.000', () => {
    const suggestions = getCashBillSuggestions(12000);
    expect(suggestions.map((s) => s.val)).toEqual([12000, 15000, 20000]);
  });

  it('para $25.000 sugiere Exacto, $30.000, $40.000', () => {
    const suggestions = getCashBillSuggestions(25000);
    expect(suggestions[0].val).toBe(25000);
    expect(suggestions[1].val).toBe(30000);
    expect(suggestions[2].val).toBe(40000);
  });
});
