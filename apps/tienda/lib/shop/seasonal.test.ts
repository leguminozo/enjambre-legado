import { describe, it, expect, vi, afterEach } from 'vitest';
import { getSeasonalContext } from './seasonal';

// getChileanSeason usa new Date() → controlamos el mes con fake timers
function setMonth(monthIndex: number, day = 15) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, monthIndex, day));
}

describe('getSeasonalContext (estacionalidad chilena)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('enero → verano con cosecha activa y floraciones de Ulmo/Tiaca', () => {
    setMonth(0); // enero
    const ctx = getSeasonalContext();
    expect(ctx.season).toBe('verano');
    expect(ctx.seasonLabel).toBe('Verano');
    expect(ctx.harvestStatus).toBe('active');
    expect(ctx.availableFloraciones).toContain('Ulmo');
    expect(ctx.availableFloraciones).toContain('Tiaca');
  });

  it('abril → otoño con cosecha próxima (envasado de la temporada)', () => {
    setMonth(3); // abril
    const ctx = getSeasonalContext();
    expect(ctx.season).toBe('otono');
    expect(ctx.harvestStatus).toBe('upcoming');
    expect(ctx.availableFloraciones).toContain('Ulmo');
  });

  it('julio → invierno en reposo, sin floraciones activas', () => {
    setMonth(6); // julio
    const ctx = getSeasonalContext();
    expect(ctx.season).toBe('invierno');
    expect(ctx.harvestStatus).toBe('resting');
    expect(ctx.availableFloraciones).toEqual([]);
    expect(ctx.message).toContain('colmenas descansan');
  });

  it('octubre → primavera preparando la cosecha', () => {
    setMonth(9); // octubre
    const ctx = getSeasonalContext();
    expect(ctx.season).toBe('primavera');
    expect(ctx.harvestStatus).toBe('preparing');
    expect(ctx.availableFloraciones).toEqual(['Melis', 'Luma', 'Tepu']);
  });

  it('límites de mes: diciembre es verano, marzo es otoño', () => {
    setMonth(11); // diciembre
    expect(getSeasonalContext().season).toBe('verano');
    setMonth(2); // marzo
    expect(getSeasonalContext().season).toBe('otono');
  });
});

describe('getSeasonalContext (overrides del CMS)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const veranoOverrides = {
    verano: { label: 'Verano Austral', message: 'Mensaje personalizado', floraciones: ['Quillay'] },
  };

  it('sin overrides → default intacto', () => {
    setMonth(0); // enero
    const ctx = getSeasonalContext(undefined, 'es');
    expect(ctx.seasonLabel).toBe('Verano');
    expect(ctx.message).toContain('Recolección activa');
  });

  it('override de la temporada vigente gana sobre el default', () => {
    setMonth(0); // enero → verano
    const ctx = getSeasonalContext(veranoOverrides, 'es');
    expect(ctx.seasonLabel).toBe('Verano Austral');
    expect(ctx.message).toBe('Mensaje personalizado');
    expect(ctx.availableFloraciones).toEqual(['Quillay']);
  });

  it('override de otra temporada no afecta la vigente', () => {
    setMonth(6); // julio → invierno
    const ctx = getSeasonalContext(veranoOverrides, 'es');
    expect(ctx.seasonLabel).toBe('Invierno');
    expect(ctx.message).toContain('colmenas descansan');
    expect(ctx.availableFloraciones).toEqual([]);
  });

  it('override parcial: campos vacíos caen al default', () => {
    setMonth(0); // enero → verano
    const ctx = getSeasonalContext({ verano: { label: 'Verano Austral' } }, 'es');
    expect(ctx.seasonLabel).toBe('Verano Austral');
    expect(ctx.message).toContain('Recolección activa');
    expect(ctx.availableFloraciones).toContain('Ulmo');
  });

  it('locale en: usa label_en/message_en cuando existen', () => {
    setMonth(0); // enero → verano
    const ctx = getSeasonalContext(
      { verano: { label: 'Verano Austral', label_en: 'Southern Summer', message_en: 'Harvest active' } },
      'en',
    );
    expect(ctx.seasonLabel).toBe('Southern Summer');
    expect(ctx.message).toBe('Harvest active');
    // Sin label_en/message_en → cae al ES/default
    const ctxEs = getSeasonalContext(
      { verano: { label: 'Verano Austral', label_en: 'Southern Summer', message_en: 'Harvest active' } },
      'es',
    );
    expect(ctxEs.seasonLabel).toBe('Verano Austral');
  });
});
