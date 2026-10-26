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
    expect(sanitizeFontFamily('!!!', 'Source Sans 3')).toBe('Source Sans 3');
    expect(sanitizeFontFamily(null, 'Source Sans 3')).toBe('Source Sans 3');
    expect(sanitizeFontFamily(42, 'Source Sans 3')).toBe('Source Sans 3');
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
  it('default → Cormorant con italics + Source Sans 3 sin italics', () => {
    const href = buildGoogleFontsHref(DEFAULT_TYPOGRAPHY_SETTINGS);
    expect(href).toContain('family=Cormorant+Garamond:ital,wght@0,300;1,300;0,400;1,400;0,600;1,600');
    expect(href).toContain('family=Source+Sans+3:wght@300;400;500;600');
    expect(href).toContain('display=swap');
  });

  it('no repite la familia si display === sans', () => {
    const href = buildGoogleFontsHref({ font_display: 'Source Sans 3', font_sans: 'Source Sans 3' });
    expect(href.match(/family=Source\+Sans\+3/g)).toHaveLength(1);
  });

  it('espacios → + en la URL', () => {
    const href = buildGoogleFontsHref({ font_display: 'Source Serif 4', font_sans: 'Public Sans' });
    expect(href).toContain('family=Source+Serif+4');
    expect(href).toContain('family=Public+Sans');
  });
});

describe('typographyToCssVars', () => {
  it('emite vars con comillas, stacks y escalas tipográficas', () => {
    expect(typographyToCssVars({ font_display: 'Fraunces', font_sans: 'Manrope' })).toEqual({
      '--font-display': "'Fraunces', Georgia, serif",
      '--font-sans': "'Manrope', system-ui, sans-serif",
      '--tienda-font-scale': '1.00',
      '--tienda-heading-scale': '1.00',
      '--tienda-body-scale': '1.00',
    });
    expect(
      typographyToCssVars({
        font_display: 'Fraunces',
        font_sans: 'Manrope',
        font_scale: 1.05,
        heading_scale: 1.1,
        body_scale: 0.95,
      }),
    ).toEqual({
      '--font-display': "'Fraunces', Georgia, serif",
      '--font-sans': "'Manrope', system-ui, sans-serif",
      '--tienda-font-scale': '1.05',
      '--tienda-heading-scale': '1.10',
      '--tienda-body-scale': '0.95',
    });
  });
});

describe('parseTypographySettings', () => {
  it('null → defaults con escalas en 1.0', () => {
    expect(parseTypographySettings(null)).toEqual(DEFAULT_TYPOGRAPHY_SETTINGS);
  });

  it('sanitiza valores y completa campos faltantes con defaults', () => {
    expect(parseTypographySettings({ font_display: 'Fraunces' })).toEqual({
      font_display: 'Fraunces',
      font_sans: 'Source Sans 3',
      font_scale: 1.0,
      heading_scale: 1.0,
      body_scale: 1.0,
    });
    expect(parseTypographySettings({ font_display: 'X";}', font_sans: 'x' })).toEqual({
      font_display: 'X',
      font_sans: 'x',
      font_scale: 1.0,
      heading_scale: 1.0,
      body_scale: 1.0,
    });
  });

  it('parsea y clampa escalas numéricas dentro de rangos seguros', () => {
    expect(
      parseTypographySettings({
        font_display: 'Cormorant Garamond',
        font_sans: 'Source Sans 3',
        font_scale: 1.15,
        heading_scale: 1.25,
        body_scale: 0.9,
      }),
    ).toEqual({
      font_display: 'Cormorant Garamond',
      font_sans: 'Source Sans 3',
      font_scale: 1.15,
      heading_scale: 1.25,
      body_scale: 0.9,
    });

    // Clamping por fuera de rango
    expect(
      parseTypographySettings({
        font_scale: 2.5,
        heading_scale: 0.2,
        body_scale: '1.05',
      }),
    ).toEqual({
      font_display: 'Cormorant Garamond',
      font_sans: 'Source Sans 3',
      font_scale: 1.25,
      heading_scale: 0.85,
      body_scale: 1.05,
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
