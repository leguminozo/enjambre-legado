import { describe, it, expect } from 'vitest';
import {
  getDayTimePeriod,
  getGreetingByPeriod,
  DAY_PERIOD_QUOTES,
  CHILOE_SEASONS,
  SUBROLE_QUOTES,
} from './editorial-greeting';

describe('editorial-greeting', () => {
  describe('getDayTimePeriod', () => {
    it('resolves hours correctly to periods', () => {
      expect(getDayTimePeriod(6)).toBe('madrugada');
      expect(getDayTimePeriod(9)).toBe('manana');
      expect(getDayTimePeriod(14)).toBe('tarde');
      expect(getDayTimePeriod(20)).toBe('atardecer');
      expect(getDayTimePeriod(23)).toBe('noche');
      expect(getDayTimePeriod(2)).toBe('noche');
    });
  });

  describe('getGreetingByPeriod', () => {
    it('generates friendly greetings with and without names', () => {
      expect(getGreetingByPeriod('madrugada', 'Gaboo Douh')).toBe('¡Buen amanecer, Gaboo!');
      expect(getGreetingByPeriod('manana', 'Gaboo')).toBe('¡Buenos días, Gaboo!');
      expect(getGreetingByPeriod('tarde', 'Gaboo')).toBe('¡Buenas tardes, Gaboo!');
      expect(getGreetingByPeriod('atardecer', 'Gaboo')).toBe('¡Cae la tarde, Gaboo!');
      expect(getGreetingByPeriod('noche', 'Gaboo')).toBe('¡Buenas noches, Gaboo!');

      expect(getGreetingByPeriod('manana')).toBe('¡Buenos días!');
      expect(getGreetingByPeriod('tarde')).toBe('¡Buenas tardes!');
    });
  });

  describe('CHILOE_SEASONS', () => {
    it('has all 12 months defined with flora and poetic quotes', () => {
      expect(CHILOE_SEASONS).toHaveLength(12);
      for (let i = 0; i < 12; i++) {
        const s = CHILOE_SEASONS[i];
        expect(s.monthIndex).toBe(i);
        expect(s.monthName).toBeTruthy();
        expect(s.seasonName).toBeTruthy();
        expect(s.floraDestacada.length).toBeGreaterThan(0);
        expect(s.quotes.length).toBeGreaterThan(0);
        expect(s.fenologiaTip).toBeTruthy();
      }
    });

    it('contains Ulmo in January/February and Notro in September', () => {
      const enero = CHILOE_SEASONS[0];
      expect(enero.floraDestacada).toContain('Ulmo');
      expect(enero.quotes.some((q) => q.quote.includes('Ulmo'))).toBe(true);

      const septiembre = CHILOE_SEASONS[8];
      expect(septiembre.floraDestacada).toContain('Notro');
      expect(septiembre.quotes.some((q) => q.quote.includes('Notro'))).toBe(true);
    });
  });

  describe('DAY_PERIOD_QUOTES', () => {
    it('has quotes for every day period', () => {
      const periods = ['madrugada', 'manana', 'tarde', 'atardecer', 'noche'] as const;
      for (const p of periods) {
        expect(DAY_PERIOD_QUOTES[p].length).toBeGreaterThan(0);
        for (const q of DAY_PERIOD_QUOTES[p]) {
          expect(q.quote).toBeTruthy();
          expect(q.context).toBeTruthy();
        }
      }
    });

    it('contains the specific poetic phrases requested', () => {
      const allQuotes = Object.values(DAY_PERIOD_QUOTES).flatMap((list) => list.map((x) => x.quote));
      expect(allQuotes.some((q) => q.includes('las estrellas observan') || q.includes('Las estrellas observan'))).toBe(true);
      expect(allQuotes.some((q) => q.includes('el bosque te espera') || q.includes('El bosque te espera'))).toBe(true);
      expect(allQuotes.some((q) => q.includes('germinando néctar'))).toBe(true);
    });
  });

  describe('SUBROLE_QUOTES', () => {
    it('has quotes for subroles', () => {
      expect(SUBROLE_QUOTES.api_residente.length).toBeGreaterThan(0);
      expect(SUBROLE_QUOTES.api_trashumante.length).toBeGreaterThan(0);
      expect(SUBROLE_QUOTES.agri_fitosanitario.length).toBeGreaterThan(0);
    });
  });
});
