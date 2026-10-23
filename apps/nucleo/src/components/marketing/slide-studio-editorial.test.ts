import { describe, it, expect } from 'vitest';
import {
  SLIDE_FONT_FAMILIES,
  SLIDE_ACCENT_PALETTES,
  resolveSlideFontFamily,
  resolveAccentColor,
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
});
