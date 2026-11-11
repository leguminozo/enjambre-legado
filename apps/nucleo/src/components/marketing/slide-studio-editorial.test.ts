import { describe, it, expect } from 'vitest';
import {
  SLIDE_FONT_FAMILIES,
  SLIDE_ACCENT_PALETTES,
  resolveSlideFontFamily,
  resolveAccentColor,
  resolveSlideTheme,
  hexToRgb,
  rgbToHex,
  rgbToHsb,
  hsbToRgb,
  hexToHsb,
  hsbToHex,
  getLuminance,
} from './slide-studio-core';
import { resolveAlignmentClass } from './SlidePreviewCard';

describe('Slide Studio Editorial — Brand Governance & Formats', () => {
  it('identifies canonical brand fonts (Cormorant, Sans, Mono)', () => {
    expect(SLIDE_FONT_FAMILIES.cormorant.isCanonical).toBe(true);
    expect(SLIDE_FONT_FAMILIES.sans.isCanonical).toBe(true);
    expect(SLIDE_FONT_FAMILIES.mono.isCanonical).toBe(true);
    expect(SLIDE_FONT_FAMILIES.display.isCanonical).toBe(false);
    expect(SLIDE_FONT_FAMILIES.humanist.isCanonical).toBe(false);
  });

  it('includes territorial curated palettes (Tepú y Liquen)', () => {
    expect(SLIDE_ACCENT_PALETTES.tepu).toBeDefined();
    expect(SLIDE_ACCENT_PALETTES.tepu.label).toBe('Corteza de Tepú');

    expect(SLIDE_ACCENT_PALETTES.liquen).toBeDefined();
    expect(SLIDE_ACCENT_PALETTES.liquen.label).toBe('Liquen Dorado');
  });

  it('resolves alignment classes properly', () => {
    expect(resolveAlignmentClass('left')).toBe('text-left');
    expect(resolveAlignmentClass('center')).toBe('text-center');
    expect(resolveAlignmentClass('right')).toBe('text-right');
    expect(resolveAlignmentClass('justify')).toBe('text-justify');
    expect(resolveAlignmentClass(undefined)).toBe('text-left');
  });

  it('resolves accent colors with fallback', () => {
    const oro = resolveAccentColor('oro');
    expect(oro.hex).toBeDefined();

    const custom = resolveAccentColor('#123456');
    expect(custom.hex).toBe('#123456');

    const fallback = resolveAccentColor('inexistente');
    expect(fallback.hex).toBe(oro.hex);
  });

  it('resolves canonical slide themes and dynamic custom background colors', () => {
    // Canónico oscuro
    const obsidiana = resolveSlideTheme('obsidiana');
    expect(obsidiana.isLight).toBe(false);
    expect(obsidiana.textPrimaryHex).toBeDefined();

    // Canónico claro
    const marfil = resolveSlideTheme('marfil');
    expect(marfil.isLight).toBe(true);

    // Fondo personalizado oscuro tipo Photoshop (ej. morado profundo)
    const deepViolet = resolveSlideTheme('#1B0A2A');
    expect(deepViolet.bgHex).toBe('#1B0A2A');
    expect(deepViolet.isLight).toBe(false);
    expect(deepViolet.textPrimaryHex).toBe('#F2EEE6');

    // Fondo personalizado claro tipo Photoshop (ej. arena cálido)
    const warmPaper = resolveSlideTheme('#F5EFE6');
    expect(warmPaper.bgHex).toBe('#F5EFE6');
    expect(warmPaper.isLight).toBe(true);
    expect(warmPaper.textPrimaryHex).toBe('#161916');
  });

  it('converts accurately between HEX, RGB and HSB for Photoshop color picker', () => {
    // Negro puro
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToHsb('#000000')).toEqual({ h: 0, s: 0, b: 0 });

    // Blanco puro
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToHsb('#FFFFFF')).toEqual({ h: 0, s: 0, b: 100 });

    // Rojo puro
    expect(hexToHsb('#FF0000')).toEqual({ h: 0, s: 100, b: 100 });
    expect(hsbToHex(0, 100, 100)).toBe('#ff0000');

    // Oro Melífero #D6AA5C (RGB roundtrip exacto y HSB dentro de 1 dígito de cuantización)
    const { r, g, b } = hexToRgb('#D6AA5C');
    expect(rgbToHex(r, g, b).toUpperCase()).toBe('#D6AA5C');

    const oroHsb = hexToHsb('#D6AA5C');
    expect(oroHsb.h).toBeGreaterThanOrEqual(35);
    expect(oroHsb.h).toBeLessThanOrEqual(42);
    const converted = hexToRgb(hsbToHex(oroHsb.h, oroHsb.s, oroHsb.b));
    expect(Math.abs(converted.r - r)).toBeLessThanOrEqual(2);
    expect(Math.abs(converted.g - g)).toBeLessThanOrEqual(2);
    expect(Math.abs(converted.b - b)).toBeLessThanOrEqual(2);
  });
});
