import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getClubCosechaContext,
  resolveClubPlanId,
  statusForCosecha,
  statusLabel,
  splitCataLines,
  expandVentanaBotanica,
  CLUB_COSECHAS,
  loteMatchesClub,
  groupLotesByClub,
  type FuenteBotanica,
} from './club-cosecha';

function setMonth(monthIndex: number) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, monthIndex, 15));
}

describe('Club Legado del Bosque', () => {
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
    expect(ctx.copy.titulo).toContain('Bosque');
    expect(ctx.copy.comoFunciona.length).toBeGreaterThanOrEqual(3);
    expect(ctx.cosechas).toHaveLength(4);
  });

  it('statusLabel es bilingüe', () => {
    expect(statusLabel('en_ventana')).toBe('En ventana de recolección');
    expect(statusLabel('en_ventana', 'en')).toBe('In harvest window');
    expect(statusLabel('proxima', 'en')).toBe('Upcoming');
    expect(statusLabel('reserva', 'en')).toBe('In reserve / maturing');
  });

  it('splitCataLines parte por línea e ignora vacías', () => {
    expect(splitCataLines('Floral\n\n Notas \n')).toEqual(['Floral', 'Notas']);
    expect(splitCataLines('')).toEqual([]);
    expect(splitCataLines(null)).toEqual([]);
  });

  it('override editorial reemplaza copy y nombre vacío oculta la tarjeta', () => {
    setMonth(0);
    const ctx = getClubCosechaContext(new Date(), undefined, 'es', {
      ulmo: {
        nombre: 'Ulmo Editado',
        cientifico: null,
        tagline: '',
        cata: [],
        maridaje: '',
        origenPath: null,
      },
      tiaca: {
        nombre: '  ',
        cientifico: null,
        tagline: '',
        cata: [],
        maridaje: '',
        origenPath: null,
      },
    });
    expect(ctx.cosechas.find((c) => c.key === 'ulmo')?.nombre).toBe('Ulmo Editado');
    expect(ctx.cosechas.find((c) => c.key === 'ulmo')?.nombreCientifico).toBeNull();
    expect(ctx.cosechas.some((c) => c.key === 'tiaca')).toBe(false);
    expect(ctx.cosechas.find((c) => c.key === 'quillay')?.nombre).toBe('Quillay');
  });

  it('expandVentanaBotanica expande y cruza año', () => {
    expect(expandVentanaBotanica(1, 3)).toEqual([1, 2, 3]);
    expect(expandVentanaBotanica(11, 2)).toEqual([11, 12, 1, 2]);
    expect(expandVentanaBotanica(null, 3)).toBeNull();
    expect(expandVentanaBotanica(0, 13)).toBeNull();
  });

  it('la Biblioteca manda en nombre, científico y ventana', () => {
    setMonth(1);
    const botanica: FuenteBotanica[] = [
      {
        slug: 'ulmo',
        nombre_comun: 'Ulmo austral',
        nombre_cientifico: 'Eucryphia cordifolia',
        ventana_ini: 2,
        ventana_fin: 2,
        fuente: 'literatura',
      },
    ];
    const ctx = getClubCosechaContext(new Date(), undefined, 'es', undefined, botanica);
    const ulmo = ctx.cosechas.find((c) => c.key === 'ulmo')!;
    expect(ulmo.nombre).toBe('Ulmo austral');
    // Febrero en ventana según Biblioteca (no enero–marzo fijo)
    expect(ulmo.status).toBe('en_ventana');
    // Sin match botánico, multifloral conserva fallback
    expect(ctx.cosechas.find((c) => c.key === 'multifloral')?.nombre).toBe(
      'Multifloral del bosque',
    );
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
