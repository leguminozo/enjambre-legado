import { describe, expect, it } from 'vitest';
import { formatCLP, formatDate, formatDateShort, fmtCLP } from './format';

describe('@enjambre/ui format', () => {
  it('formatCLP', () => {
    const s = formatCLP(15000);
    expect(s).toMatch(/15.?000/);
  });

  it('fmtCLP compacta miles y millones', () => {
    expect(fmtCLP(1500)).toMatch(/1\.5K|\$1\.5K/);
    expect(fmtCLP(2_500_000)).toMatch(/2\.5M|\$2\.5M/);
    expect(fmtCLP(50)).toMatch(/50/);
  });

  it('formatDate / formatDateShort no vacíos', () => {
    expect(formatDate('2026-07-11T12:00:00.000Z').length).toBeGreaterThan(4);
    expect(formatDateShort('2026-07-11T12:00:00.000Z').length).toBeGreaterThan(4);
  });
});
