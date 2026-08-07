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
};

export const DEFAULT_TYPOGRAPHY_SETTINGS: TypographySettings = {
  font_display: 'Cormorant Garamond',
  font_sans: 'Inter',
};

/** Catálogo curado (~34 fuentes). Display editorial + sans modernos + few display/handwriting. */
export const GOOGLE_FONTS_CATALOG: GoogleFontDef[] = [
  // Serif editorial
  { family: 'Cormorant Garamond', category: 'serif', weights: [300, 400, 600], italic: true },
  { family: 'Cormorant', category: 'serif', weights: [300, 400, 600], italic: true },
  { family: 'EB Garamond', category: 'serif', weights: [400, 500, 600], italic: true },
  { family: 'Lora', category: 'serif', weights: [400, 500, 600], italic: true },
  { family: 'Libre Caslon Text', category: 'serif', weights: [400, 700], italic: true },
  { family: 'Crimson Pro', category: 'serif', weights: [300, 400, 600], italic: true },
  { family: 'Vollkorn', category: 'serif', weights: [400, 600], italic: true },
  { family: 'Spectral', category: 'serif', weights: [300, 400, 600], italic: true },
  { family: 'Source Serif 4', category: 'serif', weights: [300, 400, 600], italic: true },
  { family: 'Marcellus', category: 'serif', weights: [400], italic: false },
  { family: 'Italiana', category: 'serif', weights: [400], italic: false },
  { family: 'Cinzel', category: 'serif', weights: [400, 500, 700], italic: false },
  // Display
  { family: 'Playfair Display', category: 'display', weights: [400, 600, 700], italic: true },
  { family: 'Fraunces', category: 'display', weights: [300, 400, 600], italic: true },
  { family: 'DM Serif Display', category: 'display', weights: [400], italic: false },
  { family: 'Unna', category: 'display', weights: [400, 700], italic: true },
  { family: 'Libre Baskerville', category: 'display', weights: [400, 700], italic: true },
  // Sans
  { family: 'Inter', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Work Sans', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Manrope', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Outfit', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'DM Sans', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Space Grotesk', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Jost', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Public Sans', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Source Sans 3', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Nunito Sans', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Figtree', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Plus Jakarta Sans', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Sora', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  { family: 'Archivo', category: 'sans', weights: [300, 400, 500, 600], italic: false },
  // Handwriting
  { family: 'Caveat', category: 'handwriting', weights: [400, 600], italic: false },
  { family: 'Dancing Script', category: 'handwriting', weights: [400, 600], italic: false },
  { family: 'Pacifico', category: 'handwriting', weights: [400], italic: false },
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

export function parseTypographySettings(
  raw: Record<string, unknown> | null | undefined,
): TypographySettings {
  const d = DEFAULT_TYPOGRAPHY_SETTINGS;
  if (!raw) return { ...d };
  return {
    font_display: sanitizeFontFamily(raw.font_display, d.font_display),
    font_sans: sanitizeFontFamily(raw.font_sans, d.font_sans),
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
  return {
    '--font-display': `'${t.font_display}', Georgia, serif`,
    '--font-sans': `'${t.font_sans}', system-ui, sans-serif`,
  };
}

export const TYPOGRAPHY_SETTINGS_TEMPLATE = { ...DEFAULT_TYPOGRAPHY_SETTINGS };
