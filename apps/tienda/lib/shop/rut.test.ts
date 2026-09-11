import { describe, it, expect } from 'vitest';
import { normalizarRUT, validarRUT, formatearRUT } from './rut';

describe('validarRUT', () => {
  it('valida RUTs chilenos reales con formato y sin formato', () => {
    expect(validarRUT('11111111-1')).toBe(true);
    expect(validarRUT('22222222-2')).toBe(true);
    expect(validarRUT('60803000-K')).toBe(true);
    expect(validarRUT('76.350.040-3')).toBe(true);
    expect(validarRUT('763500403')).toBe(true);
  });

  it('rechaza RUTs con dígito verificador inválido', () => {
    expect(validarRUT('12345678-0')).toBe(false);
    expect(validarRUT('76350040-1')).toBe(false);
    expect(validarRUT('1')).toBe(false);
    expect(validarRUT('')).toBe(false);
    expect(validarRUT('abc-9')).toBe(false);
  });
});

describe('formatearRUT', () => {
  it('formatea números a formato con puntos y guion', () => {
    expect(formatearRUT('763500403')).toBe('76.350.040-3');
    expect(formatearRUT('60803000k')).toBe('60.803.000-K');
    expect(formatearRUT('111111111')).toBe('11.111.111-1');
  });

  it('preserva strings muy cortos sin romper', () => {
    expect(formatearRUT('')).toBe('');
    expect(formatearRUT('1')).toBe('1');
  });
});
