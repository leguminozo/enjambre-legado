import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getClubCosechaContext,
  resolveClubPlanId,
  statusForCosecha,
  CLUB_COSECHAS,
  loteMatchesClub,
  groupLotesByClub,
} from './club-cosecha';

function setMonth(monthIndex: number) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, monthIndex, 15));
}

describe('Club de la Cosecha', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('enero: ulmo en ventana y destacada', () => {
    setMonth(0);
    const ulmo = CLUB_COSECHAS.find((c) => c.key === 'ulmo')!;
    expect(statusForCosecha(ulmo)).toBe('en_ventana');
    const ctx = getClubCosechaContext(new Date());
    expect(ctx.cosechas.find((c) => c.key === 'ulmo')?.destacada).toBe(true);
    expect(ctx.suggestedPlanKey).toMatch(/club_ulmo|quarterly/);
  });

  it('julio: ulmo en reserva', () => {
    setMonth(6);
    const ulmo = CLUB_COSECHAS.find((c) => c.key === 'ulmo')!;
    expect(statusForCosecha(ulmo)).toBe('reserva');
  });

  it('noviembre: quillay en ventana', () => {
    setMonth(10);
    const q = CLUB_COSECHAS.find((c) => c.key === 'quillay')!;
    expect(statusForCosecha(q)).toBe('en_ventana');
  });

  it('resolveClubPlanId hace fallback a quarterly', () => {
    const plans = [
      { id: '1', key: 'monthly' },
      { id: '2', key: 'quarterly' },
    ];
    expect(resolveClubPlanId('club_ulmo', plans)).toBe('2');
    expect(resolveClubPlanId('quarterly', plans)).toBe('2');
  });

  it('copy del club está completo', () => {
    const ctx = getClubCosechaContext();
    expect(ctx.copy.titulo).toContain('Cosecha');
    expect(ctx.copy.comoFunciona.length).toBeGreaterThanOrEqual(3);
    expect(ctx.cosechas).toHaveLength(4);
  });

  it('loteMatchesClub reconoce variedad', () => {
    expect(loteMatchesClub('Miel de Ulmo Pureo', 'ulmo')).toBe(true);
    expect(loteMatchesClub('Tiaca 2026', 'tiaca')).toBe(true);
    expect(loteMatchesClub('Ulmo', 'tiaca')).toBe(false);
    expect(loteMatchesClub(null, 'multifloral')).toBe(true);
  });

  it('groupLotesByClub reparte por floración', () => {
    const g = groupLotesByClub([
      {
        id: '1',
        nombre_lote: 'A',
        variedad_floral: 'Ulmo',
        fecha: null,
        lab_nombre: null,
        humedad: null,
        relato_excerpt: null,
      },
      {
        id: '2',
        nombre_lote: 'B',
        variedad_floral: 'Bosque mixto',
        fecha: null,
        lab_nombre: null,
        humedad: null,
        relato_excerpt: null,
      },
    ]);
    expect(g.ulmo).toHaveLength(1);
    expect(g.multifloral).toHaveLength(1);
  });
});
