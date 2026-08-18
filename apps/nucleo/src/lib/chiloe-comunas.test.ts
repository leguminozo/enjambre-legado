import { describe, expect, it } from 'vitest';
import {
  COMUNAS_CHILOE,
  resolveComunaChiloe,
  slugifyComuna,
} from './chiloe-comunas';

describe('comunas de Chiloé', () => {
  it('resuelve tildes y alias', () => {
    expect(resolveComunaChiloe('Queilén')?.slug).toBe('queilen');
    expect(resolveComunaChiloe('quellón')?.nombre).toBe('Quellón');
    expect(resolveComunaChiloe('Curaco de Velez')?.slug).toBe('curaco-de-velez');
    expect(resolveComunaChiloe('Puqueldón')?.slug).toBe('puqueldon');
  });

  it('no inventa comunas ni localidades', () => {
    expect(resolveComunaChiloe('Pureo')).toBeNull();
    expect(resolveComunaChiloe('Santiago')).toBeNull();
    expect(resolveComunaChiloe('')).toBeNull();
  });

  it('tiene las 10 comunas de la provincia', () => {
    expect(COMUNAS_CHILOE).toHaveLength(10);
    expect(slugifyComuna('Curaco de Vélez')).toBe('curaco-de-velez');
  });
});
