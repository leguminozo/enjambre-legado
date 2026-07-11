import { describe, expect, it } from 'vitest';
import { CAMPO_NAV_ROUTES } from './routes';

describe('CAMPO_NAV_ROUTES', () => {
  it('incluye POS, feria y caja', () => {
    const hrefs = CAMPO_NAV_ROUTES.map((r) => r.href);
    expect(hrefs).toContain('/pos');
    expect(hrefs).toContain('/mi-feria');
    expect(hrefs).toContain('/caja');
    expect(hrefs).toContain('/comisiones');
    expect(hrefs).toContain('/leaderboard');
  });

  it('cada ruta tiene label e icono', () => {
    for (const r of CAMPO_NAV_ROUTES) {
      expect(r.label.length).toBeGreaterThan(0);
      expect(r.icon).toBeTruthy();
      expect(r.href.startsWith('/')).toBe(true);
    }
  });
});
