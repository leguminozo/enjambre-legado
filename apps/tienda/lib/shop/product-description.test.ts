import { describe, expect, it } from 'vitest';
import {
  brandDescriptionForSlug,
  isPlaceholderDescription,
  resolveProductDescription,
} from './product-description';

describe('isPlaceholderDescription', () => {
  it('detecta mash de teclado reportado en producción', () => {
    expect(isPlaceholderDescription('asdadassaasdsa')).toBe(true);
    expect(isPlaceholderDescription('tyguhgtgygu')).toBe(true);
    expect(isPlaceholderDescription('blablakjnasmk')).toBe(true);
    expect(isPlaceholderDescription('ugyvutfvgbyhiun')).toBe(true);
    expect(isPlaceholderDescription('knjbhnlmlnj')).toBe(true);
    expect(isPlaceholderDescription('W,masldasdasda')).toBe(true);
  });

  it('acepta copy de marca real', () => {
    expect(
      isPlaceholderDescription(
        'Miel virgen en panal, sellada como sale de la colmena. Pureza del néctar del bosque nativo de Chiloé.',
      ),
    ).toBe(false);
  });
});

describe('resolveProductDescription', () => {
  it('reemplaza placeholder por fallback de slug', () => {
    const out = resolveProductDescription('miel-virgen', 'asdadassaasdsa');
    expect(out).toContain('panal');
    expect(out).not.toContain('asdad');
  });

  it('respeta descripción válida', () => {
    const real = 'Crema de miel ulmo-tepú artesanal del bosque de Pureo.';
    expect(resolveProductDescription('crema-de-miel', real)).toBe(real);
  });

  it('brandDescriptionForSlug cubre slugs conocidos', () => {
    expect(brandDescriptionForSlug('sachet-de-miel-con-avellanas')).toMatch(/avellana/i);
  });
});
