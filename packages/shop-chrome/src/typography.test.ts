import { describe, expect, it } from 'vitest';
import {
  buildGoogleFontsHref,
  parseTypographySettings,
  resolveGoogleFont,
  sanitizeFontFamily,
  typographyToCssVars,
  DEFAULT_TYPOGRAPHY_SETTINGS,
  GOOGLE_FONTS_CATALOG,
} from './typography';

describe('sanitizeFontFamily', () => {
  it('elimina todo lo que no sea letras/dígitos/espacios (inyección CSS/URL)', () => {
    expect(sanitizeFontFamily('Comic Sans";} body { display: none }', 'fallback')).toBe(
      'Comic Sans body  display none',
    );
    expect(sanitizeFontFamily('Arial, sans-serif', 'fallback')).toBe('Arial sansserif');
    expect(sanitizeFontFamily('Impact<script>alert(1)</script>', 'fallback')).toBe(
      'Impactscriptalert1script',
    );
  });

  it('trunca a 50 chars y cae a fallback si vacío', () => {
    const long = 'A'.repeat(80);
    expect(sanitizeFontFamily(long, 'x')).toHaveLength(50);
    expect(sanitizeFontFamily('!!!', 'Inter')).toBe('Inter');
    expect(sanitizeFontFamily(null, 'Inter')).toBe('Inter');
    expect(sanitizeFontFamily(42, 'Inter')).toBe('Inter');
  });
});

describe('resolveGoogleFont', () => {
  it('resuelve del catálogo (case-insensitive)', () => {
    expect(resolveGoogleFont('cormorant garamond').weights).toEqual([300, 400, 600]);
    expect(resolveGoogleFont('Cormorant Garamond').italic).toBe(true);
  });

  it('custom fuera de catálogo → pesos 400/500/600/700', () => {
    const custom = resolveGoogleFont('Montserrat');
    expect(custom.weights).toEqual([400, 500, 600, 700]);
    expect(custom.italic).toBe(false);
  });

  it('custom malicioso se sanitiza', () => {
    expect(resolveGoogleFont('Mons"</style>').family).not.toContain('"');
  });
});

describe('buildGoogleFontsHref', () => {
  it('default → Cormorant con italics + Inter sin italics', () => {
    const href = buildGoogleFontsHref(DEFAULT_TYPOGRAPHY_SETTINGS);
    expect(href).toContain('family=Cormorant+Garamond:ital,wght@0,300;1,300;0,400;1,400;0,600;1,600');
    expect(href).toContain('family=Inter:wght@300;400;500;600');
    expect(href).toContain('display=swap');
  });

  it('no repite la familia si display === sans', () => {
    const href = buildGoogleFontsHref({ font_display: 'Inter', font_sans: 'Inter' });
    expect(href.match(/family=Inter/g)).toHaveLength(1);
  });

  it('espacios → + en la URL', () => {
    const href = buildGoogleFontsHref({ font_display: 'Playfair Display', font_sans: 'Work Sans' });
    expect(href).toContain('family=Playfair+Display');
    expect(href).toContain('family=Work+Sans');
  });
});

describe('typographyToCssVars', () => {
  it('emite vars con comillas y stacks', () => {
    expect(typographyToCssVars({ font_display: 'Fraunces', font_sans: 'Manrope' })).toEqual({
      '--font-display': "'Fraunces', Georgia, serif",
      '--font-sans': "'Manrope', system-ui, sans-serif",
    });
  });
});

describe('parseTypographySettings', () => {
  it('null → defaults', () => {
    expect(parseTypographySettings(null)).toEqual(DEFAULT_TYPOGRAPHY_SETTINGS);
  });

  it('sanitiza valores y completa campos faltantes', () => {
    expect(parseTypographySettings({ font_display: 'EB Garamond' })).toEqual({
      font_display: 'EB Garamond',
      font_sans: 'Inter',
    });
    expect(parseTypographySettings({ font_display: 'X";}', font_sans: 'x' })).toEqual({
      font_display: 'X',
      font_sans: 'x',
    });
  });
});

describe('catalog integrity', () => {
  it('familias únicas, nombres sanitizables y pesos válidos', () => {
    const names = new Set<string>();
    for (const f of GOOGLE_FONTS_CATALOG) {
      expect(f.family).toBe(sanitizeFontFamily(f.family, ''));
      expect(names.has(f.family.toLowerCase())).toBe(false);
      names.add(f.family.toLowerCase());
      expect(f.weights.length).toBeGreaterThan(0);
      for (const w of f.weights) {
        expect(Number.isInteger(w) && w >= 300 && w <= 900).toBe(true);
      }
    }
  });
});
