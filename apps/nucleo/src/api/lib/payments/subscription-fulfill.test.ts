import { describe, it, expect } from 'vitest';
import { addMonthsClamped } from './subscription-fulfill';

describe('addMonthsClamped (períodos de suscripción)', () => {
  it('preserva el día cuando el mes destino lo tiene (15 ene → 15 feb)', () => {
    const result = addMonthsClamped(new Date(2026, 0, 15), 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(15);
  });

  it('31 ene + 1 mes → 28 feb en año no bisiesto (bug setMonth clásico)', () => {
    const result = addMonthsClamped(new Date(2026, 0, 31), 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1); // febrero
    expect(result.getDate()).toBe(28);
  });

  it('31 ene + 1 mes → 29 feb en año bisiesto', () => {
    const result = addMonthsClamped(new Date(2028, 0, 31), 1);
    expect(result.getFullYear()).toBe(2028);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(29);
  });

  it('31 mar + 1 mes → 30 abr', () => {
    const result = addMonthsClamped(new Date(2026, 2, 31), 1);
    expect(result.getMonth()).toBe(3);
    expect(result.getDate()).toBe(30);
  });

  it('31 may + 1 mes → 30 jun', () => {
    const result = addMonthsClamped(new Date(2026, 4, 31), 1);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(30);
  });

  it('trimestral desde fin de mes: 30 nov + 3 meses → 28 feb', () => {
    const result = addMonthsClamped(new Date(2026, 10, 30), 3);
    expect(result.getMonth()).toBe(1); // febrero
    expect(result.getDate()).toBe(28);
  });

  it('anual: 29 feb 2028 (bisiesto) + 12 meses → 28 feb 2029 (no bisiesto)', () => {
    const result = addMonthsClamped(new Date(2028, 1, 29), 12);
    expect(result.getFullYear()).toBe(2029);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
  });

  it('no muta la fecha original', () => {
    const input = new Date(2026, 0, 31);
    const result = addMonthsClamped(input, 1);
    expect(input.getDate()).toBe(31); // input intacto
    expect(result).not.toBe(input);
  });
});
