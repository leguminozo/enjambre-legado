import { describe, expect, it } from 'vitest';
import { formatCLP, formatDate, formatDateShort, fmtCLP } from './format';

describe('@enjambre/ui format', () => {
  it('formatCLP', () => {
    const s = formatCLP(15000);
    expect(s).toMatch(/15.?000/);
  });

  it('fmtCLP compacta miles y millones (separador decimal CLP = coma)', () => {
    expect(fmtCLP(1500)).toBe('$1,5K');
    expect(fmtCLP(2_500_000)).toBe('$2,5M');
    expect(fmtCLP(50)).toMatch(/50/);
  });

  it('formatCLP usa $ y punto de miles chileno', () => {
    expect(formatCLP(8000)).toBe('$8.000');
    expect(formatCLP(80_000)).toBe('$80.000');
  });

  it('formatDate / formatDateShort no vacíos', () => {
    expect(formatDate('2026-07-11T12:00:00.000Z').length).toBeGreaterThan(4);
    expect(formatDateShort('2026-07-11T12:00:00.000Z').length).toBeGreaterThan(4);
  });

  it('formatDate soporta dateStyle y timeStyle sin lanzar TypeError', () => {
    const formatted = formatDate('2026-02-18T14:30:00.000Z', {
      dateStyle: 'long',
      timeStyle: 'medium',
    });
    expect(formatted).toContain('febrero');
    expect(formatted).toContain('2026');
  });

  it('formatDate maneja fechas inválidas sin crashear', () => {
    expect(formatDate('invalid-date')).toBe('—');
    expect(formatDateShort('invalid-date')).toBe('—');
  });
});
