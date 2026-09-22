import { describe, expect, it } from 'vitest';
import {
  alignToClass,
  parseTextAlign,
  TEXT_ALIGN_OPTIONS,
  parseIdentidadSettings,
  parseClubPageSettings,
  parseCheckoutSettings,
} from './store-chrome';

describe('parseTextAlign', () => {
  it('acepta center, right y justify, y cae a left con el resto', () => {
    expect(parseTextAlign('center')).toBe('center');
    expect(parseTextAlign('right')).toBe('right');
    expect(parseTextAlign('left')).toBe('left');
    expect(parseTextAlign('justify')).toBe('justify');
    expect(parseTextAlign(undefined)).toBe('left');
    expect(parseTextAlign(null)).toBe('left');
    expect(parseTextAlign(42)).toBe('left');
  });
});

describe('alignToClass', () => {
  it('left e indefinido no emiten clase (hereda el diseño actual)', () => {
    expect(alignToClass('left')).toBe('');
    expect(alignToClass(undefined)).toBe('');
    expect(alignToClass(null)).toBe('');
  });

  it('mapea center, right y justify a utilidades Tailwind', () => {
    expect(alignToClass('center')).toBe('text-center');
    expect(alignToClass('right')).toBe('text-right');
    expect(alignToClass('justify')).toBe('text-justify hyphens-auto');
  });
});

describe('TEXT_ALIGN_OPTIONS', () => {
  it('ofrece izquierda, centro, justificado y derecha', () => {
    expect(TEXT_ALIGN_OPTIONS.map((o) => o.value)).toEqual(['left', 'center', 'justify', 'right']);
  });
});

describe('text_align en settings', () => {
  it('identidad conserva párrafos y lee alineación', () => {
    const s = parseIdentidadSettings({ desc: 'Hola', text_align: 'center' });
    expect(s.desc).toBe('Hola');
    expect(s.text_align).toBe('center');
    expect(alignToClass(s.text_align)).toBe('text-center');

    const sJustified = parseIdentidadSettings({ desc: 'Hola', text_align: 'justify' });
    expect(sJustified.text_align).toBe('justify');
    expect(alignToClass(sJustified.text_align)).toBe('text-justify hyphens-auto');
  });

  it('ausente cae a left sin romper el diseño', () => {
    expect(parseClubPageSettings({}).text_align).toBe('left');
    expect(parseCheckoutSettings(null).text_align).toBeUndefined();
  });
});
