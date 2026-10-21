import { describe, expect, it } from 'vitest';
import {
  EASE_EDITORIAL,
  EASE_RUPTURE,
  MOTION_SCOPES,
  MOTION_SCOPE_ORDER,
  bandRevealProgress,
  buildTimeline,
  clamp01,
  cubicBezier,
  lerp,
  resolveMotionScope,
  totalDurationMs,
} from './slide-motion';

describe('curvas', () => {
  it('cierran en los extremos', () => {
    expect(EASE_EDITORIAL(0)).toBe(0);
    expect(EASE_EDITORIAL(1)).toBe(1);
    expect(EASE_RUPTURE(0)).toBe(0);
    expect(EASE_RUPTURE(1)).toBe(1);
  });

  it('no retroceden', () => {
    let previous = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const value = EASE_EDITORIAL(t);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it('acota valores fuera de rango', () => {
    expect(clamp01(-3)).toBe(0);
    expect(clamp01(3)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
  });

  it('interpola linealmente', () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it('resuelve una curva cúbica con valores finitos', () => {
    const curve = cubicBezier(0.16, 1, 0.3, 1);
    for (let t = 0; t <= 1.0001; t += 0.1) {
      expect(Number.isFinite(curve(t))).toBe(true);
    }
  });
});

describe('alcances', () => {
  it('expone los tres alcances', () => {
    expect(MOTION_SCOPE_ORDER).toEqual(['estatico', 'elegante', 'rupturista']);
    for (const id of MOTION_SCOPE_ORDER) {
      expect(MOTION_SCOPES[id].id).toBe(id);
    }
  });

  it('deja el alcance estático sin movimiento', () => {
    const spec = MOTION_SCOPES.estatico;
    expect(spec.revealBands).toBe(0);
    expect(spec.kenBurns).toBe(0);
    expect(spec.bandOffset).toBe(0);
    expect(spec.glitchBands).toBe(0);
    expect(spec.substrateOpacity).toBe(0);
    expect(spec.transitionMs).toBe(0);
    expect(spec.printable).toBe(true);
  });

  it('mantiene el ruptura dentro de un presupuesto de glitch', () => {
    const spec = MOTION_SCOPES.rupturista;
    expect(spec.glitchBands).toBeGreaterThan(0);
    expect(spec.glitchBudget).toBeGreaterThan(0);
    expect(spec.glitchBudget).toBeLessThanOrEqual(3);
    expect(spec.printable).toBe(false);
  });

  it('cae al alcance estático ante un valor desconocido', () => {
    expect(resolveMotionScope('desconocido').id).toBe('estatico');
    expect(resolveMotionScope('elegante').id).toBe('elegante');
  });
});

describe('línea de tiempo', () => {
  it('reparte las láminas sin huecos', () => {
    const spec = MOTION_SCOPES.elegante;
    const slots = buildTimeline(spec, 4);
    expect(slots).toHaveLength(4);
    expect(slots[0].startMs).toBe(0);
    expect(slots[0].transitionInMs).toBe(0);
    expect(slots[1].startMs).toBe(spec.slideDurationMs);
    expect(slots[3].transitionOutMs).toBe(0);
  });

  it('calcula la duración total', () => {
    const spec = MOTION_SCOPES.elegante;
    expect(totalDurationMs(spec, 6)).toBe(spec.slideDurationMs * 6);
    expect(totalDurationMs(spec, 0)).toBe(0);
  });
});

describe('revelado por bandas', () => {
  it('no revela antes de la demora', () => {
    expect(bandRevealProgress(0, 10, 0, 500)).toBe(0);
  });

  it('revela por completo pasado el tiempo', () => {
    expect(bandRevealProgress(0, 10, 5000, 500)).toBe(1);
  });

  it('escalona las bandas: la última tarda más', () => {
    const elapsed = 300;
    const first = bandRevealProgress(0, 20, elapsed, 500);
    const last = bandRevealProgress(19, 20, elapsed, 500);
    expect(first).toBeGreaterThan(last);
  });

  it('no revela nada cuando no hay bandas', () => {
    expect(bandRevealProgress(0, 0, 1000, 500)).toBe(1);
  });
});
