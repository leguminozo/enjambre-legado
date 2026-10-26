/**
 * Tipografía del chrome de tienda — catálogo curado de Google Fonts.
 * El nombre de familia se sanitiza estricto: [A-Za-z0-9 ] (máx 50) para
 * impedir inyección CSS/URL desde el CMS (va dentro de un <style> y de
 * un href de Google Fonts en el layout de la tienda).
 */

export type FontCategory = 'serif' | 'sans' | 'display' | 'handwriting';

export type GoogleFontDef = {
  family: string;
  category: FontCategory;
  /** Pesos que el CSS/editor realmente usa (display 300/400/600, sans 300–600). */
  weights: number[];
  /** La familia tiene eje itálico en Google Fonts (solo se pide para display). */
  italic: boolean;
};

export type TypographySettings = {
  font_display: string;
  font_sans: string;
  /** Escala general de textos en la tienda (0.85 a 1.25, default 1.0) */
  font_scale?: number;
  /** Escala de titulares display / H1-H6 (0.85 a 1.30, default 1.0) */
  heading_scale?: number;
  /** Escala de texto de cuerpo y lectura (0.85 a 1.20, default 1.0) */
  body_scale?: number;
};

export const DEFAULT_TYPOGRAPHY_SETTINGS: TypographySettings = {
  font_display: 'Cormorant Garamond',
  font_sans: 'Source Sans 3',
  font_scale: 1.0,
  heading_scale: 1.0,
  body_scale: 1.0,
};

export interface FontScalePreset {
  value: number;
  label: string;
  desc: string;
}

export const FONT_SCALE_PRESETS: readonly FontScalePreset[] = [
  { value: 0.9, label: 'Compacto', desc: '90%' },
  { value: 0.95, label: 'Sutil', desc: '95%' },
  { value: 1.0, label: 'Canónico', desc: '100% · Origen' },
  { value: 1.05, label: 'Amplio', desc: '105%' },
  { value: 1.1, label: 'Editorial', desc: '110%' },
] as const;

/**
 * Catálogo corto a propósito. Inter / Geist / Space Grotesk / Outfit / Sora
 * no están: son el default estadístico de landings vibe-coded (docs/ANTI_SLOP.md).
 */
export const GOOGLE_FONTS_CATALOG: GoogleFontDef[] = [
  { family: 'Cormorant Garamond', category: 'serif', weights: [300, 400, 600], italic: true },
  { family: 'Cormorant', category: 'serif', weights: [300, 400, 600], italic: true },
  { family: 'Fraunces', category: 'display', weights: [300, 400, 600], italic: true },
  { family: 'Source Serif 4', category: 'serif', weights: [300, 400, 600], italic: true },
  { family: 'Source Sans 3', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Public Sans', category: 'sans', weights: [300, 400, 500, 600], italic: false },
];

/**
 * Solo letras/dígitos/espacios, máx 50 chars. Devuelve fallback si queda vacío.
 * Es la única barrera contra inyección CSS/URL del nombre de fuente.
 */
export function sanitizeFontFamily(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[^A-Za-z0-9 ]/g, '').trim().slice(0, 50);
  return cleaned || fallback;
}

/**
 * Fuente del catálogo o custom (cualquier Google Font válida) con
 * pesos genéricos 400/500/600/700. El editor valida 400 contra css2.
 */
export function resolveGoogleFont(family: string): GoogleFontDef {
  const found = GOOGLE_FONTS_CATALOG.find(
    (f) => f.family.toLowerCase() === family.trim().toLowerCase(),
  );
  if (found) return found;
  return {
    family: sanitizeFontFamily(family, DEFAULT_TYPOGRAPHY_SETTINGS.font_sans),
    category: 'sans',
    weights: [400, 500, 600, 700],
    italic: false,
  };
}

function clampScale(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(min, Math.min(max, Number(value.toFixed(2))));
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) {
      return Math.max(min, Math.min(max, Number(parsed.toFixed(2))));
    }
  }
  return fallback;
}

export function parseTypographySettings(
  raw: Record<string, unknown> | null | undefined,
): TypographySettings {
  const d = DEFAULT_TYPOGRAPHY_SETTINGS;
  if (!raw) return { ...d };
  return {
    font_display: sanitizeFontFamily(raw.font_display, d.font_display),
    font_sans: sanitizeFontFamily(raw.font_sans, d.font_sans),
    font_scale: clampScale(raw.font_scale, d.font_scale ?? 1.0, 0.85, 1.25),
    heading_scale: clampScale(raw.heading_scale, d.heading_scale ?? 1.0, 0.85, 1.3),
    body_scale: clampScale(raw.body_scale, d.body_scale ?? 1.0, 0.85, 1.2),
  };
}

function familySegment(family: string, weights: number[], italic: boolean): string {
  const name = family.trim().replace(/\s+/g, '+');
  if (italic) {
    const axes: string[] = [];
    for (const w of weights) axes.push(`0,${w}`, `1,${w}`);
    return `family=${name}:ital,wght@${axes.join(';')}`;
  }
  return `family=${name}:wght@${weights.join(';')}`;
}

/** URL css2 para el <link> del layout. Italics solo para la familia display (como hoy). */
export function buildGoogleFontsHref(t: TypographySettings): string {
  const display = resolveGoogleFont(t.font_display);
  const sans = resolveGoogleFont(t.font_sans);
  const segments = [familySegment(display.family, display.weights, display.italic)];
  if (sans.family.toLowerCase() !== display.family.toLowerCase()) {
    segments.push(familySegment(sans.family, sans.weights, false));
  }
  return `https://fonts.googleapis.com/css2?${segments.join('&')}&display=swap`;
}

/** Vars CSS inyectadas server-side (cero FOUT) y por el context en cliente. */
export function typographyToCssVars(t: TypographySettings): Record<string, string> {
  const fontScale = (t.font_scale ?? 1.0).toFixed(2);
  const headingScale = (t.heading_scale ?? 1.0).toFixed(2);
  const bodyScale = (t.body_scale ?? 1.0).toFixed(2);

  return {
    '--font-display': `'${t.font_display}', Georgia, serif`,
    '--font-sans': `'${t.font_sans}', system-ui, sans-serif`,
    '--tienda-font-scale': fontScale,
    '--tienda-heading-scale': headingScale,
    '--tienda-body-scale': bodyScale,
  };
}

export const TYPOGRAPHY_SETTINGS_TEMPLATE = { ...DEFAULT_TYPOGRAPHY_SETTINGS };
