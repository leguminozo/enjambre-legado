import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate } from './format';

describe('formatCurrency', () => {
  it('formatea CLP sin decimales', () => {
    const s = formatCurrency(12500);
    expect(s).toMatch(/12.?500/);
    expect(s).toMatch(/\$|CLP/i);
  });
});

describe('formatDate', () => {
  it('formatea ISO a es-CL', () => {
    const s = formatDate('2026-07-11T12:00:00.000Z');
    expect(s.length).toBeGreaterThan(4);
    expect(s).toMatch(/2026|11|07/);
  });
});
