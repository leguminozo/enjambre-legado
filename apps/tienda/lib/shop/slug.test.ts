import { describe, it, expect } from 'vitest';
import { slugify } from './slug';

describe('slugify (slugs de producto)', () => {
  it('convierte a minúsculas y separa con guiones', () => {
    expect(slugify('Miel de Ulmo Premium')).toBe('miel-de-ulmo-premium');
  });

  it('elimina tildes y la ñ (normalización NFD)', () => {
    expect(slugify('Miel de Ñuble Ácida')).toBe('miel-de-nuble-acida');
    expect(slugify('Café')).toBe('cafe');
  });

  it('colapsa espacios múltiples y símbolos en un solo guion', () => {
    expect(slugify('  Miel   & Té   ')).toBe('miel-te');
    expect(slugify('100% Puro!')).toBe('100-puro');
  });

  it('quita guiones al inicio y al final', () => {
    expect(slugify('-miel-')).toBe('miel');
    expect(slugify('---ulmo---')).toBe('ulmo');
  });

  it('mantiene dígitos', () => {
    expect(slugify('Miel 500g')).toBe('miel-500g');
  });

  it('entrada vacía o solo símbolos → string vacío', () => {
    expect(slugify('')).toBe('');
    expect(slugify('!!!')).toBe('');
    expect(slugify('   ')).toBe('');
  });

  it('es determinista (misma entrada → mismo slug)', () => {
    expect(slugify('Miel de Ulmo')).toBe(slugify('miel de ulmo'));
  });
});
