import { describe, expect, it } from 'vitest';
import {
  formatCLP,
  formatDate,
  formatDateShort,
  formatCalendarDate,
  toCalendarIso,
  fmtCLP,
} from './format';

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
    expect(formatCalendarDate('invalid-date')).toBe('—');
    expect(formatCalendarDate(null)).toBe('—');
  });

  describe('Garantías de Zona Horaria (Anti-desfase UTC en Chile)', () => {
    it('formatCalendarDate extrae el día calendario exacto sin restar días', () => {
      // Caso 1: string de fecha pura YYYY-MM-DD
      expect(formatCalendarDate('2026-10-04')).toBe('04-10-2026');
      expect(formatCalendarDate('2026-08-05')).toBe('05-08-2026');

      // Caso 2: timestamp a medianoche UTC (típico de inputs convertidos a ISO)
      expect(formatCalendarDate('2026-10-04T00:00:00.000Z')).toBe('04-10-2026');

      // Caso 3: timestamp a mediodía UTC
      expect(formatCalendarDate('2026-10-04T12:00:00.000Z')).toBe('04-10-2026');

      // Caso 4: separador personalizado
      expect(formatCalendarDate('2026-10-04', { separator: '/' })).toBe('04/10/2026');

      // Caso 5: Intl.DateTimeFormatOptions
      const longFormat = formatCalendarDate('2026-10-04', { day: 'numeric', month: 'long', year: 'numeric' });
      expect(longFormat).toContain('4');
      expect(longFormat).toContain('octubre');
      expect(longFormat).toContain('2026');

      const shortMonth = formatCalendarDate('2026-10-04', { month: 'short', year: 'numeric' });
      expect(shortMonth).toContain('2026');
    });

    it('formatDateShort protege fechas de calendario y medianoche UTC de desfase', () => {
      expect(formatDateShort('2026-10-04')).toBe('04-10-2026');
      expect(formatDateShort('2026-10-04T00:00:00.000Z')).toBe('04-10-2026');
    });

    it('formatDate respeta el día de calendario cuando no se piden horas/minutos', () => {
      const formatted = formatDate('2026-10-04', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      // Debe contener "4", "octubre" y "2026", nunca "3" de octubre
      expect(formatted).toContain('4');
      expect(formatted).toContain('octubre');
      expect(formatted).toContain('2026');
    });

    it('toCalendarIso estandariza fechas a mediodía UTC 12:00:00Z para persistencia segura', () => {
      expect(toCalendarIso('2026-10-04')).toBe('2026-10-04T12:00:00.000Z');
      expect(toCalendarIso('2026-10-04T00:00:00.000Z')).toBe('2026-10-04T12:00:00.000Z');
    });
  });
});
