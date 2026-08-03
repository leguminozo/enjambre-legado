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
